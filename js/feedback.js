// js/feedback.js
// 訓後回顧：直接從 Firestore 抓 profiles/{userName}.history
// 每個動作顯示最近 30 筆，X 軸：日期時間，Y 軸：重量。

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
  measurementId: "G-7X1L324K0Q",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 小工具：slot "2025-11-29 14:01:11" → "11/29 14:01"
function prettyTimeLabel(slot) {
  const [date, time] = slot.split(" ");
  if (!date || !time) return slot;
  const [y, m, d] = date.split("-");
  const [hh, mm] = time.split(":");
  return `${m}/${d} ${hh}:${mm}`;
}

// 鼓勵文字
function buildComment(weights) {
  if (!weights || weights.length === 0) {
    return "目前還沒有這個動作的訓練紀錄，之後在訓練頁完成訓練後，就會在這裡看到歷史趨勢囉。";
  }
  if (weights.length === 1) {
    return "已經有第一筆紀錄了！之後每次完成訓練都會多一點，慢慢就能看到自己的進步軌跡。💪";
  }
  const first = weights[0];
  const last = weights[weights.length - 1];
  if (first === 0) return "持續穩定訓練最重要，記得好好休息與恢復，今天辛苦了！";

  const ratio = (last - first) / first;
  if (ratio > 0.05) {
    return "整體趨勢往上，代表你有在漸進超負荷，訓練很扎實，繼續保持！🔥";
  } else if (ratio > -0.05) {
    return "重量大致維持在同一個區間，代表你有穩定在訓練，可以依照身體狀態微調負重。👍";
  } else {
    return "最近的重量稍微比一開始低一些，可能是在調整動作或身體比較疲勞，休息充足，下次再慢慢往上推就好。💪";
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const summaryUser = document.getElementById("summaryUser");
  const summaryLast = document.getElementById("summaryLast");
  const container = document.getElementById("feedbackContainer");

  const userName = localStorage.getItem("userName") || "guestUser";
  if (summaryUser) summaryUser.textContent = userName;

  try {
    const userRef = doc(db, "profiles", userName);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      if (summaryLast) summaryLast.textContent = "尚未建立個人資料。";
      if (container) {
        container.innerHTML = "<p>⚠️ 找不到這個使用者的訓練紀錄。</p>";
      }
      return;
    }

    const data = snap.data();
    const historyAll = data.history || {};
    const exerciseNames = data.exerciseNames || {};
    const lastTraining = data.lastTraining;

    if (summaryLast) {
      if (lastTraining) {
        summaryLast.textContent =
          `${lastTraining.date || ""}　目標：${lastTraining.goal || "-"}　部位：${lastTraining.bodyPart || "-"}`;
      } else {
        summaryLast.textContent = "尚無訓練紀錄。";
      }
    }

    if (!container) return;
    container.innerHTML = "";

    const safeNames = Object.keys(historyAll);
    if (safeNames.length === 0) {
      container.innerHTML =
        "<p>目前尚未有任何訓練歷史紀錄，先去「訓練紀錄」頁完成一次訓練吧！</p>";
      return;
    }

    let idx = 1;
    for (const safeName of safeNames) {
      const historyObj = historyAll[safeName] || {};
      const allSlots = Object.keys(historyObj).sort();
      const slots = allSlots.slice(-30); // ✅ 最近 30 筆
      const weights = slots.map(s => historyObj[s]);

      if (!weights.length) continue;

      const displayName = exerciseNames[safeName] || safeName;

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${idx}. ${displayName}</h3>
        <small>顯示最近 ${slots.length} 筆紀錄（最多 30 筆）</small>
        <canvas id="chart-${idx}" height="130"></canvas>
        <p class="comment">${buildComment(weights)}</p>
      `;
      container.appendChild(card);

      const labels = slots.map(prettyTimeLabel);
      const ctx = document.getElementById(`chart-${idx}`);
      new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "重量 (kg)",
              data: weights,
              borderColor: "#0d6efd",
              backgroundColor: "rgba(13,110,253,0.12)",
              tension: 0.2,
            },
          ],
        },
        options: {
          animation: false,
          scales: { y: { beginAtZero: true } },
        },
      });

      idx++;
    }

    if (!container.children.length) {
      container.innerHTML =
        "<p>目前雖然有 history 結構，但沒有任何有效的重量資料可以繪圖。</p>";
    }
  } catch (e) {
    console.error("讀取回顧資料失敗：", e);
    if (summaryLast) summaryLast.textContent = "讀取資料時發生錯誤。";
    if (container) {
      container.innerHTML = "<p>❌ 無法載入訓後回顧資料，請稍後再試。</p>";
    }
  }
});
