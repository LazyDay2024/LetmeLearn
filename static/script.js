const dataType = document.getElementById("data_type");
const textBox = document.getElementById("textBox");
const fileBox = document.getElementById("fileBox");
const fileInput = document.getElementById("file");
const uploadForm = document.getElementById("uploadForm");
const submitBtn = document.getElementById("submitBtn");

const progressWrapper = document.getElementById("progressWrapper");
const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");
const statusText = document.getElementById("statusText");

let fakeProgress = 0;
let progressTimer = null;
let isFinished = false;

dataType.addEventListener("change", function () {
  const selected = dataType.value;

  if (selected === "text") {
    textBox.style.display = "block";
    fileBox.style.display = "none";
    fileInput.value = "";
    fileInput.accept = "";
  } else if (selected === "image") {
    textBox.style.display = "none";
    fileBox.style.display = "block";
    fileInput.accept = "image/*";
  } else if (selected === "pdf") {
    textBox.style.display = "none";
    fileBox.style.display = "block";
    fileInput.accept = ".pdf";
  }
});

function setProgress(percent, message) {
  progressFill.style.width = percent + "%";
  progressPercent.textContent = percent + "%";
  statusText.textContent = message;
}

function startFakeProgress() {
  fakeProgress = 0;
  isFinished = false;
  setProgress(3, "กำลังเริ่มประมวลผล...");

  const checkpoints = [3, 17, 45, 65, 78, 89];
  let index = 1;

  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    if (isFinished) return;

    let target;

    if (index < checkpoints.length) {
      target = checkpoints[index];
      index++;
    } else {
      target = Math.min(fakeProgress + Math.floor(Math.random() * 4) + 1, 95);
    }

    fakeProgress = target;

    if (fakeProgress < 45) {
      setProgress(fakeProgress, "กำลังอัปโหลดข้อมูล...");
    } else if (fakeProgress < 78) {
      setProgress(fakeProgress, "กำลังวิเคราะห์เนื้อหา...");
    } else {
      setProgress(fakeProgress, "AI กำลังสรุปผลลัพธ์...");
    }

    if (fakeProgress >= 95) {
      clearInterval(progressTimer);
    }
  }, 500);
}

function finishFakeProgress() {
  isFinished = true;
  clearInterval(progressTimer);
  setProgress(100, "เสร็จสิ้น");
}

uploadForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("data_type", dataType.value);

  if (dataType.value === "text") {
    const text = document.getElementById("text_content").value.trim();
    if (!text) {
      alert("กรุณาใส่ข้อความก่อน");
      return;
    }
    formData.append("text_content", text);
  } else {
    const file = fileInput.files[0];
    if (!file) {
      alert("กรุณาเลือกไฟล์ก่อน");
      return;
    }
    formData.append("file", file);
  }

  progressWrapper.style.display = "block";
  submitBtn.disabled = true;
  startFakeProgress();

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/submit", true);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      submitBtn.disabled = false;

      if (xhr.status === 200) {
        finishFakeProgress();

        const result = JSON.parse(xhr.responseText);
        const summaryText = result.summary || result.extracted_text || "ไม่พบ summary";

        // เก็บ summary ไว้ใช้ในหน้าถัดไป
        localStorage.setItem("summary", summaryText);

        // รอให้ progress โชว์ 100% แป๊บหนึ่ง แล้วค่อยไปหน้าใหม่
        setTimeout(() => {
          window.location.href = "/result";
        }, 500);
      } else {
        clearInterval(progressTimer);
        setProgress(0, "เกิดข้อผิดพลาด");
        alert("อัปโหลดไม่สำเร็จ");
      }
    }
  };

  xhr.send(formData);
});