// js/profile.js
const db = window.db; // 取用 firebase.js 的全域 db

const form = document.getElementById('profileForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const gender = document.getElementById('gender').value;
  const age = parseInt(document.getElementById('age').value);
  const height = parseFloat(document.getElementById('height').value);
  const weight = parseFloat(document.getElementById('weight').value);

  if (!gender || !age || !height || !weight) {
    alert('⚠️ 請完整填寫所有欄位');
    return;
  }

  try {
    await db.collection('users').doc('user_001').collection('profile').doc('basic').set({
      gender,
      age,
      height,
      weight,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('✅ 個人資料已成功儲存！');
  } catch (error) {
    console.error('❌ 儲存失敗:', error);
    alert('儲存失敗，請稍後再試');
  }
});
