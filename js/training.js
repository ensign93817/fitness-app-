import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const goalSelect = document.getElementById("goalSelect");
const partSelect = document.getElementById("partSelect");
const loadBtn = document.getElementById("loadBtn");
const container = document.getElementById("exerciseContainer");

// 載入 Firestore 資料
loadBtn.addEventListener("click", async () => {
  const goal = goalSelect.value.trim();
  const part = partSelect.value.trim();

  if (!goal || !part) {
    alert("請選擇訓練目標與部位！");
    return;
  }

  const key = `${goal}_${part}`;
  console.log("🔍 查找文件：", key);

  try {
    const docRef = doc(db, "menus", key);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      displayExercises(data.exercises);
    } else {
      container.innerHTML = `<p>找不到相應的訓練菜單。</p>`;
    }
  } catch (error) {
    console.error("❌ 讀取 Firestore 發生錯誤：", error);
  }
});

// 顯示訓練菜單
function displayExercises(exercises) {
  container.innerHTML = "";

  // 只保留「第一次」且不重複名稱
  const uniqueExercises = Array.from(
    new Map(
      exercises
        .filter(ex => ex["使用者反應"] === "第一次")
        .map(ex => [ex["訓練動作"], ex])
    ).values()
  );

  if (uniqueExercises.length === 0) {
    container.innerHTML = `<p>沒有可用的訓練項目。</p>`;
    return;
  }

  uniqueExercises.forEach((ex, index) => {
    const card = document.createElement("div");
    card.classList.add("exercise-card");

    let currentWeight = ex["重量(KG)"] || 0;
    const delta = ex["每次增減重量量(KG)"] || 0;
    const sets = ex["組數"] || "3到4";
    const reps = ex["次數"] || "8到12";
    const rest = ex["休息時間"] || "75 秒";

    card.innerHTML = `
      <h3>${index + 1}. ${ex["訓練動作"]}</h3>
      <p>組數：${sets}　次數：${reps}</p>
      <p>休息：${rest}</p>
      <p>重量：<span class="weight">${currentWeight}</span> kg</p>
      <div class="btn-group">
        <button class="add-btn">加重</button>
        <button class="keep-btn">維持</button>
        <button class="reduce-btn">減重</button>
      </div>
    `;

    // 綁定按鈕
    const weightSpan = card.querySelector(".weight");
    card.querySelector(".add-btn").addEventListener("click", () => {
      currentWeight += delta;
      weightSpan.textContent = currentWeight;
    });
    card.querySelector(".keep-btn").addEventListener("click", () => {
      alert(`維持 ${currentWeight} kg`);
    });
    card.querySelector(".reduce-btn").addEventListener("click", () => {
      currentWeight -= delta;
      if (currentWeight < 0) currentWeight = 0;
      weightSpan.textContent = currentWeight;
    });

    container.appendChild(card);
  });
}
