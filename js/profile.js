// js/profile.js
(function () {
  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  onReady(() => {
    const form = document.getElementById("profileForm");
    if (!form) {
      console.error("❌ 找不到 id='profileForm' 的表單");
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const gender = document.getElementById("gender").value;
      const age    = Number(document.getElementById("age").value || 0);
      const height = Number(document.getElementById("height").value || 0);
      const weight = Number(document.getElementById("weight").value || 0);

      try {
        // 寫入 Firestore（先用固定 user_001）
        await db.collection("users").doc("user_001").set({
          gender, age, height, weight,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // 設定本地登入標記，供 index.html 判斷導頁用
        localStorage.setItem("fitnessUserId", "user_001");

        alert("✅ 已儲存，前往訓練推薦頁");
        window.location.href = "training.html";
      } catch (err) {
        console.error("儲存失敗：", err);
        alert("❌ 儲存失敗，請稍後再試");
      }
    });
  });
})();
