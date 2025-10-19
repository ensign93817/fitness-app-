// ===== Firebase 初始化 =====
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "fitness-guide-9a8f3.firebaseapp.com",
  projectId: "fitness-guide-9a8f3",
  storageBucket: "fitness-guide-9a8f3.appspot.com",
  messagingSenderId: "969288112649",
  appId: "YOUR_APP_ID",
  measurementId: "G-XXXX"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);

// 建立 Firestore 資料庫連線
const db = firebase.firestore();
