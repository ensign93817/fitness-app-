// js/training.js
import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.getElementById("generate").addEventListener("click", async () => {
  const goal = document.getElementById("goal").value;
  const part = document.getElementById("part").value;

  if (!goal || !part) {
    alert("請選擇訓練目標與部位！");
    return;
  }

  // （未來可改為從 Firebase /menus 讀取）
  console.log("選擇目標：", goal, "訓練部位：", part);
});
