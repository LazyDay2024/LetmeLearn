const quizContainer = document.getElementById("quizContainer");
const submitQuizBtn = document.getElementById("submitQuizBtn");
const backToResultBtn = document.getElementById("backToResultBtn");
const scoreBox = document.getElementById("scoreBox");

let quizData = null;

function tryParseQuizData(raw) {
  try {
    const parsed = JSON.parse(raw);

    // กรณี backend return { quiz: "json string" }
    if (parsed.quiz && typeof parsed.quiz === "string") {
      return JSON.parse(parsed.quiz);
    }

    // กรณี backend return { questions: [...] } ตรง ๆ
    return parsed;
  } catch (error) {
    return null;
  }
}

function renderQuiz(data) {
  const questions = data?.questions || [];

  if (!questions.length) {
    quizContainer.innerHTML = `
      <div class="summary-box">
        ไม่พบข้อมูลคำถาม หรือ AI ยังไม่ได้ส่ง JSON ที่ถูกต้องกลับมา
      </div>
    `;
    submitQuizBtn.style.display = "none";
    return;
  }

  quizContainer.innerHTML = "";

  questions.forEach((item, index) => {
    const block = document.createElement("div");
    block.className = "quiz-card";

    const choicesHtml = item.choices.map((choice, choiceIndex) => {
      const choiceId = `q${index}_choice${choiceIndex}`;
      return `
        <label class="choice-item" for="${choiceId}">
          <input type="radio" id="${choiceId}" name="question_${index}" value="${choice}">
          <span>${choice}</span>
        </label>
      `;
    }).join("");

    block.innerHTML = `
      <div class="quiz-question">
        <strong>ข้อ ${index + 1}:</strong> ${item.question}
      </div>
      <div class="quiz-choices">
        ${choicesHtml}
      </div>
      <div class="answer-result" id="answerResult_${index}" style="display:none;"></div>
    `;

    quizContainer.appendChild(block);
  });
}

function gradeQuiz() {
  const questions = quizData?.questions || [];
  let score = 0;

  questions.forEach((item, index) => {
    const selected = document.querySelector(`input[name="question_${index}"]:checked`);
    const resultBox = document.getElementById(`answerResult_${index}`);

    if (!resultBox) return;

    resultBox.style.display = "block";

    if (selected) {
      if (selected.value === item.answer) {
        score++;
        resultBox.className = "answer-result correct";
        resultBox.textContent = `ถูกต้อง ✓ คำตอบคือ: ${item.answer}`;
      } else {
        resultBox.className = "answer-result incorrect";
        resultBox.textContent = `ผิด ✗ คำตอบที่ถูกคือ: ${item.answer}`;
      }
    } else {
      resultBox.className = "answer-result incorrect";
      resultBox.textContent = `ยังไม่ได้เลือกคำตอบ | คำตอบที่ถูกคือ: ${item.answer}`;
    }
  });

  scoreBox.style.display = "block";
  scoreBox.textContent = `คะแนนของคุณ: ${score} / ${questions.length}`;

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });
}

(function initQuizPage() {
  const rawQuizData = localStorage.getItem("quizData");

  console.log("========== QUIZ DEBUG ==========");
  console.log("RAW quizData from localStorage:");
  console.log(rawQuizData);

  if (!rawQuizData) {
    quizContainer.innerHTML = `
      <div class="summary-box">ไม่พบ quizData ในระบบ กรุณากลับไปสร้าง Quiz ใหม่</div>
    `;
    submitQuizBtn.style.display = "none";
    return;
  }

  quizData = tryParseQuizData(rawQuizData);

  console.log("PARSED quizData object:");
  console.log(quizData);

  if (quizData?.questions) {
    console.table(quizData.questions);
  }

  if (!quizData) {
    quizContainer.innerHTML = `
      <div class="summary-box">ไม่สามารถอ่านข้อมูล Quiz ได้ อาจเป็นเพราะ AI ส่ง JSON ไม่ถูกต้อง</div>
    `;
    submitQuizBtn.style.display = "none";
    return;
  }

  renderQuiz(quizData);
  console.log("RAW quizData from localStorage:");
console.log(rawQuizData);

// อันนี้สำคัญ
try {
  const parsedRaw = JSON.parse(rawQuizData);

  if (parsedRaw.raw_text) {
    console.log("===== AI RAW TEXT START =====");
    console.log(parsedRaw.raw_text);
    console.log("===== AI RAW TEXT END =====");
  }
} catch(e) {
  console.log("localStorage JSON parse error");
}
})();

submitQuizBtn.addEventListener("click", gradeQuiz);

backToResultBtn.addEventListener("click", function () {
  window.location.href = "/result";
});