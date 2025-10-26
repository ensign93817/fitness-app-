// js/firebase.js (ESM)
// 以 ESM 方式透過官方 CDN 匯入模組
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";


// TODO: 替換成你的 Firebase 專案設定
export const firebaseConfig = {
 apiKey: "AIzaSyBur0DoRPT0csPqtyDSOQBYMjlGaqf3EB0",
  authDomain: "fitness-guide-9a8f3.firebaseapp.com",
  projectId: "fitness-guide-9a8f3",
  storageBucket: "fitness-guide-9a8f3.firebasestorage.app",
  messagingSenderId: "969288112649",
  appId: "1:969288112649:web:58b5b807c410388b1836d8",
  measurementId: "G-7X1L324K0Q"
};


let _app=null, _db=null;
export function getDb(){
if(!_app){ _app = initializeApp(firebaseConfig); }
if(!_db){ _db = getFirestore(_app); }
return _db;
}


// 工具: 取得/建立本地 uid（無登入情境）
export function getLocalUID(){
let uid = localStorage.getItem('uid');
if(!uid){
uid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
localStorage.setItem('uid', uid);
}
return uid;
}


// 匯出 Firestore 常用 API（方便其他檔案使用）
export { collection, doc, getDoc, setDoc, addDoc, getDocs, query, where };
