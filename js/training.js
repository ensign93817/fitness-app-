// js/training.js
document.addEventListener("DOMContentLoaded", async () => {
  const rec = document.getElementById("recommendation");

  try {
    const docRef = db.collection("users").doc("user_001");
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      let plan = "";

      if (data.gender === "男") {
        plan = "建議以增肌訓練為主：深蹲、硬舉、臥推、引體向上";
      } else {
        plan = "建議以全身緊實與核心訓練為主：深蹲、登山者、平板支撐";
      }

      rec.innerHTML = `
        <p>👤 性別：${data.gender}</p>
        <p>🎂 年齡：${data.age}</p>
        <p>📏 身高：${data.height} cm</p>
        <p>⚖️ 體重：${data.weight} kg</p>
        <hr>
        <h3>💪 推薦訓練：</h3>
        <p>${plan}</p>
      `;
    } else {
      rec.textContent = "尚未建立個人資料，請先前往填寫。";
    }
  } catch (error) {
    console.error("載入失敗：", error);
    rec.textContent = "⚠️ 無法載入訓練推薦。";
  }
});
