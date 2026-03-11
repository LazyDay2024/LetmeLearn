import requests

def ask_ai(prompt):

    response = requests.post(
        " https://lily-totemic-irmgard.ngrok-free.dev/api/generate",
        json={
            "model": "llama3",
            "prompt": prompt,
            "stream": False
        }
    )   

    return response.json()["response"]