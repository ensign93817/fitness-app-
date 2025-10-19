const userId = localStorage.getItem("fitnessUserId") || "user_001";
const result = document.getElementById("result");

document.getElementById("recommend").addEventListener("click", async () => {
  const goal = document.getElementById("goal").value;
  const muscle = document.getElementById("muscle").value;
  if (!goal || !muscle) {
    result.innerHTML = "<p style='color:red'>請選擇訓練目標與部位</p>";
    return;
  }

  result.innerHTML = "<p class='muted'>載入中...</p>";

  const snapshot = await db.collection("workouts").doc(goal).collection(muscle).get();
  if (snapshot.empty) {
    result.innerHTML = "<p>找不到對應訓練資料。</p>";
    return;
  }

  let html = "";
  snapshot.forEach(doc => {
    const d = doc.data();
    html += `
      <div class="card">
        <h3>${doc.id}</h3>
        <p>組數 × 次數：${d.sets} × ${d.reps}</p>
        <p>建議重量：<span class="hl">${d.initialWeight ?? 0}</span> kg（增減幅度：${d.delta ?? 0} kg）</p>
        <p>休息時間：${d.rest}</p>
        ${d.cardio ? `<p>有氧建議：${d.cardio}</p>` : ""}
      </div>`;
  });
  result.innerHTML = html;
});
