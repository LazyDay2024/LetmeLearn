from services.text_chunker import split_text
from ai import ask_ai
import time

def summarize_long_text(text):
    chunks = split_text(text)

    summaries = []

    for chunk in chunks:
        prompt = f"""
You are an API that summarizes Wikipedia articles.

Your task is to read the provided content and return a clear summary in Thai.

Rules you must follow strictly:
- Output must be plain text only.
- Do NOT use Markdown.
- Do NOT use bullet symbols like *, -, #.
- Do NOT use tables.
- Do NOT use HTML tags.
- Do NOT use LaTeX or any math formatting.
- Do NOT include code blocks or programming syntax.
- Do NOT explain the rules.

Write the summary as normal readable Thai paragraphs.

Content to summarize:

{chunk}
"""

        result = ask_ai(prompt)
        summaries.append(result)
        time.sleep(5)
    combined_summary = "\n".join(summaries)

    final_prompt = f"""
You are an API that produces the final summary of a Wikipedia article.

The text below contains multiple partial summaries of the same topic.
Merge them into one clear and coherent Thai summary.

Rules:
- Return plain text only.
- No Markdown.
- No HTML.
- No tables.
- No LaTeX.
- No code blocks.
- Write in normal Thai paragraphs.

Text:

{combined_summary}
"""

    final_summary = ask_ai(final_prompt)

    return final_summary

#letmeFix: 12.36