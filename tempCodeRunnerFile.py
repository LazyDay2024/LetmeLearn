from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse
import os
import shutil
import uuid
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Users\Ryu17\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
print(pytesseract.get_tesseract_version())

app = FastAPI()

UPLOAD_pdf = "pdfuploads"
UPLOAD_img = "imageuploads"
UPLOAD_text = "textuploads"
os.makedirs(UPLOAD_pdf, exist_ok=True)
os.makedirs(UPLOAD_img, exist_ok=True)
os.makedirs(UPLOAD_text, exist_ok=True)

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
    if data_type == "text":

        filename = str(uuid.uuid4()) + ".txt"
        save_path = os.path.join(UPLOAD_text, filename)

        with open(save_path, "w", encoding="utf-8") as f:
            f.write(text_content)

        return {
            "type": "text",
            "content": text_content,
            "saved_to": save_path
        }

    elif data_type == "image":
        if file is None:
            return {"error": "No image uploaded"}

        save_path = os.path.join(UPLOAD_img, file.filename)
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "type": "image",
            "filename": file.filename,
            "content_type": file.content_type,
            "saved_to": save_path
        }

    elif data_type == "pdf":
        if file is None:
            return {"error": "No pdf uploaded"}

        save_path = os.path.join(UPLOAD_pdf, file.filename)
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "type": "pdf",
            "filename": file.filename,
            "content_type": file.content_type,
            "saved_to": save_path
        }

    return {"error": "Invalid data type"}