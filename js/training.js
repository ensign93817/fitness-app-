// ================================
//  fitness-app: training.js (新版)
// ================================

// Firestore 初始化（確保已引入 Firebase SDK）
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
 apiKey: "AIzaSyBur0DoRPT0csPqtyDSOQBYMjlGaqf3EB0",
  authDomain: "fitness-guide-9a8f3.firebaseapp.com",
  projectId: "fitness-guide-9a8f3",
  storageBucket: "fitness-guide-9a8f3.firebasestorage.app",
  messagingSenderId: "969288112649",
  appId: "1:969288112649:web:58b5b807c410388b1836d8",
  measurementId: "G-7X1L324K0Q"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------------------------
// DOM 元素
// ---------------------------
const goalSelect = document.getElementById("goalSelect");
const partSelect = document.getElementById("partSelect");
const loadBtn = document.getElementById("loadBtn");
const exerciseContainer = document.getElementById("exerciseContainer");

// ---------------------------
// 事件：載入菜單
// ---------------------------
loadBtn.addEventListener("click", async () => {
  const goal = goalSelect.value.trim();
  const part = partSelect.value.trim();

  if (!goal || !part) {
    exerciseContainer.innerHTML = "<p>⚠️ 請先選擇訓練目標與部位</p>";
    return;
  }

  const key = `${goal}_${part}`;
  console.log("🔍 查找文件：", key);

  const docRef = doc(db, "menus", key);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    exerciseContainer.innerHTML = `<p>❌ 找不到菜單：${key}</p>`;
    return;
  }

  const data = docSnap.data();
  if (!data.exercises || !Array.isArray(data.exercises)) {
    exerciseContainer.innerHTML = "<p>⚠️ 此菜單資料不完整</p>";
    return;
  }

  renderExercises(data.exercises);
});
// 建立每個動作卡片
docSnap.data().exercises
  .filter(ex => ex["使用者反應"] === "第一次")
  .forEach((ex, index) => {
    const card = document.createElement("div");
    card.classList.add("exercise-card");

    // 初始重量與增減量
    let currentWeight = ex.defaultWeight || ex["重量(KG)"] || 0;
    const delta = ex.deltaWeight || ex["每次增減重量量(KG)"] || 0;

    card.innerHTML = `
      <h3>${index + 1}. ${ex.name || ex["訓練動作"]}</h3>
      <p>組數：${ex.defaultSets || ex["組數"]}　次數：${ex.defaultReps || ex["次數"]}</p>
      <p>休息：${ex.restSec || ex["休息時間"]} 秒</p>
      <p>重量：<span class="weight">${currentWeight}</span> kg</p>
      <div class="btn-group">
        <button class="add-btn">加重</button>
        <button class="keep-btn">維持</button>
        <button class="reduce-btn">減重</button>
      </div>
    `;

    // 綁定按鈕事件
    const weightSpan = card.querySelector(".weight");
    const addBtn = card.querySelector(".add-btn");
    const keepBtn = card.querySelector(".keep-btn");
    const reduceBtn = card.querySelector(".reduce-btn");

    addBtn.addEventListener("click", () => {
      currentWeight += delta;
      weightSpan.textContent = currentWeight;
    });

    keepBtn.addEventListener("click", () => {
      alert("保持當前重量：" + currentWeight + " kg");
    });

    reduceBtn.addEventListener("click", () => {
      currentWeight -= delta;
      if (currentWeight < 0) currentWeight = 0;
      weightSpan.textContent = currentWeight;
    });

    container.appendChild(card);
  });

// ---------------------------
// 顯示訓練動作
// ---------------------------
function renderExercises(exercises) {
  exerciseContainer.innerHTML = "";
  exercises.forEach((ex, i) => {
    const name = ex.name || "未命名動作";
    const reps = ex.defaultReps || "?";
    const sets = ex.defaultSets || "?";
    const rest = ex.restSec || "?";
    const delta = ex.deltaWeight ?? 0;
    let weight = ex.defaultWeight ?? 0;

    // 每個動作的卡片
    const div = document.createElement("div");
    div.classList.add("exercise-card");
    div.innerHTML = `
      <h3>${i + 1}. ${name}</h3>
      <p>組數：${sets}　次數：${reps}</p>
      <p>休息：${rest} 秒</p>
      <p id="weight-${i}">重量：${weight} kg</p>
      <div class="btn-group">
        <button class="add-btn">加重</button>
        <button class="keep-btn">維持</button>
        <button class="reduce-btn">減重</button>
      </div>
    `;

    // 三個控制按鈕
    div.querySelector(".add-btn").addEventListener("click", () => {
      weight += delta;
      document.getElementById(`weight-${i}`).innerText = `重量：${weight} kg`;
    });

    div.querySelector(".keep-btn").addEventListener("click", () => {
      document.getElementById(`weight-${i}`).innerText = `重量：${weight} kg（維持）`;
    });

    div.querySelector(".reduce-btn").addEventListener("click", () => {
      weight -= delta;
      if (weight < 0) weight = 0;
      document.getElementById(`weight-${i}`).innerText = `重量：${weight} kg`;
    });

    exerciseContainer.appendChild(div);
  });
}
