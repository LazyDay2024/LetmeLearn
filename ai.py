import requests
import os

def ask_ai(prompt):
    try:
        ai_base_url = os.getenv("AI_BASE_URL", "http://localhost:11434")
        print("AI_BASE_URL DEBUG =", ai_base_url)

        response = requests.post(
            f"{ai_base_url}/api/generate",
            headers={"ngrok-skip-browser-warning": "true"},
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )

        print("STATUS:", response.status_code)
        print("TEXT:", response.text[:500])

        response.raise_for_status()

        return response.json().get("response", "")

    except Exception as e:
        print("AI ERROR:", e)
        return f"AI error: {e}"