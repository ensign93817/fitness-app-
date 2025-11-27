// js/feedback.js

// === 🔥 Firebase SDK ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === ⚙️ Firebase 初始化設定（跟其他頁面一樣） ===
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

// 小工具：算趨勢文字
function buildComment(weights) {
  if (!weights || weights.length === 0) {
    return "目前還沒有這個動作的重量紀錄，下次訓練可以試著按一次【加重 / 維持 / 減重】留下紀錄。";
  }
  if (weights.length === 1) {
    return "已經有第一次的重量紀錄了，持續紀錄幾次就能看到自己的進步軌跡！";
  }
  const first = weights[0];
  const last = weights[weights.length - 1];

  if (first === 0) {
    return "已經累積了一些紀錄，持續穩定訓練最重要，加油！";
  }

  const ratio = (last - first) / first;

  if (ratio > 0.05) {
    return "最近這個動作的重量有明顯往上，漸進超負荷做得很棒，保持！💪";
  } else if (ratio > -0.05) {
    return "重量大致維持在同一個區間，代表你有穩定訓練，之後可以依照感受再慢慢調整。👍";
  }
  return "最近重量稍微下降，可能是在調整動作或身體比較疲勞，記得休息、補充營養，下次再衝就好！🔥";
}

// 把 safeName 轉成好讀一點的名稱
function displayNameFromSafeName(safeName) {
  return (safeName || "").replace(/_/g, " ");
}

// === 🚀 頁面啟動 ===
window.addEventListener("DOMContentLoaded", async () => {
  const userName = localStorage.getItem("userName");
  const summaryUser = document.getElementById("summaryUser");
  const summaryLast = document.getElementById("summaryLast");
  const container = document.getElementById("feedbackContainer");

  if (!userName) {
    alert("找不到使用者名稱，請先到訓練紀錄頁登入一次使用者。");
    window.location.href = "./training.html";
    return;
  }

  summaryUser.textContent = userName;

  try {
    const userRef = doc(db, "profiles", userName);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      summaryLast.textContent = "尚未建立個人資料。";
      container.textContent = "找不到訓練紀錄。";
      return;
    }

    const data = snap.data();
    const history = data.history || {};

    // 最近一次訓練摘要
    if (data.lastTraining) {
      const lt = data.lastTraining;
      summaryLast.textContent =
        `${lt.date || "（未記錄日期）"}，目標「${lt.goal || "-"}」，部位「${lt.bodyPart || "-"}」`;
    } else {
      summaryLast.textContent = "尚未有「完成訓練」的紀錄。";
    }

    // 沒有 history 直接結束
    const entries = Object.entries(history);
    if (entries.length === 0) {
      container.textContent = "目前還沒有任何重量歷史紀錄，從訓練紀錄頁面開始按【加重／維持／減重】就會累積資料囉。";
      return;
    }

    container.innerHTML = "";

    let idx = 1;
    for (const [safeName, seriesObj] of entries) {
      // seriesObj: { timestamp: weight, ... }
      const timestamps = Object.keys(seriesObj).sort(); // 舊→新
      if (timestamps.length === 0) continue;

      const lastKeys = timestamps.slice(-30); // 最近 30 筆
      const weights = lastKeys.map((t) => seriesObj[t]);
      const labels = lastKeys.map((_, i) => `第 ${timestamps.length - lastKeys.length + i + 1} 次`);

      const niceName = displayNameFromSafeName(safeName);
      const comment = buildComment(weights);

      // 建 card
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${idx}. ${niceName}</h3>
        <small>本圖顯示最近 ${weights.length} 次重量變化（最多 30 次）。</small>
        <canvas id="chart-${safeName}" height="120" style="margin-top:8px;"></canvas>
        <p class="comment">${comment}</p>
      `;
      container.appendChild(card);

      // 畫圖
      const ctx = document.getElementById(`chart-${safeName}`);
      new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "重量 (kg)",
              data: weights,
              borderColor: "#0d6efd",
              backgroundColor: "rgba(13,110,253,0.1)",
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

      idx++;
    }
  } catch (e) {
    console.error("❌ 載入回顧資料失敗：", e);
    summaryLast.textContent = "讀取資料時發生錯誤。";
    container.textContent = "無法載入回顧資料，稍後再試一次。";
  }
});
