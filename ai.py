import requests
import os

def ask_ai(prompt):
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.environ.get('GROQ_API_KEY')}",
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

    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]
#letme fix 11:42