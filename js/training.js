// === 🕓 取得本地時區日期 (YYYY-MM-DD) ===
function localISODate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// === 🔥 Firebase SDK 載入 ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === ⚙️ Firebase 初始化設定 ===
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

// === ✅ 檢查使用者是否已在 profile.html 建立資料 ===
const activeUser = localStorage.getItem("activeUser");
if (!activeUser) {
  alert("請先建立個人資料，再進行訓練推薦。");
  window.location.href = "profile.html";
} else {
  console.log("目前登入使用者：", activeUser);
}

// === 👤 初始化使用者 ===
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

  const h2 = document.querySelector("h2");
  if (h2) {
    h2.insertAdjacentHTML(
      "beforebegin",
      `<div style="margin:10px 0;">👤 當前使用者：<b>${userName}</b></div>`
    );
  }
  return userName;
}

// === 💪 顯示上次訓練目標與部位 ===
// === 💪 顯示上次訓練目標與部位 ===
async function showLastTraining() {
  const userName = localStorage.getItem("userName"); // ✅ 統一名稱
  if (!userName) return;

  try {
    const userSnap = await getDoc(doc(db, "profiles", userName)); // ✅ 用 userName 抓資料
    const data = userSnap.data();
    if (data?.lastTraining) {
      const infoDiv = document.createElement("div");
      infoDiv.className = "alert alert-info mt-2";
      infoDiv.innerHTML = `📌 上次訓練：<b>${data.lastTraining.goal}</b> - <b>${data.lastTraining.bodyPart}</b>`;
      document.querySelector("h2")?.insertAdjacentElement("beforebegin", infoDiv);
    }
  } catch (e) {
    console.warn("❌ 無法讀取上次訓練紀錄：", e);
  }
}

// === 📦 載入菜單 ===
async function loadMenu(db, userName) {
  const goal = document.getElementById("goalSelect").value;
  const part = document.getElementById("partSelect").value;
  const loadBtn = document.getElementById("loadBtn");
  const container = document.getElementById("exerciseContainer");

  if (!goal || !part) {
    alert("⚠️ 請先選擇訓練目標與部位！");
    return;
  }

  localStorage.setItem("lastGoal", goal);
  localStorage.setItem("lastPart", part);

  // 🔄 載入中提示
  loadBtn.disabled = true;
  loadBtn.textContent = "⏳ 載入中...";
  container.innerHTML = "<p>📂 正在讀取訓練菜單...</p>";

  // ✅ 先檢查快取
  const cacheKey = `${goal}_${part}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    await displayExercises(db, userName, data.exercises);
    loadBtn.disabled = false;
    loadBtn.textContent = "載入菜單";
    return;
  }

  // 🔥 從 Firestore 抓資料
  try {
    const docRef = doc(db, "menus", `${goal}_${part}`);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      container.innerHTML = "<p>⚠️ 查無此訓練菜單。</p>";
      return;
    }

    const data = docSnap.data();
    if (!data.exercises || !Array.isArray(data.exercises)) {
      container.innerHTML = "<p>⚠️ 菜單資料格式錯誤。</p>";
      return;
    }

    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    await displayExercises(db, userName, data.exercises);
  } catch (e) {
    console.error("❌ 載入錯誤：", e);
    container.innerHTML = "<p>❌ 無法載入資料，請稍後再試。</p>";
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = "載入菜單";
  }
}

// === 🏋️‍♀️ 顯示訓練動作 ===
async function displayExercises(db, userName, exercises) {
  const container = document.getElementById("exerciseContainer");
  container.innerHTML = "";
  window.charts = [];

  // 🔹 去重
  const names = new Set();
  const uniqueExercises = exercises.filter((ex) => {
    if (!ex.name || names.has(ex.name)) return false;
    names.add(ex.name);
    return true;
  });

  const userRef = doc(db, "profiles", userName);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : {};

  for (let i = 0; i < uniqueExercises.length; i++) {
    const ex = uniqueExercises[i];
    const safeName = ex.name.replace(/[\/\[\]#$.()\s（）]/g, "_");
    const history = userData.history?.[safeName] || {};
    const dates = Object.keys(history).sort();
    const weights = dates.map((d) => history[d]);
    const lastWeight = weights.at(-1) || ex.defaultWeight || ex.weight || 10;


    const card = document.createElement("div");
    card.className = "card p-3 mb-3 shadow-sm";
    card.innerHTML = `
      <h4>${i + 1}. ${ex.name}</h4>
      <p>組數：${ex.defaultSets || "未設定"}　次數：${ex.defaultReps || "未設定"}</p>
      <p>休息：${ex.restSec || "未設定"} 秒</p>
      <p class="weight">推薦重量：${lastWeight || "尚未有紀錄"} kg</p>
      <div class="btn-group mb-2">
        <button class="btn btn-success add-btn">加重</button>
        <button class="btn btn-primary keep-btn">維持</button>
        <button class="btn btn-danger reduce-btn">減重</button>
      </div>
      <canvas id="chart-${i}" height="120"></canvas>
    `;
    container.appendChild(card);

    const ctx = document.getElementById(`chart-${i}`);
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: dates.length ? dates : [localISODate()],
        datasets: [
          {
            label: "重量變化 (kg)",
            data: weights.length ? weights : [lastWeight],
            borderColor: "#007bff",
            backgroundColor: "rgba(0,123,255,0.1)",
            tension: 0.2,
          },
        ],
      },
      options: { scales: { y: { beginAtZero: true } } },
    });
    charts.push({ safeName, chart });

    // === 🔧 重量調整按鈕 ===
    const addBtn = card.querySelector(".add-btn");
    const keepBtn = card.querySelector(".keep-btn");
    const reduceBtn = card.querySelector(".reduce-btn");
    const weightText = card.querySelector(".weight");
    const delta = 2.5;
    let currentWeight = lastWeight;

    async function saveWeightChange(newWeight) {
      const today = localISODate();
      try {
        await updateDoc(userRef, { [`history.${safeName}.${today}`]: newWeight });
      } catch {
        await setDoc(
          userRef,
          { history: { [safeName]: { [today]: newWeight } } },
          { merge: true }
        );
      }
    }

    addBtn.addEventListener("click", async () => {
      currentWeight += delta;
      weightText.textContent = `重量：${currentWeight.toFixed(1)} kg`;
      await saveWeightChange(currentWeight);
    });

    keepBtn.addEventListener("click", async () => {
      alert(`💪 維持重量 ${currentWeight.toFixed(1)} kg`);
      await saveWeightChange(currentWeight);
    });

    reduceBtn.addEventListener("click", async () => {
      currentWeight = Math.max(0, currentWeight - delta);
      weightText.textContent = `重量：${currentWeight.toFixed(1)} kg`;
      await saveWeightChange(currentWeight);
    });
  }
// 🧩 避免重複建立「完成訓練」按鈕
if (document.getElementById("completeTrainingBtn")) return;

  // === ✅ 完成訓練按鈕 ===
  const completeBtn = document.createElement("button");
  completeBtn.id = "completeTrainingBtn";
  completeBtn.className = "btn btn-success";
  completeBtn.textContent = "✅ 完成訓練";
  completeBtn.style = "display:block;margin:30px auto;padding:10px 20px;font-size:18px;";
  container.insertAdjacentElement("afterend", completeBtn);

// === ✅ 完成訓練按鈕事件 ===
completeBtn.addEventListener("click", async () => {
  const today = localISODate();
  const cards = document.querySelectorAll(".card");
  let total = 0;
  const updates = {};

  for (const card of cards) {
    const name = card.querySelector("h4").textContent;
    const safeName = name.replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣一-龥]/g, "_");
    const weight =
      parseFloat(card.querySelector(".weight").textContent.replace(/[^\d.]/g, "")) || 0;
    updates[`history.${safeName}.${today}`] = weight;
    total += weight;
  }

  try {
    // 📝 寫入 Firestore
    const userRef = doc(db, "profiles", localStorage.getItem("userName"));
    for (const [k, v] of Object.entries(updates)) {
      await updateDoc(userRef, { [k]: v });
    }
    // 📈 更新折線圖（即時顯示新資料）
    for (const { safeName, chart } of charts) {
      const w = updates[`history.${safeName}.${today}`];
      if (w !== undefined) {
        const labels = chart.data.labels;
        const data = chart.data.datasets[0].data;
        if (!labels.includes(today)) {
          labels.push(today);
          data.push(w);
        } else {
          // 若已存在今天的日期，更新最後一個點
          data[data.length - 1] = w;
        }
        chart.update();
      }
    }
    // ✅ 同步更新 lastTraining (顯示上次訓練用)
    await setDoc(
       doc(db, "profiles", localStorage.getItem("userName")),
      {
        lastTraining: {
          goal: localStorage.getItem("lastGoal"),
          bodyPart: localStorage.getItem("lastPart"),
          date: today,
        },
      },
      { merge: true }
    );

    // 🎉 完成提示
    alert(`✅ 今日訓練完成！總重量：${total.toFixed(1)} kg 已儲存。`);

  } catch (e) {
    console.error("❌ 訓練儲存失敗：", e);
    alert("❌ 訓練儲存失敗，請稍後再試。");
  }
});

// === 🚀 頁面啟動 ===
window.addEventListener("DOMContentLoaded", async () => {
  const userName = await initUser();
  await showLastTraining();
  document.getElementById("loadBtn")?.addEventListener("click", () => loadMenu(db, userName));
});
