def chunk_text(text, size=1500):

    chunks = []

    for i in range(0, len(text), size):
        chunks.append(text[i:i+size])

    return chunks
#letmeFix: 12.36