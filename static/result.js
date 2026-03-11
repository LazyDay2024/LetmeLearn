const summaryText = document.getElementById("summaryText");
const generateBtn = document.getElementById("generateBtn");
const backBtn = document.getElementById("backBtn");
const quizCountInput = document.getElementById("quizCount");
const loadingOverlay = document.getElementById("loadingOverlay");
const decreaseBtn = document.getElementById("decreaseBtn");
const increaseBtn = document.getElementById("increaseBtn");

if (decreaseBtn && increaseBtn && quizCountInput) {
  decreaseBtn.addEventListener("click", () => {
    let val = parseInt(quizCountInput.value) || 1;
    let min = parseInt(quizCountInput.min) || 1;
    if (val > min) quizCountInput.value = val - 1;
  });
  increaseBtn.addEventListener("click", () => {
    let val = parseInt(quizCountInput.value) || 1;
    let max = parseInt(quizCountInput.max) || 20;
    if (val < max) quizCountInput.value = val + 1;
  });
}

const summary = localStorage.getItem("summary") || "";
const summarySectionContainer = document.getElementById("summarySectionContainer");

if (summary && summary.trim() !== "" && summary !== "ไม่พบข้อมูล summary") {
  summaryText.textContent = summary;
  if(summarySectionContainer) summarySectionContainer.style.display = "block";
} else {
  // ไม่โชว์กล่องสรุปเลยถ้าไม่มีข้อมูล
  if(summarySectionContainer) summarySectionContainer.style.display = "none";
}

generateBtn.addEventListener("click", async function () {
  const quizCount = parseInt(quizCountInput.value, 10);
  const promptRole = document.getElementById("promptRole") ? document.getElementById("promptRole").value.trim() : "";
  const promptTopic = document.getElementById("promptTopic") ? document.getElementById("promptTopic").value.trim() : "";
  const promptLevel = document.getElementById("promptLevel") ? document.getElementById("promptLevel").value.trim() : "";
  const promptGoal = document.getElementById("promptGoal") ? document.getElementById("promptGoal").value.trim() : "";

  // if (!summary) {
  //   alert("ไม่พบ summary");
  //   return;
  // }

  if (!quizCount || quizCount < 1) {
    alert("กรุณาใส่จำนวนข้อให้ถูกต้อง");
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "กำลังสร้าง Quiz...";
  if (loadingOverlay) loadingOverlay.style.display = "flex";

  try {
    const response = await fetch("/generate_quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        summary: summary,
        number_of_questions: quizCount,
        role: promptRole,
        topic: promptTopic,
        level: promptLevel,
        goal: promptGoal
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
    generateBtn.innerHTML = "🚀 Generate Quiz";
    if (loadingOverlay) loadingOverlay.style.display = "none";
  }
});

backBtn.addEventListener("click", function () {
  window.location.href = "/";
});
