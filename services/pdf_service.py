from pypdf import PdfReader
from pdf2image import convert_from_path
import pytesseract

def extract_text_from_pdf(pdf_path):

    reader = PdfReader(pdf_path)
    text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text

    return text


def extract_text_from_scanned_pdf(pdf_path):

    pages = convert_from_path(pdf_path)
    all_text = ""

    for page in pages:
        text = pytesseract.image_to_string(page, lang="tha+eng")
        all_text += text + "\n"

    return all_text


def is_probably_text_pdf(text, min_length=100):
    return len(text.strip()) >= min_length


def process_pdf(pdf_path):

    extracted_text = extract_text_from_pdf(pdf_path)

    if is_probably_text_pdf(extracted_text):
        return {
            "mode": "text",
            "text": extracted_text
        }
    else:
        ocr_text = extract_text_from_scanned_pdf(pdf_path)
        return {
            "mode": "ocr",
            "text": ocr_text
        }