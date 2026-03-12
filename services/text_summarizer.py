from services.text_chunker import split_text
from ai import ask_ai
import time

def summarize_long_text(text):
    chunks = split_text(text)

    summaries = []

    for chunk in chunks:
        prompt = f"""
กรุณาสรุปเนื้อหาต่อไปนี้เป็นภาษาไทยแบบเข้าใจง่าย
เน้นประเด็นสำคัญ ไม่ต้องยาว

เนื้อหา:
{chunk}
"""

        result = ask_ai(prompt)
        summaries.append(result)
        time.sleep(1)
    combined_summary = "\n".join(summaries)

    final_prompt = f"""
ต่อไปนี้คือสรุปย่อยจากหลายส่วนของเอกสารเดียวกัน
กรุณารวมให้เป็นสรุปสุดท้ายที่กระชับและอ่านง่าย

{combined_summary}
"""

    final_summary = ask_ai(final_prompt)

    return final_summary

#letmeFix: 12.36