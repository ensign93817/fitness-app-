// js/firebase.js
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// === 換成你的專案設定 ===
const firebaseConfig = {
  apiKey: "AIzaSyBurBoRPT0csPqtyDSOQBYMj1Gaqf3EB0",
  authDomain: "fitness-guide-9a8f3.firebaseapp.com",
  projectId: "fitness-guide-9a8f3",
  storageBucket: "fitness-guide-9a8f3.appspot.com",
  messagingSenderId: "969288112649",
  appId: "1:969288112649:web:58b5b807c410388b1836d8",
  measurementId: "G-7XL1324K8Q"
};

// ✅ 避免重複初始化
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ 匯出 Firestore 供其他檔案使用
export const db = getFirestore(app);
