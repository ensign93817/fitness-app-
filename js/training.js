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
  measurementId: "G-7X1L324K0Q",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

// === 載入訓練菜單 ===
loadBtn.addEventListener("click", async () => {
  const userName = localStorage.getItem("userName") || "訪客";
  console.log(`當前登入使用者：${userName}`);

  const goal = goalSelect.value;
  const part = partSelect.value;
  localStorage.setItem("lastGoal", goal);
  localStorage.setItem("lastPart", part);

  const docRef = doc(db, "menus", `${goal}_${part}`);
  container.innerHTML = "<p>⏳ 正在載入中...</p>";

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("成功載入 Firestore 文件：", data);
      displayExercises(data.exercises);
    } else {
      container.innerHTML = "<p>⚠️ 查無此訓練菜單。</p>";
    }
  } catch (error) {
    console.error("載入菜單錯誤：", error);
    container.innerHTML = "<p>❌ 無法讀取資料，請稍後再試。</p>";
  }
});

// === 顯示訓練動作 ===
async function displayExercises(exercises) {
  container.innerHTML = "";
  const userName = localStorage.getItem("userName") || "guestUser";
  const userRef = doc(db, "profiles", userName);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : {};

  // === 每個動作卡片 ===
  exercises.forEach((ex, i) => {
    const safeName = ex.name.replace(/[\/\[\]#$.()\s（）]/g, "_");
    const history = userData.history?.[safeName] || {};
    const lastWeight = Object.values(history).pop() || ex.weight;

    const card = document.createElement("div");
    card.className = "card p-3 mb-3 shadow-sm";
    card.innerHTML = `
      <h4>${i + 1}. ${ex.name}</h4>
      <p>組數：${ex.sets}　次數：${ex.reps}</p>
      <p>休息：${ex.rest} 秒</p>
      <p class="weight">重量：${lastWeight} kg（系統推薦值）</p>
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
        datasets: [{
          label: "歷史重量 (kg)",
          data: weights.length ? weights : [0],
          borderColor: "#007bff",
          backgroundColor: "rgba(0,123,255,0.1)",
          tension: 0.2,
        }],
      },
      options: {
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "重量 (kg)" } },
        },
      },
    });

    // === 重量調整功能 ===
    const addBtn = card.querySelector(".add-btn");
    const keepBtn = card.querySelector(".keep-btn");
    const reduceBtn = card.querySelector(".reduce-btn");
    const weightText = card.querySelector(".weight");
    const delta = 2.5;
    let currentWeight = lastWeight;

    async function saveWeightChange(newWeight) {
      const today = new Date().toISOString().split("T")[0];
      try {
        await updateDoc(userRef, {
          [`history.${safeName}.${today}`]: newWeight,
        });
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
      alert(`💪 維持重量：${currentWeight.toFixed(1)} kg`);
      await saveWeightChange(currentWeight);
    });

    reduceBtn.addEventListener("click", async () => {
      currentWeight = Math.max(0, currentWeight - delta);
      weightText.textContent = `重量：${currentWeight.toFixed(1)} kg`;
      await saveWeightChange(currentWeight);
    });
  });

  // === 菜單底部「完成訓練」按鈕 ===
  const completeBtn = document.createElement("button");
  completeBtn.textContent = "✅ 完成訓練";
  completeBtn.style = `
    display:block;
    margin:30px auto;
    padding:12px 24px;
    background-color:#28a745;
    color:white;
    border:none;
    border-radius:8px;
    font-size:16px;
    cursor:pointer;
  `;
  container.insertAdjacentElement("afterend", completeBtn);

  completeBtn.addEventListener("click", async () => {
    const today = new Date().toISOString().split("T")[0];
    const cards = document.querySelectorAll(".card");
    const updates = {};

    cards.forEach((card) => {
      const name = card.querySelector("h4").textContent;
      const safeName = name.replace(/[\/\[\]#$.()\s（）]/g, "_");
      const weight = parseFloat(
        card.querySelector(".weight").textContent.replace(/[^\d.]/g, "")
      );
      updates[`history.${safeName}.${today}`] = weight;
    });

    try {
      await updateDoc(userRef, updates);
      alert("✅ 今日訓練紀錄已完成！");
      location.reload();
    } catch (error) {
      console.error(error);
      alert("⚠️ 儲存失敗，請稍後再試。");
    }
  });
}
