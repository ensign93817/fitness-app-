// === Firebase SDK 載入 ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === Firebase 初始化設定 ===
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

window.addEventListener("DOMContentLoaded", () => {
  let userName = localStorage.getItem("userName");
  if (!userName) {
    userName = prompt("請輸入您的使用者名稱：");
    localStorage.setItem("userName", userName);
  }
  console.log("登入使用者：", userName);
});

// === 顯示上次訓練目標與部位 ===
const lastGoal = localStorage.getItem("lastGoal");
const lastPart = localStorage.getItem("lastPart");
if (lastGoal && lastPart) {
  const infoDiv = document.createElement("div");
  infoDiv.style.margin = "10px 0";
  infoDiv.innerHTML = `📌 上次訓練：<b>${lastGoal}</b> - <b>${lastPart}</b>`;
  document.querySelector("h2").insertAdjacentElement("beforebegin", infoDiv);
}

// === DOM 取得 ===
const goalSelect = document.getElementById("goalSelect");
const partSelect = document.getElementById("partSelect");
const loadBtn = document.getElementById("loadBtn");
const container = document.getElementById("exerciseContainer");

// === 防止重複綁定 ===
if (!window.hasBoundLoadMenu) {
  window.hasBoundLoadMenu = true;

  loadBtn.addEventListener("click", async () => {
    const userName = localStorage.getItem("userName") || "guestUser";
    console.log(`當前登入使用者：${userName}`);

    const goal = goalSelect.value;
    const part = partSelect.value;

    if (!goal || !part) {
      alert("⚠️ 請先選擇訓練目標與部位！");
      return;
    }

    localStorage.setItem("lastGoal", goal);
    localStorage.setItem("lastPart", part);

    const docRef = doc(db, "menus", `${goal}_${part}`);
    container.innerHTML = "<p>⏳ 正在載入菜單中...</p>";

    try {
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        container.innerHTML = "<p>⚠️ 查無此訓練菜單。</p>";
        return; // ✅ 這裡現在合法，因為在 async function 裡
      }

      const data = docSnap.data();

      if (!data.exercises || !Array.isArray(data.exercises)) {
        container.innerHTML = "<p>⚠️ 菜單資料格式錯誤。</p>";
        return;
      }

      console.log("✅ 成功載入 Firestore 文件：", data);
      await displayExercises(data.exercises);
    } catch (error) {
      console.error("❌ 載入過程錯誤：", error);
      container.innerHTML = "<p>❌ 無法讀取資料，請稍後再試。</p>";
    }
  });
}
// === 顯示訓練動作 ===
async function displayExercises(exercises) {
  container.innerHTML = "";
  const oldBtn = document.getElementById("completeTrainingBtn");
  if (oldBtn) oldBtn.remove();

  // 🔹 去除重複項目
  const uniqueExercises = [];
  const names = new Set();
  for (const ex of exercises) {
    if (ex.name && !names.has(ex.name)) {
      names.add(ex.name);
      uniqueExercises.push(ex);
    }
  }

  const userName = localStorage.getItem("userName") || "guestUser";
  const userRef = doc(db, "profiles", userName);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : {};

uniqueExercises.forEach((ex, i) => {
  if (!ex.name) return;

  const safeName = ex.name.replace(/[\/\[\]#$.()\s（）]/g, "_");
  const history = userData.history?.[safeName] || {};
  const sets = ex.sets || ex.defaultSets || "未設定";
  const reps = ex.reps || ex.defaultReps || "未設定";
  const rest = ex.rest || ex.restSec || "未設定";
  const baseWeight = ex.weight || ex.defaultWeight || 0;
  const lastWeight = Object.values(history).pop() || baseWeight;

  const card = document.createElement("div");
  card.className = "card p-3 mb-3 shadow-sm";
  card.innerHTML = `
    <h4>${i + 1}. ${ex.name}</h4>
    <p>組數：${sets}　次數：${reps}</p>
    <p>休息：${rest} 秒</p>
    <p class="weight">推薦重量：${
      lastWeight > 0 ? lastWeight + " kg" : "尚未有紀錄"
    }（根據上次訓練）</p>
    <div class="btn-group mb-2">
      <button class="btn btn-success add-btn">加重</button>
      <button class="btn btn-primary keep-btn">維持</button>
      <button class="btn btn-danger reduce-btn">減重</button>
    </div>
    <canvas id="chart-${i}" height="120"></canvas>
  `;
  container.appendChild(card);

  // === 折線圖 ===
  const ctx = document.getElementById(`chart-${i}`);
  const dates = Object.keys(history);
  const weights = Object.values(history);
  new Chart(ctx, {
    type: "line",
    data: {
      labels: dates.length ? dates : [new Date().toISOString().split("T")[0]],
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

  // === 加重 / 維持 / 減重 ===
  const addBtn = card.querySelector(".add-btn");
  const keepBtn = card.querySelector(".keep-btn");
  const reduceBtn = card.querySelector(".reduce-btn");
  const weightText = card.querySelector(".weight");
  const delta = 2.5;
  let currentWeight = lastWeight;

  async function saveWeightChange(newWeight) {
    const today = new Date().toISOString().split("T")[0];
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
}); // ← forEach 結束

  // === ✅ 完成訓練按鈕 ===
  const completeBtn = document.createElement("button");
  completeBtn.id = "completeTrainingBtn";
  completeBtn.textContent = "✅ 完成訓練";
  completeBtn.className = "btn btn-success";
  completeBtn.style = "display:block;margin:30px auto;padding:10px 20px;font-size:18px;";
  container.insertAdjacentElement("afterend", completeBtn);

  completeBtn.addEventListener("click", async () => {
    const today = new Date().toISOString().split("T")[0];
    const cards = document.querySelectorAll(".card");
    const updates = {};
    let todayTotal = 0;

    cards.forEach(card => {
      const name = card.querySelector("h4").textContent;
      const safeName = name.replace(/[\/\[\]#$.()\s（）]/g, "_");
      const weight = parseFloat(card.querySelector(".weight").textContent.replace(/[^\d.]/g, ""));
      updates[`history.${safeName}.${today}`] = weight;
      todayTotal += weight;
    });

    await updateDoc(userRef, updates);
    alert(`✅ 今日總訓練重量：${todayTotal.toFixed(1)} kg 已儲存！`);
  });
}
// === 登入與切換使用者 ===
window.addEventListener("DOMContentLoaded", () => {
  let userName = localStorage.getItem("userName");
  if (!userName) {
    userName = prompt("請輸入您的使用者名稱：");
    localStorage.setItem("userName", userName);
  }

  console.log("登入使用者：", userName);

  // === 顯示當前使用者 ===
  const currentUser = localStorage.getItem("userName") || "guestUser";
  document.querySelector("h2").insertAdjacentHTML(
    "beforebegin",
    `<div style="margin:10px 0;">👤 當前使用者：<b>${currentUser}</b></div>`
  );

  // === 切換使用者按鈕事件 ===
  const changeBtn = document.getElementById("changeUserBtn");
  if (changeBtn) {
    changeBtn.addEventListener("click", () => {
      const newUser = prompt("請輸入新的使用者名稱：");
      if (newUser) {
        localStorage.setItem("userName", newUser);
        alert(`✅ 已切換使用者：${newUser}`);
        location.reload(); // 重新載入以套用新帳號
      }
    });
  }
});
