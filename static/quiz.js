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

    // Clear previous highlights when user selects another option
    const radios = block.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        const labels = block.querySelectorAll('.choice-item');
        labels.forEach(l => l.classList.remove('selected'));
        radio.closest('.choice-item').classList.add('selected');
      });
    });

    quizContainer.appendChild(block);
  });
}

function gradeQuiz() {
  const questions = quizData?.questions || [];
  let score = 0;

  questions.forEach((item, index) => {
    const selected = document.querySelector(`input[name="question_${index}"]:checked`);
    const resultBox = document.getElementById(`answerResult_${index}`);
    const labels = document.querySelectorAll(`input[name="question_${index}"]`);

    if (!resultBox) return;

    resultBox.style.display = "block";

    // Revert all choice-item colors
    labels.forEach(radio => {
      radio.closest('.choice-item').classList.remove('correct-choice', 'incorrect-choice');
      if (radio.value === item.answer) {
         radio.closest('.choice-item').classList.add('correct-choice-highlight');
      }
    });

    if (selected) {
      if (selected.value === item.answer) {
        score++;
        selected.closest('.choice-item').classList.add('correct-choice');
        resultBox.className = "answer-result correct";
        resultBox.textContent = `ถูกต้อง ✓`;
      } else {
        selected.closest('.choice-item').classList.add('incorrect-choice');
        resultBox.className = "answer-result incorrect";
        resultBox.textContent = `ผิด ✗ คำตอบที่ถูกคือ: ${item.answer}`;
      }
    } else {
      resultBox.className = "answer-result incorrect";
      resultBox.textContent = `ยังไม่ได้เลือกคำตอบ | คำตอบที่ถูกคือ: ${item.answer}`;
    }
  });

  // scoreBox.style.display = "block";
  // scoreBox.textContent = `คะแนนของคุณ: ${score} / ${questions.length}`;

  showScoreModal(score, questions.length);
}

function showScoreModal(score, total) {
  const modal = document.getElementById("scoreModalOverlay");
  const scoreText = document.getElementById("modalScoreText");
  const feedbackText = document.getElementById("modalFeedbackText");
  
  scoreText.textContent = `${score}/${total}`;
  
  const percentage = (score / total) * 100;
  if (percentage === 100) {
    feedbackText.textContent = "เก่งมาก! ถูกหมดเลย 🎉";
  } else if (percentage >= 70) {
    feedbackText.textContent = "ทำได้ดีมากครับ! 👍";
  } else if (percentage >= 50) {
    feedbackText.textContent = "ผ่านเกณฑ์! พยายามอีกนิดนะ ✌️";
  } else {
    feedbackText.textContent = "ไม่เป็นไรนะ ลองทบทวนเนื้อหาแล้วทำใหม่ดู! 💪";
  }

  modal.style.display = "flex";
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });
}

document.getElementById("tryAgainBtn")?.addEventListener("click", () => {
  document.getElementById("scoreModalOverlay").style.display = "none";
  // ล้างการสไตล์และ choice ที่เลือกไว้ทั้งหมด
  renderQuiz(quizData);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("newQuizBtn")?.addEventListener("click", () => {
  window.location.href = "/result";
});

document.getElementById("retryBtn")?.addEventListener("click", () => {
  window.location.href = "/result";
});
(function initQuizPage() {
  const rawQuizData = localStorage.getItem("quizData");

  console.log("========== QUIZ DEBUG ==========");
  console.log("RAW quizData from localStorage:");
  console.log(rawQuizData);

  if (!rawQuizData) {
    quizContainer.innerHTML = "";
    document.getElementById("errorCard").style.display = "block";
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
    quizContainer.innerHTML = "";
    document.getElementById("errorCard").style.display = "block";
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