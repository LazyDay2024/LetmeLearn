import requests
import os

def ask_ai(prompt):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set")

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "openai/gpt-oss-120b",
            "messages": [
                {"role": "user", "content": prompt}
            ]
        },
        timeout=60
    )

    if response.status_code == 429:
        raise ValueError("Groq rate limit reached. Please try again later.")

    response.raise_for_status()

    data = response.json()
    return data["choices"][0]["message"]["content"]

#letmeFix: 12.36