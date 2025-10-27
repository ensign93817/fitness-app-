// === 防止重複載入 ===
if (window.trainingLoaded) {
  console.warn("⚠️ training.js 已載入，跳過重複執行");
} else {
  window.trainingLoaded = true;

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

  // === 載入菜單 ===
  loadBtn.addEventListener("click", async () => {
    const userName = localStorage.getItem("userName") || "guestUser";
    console.log(`當前登入使用者：${userName}`);

    const goal = goalSelect.value;
    const part = partSelect.value;
    localStorage.setItem("lastGoal", goal);
    localStorage.setItem("lastPart", part);

    const docRef = doc(db, "menus", `${goal}_${part}`);
    container.innerHTML = "<p>⏳ 正在載入中...</p>";

    // 🔒 清除重複按鈕
    const oldBtns = document.querySelectorAll("#completeTrainingBtn");
    oldBtns.forEach(btn => btn.remove());

    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        container.innerHTML = "<p>⚠️ 查無此訓練菜單。</p>";
        return;
      }

      const data = docSnap.data();
      if (!data.exercises || !Array.isArray(data.exercises)) {
        container.innerHTML = "<p>⚠️ 菜單格式錯誤。</p>";
        return;
      }

      console.log("成功載入 Firestore 文件：", data);
      await displayExercises(data.exercises);
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
      if (!ex.name) return;

      const safeName = ex.name.replace(/[\/\[\]#$.()\s（）]/g, "_");
      const history = userData.history?.[safeName] || {};
      const lastWeight = Object.values(history).pop() || ex.weight || 0;

      const card = document.createElement("div");
      card.className = "card p-3 mb-3 shadow-sm";
      card.innerHTML = `
        <h4>${i + 1}. ${ex.name}</h4>
        <p>組數：${ex.sets || "未設定"}　次數：${ex.reps || "未設定"}</p>
        <p>休息：${ex.rest || "未設定"} 秒</p>
        <p class="weight">重量：${lastWeight} kg（根據上次訓練）</p>
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
            data: weights.length ? weights : [lastWeight],
            borderColor: "#007bff",
            backgroundColor: "rgba(0,123,255,0.1)",
            tension: 0.2,
          }],
        },
        options: { scales: { y: { beginAtZero: true } } },
      });

      // === 加重 / 維持 / 減重 ===
      const delta = 2.5;
      let currentWeight = lastWeight;
      const weightText = card.querySelector(".weight");
      const addBtn = card.querySelector(".add-btn");
      const keepBtn = card.querySelector(".keep-btn");
      const reduceBtn = card.querySelector(".reduce-btn");

      async function saveWeightChange(newWeight) {
        const today = new Date().toISOString().split("T")[0];
        try {
          await updateDoc(userRef, { [`history.${safeName}.${today}`]: newWeight });
        } catch {
          await setDoc(userRef, { history: { [safeName]: { [today]: newWeight } } }, { merge: true });
        }
      }

      addBtn.onclick = async () => {
        currentWeight += delta;
        weightText.textContent = `重量：${currentWeight.toFixed(1)} kg`;
        await saveWeightChange(currentWeight);
      };
      keepBtn.onclick = async () => {
        alert(`💪 維持重量 ${currentWeight.toFixed(1)} kg`);
        await saveWeightChange(currentWeight);
      };
      reduceBtn.onclick = async () => {
        currentWeight = Math.max(0, currentWeight - delta);
        weightText.textContent = `重量：${currentWeight.toFixed(1)} kg`;
        await saveWeightChange(currentWeight);
      };
    });

    // === ✅ 完成訓練按鈕（只會存在一個） ===
    if (!document.getElementById("completeTrainingBtn")) {
      const btn = document.createElement("button");
      btn.id = "completeTrainingBtn";
      btn.textContent = "✅ 完成訓練";
      btn.className = "btn btn-success";
      btn.style = "display:block;margin:30px auto;padding:10px 20px;font-size:18px;";
      container.insertAdjacentElement("afterend", btn);

      btn.onclick = async () => {
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

        alert(`✅ 本次總訓練重量 ${todayTotal.toFixed(1)} kg 已儲存！`);
      };
    }
  }
}
