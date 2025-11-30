// js/feedback.js

// === 🕓 只取日期 (YYYY-MM-DD) ===
function localISODate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// 🔐 跟 training.js 一樣的 safeName
function makeSafeName(name) {
  return (name || "").replace(/[^\w一-龥ㄱ-ㅎㅏ-ㅣ]/g, "_");
}

// 🔍 跟 training.js 一樣：為了兼容舊 key，同一個動作試 3 組 key
function getHistoryForExercise(userData, exerciseName) {
  const allHistory = userData.history || {};
  const keyNew  = makeSafeName(exerciseName);
  const keyOld1 = (exerciseName || "").replace(/[\/\[\]#$.()\s（）]/g, "_");
  const keyOld2 = (exerciseName || "").replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣一-龥]/g, "_");

  if (allHistory[keyNew])  return allHistory[keyNew];
  if (allHistory[keyOld1]) return allHistory[keyOld1];
  if (allHistory[keyOld2]) return allHistory[keyOld2];

  return {}; // 找不到就回傳空物件
}

// === 🔥 Firebase SDK 載入 ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === ⚙️ Firebase 初始化設定 ===
const firebaseConfig = {
  apiKey: "AIzaSyBur0DoRPT0csPqtyDSOQBYMjlGaqf3EB0",
  authDomain: "fitness-guide-9a8f3.firebaseapp.com",
  projectId: "fitness-guide-9a8f3",
  storageBucket: "fitness-guide-9a8f3.firebasestorage.app",
  messagingSenderId: "969288112649",
  appId: "1:969288112649:web:58b5b807c410388b1836d8",
  measurementId: "G-7X1L324K0Q",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === 🚀 頁面啟動 ===
window.addEventListener("DOMContentLoaded", async () => {
  // 1️⃣ 讀使用者
  const userName = localStorage.getItem("userName") || "guestUser";
  const userNameText = document.getElementById("userNameText");
  if (userNameText) userNameText.textContent = userName;

  // 2️⃣ 讀 training.js 存的最後一次訓練摘要
  const raw = localStorage.getItem("lastFeedbackData");
  const summaryText = document.getElementById("summaryText");
  const totalWeightText = document.getElementById("totalWeightText");
  const container = document.getElementById("feedbackContainer");

  if (!raw) {
    if (summaryText) summaryText.textContent = "尚未找到最近一次訓練資料。";
    if (container) container.textContent = "請先到「訓練紀錄」頁完成一次訓練。";
    return;
  }

  let feedback;
  try {
    feedback = JSON.parse(raw);
  } catch (e) {
    console.error("lastFeedbackData 解析失敗：", e);
    if (summaryText) summaryText.textContent = "最近一次訓練資料已損壞。";
    return;
  }

  const { date, goal, bodyPart, sessionSeries, totalWeight } = feedback || {};
  if (summaryText) {
    const d = date || localISODate();
    summaryText.textContent = `日期：${d}，目標：${goal || "—"}，部位：${bodyPart || "—"}`;
  }
  if (totalWeightText && typeof totalWeight === "number") {
    totalWeightText.textContent = totalWeight.toFixed(1) + " kg";
  }

  const seriesArray = Object.values(sessionSeries || {});
  if (!seriesArray.length) {
    if (container) container.textContent = "本次訓練沒有任何動作資料。";
    return;
  }

  // 3️⃣ 從 Firestore 把 history 抓出來（每次按「完成訓練」寫進去的 1 筆）
  let userData = {};
  try {
    const userRef = doc(db, "profiles", userName);
    const userSnap = await getDoc(userRef);
    userData = userSnap.exists() ? userSnap.data() : {};
  } catch (e) {
    console.error("讀取使用者 history 失敗：", e);
  }

  if (!container) return;
  container.innerHTML = "";

  // 4️⃣ 針對這次訓練的每一個動作，畫「最近 30 次完成訓練」折線圖
  seriesArray.forEach((item, idx) => {
    const name = item.name || `動作 ${idx + 1}`;
    const safeName = makeSafeName(name);

    const historyObj = getHistoryForExercise(userData, name);
    const entries = Object.entries(historyObj).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    const recent = entries.slice(-30); // ⬅️ 只要最近 30 筆「完成訓練」紀錄
    const dates = recent.map(([d]) => d);
    const weights = recent.map(([, w]) => w);

    // 今天的重量：優先用 history 最後一筆；沒有就退回 sessionSeries 裡的最後一個
    const todayWeight =
      weights.length
        ? weights[weights.length - 1]
        : (Array.isArray(item.weights) && item.weights[item.weights.length - 1]) || 0;

    const card = document.createElement("div");
    card.className = "card p-3 mb-3 shadow-sm";

    const canvasId = `fb-chart-${idx}`;

    card.innerHTML = `
      <h3 style="margin-bottom:6px;">${idx + 1}. ${name}</h3>
      <p style="margin:2px 0;">本次訓練重量：<b>${todayWeight || "尚未有紀錄"}</b> kg</p>
      <p style="margin:2px 0; font-size:13px; color:#666;">
        折線圖顯示「每次按下 <完成訓練> 時」寫入的歷史紀錄（最多 30 筆）。
      </p>
      <canvas id="${canvasId}" height="140"></canvas>
    `;

    container.appendChild(card);

    // 沒有任何歷史就不要畫圖
    if (!dates.length || !weights.length) {
      const tip = document.createElement("p");
      tip.style.fontSize = "13px";
      tip.style.color = "#999";
      tip.textContent = "目前尚未有過去的完成訓練紀錄。";
      card.appendChild(tip);
      return;
    }

    const ctx = document.getElementById(canvasId);
    // 全部點都是「完成訓練」時寫進 DB 的一筆
    new Chart(ctx, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "每次完成訓練的重量 (kg)",
            data: weights,
            borderColor: "#007bff",
            backgroundColor: "rgba(0,123,255,0.1)",
            tension: 0.2,
          },
        ],
      },
      options: {
        animation: false,
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  });
});
