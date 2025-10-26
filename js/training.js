// ========== Firebase 初始化 ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ 你的 Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyBur0O0PTGxPotyDSOB9Yj1Gaqf3B0",
  authDomain: "fitness-guide-9a83f.firebaseapp.com",
  projectId: "fitness-guide-9a83f",
  storageBucket: "fitness-guide-9a83f.appspot.com",
  messagingSenderId: "969288112649",
  appId: "1:969288112649:web:58b5b807c410388b138d8",
  measurementId: "G-7XL13P4K0Q"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========== DOM 元素 ==========
const goalSelect = document.getElementById("goalSelect");
const partSelect = document.getElementById("partSelect");
const loadBtn = document.getElementById("loadBtn");
const container = document.getElementById("exerciseContainer");

// ========== 載入菜單 ==========
loadBtn.addEventListener("click", async () => {
  const goal = goalSelect.value.trim();
  const part = partSelect.value.trim();

  if (!goal || !part) {
    alert("請選擇訓練目標與部位！");
    return;
  }

  const docName = `${goal}_${part}`;
  console.log("📦 嘗試讀取文件：", docName);

  try {
    const docRef = doc(db, "menus", docName);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn("⚠️ 文件不存在：", docName);
      container.innerHTML = `<p>⚠️ 沒有可用的訓練項目。</p>`;
      return;
    }

    const data = docSnap.data();
    console.log("✅ 成功載入文件資料：", data);
    displayExercises(data.exercises || []);
  } catch (error) {
    console.error("❌ Firestore 讀取錯誤：", error);
    container.innerHTML = `<p>❌ 無法載入菜單，請稍後再試。</p>`;
  }
});

// ========== 顯示訓練項目 ==========
function displayExercises(exercises) {
  container.innerHTML = "";

  if (!Array.isArray(exercises) || exercises.length === 0) {
    container.innerHTML = `<p>⚠️ 沒有可用的訓練項目。</p>`;
    return;
  }

  // 移除重複動作（以「訓練動作」為唯一）
  const uniqueList = Array.from(new Map(exercises.map(e => [e["訓練動作"], e])).values());

  uniqueList.forEach((ex, i) => {
    const name = ex["訓練動作"] || "未命名動作";
    const sets = ex["組數"] || "3到4";
    const reps = ex["次數"] || "8到12";
    const rest = ex["休息時間"] || "60-90 秒";
    const baseWeight = Number(ex["重量(KG)"]) || 0;
    const delta = Number(ex["每次增減重量量(KG)"]) || 0;

    let currentWeight = baseWeight;

    const card = document.createElement("div");
    card.classList.add("exercise-card");
    card.innerHTML = `
      <h3>${i + 1}. ${name}</h3>
      <p>組數：${sets}　次數：${reps}</p>
      <p>休息：${rest}</p>
      <p>重量：<span class="weight">${currentWeight}</span> kg</p>
      <div class="btn-group">
        <button class="add-btn">加重</button>
        <button class="keep-btn">維持</button>
        <button class="reduce-btn">減重</button>
      </div>
    `;

    const weightText = card.querySelector(".weight");
    const addBtn = card.querySelector(".add-btn");
    const keepBtn = card.querySelector(".keep-btn");
    const reduceBtn = card.querySelector(".reduce-btn");

    // === 加重 ===
    addBtn.addEventListener("click", () => {
      currentWeight += delta;
      weightText.textContent = currentWeight;
    });

    // === 維持 ===
    keepBtn.addEventListener("click", () => {
      alert(`維持目前重量 ${currentWeight} kg`);
    });

    // === 減重 ===
    reduceBtn.addEventListener("click", () => {
      currentWeight = Math.max(0, currentWeight - delta);
      weightText.textContent = currentWeight;
    });

    container.appendChild(card);
  });
}
