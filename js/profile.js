// profile.js
document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const gender = document.getElementById("gender").value;
  const age = document.getElementById("age").value;
  const height = document.getElementById("height").value;
  const weight = document.getElementById("weight").value;

  if (!gender || !age || !height || !weight) {
    alert("⚠️ 請完整填寫所有欄位");
    return;
  }

  try {
    await db.collection("users").doc("user_001").collection("profile").doc("basic").set({
      gender,
      age: parseInt(age),
      height: parseFloat(height),
      weight: parseFloat(weight),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("✅ 資料已成功儲存！");
  } catch (error) {
    console.error("❌ 儲存失敗:", error);
    alert("儲存失敗，請稍後再試");
  }
});
