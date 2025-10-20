// js/firebase.js
// ✅ Firebase 初始化（只留這一份）
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "fitness-guide-9a8f3.firebaseapp.com",
  projectId: "fitness-guide-9a8f3",
  storageBucket: "fitness-guide-9a8f3.appspot.com",
  messagingSenderId: "969288112649",
  appId: "YOUR_APP_ID"
};

// 初始化 Firebase（只載入一次）
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
window.db = db; // ✅ 全域共享 Firestore
