// js/firebase.js
// ✅ Firebase 初始化（只留這一份）
const firebaseConfig = {
apiKey: "AIzaSyBur0DoRPT0csPqtyDSOQBYMjlGaqf3EB0",
  authDomain: "fitness-guide-9a8f3.firebaseapp.com",
  projectId: "fitness-guide-9a8f3",
  storageBucket: "fitness-guide-9a8f3.firebasestorage.app",
  messagingSenderId: "969288112649",
  appId: "1:969288112649:web:58b5b807c410388b1836d8",
  measurementId: "G-7X1L324K0Q"
};

// 初始化 Firebase（只載入一次）
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
window.db = db; // ✅ 全域共享 Firestore
