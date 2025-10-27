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

  exercises.forEach((ex, i) => {
    const safeName = ex.name.replace(/[\/\[\]#$.()\s（）]/g, "_");
    const history = userData.history?.[safeName] || {};
    const lastWeight = Object.values(history).pop() || ex.weight;

    // === 建立動作卡片 ===
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
    
      // === 重量調整功能 ===
    const addBtn = card.querySelector(".add-btn");
    const keepBtn = card.querySelector(".keep-btn");
    const reduceBtn = card.querySelector(".reduce-btn");
    const weightText = card.querySelector(".weight");

    const delta = 2.5;
    let currentWeight = lastWeight;

    async function saveWeightChange(newWeight) {
      const today = new Date().toISOString().split("T")[0];
      const safeName = ex.name.replace(/[\/\[\]#$.()\s（）]/g, "_");
      try {
        await updateDoc(userRef, {
          [`history.${safeName}.${today}`]: newWeight,
        });
      } catch {
        await setDoc(userRef, {
          history: { [safeName]: { [today]: newWeight } },
        }, { merge: true });
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


    // Firestore 紀錄讀取（個人化）
// 取得目前登入使用者名稱
const userId = localStorage.getItem("userName") || "guestUser";
const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);

    let history = {};
    if (userSnap.exists()) {
      history = userSnap.data().history?.[name] || {};
      const dates = Object.keys(history);
      if (dates.length > 0) {
        const lastDate = dates[dates.length - 1];
        baseWeight = history[lastDate];
        sourceLabel = "（根據上次訓練）";
      }
    }

    // 若 Firestore 沒資料則依目標給預設值
    if (!baseWeight || baseWeight === 0) {
      const goal = goalSelect.value;
      if (goal === "增肌") baseWeight = 30;
      else if (goal === "力量") baseWeight = 40;
      else if (goal === "減脂") baseWeight = 20;
      else if (goal === "耐力") baseWeight = 15;
      else baseWeight = 25;
    }

    let currentWeight = baseWeight;

    // === 卡片 DOM 結構 ===
    const card = document.createElement("div");
    card.classList.add("exercise-card");
    card.innerHTML = `
      <h3>${i + 1}. ${name}</h3>
      <p>組數：${sets}　次數：${reps}</p>
      <p>休息：${rest} 秒</p>
      <p>重量：<span class="weight">${currentWeight}</span> kg ${sourceLabel}</p>
      <div class="btn-group">
        <button class="add-btn">加重</button>
        <button class="keep-btn">維持</button>
        <button class="reduce-btn">減重</button>
      </div>
      <canvas id="chart-${i}" height="120"></canvas>
    `;
    container.appendChild(card);

// === 建立 Chart.js 折線圖 ===
const ctx = document.getElementById(`chart-${i}`);
const dates = Object.keys(history);
const weights = Object.values(history);

if (dates.length > 0) {
  new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [{
        label: "歷史重量 (kg)",
        data: weights,
        borderColor: "#007bff",
        backgroundColor: "rgba(0,123,255,0.1)",
        tension: 0.2,
      }],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: context => `${context.parsed.y} kg`,
          },
        },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

 // === 完成訓練按鈕 ===
  const btn = document.createElement("button");
  btn.id = "completeTrainingBtn";
  btn.textContent = "✅ 完成訓練";
  btn.style = `
    display:block;
    margin:25px auto;
    padding:10px 20px;
    background-color:#28a745;
    color:white;
    border:none;
    border-radius:5px;
    font-size:16px;
    cursor:pointer;
  `;
  container.insertAdjacentElement("afterend", btn);

  btn.addEventListener("click", async () => {
    const today = new Date().toISOString().split("T")[0];
    const cards = document.querySelectorAll(".card");
    const updates = {};

    cards.forEach(card => {
      const name = card.querySelector("h4").textContent;
      const safeName = name.replace(/[\/\[\]#$.()\s（）]/g, "_");
      const weight = parseFloat(card.querySelector(".weight").textContent.replace(/[^\d.]/g, ""));
      updates[`history.${safeName}.${today}`] = weight;
    });

    try {
      await updateDoc(userRef, updates);
      alert("✅ 今日訓練紀錄已完成！");
      location.reload();
    } catch (e) {
      console.error(e);
      alert("⚠️ 儲存失敗，請稍後再試。");
    }
  });
}
// === Firestore 紀錄每次訓練的重量 ===
async function saveWeightChange(newWeight) {
  const today = new Date().toISOString().split("T")[0];

  // 🔒 避免 Firestore 禁用字元錯誤 (包含全形符號)
  const safeName = name.replace(/[\/\[\]#$.()\s（）]/g, "_");

  try {
    await updateDoc(userRef, {
      [`history.${safeName}.${today}`]: newWeight,
    });
  } catch (error) {
    await setDoc(
      userRef,
      { history: { [safeName]: { [today]: newWeight } } },
      { merge: true }
    );
  }
}

    // === 三個控制按鈕 ===
    addBtn.addEventListener("click", async () => {
      currentWeight += delta;
      weightText.textContent = currentWeight.toFixed(1);
      await saveWeightChange(currentWeight);
    });

    keepBtn.addEventListener("click", async () => {
      await saveWeightChange(currentWeight);
      alert(`${name} 維持 ${currentWeight.toFixed(1)} kg`);
    });

    reduceBtn.addEventListener("click", async () => {
      currentWeight = Math.max(0, currentWeight - delta);
      weightText.textContent = currentWeight.toFixed(1);
      await saveWeightChange(currentWeight);
    });
  });
}
