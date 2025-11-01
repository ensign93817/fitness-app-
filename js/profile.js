import { getDb, doc, setDoc } from "./firebase.js";

// 取得表單元素
const form = document.getElementById("profileForm");
const userNameInput = document.getElementById("userName");
const genderInput = document.getElementById("gender");
const ageInput = document.getElementById("age");
const heightInput = document.getElementById("height");
const weightInput = document.getElementById("weight");

// Firestore 寫入
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userName = userNameInput.value.trim();
  const gender = genderInput.value;
  const age = Number(ageInput.value);
  const height = Number(heightInput.value);
  const weight = Number(weightInput.value);

  if (!userName) {
    alert("請輸入使用者名稱！");
    return;
  }

  try {
    const db = getDb();

    // 建立文件：profiles/{userName}
    await setDoc(doc(db, "profiles", userName), {
      userName,
      gender,
      age,
      height,
      weight,
      updatedAt: new Date().toISOString(),
    });

    // 儲存在 localStorage，供 training.html 使用
    localStorage.setItem("activeUser", userName);

    alert(`✅ ${userName} 資料已儲存成功！`);
    window.location.href = "training.html"; // 自動跳轉至訓練推薦頁
  } catch (err) {
    console.error("Firestore 寫入錯誤：", err);
    alert("❌ 資料儲存失敗，請稍後再試。");
  }
});
