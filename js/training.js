// ✅ 使用 module 匯入 Firebase
import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generate");
  const goalSelect = document.getElementById("goal");
  const partSelect = document.getElementById("part");
  const resultDiv = document.getElementById("result");

  if (!generateBtn) {
    console.error("⚠️ 找不到按鈕 #generate");
    return;
  }

  generateBtn.addEventListener("click", async () => {
    const goal = goalSelect.value;
    const part = partSelect.value;

    if (!goal || !part) {
      alert("請選擇訓練目標與部位！");
      return;
    }

    // 🔍 未來這裡會根據 Excel (轉 JSON) 顯示推薦菜單
    resultDiv.innerHTML = `選擇目標：${goal}<br>訓練部位：${part}`;
    console.log("✅ 選擇目標：", goal, "部位：", part);
  });
});
