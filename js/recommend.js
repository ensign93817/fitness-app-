// === 時間工具（其實這支只用到 localISODateTime，留著彈性） ===
function localISODateTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// === Firebase SDK ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// === 初始化使用者（和 training.js 幾乎一樣） ===
async function initUser() {
  let userName = localStorage.getItem("userName");

  if (userName) {
    const change = confirm(`目前登入使用者為「${userName}」，是否要切換？`);
    if (change) {
      userName = prompt("請輸入新的使用者名稱：")?.trim() || userName;
      localStorage.setItem("userName", userName);
      alert(`✅ 已切換為使用者：${userName}`);
    }
  } else {
    userName = prompt("請輸入您的使用者名稱：")?.trim() || "guestUser";
    localStorage.setItem("userName", userName);
    alert(`👋 歡迎 ${userName}！`);
  }

  console.log("登入使用者：", userName);

  try {
    const userRef = doc(db, "profiles", userName);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert(`⚠️ 尚未建立基本資料！請先前往「建立個人資料」頁面。`);
      window.location.href = "./profile.html";
      return null;
    }
  } catch (err) {
    console.error("❌ 無法檢查使用者資料：", err);
  }

  return userName;
}

// 🔁 部位循環順序
const BODY_ORDER = ["胸部", "背部", "腿部", "肩部", "二頭肌", "三頭肌", "核心"];

function getNextBodyPart(lastPart) {
  const idx = BODY_ORDER.indexOf(lastPart);
  if (idx === -1) return BODY_ORDER[0];
  return BODY_ORDER[(idx + 1) % BODY_ORDER.length];
}

// === 主流程：載入推薦資訊 + 菜單 ===
async function loadRecommendation(userName) {
  const userNameEl = document.getElementById("userNameDisplay");
  const lastGoalEl = document.getElementById("lastGoalDisplay");
  const lastPartEl = document.getElementById("lastPartDisplay");
  const todayGoalEl = document.getElementById("todayGoalDisplay");
  const todayPartEl = document.getElementById("todayPartDisplay");
  const tbody = document.getElementById("recommendTableBody");
  const startBtn = document.getElementById("startBtn");
  const customBtn = document.getElementById("customBtn");

  userNameEl.textContent = userName;

  try {
    const userRef = doc(db, "profiles", userName);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    if (!userData.lastTraining) {
      lastGoalEl.textContent = "尚無紀錄";
      lastPartEl.textContent = "尚無紀錄";
      todayGoalEl.textContent = "請自選";
      todayPartEl.textContent = "請自選";
      tbody.innerHTML = `<tr><td colspan="5">目前尚無訓練紀錄，請先到「訓練紀錄」頁面自行選擇目標與部位進行第一次訓練。</td></tr>`;

      startBtn.style.display = "none";
      customBtn.onclick = () => (window.location.href = "training.html");
      return;
    }

    const lastGoal = userData.lastTraining.goal || "增肌";
    const lastPart = userData.lastTraining.bodyPart || BODY_ORDER[0];
    const nextPart = getNextBodyPart(lastPart);

    lastGoalEl.textContent = lastGoal;
    lastPartEl.textContent = lastPart;
    todayGoalEl.textContent = lastGoal;
    todayPartEl.textContent = nextPart;

    // 讀取推薦菜單
    const menuRef = doc(db, "menus", `${lastGoal}_${nextPart}`);
    const menuSnap = await getDoc(menuRef);

    if (!menuSnap.exists()) {
      tbody.innerHTML = `<tr><td colspan="5">查無對應的菜單（${lastGoal}_${nextPart}），請改用「我想自己選」。</td></tr>`;
    } else {
      const menuData = menuSnap.data();
      const exercises = Array.isArray(menuData.exercises) ? menuData.exercises : [];
      const historyAll = userData.history || {};

      if (!exercises.length) {
        tbody.innerHTML = `<tr><td colspan="5">此組合尚未建立訓練菜單，請改用「我想自己選」。</td></tr>`;
      } else {
        tbody.innerHTML = "";
        exercises.forEach((ex, idx) => {
          const safeName = ex.name?.replace(/[\/\[\]#$.()\s（）]/g, "_") || `ex${idx}`;
          const history = historyAll[safeName] || {};
          const dates = Object.keys(history).sort();
          const weights = dates.map(d => history[d]);
          const lastWeight = weights.at(-1) ?? "尚無紀錄";

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${idx + 1}. ${ex.name || "未命名"}</td>
            <td>${ex.defaultSets ?? "—"}</td>
            <td>${ex.defaultReps ?? "—"}</td>
            <td>${ex.restSec ?? "—"}</td>
            <td>${lastWeight}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    }

    // 接受推薦 → 帶參數跳到 training.html
    startBtn.onclick = () => {
      const url = new URL("training.html", window.location.origin);
      url.searchParams.set("goal", lastGoal);
      url.searchParams.set("part", nextPart);
      window.location.href = url.toString();
    };

    // 自己選 → 直接進 training.html
    customBtn.onclick = () => {
      window.location.href = "training.html";
    };
  } catch (e) {
    console.error("❌ 載入推薦失敗：", e);
    tbody.innerHTML = `<tr><td colspan="5">推薦資訊載入失敗，請稍後再試或改用「我想自己選」。</td></tr>`;
    startBtn.style.display = "none";
    customBtn.onclick = () => (window.location.href = "training.html");
  }
}

// === 啟動 ===
window.addEventListener("DOMContentLoaded", async () => {
  const userName = await initUser();
  if (!userName) return;
  await loadRecommendation(userName);
});
