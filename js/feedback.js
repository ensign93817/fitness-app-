// js/feedback.js

// === 🕓 本地時間工具 ===
function localISODateTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function localISODate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// 🔐 統一 safeName 規則（跟 training.js 一樣）
function makeSafeName(name) {
  return (name || "").replace(/[^\w一-龥ㄱ-ㅎㅏ-ㅣ]/g, "_");
}

function getHistoryForExercise(userData, exerciseName, safeKeyFromSession) {
  const allHistory = userData.history || {};

  if (safeKeyFromSession && allHistory[safeKeyFromSession]) {
    return allHistory[safeKeyFromSession];
  }
  const keyNew = makeSafeName(exerciseName);
  if (allHistory[keyNew]) return allHistory[keyNew];

  const keyOld1 = (exerciseName || "").replace(/[\/\[\]#$.()\s（）]/g, "_");
  if (allHistory[keyOld1]) return allHistory[keyOld1];

  const keyOld2 = (exerciseName || "").replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣一-龥]/g, "_");
  if (allHistory[keyOld2]) return allHistory[keyOld2];

  return {};
}

// === 🔥 Firebase SDK：只 import 一次就好 ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === ⚙️ Firebase 初始化設定：也只宣告一次 ===
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

// 🔹 訓後回顧頁：載入使用者與最近一次訓練（處理「載入中…」那兩行）
async function initFeedbackHeader() {
  const userNameEl = document.getElementById("userNameText");
  const lastTrainingEl = document.getElementById("lastTrainingText");

  const userName = localStorage.getItem("userName");

  if (!userName) {
    if (userNameEl) userNameEl.textContent = "（尚未登入）";
    if (lastTrainingEl) lastTrainingEl.textContent = "尚未有訓練紀錄。";
    return null;
  }

  if (userNameEl) userNameEl.textContent = userName;

  try {
    const userRef = doc(db, "profiles", userName);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      if (lastTrainingEl) lastTrainingEl.textContent = "尚未建立個人資料。";
      return userName;
    }

    const data = snap.data();
    if (data.lastTraining) {
      const { goal, bodyPart, date } = data.lastTraining;
      if (lastTrainingEl) {
        lastTrainingEl.textContent =
          `${date || "日期未紀錄"}，目標 ${goal || "-"}，部位 ${bodyPart || "-"}`;
      }
    } else {
      if (lastTrainingEl) lastTrainingEl.textContent = "尚未有訓練紀錄。";
    }
  } catch (e) {
    console.error("❌ 無法讀取 lastTraining：", e);
    if (lastTrainingEl) lastTrainingEl.textContent = "讀取失敗，請稍後再試。";
  }

  return userName;
}

// === 👤 取得使用者 (for history) ===
async function getCurrentUser() {
  const userName = localStorage.getItem("userName") || "guestUser";
  const userRef = doc(db, "profiles", userName);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    alert("⚠️ 找不到您的訓練資料，請先建立個人資料。");
    window.location.href = "./profile.html";
    return { userName: null, userData: null };
  }

  return { userName, userData: userSnap.data() };
}

// === 📊 建立單一動作的卡片 + 圖表 ===
function createExerciseCard(index, exName, lastWeightText) {
  const container = document.getElementById("feedbackContainer");
  const card = document.createElement("section");
  card.className = "card mb-4";
  card.style.padding = "16px";

  card.innerHTML = `
    <h2>${index + 1}. ${exName}</h2>
    <p>本次訓練重量：<b id="currentWeight-${index}">${lastWeightText}</b> kg</p>
    <p style="font-size: 14px; color: #777;">
      下方折線圖顯示的是「每一次按下『✅ 完成訓練』時」儲存到系統的重量紀錄（最多最近 30 筆），
      不包含訓練過程中每次點「加重 / 維持 / 減重」的中間調整。
    </p>
    <canvas id="chart-${index}" height="140"></canvas>
  `;

  container.appendChild(card);
  return document.getElementById(`chart-${index}`);
}

function renderExerciseChart(ctx, labels, data) {
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "每次完成訓練時的重量 (kg)",
          data,
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
}

// === 🚀 頁面啟動 ===
window.addEventListener("DOMContentLoaded", async () => {
  await initFeedbackHeader();   // 把「載入中…」換成真實資料

  const raw = localStorage.getItem("lastFeedbackData");
  if (!raw) {
    alert("找不到本次訓練的回顧資料，請先到『訓練紀錄』完成一次訓練。");
    window.location.href = "./training.html";
    return;
  }

  const sessionInfo = JSON.parse(raw);
  const { date, goal, bodyPart, sessionSeries, totalWeight } = sessionInfo;

  // 2. 顯示整體摘要
  const summaryEl = document.getElementById("sessionSummary");
  if (summaryEl) {
    summaryEl.innerHTML = `
      📅 日期：${date || localISODate()}<br>
      🎯 目標：${goal || "-"}　／　訓練部位：${bodyPart || "-"}<br>
      🧱 本次訓練總重量：約 <b>${(totalWeight || 0).toFixed(1)} kg</b>
    `;
  }

  // 3. 讀取 Firestore 資料
  const { userName, userData } = await getCurrentUser();
  if (!userName || !userData) return;

  const entries = Object.entries(sessionSeries || {});
  if (!entries.length) {
    const container = document.getElementById("feedbackContainer");
    if (container) {
      container.innerHTML =
        "<p>找不到本次訓練的動作資料，可能是訓練過程中發生錯誤。</p>";
    }
    return;
  }
  const container = document.getElementById("feedbackContainer");
  if (container) container.innerHTML = "";
  entries.forEach(([safeKey, info], idx) => {
    const exName = info.name || safeKey;

    const history = getHistoryForExercise(userData, exName, safeKey);
    const sorted = Object.entries(history).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    const recent = sorted.slice(-30);

    let labels = [];
    let data = [];
    if (recent.length) {
      labels = recent.map(([t]) => t);
      data = recent.map(([, w]) => w);
    } else {
      const lastW =
        (info.weights && info.weights.length
          ? info.weights[info.weights.length - 1]
          : 0) || 0;
      labels = [localISODateTime()];
      data = [lastW];
    }

    const lastWeight = data[data.length - 1] || 0;
    const ctx = createExerciseCard(idx, exName, lastWeight.toFixed(1));
    renderExerciseChart(ctx, labels, data);
  });
});
