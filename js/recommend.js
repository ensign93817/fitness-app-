// === 🔐 統一 safeName 規則（這裡主要用在歷史重量查詢用的 key） ===
function makeSafeName(name) {
  return (name || "").replace(/[^\w一-龥ㄱ-ㅎㅏ-ㅣ]/g, "_");
}
function getMenuDocPart(part) {
  switch (part) {
    case "二頭肌":
      return "手部-二頭肌（Biceps）";   // ← 這裡請填你 Firestore 內真正的 doc 名稱
    case "三頭肌":
      return "手部-三頭肌（Triceps）";  // ← 這裡同上（如果沒有就刪掉）
    default:
      return part;
  }
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

// 🔁 部位循環順序：用來決定「下一次」要練哪個部位
// ❗ 這裡改成乾淨的中文名稱，對應 menus 裡的 docId：${goal}_${part}
const BODY_ORDER = ["胸部", "背部", "腿部", "肩部", "二頭肌", "三頭肌", "核心"];

function getNextBodyPart(lastPart) {
  const idx = BODY_ORDER.indexOf(lastPart);
  if (idx === -1) return BODY_ORDER[0];      // 找不到就從胸部開始
  return BODY_ORDER[(idx + 1) % BODY_ORDER.length];
}

// 👤 初始化使用者（跟 training.js 的邏輯一樣）
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
      alert("⚠️ 尚未建立基本資料！請先前往「建立個人資料」頁面。");
      window.location.href = "./profile.html";
      return null;
    }
  } catch (err) {
    console.error("❌ 無法檢查使用者資料：", err);
  }

  const userNameText = document.getElementById("userNameText");
  if (userNameText) userNameText.textContent = userName;

  return userName;
}

// 🔹 讀取推薦 & 顯示在畫面上
async function loadRecommendation(userName) {
  const lastTrainingText = document.getElementById("lastTrainingText");
  const todayGoalText = document.getElementById("todayGoalText");
  const todayPartText = document.getElementById("todayPartText");
  const manualGoal = document.getElementById("manualGoal");
  const manualPart = document.getElementById("manualPart");
  const menuContainer = document.getElementById("menuContainer");

  let currentGoal = "增肌";
  let currentPart = "胸部";

  try {
    const snap = await getDoc(doc(db, "profiles", userName));
    const data = snap.data();

    // 🟢 有 lastTraining：沿用目標＋部位循環
    if (data && data.lastTraining) {
      const lastGoal = data.lastTraining.goal || "增肌";
      const lastPart = data.lastTraining.bodyPart || "胸部";
      const nextPart = getNextBodyPart(lastPart);

      lastTrainingText.textContent = `目標 ${lastGoal}，部位 ${lastPart}`;
      currentGoal = lastGoal;
      currentPart = nextPart;
    } else {
      // 🔵 第一次使用：固定「增肌 + 胸部」
      lastTrainingText.textContent =
        "尚無訓練紀錄，第一次使用，本次預設為：目標 增肌、部位 胸部。";
      currentGoal = "增肌";
      currentPart = "胸部";
    }
  } catch (e) {
    console.error("❌ 無法讀取 lastTraining：", e);
    lastTrainingText.textContent = "讀取失敗，已使用預設推薦（增肌，胸部）。";
    currentGoal = "增肌";
    currentPart = "胸部";
  }

  // 更新畫面上的「今天建議」
  todayGoalText.textContent = currentGoal;
  todayPartText.textContent = currentPart;

  // 手動選單預設值
  manualGoal.value = currentGoal;
  manualPart.value = currentPart;

  // 顯示推薦菜單
  await loadMenuPreview(userName, currentGoal, currentPart, menuContainer);

  // 回傳目前選擇給其他事件使用
  return { currentGoal, currentPart };
}

// 🔹 只做「菜單預覽」：列出動作 / 組數 / 次數 / 休息 / 上次重量
async function loadMenuPreview(userName, goal, part, menuContainer) {
  menuContainer.textContent = "正在載入菜單...";

  try {
    const docPart = getMenuDocPart(part);
    const menuSnap = await getDoc(doc(db, "menus", `${goal}_${part}`));
    if (!menuSnap.exists()) {
      menuContainer.textContent = "⚠️ 查無此訓練菜單。";
      return;
    }

    const menuData = menuSnap.data();
    const exercises = Array.isArray(menuData.exercises) ? menuData.exercises : [];

    // 讀取使用者歷史重量
    const profileSnap = await getDoc(doc(db, "profiles", userName));
    const profileData = profileSnap.data() || {};
    const historyAll = profileData.history || {};

    if (!exercises.length) {
      menuContainer.textContent = "目前此菜單尚未設定任何動作。";
      return;
    }

    menuContainer.innerHTML = "";
    exercises.forEach((ex, idx) => {
      const safeName = makeSafeName(ex.name);
      const history = historyAll[safeName] || {};
      const dates = Object.keys(history).sort();
      const lastWeight =
        dates.length > 0
          ? history[dates[dates.length - 1]]
          : (ex.defaultWeight || ex.weight || "尚無紀錄");

      const div = document.createElement("div");
      div.innerHTML = `
        <h3>${idx + 1}. ${ex.name || "未命名動作"}</h3>
        <p>組數：${ex.defaultSets || "未設定"}　次數：${ex.defaultReps || "未設定"}</p>
        <p>休息：${ex.restSec || "未設定"} 秒</p>
        <p>上次訓練重量：${lastWeight} kg</p>
      `;
      menuContainer.appendChild(div);
    });
  } catch (e) {
    console.error("❌ 載入推薦菜單失敗：", e);
    menuContainer.textContent = "❌ 無法載入推薦菜單，請稍後再試。";
  }
}

// === 🚀 頁面啟動 ===
window.addEventListener("DOMContentLoaded", async () => {
  const userName = await initUser();
  if (!userName) return;

  const acceptBtn = document.getElementById("acceptBtn");
  const manualBtn = document.getElementById("manualBtn");
  const manualArea = document.getElementById("manualArea");
  const manualGoal = document.getElementById("manualGoal");
  const manualPart = document.getElementById("manualPart");
  const applyManualBtn = document.getElementById("applyManualBtn");
  const todayGoalText = document.getElementById("todayGoalText");
  const todayPartText = document.getElementById("todayPartText");
  const menuContainer = document.getElementById("menuContainer");

  // 先載入推薦
  let { currentGoal, currentPart } = await loadRecommendation(userName);

  // ✅ 接受推薦 → 直接帶目標/部位進訓練紀錄頁
  acceptBtn.addEventListener("click", () => {
    localStorage.setItem("lastGoal", currentGoal);
    localStorage.setItem("lastPart", currentPart);
    const url =
      `training.html?goal=${encodeURIComponent(currentGoal)}` +
      `&part=${encodeURIComponent(currentPart)}`;
    window.location.href = url;
  });

  // ✏️ 我想自己選 → 展開手動設定區塊（留在今日推薦頁）
  manualBtn.addEventListener("click", () => {
    manualArea.style.display = manualArea.style.display === "none" ? "block" : "none";
  });

  // 重新套用手動條件 → 更新今天建議 + 菜單預覽，但人還在今日推薦頁
  applyManualBtn.addEventListener("click", async () => {
    currentGoal = manualGoal.value;
    currentPart = manualPart.value;

    todayGoalText.textContent = currentGoal;
    todayPartText.textContent = currentPart;

    await loadMenuPreview(userName, currentGoal, currentPart, menuContainer);
  });
});
