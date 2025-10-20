// ✅ 確保 DOM 載入完畢後再執行
document.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("saveTraining");
  const resultDiv = document.getElementById("result");

  // 防止網頁元素沒找到
  if (!btn || !resultDiv) {
    console.error("❌ 找不到必要的 HTML 元素，請確認 id=saveTraining 與 id=result 是否存在於 training.html");
    return;
  }

  // 初始化 Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyduR0ePRbC7psY09OgEWhJdaqf5B8PM",
    authDomain: "fitness-guide-9a3f3.firebaseapp.com",
    projectId: "fitness-guide-9a3f3",
    storageBucket: "fitness-guide-9a3f3.appspot.com",
    messagingSenderId: "969522181249",
    appId: "1:969522181249:web:5b855bb87c14838bb183d6",
    measurementId: "G-7XLL24WKRQ"
  };

  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // 點擊「產生建議」按鈕時
  btn.addEventListener("click", async () => {
    const goal = document.getElementById("goal").value;
    const muscle = document.getElementById("muscle").value;

    if (!goal || !muscle) {
      resultDiv.innerHTML = `<p>⚠️ 請先選擇訓練目標與訓練部位。</p>`;
      return;
    }

    resultDiv.innerHTML = `<p>⏳ 正在讀取 ${goal} - ${muscle} 的菜單...</p>`;

    try {
      const snapshot = await db.collection("menus").doc(goal).collection(muscle).get();

      if (snapshot.empty) {
        resultDiv.innerHTML = `<p>❌ 沒有找到 ${goal} - ${muscle} 的訓練資料。</p>`;
        return;
      }

      let html = `<h3>${goal}訓練菜單 - ${muscle}</h3>`;
      snapshot.forEach(doc => {
        const d = doc.data();
        html += `
          <div class="card">
            <strong>${d.exercise}</strong><br>
            次數：${d.reps} ｜ 組數：${d.sets} ｜ 休息：${d.rest}<br>
            重量：${d.weight} kg ｜ 每次增減：${d.delta} kg
          </div>
          <hr>
        `;
      });

      resultDiv.innerHTML = html;
    } catch (err) {
      console.error("Firestore 錯誤：", err);
      resultDiv.innerHTML = `<p>❌ 資料讀取失敗，請稍後再試。</p>`;
    }
  });
});
