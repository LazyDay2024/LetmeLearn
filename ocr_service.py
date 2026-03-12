import requests
import base64
import os

GOOGLE_VISION_API_KEY = os.getenv("GOOGLE_VISION_API_KEY")

def extract_text_from_image_file(image_bytes):
    if not GOOGLE_VISION_API_KEY:
        raise ValueError("GOOGLE_VISION_API_KEY is not set")

    content = base64.b64encode(image_bytes).decode()

    url = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_VISION_API_KEY}"

    payload = {
        "requests": [
            {
                "image": {"content": content},
                "features": [{"type": "TEXT_DETECTION"}]
            }
        ]
    }

    response = requests.post(url, json=payload, timeout=60)
    response.raise_for_status()

    data = response.json()

    try:
        return data["responses"][0]["fullTextAnnotation"]["text"]
    except Exception:
        return ""

#letmeFix: 11:42