// ======== Firebase 初始化 ========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ 你的 Firebase 設定（請用你自己的專案設定替換）
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

// ======== DOM 元素 ========
const goalSelect = document.getElementById("goalSelect");
const partSelect = document.getElementById("partSelect");
const loadBtn = document.getElementById("loadBtn");
const container = document.getElementById("exerciseContainer");

// ======== 載入按鈕事件 ========
loadBtn.addEventListener("click", async () => {
  const goal = goalSelect.value.trim();
  const part = partSelect.value.trim();

  if (!goal || !part) {
    alert("請選擇訓練目標與訓練部位！");
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
      container.innerHTML = `<p>⚠️ 找不到此組合的訓練菜單。</p>`;
    }
  } catch (error) {
    console.error("❌ Firestore 讀取錯誤：", error);
    container.innerHTML = `<p>❌ 無法載入資料，請稍後再試。</p>`;
  }
});

// ======== 顯示訓練菜單 ========
function displayExercises(exercises) {
  container.innerHTML = "";

  // 只保留「第一次」的紀錄並移除重複動作
  const uniqueExercises = Array.from(
    new Map(
      exercises
        .filter(ex => ex["使用者反應"] === "第一次")
        .map(ex => [ex["訓練動作"], ex])
    ).values()
  );

  if (uniqueExercises.length === 0) {
    container.innerHTML = `<p>⚠️ 沒有可用的訓練項目。</p>`;
    return;
  }

  uniqueExercises.forEach((ex, index) => {
    const card = document.createElement("div");
    card.classList.add("exercise-card");

    let currentWeight = Number(ex["重量(KG)"]) || 0;
    const delta = Number(ex["每次增減重量量(KG)"]) || 0;
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

    // === 加減重邏輯 ===
    const weightSpan = card.querySelector(".weight");
    const addBtn = card.querySelector(".add-btn");
    const keepBtn = card.querySelector(".keep-btn");
    const reduceBtn = card.querySelector(".reduce-btn");

    addBtn.addEventListener("click", () => {
      currentWeight += delta;
      weightSpan.textContent = currentWeight;
    });

    keepBtn.addEventListener("click", () => {
      alert(`維持目前重量 ${currentWeight} kg`);
    });

    reduceBtn.addEventListener("click", () => {
      currentWeight -= delta;
      if (currentWeight < 0) currentWeight = 0;
      weightSpan.textContent = currentWeight;
    });

    container.appendChild(card);
  });
}
