// ========== Firebase 初始化 ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBur0DoRPT0csPqtyDSOQBYMjlGaqf3EB0",
  authDomain: "fitness-guide-9a8f3.firebaseapp.com",
  projectId: "fitness-guide-9a8f3",
  storageBucket: "fitness-guide-9a8f3.firebasestorage.app",
  messagingSenderId: "969288112649",
  appId: "1:969288112649:web:58b5b807c410388b1836d8",
  measurementId: "G-7X1L324K0Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========== DOM ==========
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
      container.innerHTML = `<p>⚠️ 找不到此訓練菜單。</p>`;
      return;
    }

    const data = docSnap.data();
    console.log("✅ 成功載入文件資料：", data);
    displayExercises(data.exercises || []);
  } catch (error) {
    console.error("❌ Firestore 讀取錯誤：", error);
    container.innerHTML = `<p style="color:red;">❌ 無法載入菜單，請稍後再試。</p>`;
  }
});

// ========== 顯示訓練項目 ==========
function displayExercises(exercises) {
  container.innerHTML = "";

  if (!Array.isArray(exercises) || exercises.length === 0) {
    container.innerHTML = `<p>⚠️ 沒有可用的訓練項目。</p>`;
    return;
  }

  // ✅ 去重：若重複動作，保留「第一筆有重量資料」的版本
  const uniqueMap = new Map();
  exercises.forEach(ex => {
    const name = ex.name || ex["訓練動作"] || "未命名動作";
    const weight = Number(ex.defaultWeight || ex["重量(KG)"] || 0);
    if (!uniqueMap.has(name)) {
      uniqueMap.set(name, ex);
    } else {
      const saved = uniqueMap.get(name);
      if ((!saved.defaultWeight || saved.defaultWeight === 0) && weight > 0) {
        uniqueMap.set(name, ex);
      }
    }
  });

  const uniqueExercises = Array.from(uniqueMap.values());

  // ✅ 顯示卡片
  uniqueExercises.forEach((ex, i) => {
    const name = ex.name || ex["訓練動作"] || "未命名動作";
    const reps = ex.defaultReps || ex["次數"] || "8–12";
    const sets = ex.defaultSets || ex["組數"] || "3–4";
    const rest = ex.restSec || ex["休息時間"] || 75;
    const baseWeight = Number(ex.defaultWeight || ex["重量(KG)"] || 0);
    const delta = Number(ex.deltaWeight || ex["每次增減重量量(KG)"] || 2.5);
    // 根據目標補推薦重量
let baseWeight = Number(ex.defaultWeight || ex["重量(KG)"]);
if (!baseWeight || baseWeight === 0) {
  if (goalSelect.value === "增肌") baseWeight = 30;
  else if (goalSelect.value === "力量") baseWeight = 40;
  else if (goalSelect.value === "減脂") baseWeight = 20;
  else if (goalSelect.value === "耐力") baseWeight = 15;
  else baseWeight = 25;
}

const delta = Number(ex.deltaWeight || ex["每次增減重量量(KG)"] || 2.5);

    let currentWeight = baseWeight;

    const card = document.createElement("div");
    card.classList.add("exercise-card");
    card.innerHTML = `
      <h3>${i + 1}. ${name}</h3>
      <p>組數：${sets}　次數：${reps}</p>
      <p>休息：${rest} 秒</p>
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

    addBtn.addEventListener("click", () => {
      currentWeight += delta;
      weightText.textContent = currentWeight.toFixed(1);
    });

    keepBtn.addEventListener("click", () => {
      alert(`維持目前重量 ${currentWeight.toFixed(1)} kg`);
    });

    reduceBtn.addEventListener("click", () => {
      currentWeight = Math.max(0, currentWeight - delta);
      weightText.textContent = currentWeight.toFixed(1);
    });

    container.appendChild(card);
  });
}
