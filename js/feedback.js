// js/feedback.js

// 讀取 training.js 存進來的訓練資料
const raw = localStorage.getItem("lastFeedbackData");
const userName = localStorage.getItem("userName") || "未命名使用者";

const summaryEl = document.getElementById("summaryText");
const chartsContainer = document.getElementById("chartsContainer");
const overallCommentEl = document.getElementById("overallComment");

if (!raw) {
  summaryEl.textContent = "目前找不到剛才的訓練資料，請先在「訓練紀錄」頁完成一次訓練。";
} else {
  const data = JSON.parse(raw);
  const { date, goal, bodyPart, sessionSeries, totalWeight } = data;

  summaryEl.textContent =
    `👤 使用者：${userName}｜📅 日期：${date}｜🎯 目標：${goal}｜💪 部位：${bodyPart}｜` +
    `📦 本次總重量：約 ${totalWeight.toFixed(1)} kg`;

  const allTrends = [];

  Object.values(sessionSeries).forEach((exObj, idx) => {
    const { name, weights } = exObj;
    if (!weights || !weights.length) return;

    // 建立卡片
    const card = document.createElement("div");
    card.className = "exercise-card";

    const title = document.createElement("h3");
    title.textContent = `${idx + 1}. ${name}`;
    card.appendChild(title);

    const desc = document.createElement("p");
    desc.textContent = `本次共紀錄 ${weights.length} 次重量調整（最多顯示 30 次）。`;
    card.appendChild(desc);

    // 建立 canvas
    const canvas = document.createElement("canvas");
    const canvasId = `ex-chart-${idx}`;
    canvas.id = canvasId;
    canvas.height = 120;
    card.appendChild(canvas);

    chartsContainer.appendChild(card);

    // X 軸：第 1～n 次（最多 30）
    const labels = weights.map((_, i) => `第 ${i + 1} 次`);
    const ctx = canvas.getContext("2d");

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
            tension: 0.25,
            fill: true,
          },
        ],
      },
      options: {
        animation: false,
        scales: {
          x: { title: { display: true, text: "次數 (最多 30 次)" } },
          y: { beginAtZero: true, title: { display: true, text: "重量 (kg)" } },
        },
      },
    });

    // 針對單一動作產生一句鼓勵
    const first = weights[0];
    const last = weights[weights.length - 1];
    let comment = "";

    if (weights.length === 1) {
      comment = "今天完成了這個動作的訓練，先把習慣養起來最重要 💪";
    } else if (last > first + 0.5) {
      comment = "重量有明顯往上提升，進步超讚，持續加油！🔥";
      allTrends.push(1);
    } else if (last >= first - 0.5) {
      comment = "重量大致維持在同一個水準，穩定表現也是很重要的優點 ✅";
      allTrends.push(0);
    } else {
      comment = "今天重量稍微下降沒關係，可能身體比較累，記得好好休息，下次再衝！💤";
      allTrends.push(-1);
    }

    const commentEl = document.createElement("div");
    commentEl.className = "comment";
    commentEl.textContent = comment;
    card.appendChild(commentEl);
  });

  // 整體總結一句話
  if (allTrends.length) {
    const avgTrend = allTrends.reduce((a, b) => a + b, 0) / allTrends.length;
    if (avgTrend > 0.3) {
      overallCommentEl.textContent = "整體來看，今天的訓練呈現成長趨勢，非常棒，保持這個節奏！💯";
    } else if (avgTrend > -0.3) {
      overallCommentEl.textContent = "今天的表現很穩定，長期累積就是最大的進步，持續保持！✅";
    } else {
      overallCommentEl.textContent = "今天可能比較累，數字略為下滑沒關係，好好休息下次再拼就好，加油！💪";
    }
  } else {
    overallCommentEl.textContent = "尚未記錄到可畫圖的重量變化，下次記得在每個動作後使用加重/維持/減重喔！";
  }
}
