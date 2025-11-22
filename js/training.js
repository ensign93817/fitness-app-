// === 🕓 取得本地時間 (YYYY-MM-DD HH:mm:ss) ===
function localISODateTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 19).replace("T", " ");
}
// === 🕓 向下相容：只取日期 (YYYY-MM-DD) ===
function localISODate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
// ✅ 把時間「壓」成 30 秒一格
function localISODateTime30s() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  const sec = d.getSeconds();
  d.setSeconds(sec - (sec % 30), 0);
  return d.toISOString().slice(0, 19).replace("T", " ");
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

  const h2 = document.querySelector("h2");
  if (h2) {
    h2.insertAdjacentHTML(
      "beforebegin",
      `<div style="margin:10px 0;">👤 當前使用者：<b>${userName}</b></div>`
    );
  }

  return userName;
}

// === 💪 顯示上次訓練（維持原本功能） ===
async function showLastTraining() {
  const userName = localStorage.getItem("userName");
  if (!userName) return;

  try {
    const userSnap = await getDoc(doc(db, "profiles", userName));
    const data = userSnap.data();

    document.querySelectorAll(".last-training-info").forEach(el => el.remove());

    if (data?.lastTraining) {
      const infoDiv = document.createElement("div");
      infoDiv.className = "alert alert-info mt-2 last-training-info";
      infoDiv.innerHTML =
        `📌 上次訓練：<b>${data.lastTraining.goal}</b> - <b>${data.lastTraining.bodyPart}</b>`;

      infoDiv.style.transition = "all 0.5s";
      infoDiv.style.opacity = "0";
      setTimeout(() => (infoDiv.style.opacity = "1"), 50);

      document.querySelector("h2")?.insertAdjacentElement("beforebegin", infoDiv);
    }
  } catch (e) {
    console.error("❌ 無法顯示上次訓練紀錄：", e);
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

  loadBtn.disabled = true;
  loadBtn.textContent = "⏳ 載入中...";
  container.innerHTML = "<p>📂 正在讀取訓練菜單...</p>";

  const cacheKey = `${goal}_${part}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    await displayExercises(db, userName, data.exercises);
    loadBtn.disabled = false;
    loadBtn.textContent = "載入菜單";
    return;
  }

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

// === 🏋️‍♀️ 顯示訓練動作 + 折線圖與重量紀錄 ===
async function displayExercises(db, userName, exercises) {
  const container = document.getElementById("exerciseContainer");
  container.innerHTML = "";
  document.getElementById("completeTrainingBtn")?.remove();
  window.charts = [];

  const names = new Set();
  const uniqueExercises = exercises.filter(ex => {
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
    const weights = dates.map(d => history[d]);
    const lastWeight = weights.at(-1) || ex.defaultWeight || ex.weight || 10;

    const card = document.createElement("div");
    card.className = "card p-3 mb-3 shadow-sm";
 card.innerHTML = `
  <h4>${i + 1}. ${ex.name}</h4>
  <p>組數：${ex.defaultSets || "未設定"}　次數：${ex.defaultReps || "未設定"}</p>
  <p>休息：${ex.restSec || "未設定"} 秒</p>
  <p class="weight">推薦重量：${lastWeight || "尚未有紀錄"} kg</p>

  <div class="btn-group mb-2">
    <button class="btn btn-success add-btn">加重（太輕鬆）</button>
    <button class="btn btn-primary keep-btn">維持（剛剛好）</button>
    <button class="btn btn-danger reduce-btn">減重（太吃力）</button>
  </div>
  <p style="font-size:16px; color:#777; margin-top:4px;">
    做不完或做完這個動作後，依照感受選一個：太輕鬆→加重、剛好→維持、太吃力→減重。
  </p>

  <canvas id="chart-${i}" height="120"></canvas>
`;

    container.appendChild(card);

    const addBtn = card.querySelector(".add-btn");
    const keepBtn = card.querySelector(".keep-btn");
    const reduceBtn = card.querySelector(".reduce-btn");
    const weightText = card.querySelector(".weight");
    const delta = 2.5;
    let currentWeight = lastWeight;

    // ✅ 用「30 秒一格」的時間當 key
    async function saveWeightChange(newWeight) {
      const slot = localISODateTime30s();
      try {
        await updateDoc(userRef, { [`history.${safeName}.${slot}`]: newWeight });
      } catch {
        await setDoc(
          userRef,
          { history: { [safeName]: { [slot]: newWeight } } },
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

    const ctx = document.getElementById(`chart-${i}`);
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: dates.length ? dates : [localISODateTime()],
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
      options: {
        animation: false,
        scales: { y: { beginAtZero: true } },
      },
    });

    setInterval(async () => {
      try {
        const snap = await getDoc(userRef);
        const data = snap.data();
        const historyNow = data?.history?.[safeName] || {};
        const sortedDates = Object.keys(historyNow).sort();
        const newWeights = sortedDates.map(d => historyNow[d]);

        if (JSON.stringify(newWeights) !== JSON.stringify(chart.data.datasets[0].data)) {
          chart.data.labels = sortedDates;
          chart.data.datasets[0].data = newWeights;
          chart.update();
        }
      } catch (e) {
        console.warn("⚠️ 更新圖表失敗：", safeName, e);
      }
    }, 1000);

    charts.push({ safeName, chart });
  }

  if (document.getElementById("completeTrainingBtn")) return;

  const completeBtn = document.createElement("button");
  completeBtn.id = "completeTrainingBtn";
  completeBtn.className = "btn btn-success";
  completeBtn.textContent = "✅ 完成訓練";
  completeBtn.style = "display:block;margin:30px auto;padding:10px 20px;font-size:18px;";
  container.insertAdjacentElement("afterend", completeBtn);

  completeBtn.addEventListener("click", async () => {
    const today = localISODate();
    const cards = document.querySelectorAll(".card");
    let total = 0;
    const updates = {};

    for (const card of cards) {
      const name = card.querySelector("h4").textContent;
      const safeName = name.replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣一-龥]/g, "_");
      const weight = parseFloat(card.querySelector(".weight").textContent.replace(/[^\d.]/g, "")) || 0;
      const slot = localISODateTime30s();
      updates[`history.${safeName}.${slot}`] = weight;
      total += weight;
    }

    try {
      const userRef = doc(db, "profiles", localStorage.getItem("userName"));
      console.log("🚀 開始寫入 Firestore updates：", updates);
      await setDoc(userRef, { createdAt: new Date().toISOString() }, { merge: true });

      for (const [k, v] of Object.entries(updates)) {
        await updateDoc(userRef, { [k]: v });
      }

      await setDoc(
        userRef,
        {
          lastTraining: {
            goal: localStorage.getItem("lastGoal"),
            bodyPart: localStorage.getItem("lastPart"),
            date: today,
          },
        },
        { merge: true }
      );

      completeBtn.disabled = true;
      completeBtn.textContent = `✅ 已完成訓練！總重量 ${total.toFixed(1)} kg 已儲存`;
      completeBtn.style.backgroundColor = "#28a745";
      completeBtn.style.color = "white";
      completeBtn.style.fontWeight = "bold";

      await showLastTraining();
    } catch (e) {
      console.warn("❌ 無法讀取上次訓練紀錄：", e);
    }
  });
}

// === 🚀 頁面啟動（含：若有 ?goal & ?part 就自動載入菜單） ===
window.addEventListener("DOMContentLoaded", async () => {
  const userName = await initUser();
  if (!userName) return;

  await showLastTraining();

  const loadBtn = document.getElementById("loadBtn");
  const goalSelect = document.getElementById("goalSelect");
  const partSelect = document.getElementById("partSelect");

  const params = new URLSearchParams(window.location.search);
  const goal = params.get("goal");
  const part = params.get("part");

  // 若從 recommend.html 帶參數過來，直接載入推薦菜單
  if (goal && part && goalSelect && partSelect) {
    goalSelect.value = goal;
    partSelect.value = part;
    await loadMenu(db, userName);
  }

  loadBtn?.addEventListener("click", () => loadMenu(db, userName));
});
