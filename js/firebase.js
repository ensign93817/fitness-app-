// js/firebase.js

// 🔥 不要使用 import，直接用全域 firebase 物件
// 確保 training.html 有載入 firebase-app-compat.js 和 firebase-firestore-compat.js

const firebaseConfig = {
  apiKey: "你的 API_KEY",
  authDomain: "fitness-guide-9a8f3.firebaseapp.com",
  projectId: "fitness-guide-9a8f3",
  storageBucket: "fitness-guide-9a8f3.appspot.com",
  messagingSenderId: "969288112649",
  appId: "你的 APP_ID",
  measurementId: "G-XXXX"
};

// ✅ 初始化（只允許執行一次）
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// ✅ 輸出給其他 js 檔使用（例如 training.js）
window.db = db;
