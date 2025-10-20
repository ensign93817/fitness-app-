// js/profile.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profileForm");

  if (!form) {
    console.error("❌ 找不到 id='profileForm' 的表單");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const gender = document.getElementById("gender").value;
    const age = document.getElementById("age").value;
    const height = document.getElementById("height").value;
    const weight = document.getElementById("weight").value;

    try {
      await db.collection("users").doc("user_001").set({
        gender, age, height, weight
      });
      alert("✅ 資料已儲存成功！");
    } catch (error) {
      console.error("儲存失敗：", error);
      alert("❌ 儲存失敗，請稍後再試。");
    }
  });
});
