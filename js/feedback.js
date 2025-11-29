// js/feedback.js
// 只顯示「當次訓練」的回顧圖表與鼓勵文字

function buildComment(weights) {
  if (!weights || weights.length === 0) {
    return "今天這個動作還沒有重量紀錄，可以回到訓練紀錄頁面，做完覺得太輕鬆 / 剛剛好 / 太吃力時按一下按鈕試試看。";
  }
  if (weights.length === 1) {
    return "已經留下第一筆紀錄了！多累積幾次之後，會很清楚看到自己的進步軌跡。💪";
  }

  const first = weights[0];
  const last = weights[weights.length - 1];

  if (first === 0) {
    return "已經有一些紀錄囉，持續穩定訓練最重要，今天辛苦了！";
  }

  const ratio = (last - first) / first;

  if (ratio > 0.05) {
    return "這次的重量比一開始高不少，漸進超負荷做得很棒，持續維持這個節奏！🔥";
  } else if (ratio > -0.05) {
    return "重量大致維持在同一個區間，代表訓練穩定，之後可以依照感受再微調重量。👍";
  } else {
    return "這次的重量稍微比一開始低一點，可能是在調整動作或身體比較疲勞，記得好好休息、補水，下次再衝就好！💪";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const raw = localStorage.getItem("lastFeedbackData");

  if (!raw) {
    const container = document.getElementById("feedbackContainer");
    if (container) {
      container.innerHTML = "<p>❌ 找不到當次訓練資料，請先在「訓練紀錄」頁完成一次訓練，再回來查看訓後回顧。</p>";
    }
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error("解析 lastFeedbackData 失敗：", e);
    const container = document.getElementById("feedbackContainer");
    if (container) {
      container.innerHTML = "<p>❌ 回顧資料格式錯誤，請重新完成一次訓練。</p>";
    }
    return;
  }

  const userName = localStorage.getItem("userName") || "未命名使用者";

  const dateText        = document.getElementById("dateText");
  const goalText        = document.getElementById("goalText");
  const partText        = document.getElementById("partText");
  const totalWeightText = document.getElementById("totalWeightText");
  const summaryUser     = document.getElementById("summaryUser");

  if (summaryUser) summaryUser.textContent = userName;
  if (dateText)  dateText.textContent  = data.date  || "（未記錄）";
  if (goalText)  goalText.textContent  = data.goal  || "-";
  if (partText)  partText.textContent  = data.bodyPart || "-";
  if (totalWeightText && typeof data.totalWeight === "number") {
    totalWeightText.textContent = data.totalWeight.toFixed(1) + " kg";
  }

  const container = document.getElementById("feedbackContainer");
  if (!container) return;
  container.innerHTML = "";

  const series = data.sessionSeries || {};
  const keys = Object.keys(series);

  if (keys.length === 0) {
    container.innerHTML =
      "<p>今天還沒有任何重量紀錄。回到訓練紀錄頁，做完動作後依照感受按一下【加重 / 維持 / 減重】，就會在這裡看到圖表囉！</p>";
    return;
  }

  let i = 1;
  for (const key of keys) {
    const ex = series[key];
    const weights = ex.weights || [];
    const count = weights.length;

    if (count === 0) continue;

    const card = document.createElement("div");
    card.className = "card p-3 mb-4";
    card.innerHTML = `
      <h4>${i}. ${ex.name}</h4>
      <p>本次共記錄 ${count} 筆重量變化（最多 30 筆）。</p>
      <canvas id="chart-${i}" height="130"></canvas>
      <p class="comment" style="margin-top:8px;color:#555;">${buildComment(weights)}</p>
    `;
    container.appendChild(card);

    const labels = weights.map((_, idx) => `第 ${idx + 1} 次`);

    const ctx = document.getElementById(`chart-${i}`);
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
        scales: {
          y: { beginAtZero: true },
        },
      },
    });

    i++;
  }

  if (!container.children.length) {
    container.innerHTML =
      "<p>今天雖然有完成訓練，但沒有任何按下【加重 / 維持 / 減重】的紀錄，因此沒有可以繪製的圖表。</p>";
  }
});
