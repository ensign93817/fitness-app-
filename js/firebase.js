// ✅ Firebase 初始化設定（避免重複初始化）
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// === 將以下換成你 Firebase 專案設定 ===
const firebaseConfig = {
  apiKey: "AIzaSyBurBoRPT0csPqtyDSOQBYMj1Gaqf3EB0",
  authDomain: "fitness-guide-9a8f3.firebaseapp.com",
  projectId: "fitness-guide-9a8f3",
  storageBucket: "fitness-guide-9a8f3.appspot.com",
  messagingSenderId: "969288112649",
  appId: "1:969288112649:web:58b5b807c410388b1836d8",
  measurementId: "G-7XL1324K8Q"
};

// ✅ 檢查是否已初始化，避免重複錯誤
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ 匯出 Firestore
export const db = getFirestore(app);
