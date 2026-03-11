import requests

def ask_ai(prompt):
    try:
        response = requests.post(
            " https://lily-totemic-irmgard.ngrok-free.dev/api/generate",
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

        data = response.json()
        return data.get("response", "ไม่พบ response จาก AI")

    except Exception as e:
        print("AI ERROR:", e)
        return f"AI error: {e}"