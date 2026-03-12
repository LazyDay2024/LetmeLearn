from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
import os
import shutil
import uuid
from fastapi.staticfiles import StaticFiles
import json 
import re
import requests
from ocr_service import extract_text_from_image_file
from ai import ask_ai
from pydantic import BaseModel
from pypdf import PdfReader
from services.text_summarizer import summarize_long_text


class QuizRequest(BaseModel):
    summary: str
    number_of_questions: int

# =========================
# Config
# =========================
class WikiSearchRequest(BaseModel):
    key_search: list[str]


app = FastAPI()

UPLOAD_PDF = "pdfuploads"
UPLOAD_IMG = "imageuploads"
UPLOAD_TEXT = "textuploads"

os.makedirs(UPLOAD_PDF, exist_ok=True)
os.makedirs(UPLOAD_IMG, exist_ok=True)
os.makedirs(UPLOAD_TEXT, exist_ok=True)


# =========================
# Helper Functions
# =========================
def is_probably_text_pdf(text, min_length=100):
    return len(text.strip()) >= min_length


def chunk_text(text, size=1500):
    chunks = []

    for i in range(0, len(text), size):
        chunks.append(text[i:i + size])

    return chunks


def process_pdf(pdf_path):
    extracted_text = extract_text_from_pdf(pdf_path)

    if is_probably_text_pdf(extracted_text):
        return {
            "mode": "text",
            "text": extracted_text
        }
    else:
        return {
            "mode": "unsupported_scanned_pdf",
            "text": ""
        }


def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

    return text






def generate_key_search(raw_text: str):
    cleaned_text = raw_text.strip()

    if len(cleaned_text) > 4000:
        cleaned_text = cleaned_text[:4000]

    prompt = f"""
You are an AI assistant that helps students study.

Your task:
1. Fix unclear OCR text if needed
2. Understand the main topic
3. Generate short search keywords for Wikipedia

Rules:
- Reply in JSON only
- Use simple keyword/topic phrases
- Maximum 5 keywords
- Keywords should be suitable for Wikipedia search
- If the content is Thai, you may return Thai or English keywords depending on what is best for searching

Format:
{{
  "key_search": ["keyword1", "keyword2", "keyword3"]
}}

Text:
{cleaned_text}
"""

    ai_response = ask_ai(prompt)
    try:
        parsed = extract_json_from_text(ai_response)
        return parsed.get("key_search", [])
    except:
        return []

def search_wikipedia_text(title: str, max_chars: int = 3000):
    url = "https://en.wikipedia.org/w/api.php"

    params = {
        "action": "query",
        "format": "json",
        "prop": "extracts",
        "titles": title,
        "explaintext": 1,
        "redirects": 1
    }

    headers = {
        "User-Agent": "LetMeLearnBot/1.0 (Ryu educational project)"
    }

    response = requests.get(url, params=params, headers=headers, timeout=15)
    response.raise_for_status()

    data = response.json()
    pages = data["query"]["pages"]
    page = next(iter(pages.values()))

    text = page.get("extract", "").strip()

    if not text:
        return None

    return text[:max_chars]

app.mount("/static", StaticFiles(directory="static"), name="static")
# =========================
# Routes
# =========================


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    content = await file.read()
    text = extract_text_from_image_file(content)
    return {
        "filename": file.filename,
        "text": text
    }

@app.get("/result")
def result_page():
    return FileResponse("result.html")
@app.get("/")
def home():
    file_path = os.path.join(os.path.dirname(__file__), "index.html")
    return FileResponse(file_path)


@app.post("/submit")
async def submit_data(
    data_type: str = Form(...),
    text_content: str = Form(""),
    file: UploadFile = File(None)
):
    # -------------------------
    # 1) รับ text หลักจากแต่ละประเภท
    # -------------------------
    if data_type == "text":
        filename = str(uuid.uuid4()) + ".txt"
        save_path = os.path.join(UPLOAD_TEXT, filename)

        with open(save_path, "w", encoding="utf-8") as f:
            f.write(text_content)

        main_text = (text_content or "").strip()

        if len(main_text) > 20000:
         main_text = main_text[:20000]

        extra_info = {
            "type": "text",
            "saved_to": save_path
    }

    elif data_type == "image":
        if file is None:
            return {"error": "No image file uploaded"}

        filename = str(uuid.uuid4()) + "_" + file.filename
        save_path = os.path.join(UPLOAD_IMG, filename)

        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        with open(save_path, "rb") as f:
            extracted_text = extract_text_from_image_file(f.read())

        

        main_text = extracted_text

        extra_info = {
            "type": "image",
            "filename": filename,
            "extracted_text": extracted_text
    }

    elif data_type == "pdf":
        if file is None:
            return {"error": "No pdf file uploaded"}

        filename = str(uuid.uuid4()) + "_" + file.filename
        save_path = os.path.join(UPLOAD_PDF, filename)

        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = process_pdf(save_path)
        pdf_text = result["text"]
        if result["mode"] == "unsupported_scanned_pdf":
            return {"error": "PDF แบบสแกนยังไม่รองรับในเวอร์ชันนี้"}
        main_text = pdf_text

        extra_info = {
            "type": "pdf",
            "filename": filename,
            "pdf_mode": result["mode"],
            "text_length": len(pdf_text)
        }

    else:
        return {"error": "Invalid data type"}

    # -------------------------
    # 2) สร้าง keyword สำหรับ search
    # -------------------------
    key_search = generate_key_search(main_text)

    print("\n====== KEY SEARCH ======")
    print(key_search)
    print("========================\n")

    # -------------------------
    # 3) ยิง Wikipedia จาก keyword
    # -------------------------
    wiki_contents = []

    for keyword in key_search[:3]:
        try:
            wiki_text = search_wikipedia_text(keyword, max_chars=3000)
            if wiki_text:
                wiki_contents.append(f"[{keyword}]\n{wiki_text}")
        except Exception as e:
            print(f"Wikipedia error for '{keyword}': {e}")

    # -------------------------
    # 4) รวมข้อความต้นฉบับ + ข้อมูลจาก Wikipedia
    # -------------------------
    combined_context = main_text

    if wiki_contents:
        combined_context += "\n\nข้อมูลเพิ่มเติมจาก Wikipedia:\n\n" + "\n\n".join(wiki_contents)

    # -------------------------
    # 5) ให้ AI สรุป final summary
    # -------------------------
    summary_prompt = f"""
You are a study assistant.

Create a clear and useful study summary for students.

Rules:
- Write in Thai
- Make it easy to understand
- Focus on important concepts
- Use both the uploaded content and Wikipedia information if available
- Do not make up facts

Content:
{combined_context}
"""

    try:
        summary = summarize_long_text(combined_context)
    except ValueError as e:
        return JSONResponse(
        status_code=429,
        content={"error": str(e)}
    )
    except Exception:
        return JSONResponse(
        status_code=500,
        content={"error": "AI summary failed"}
    )

    # -------------------------
    # 6) ส่งผลกลับ
    # -------------------------
    return {
        **extra_info,
        "key_search": key_search,
        "wiki_count": len(wiki_contents),
        "summary": summary
    }


    
@app.post("/wiki_search")
async def wiki_search(data: WikiSearchRequest):
    key_search = data.key_search
    results = []

    for keyword in key_search[:3]:
        try:
            wiki_text = search_wikipedia_text(keyword, max_chars=3000)

            if wiki_text:
                results.append({
                    "keyword": keyword,
                    "content": wiki_text
                })
            else:
                results.append({
                    "keyword": keyword,
                    "content": None
                })

        except Exception as e:
            results.append({
                "keyword": keyword,
                "content": None,
                "error": str(e)
            })

    return {
        "results": results
    }

def extract_json_from_text(text: str):
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("ไม่พบ JSON")

    json_str = text[start:end + 1]

    # ลบ code block
    json_str = json_str.replace("```json", "").replace("```", "")

    # แก้ปัญหา } { → },{
    json_str = re.sub(r"}\s*{", "},{", json_str)

    return json.loads(json_str)

@app.post("/generate_quiz")
async def generate_quiz(data: QuizRequest):
    summary = data.summary
    number_of_questions = data.number_of_questions

    prompt = f"""
You are an Ai assistant that creates multiple choice questions for students based on the provided summary.

generate questions with multiple choice and answer {number_of_questions} questions

rules for question generation:
- Reply only with JSON in the specified format
- Do not include any explanations or text outside of the JSON structure
- Reply in Thai language only
- Each question has 4 answer choices
- Only one correct answer per question

format JSON:
{{
  "questions": [
    {{
      "question": "question 1",
      "choices": ["choice1", "choice2", "choice3", "choice4"],
      "answer": " correct choice"
    }}
  ]
}}

สรุปเนื้อหา:
{summary}
"""

    ai_response = ask_ai(prompt)

    print("\n================ AI RAW TEXT =================")
    print(ai_response)
    print("=============================================\n")

    try:
        quiz_json = extract_json_from_text(ai_response)

        print("\n================ EXTRACTED JSON =================")
        print(json.dumps(quiz_json, indent=2, ensure_ascii=False))
        print("=================================================\n")

        return {
            "questions": quiz_json.get("questions", []),
            "debug_raw_ai": ai_response,
            "debug_extracted_json": quiz_json
        }

    except Exception as e:
        print("\n================ JSON ERROR =================")
        print("Error:", str(e))
        print("Raw AI response:")
        print(ai_response)
        print("=============================================\n")

        return {
            "error": "ไม่สามารถสกัด JSON จากข้อความของ AI ได้",
            "details": str(e),
            "raw_text": ai_response
        }





@app.get("/quiz")
def quiz_page():
    file_path = os.path.join(os.path.dirname(__file__), "quiz.html")
    return FileResponse(file_path)

#letmeFix: 12.36