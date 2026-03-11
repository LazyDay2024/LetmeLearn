const summaryText = document.getElementById("summaryText");
const generateBtn = document.getElementById("generateBtn");
const backBtn = document.getElementById("backBtn");
const quizCountInput = document.getElementById("quizCount");

const summary = localStorage.getItem("summary") || "";
summaryText.textContent = summary || "ไม่พบข้อมูล summary";

generateBtn.addEventListener("click", async function () {
  const quizCount = parseInt(quizCountInput.value, 10);

  if (!summary) {
    alert("ไม่พบ summary");
    return;
  }

  if (!quizCount || quizCount < 1) {
    alert("กรุณาใส่จำนวนข้อให้ถูกต้อง");
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "กำลังสร้าง Quiz...";

  try {
    const response = await fetch("/generate_quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        summary: summary,
        number_of_questions: quizCount
      })
    });

    const result = await response.json();

    console.log("quiz json:", result);

    // เก็บไว้ใช้หน้าถัดไป
    localStorage.setItem("quizData", JSON.stringify(result));
window.location.href = "/quiz";

  } catch (error) {
    console.error(error);
    alert("สร้าง Quiz ไม่สำเร็จ");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Quiz";
  }
});

backBtn.addEventListener("click", function () {
  window.location.href = "/";
});
