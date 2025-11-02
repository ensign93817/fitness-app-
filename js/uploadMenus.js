// === 🔥 Firebase SDK 載入 ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === ⚙️ Firebase 初始化 ===
const firebaseConfig = {
  apiKey: "AIzaSyBur0DoRPT0csPqtyDSOQBYMjlGaqf3EB0",
  authDomain: "fitness-guide-9a8f3.firebaseapp.com",
  projectId: "fitness-guide-9a8f3",
  storageBucket: "fitness-guide-9a8f3.firebasestorage.app",
  messagingSenderId: "969288112649",
  appId: "1:969288112649:web:58b5b807c410388b1836d8",
  measurementId: "G-7X1L324K0Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.onload = () => {
  document.getElementById("uploadBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput || !fileInput.files.length) {
      alert("請先選擇 JSON 檔案！");
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const menus = JSON.parse(event.target.result);
        let totalCount = 0;

        for (const [goal, parts] of Object.entries(menus)) {
          for (const [part, exercises] of Object.entries(parts)) {
            const docId = `${goal}_${part}`;
            await setDoc(doc(db, "menus", docId), {
              bodyPart: part,
              exercises: exercises
            });
            console.log(`✅ 已上傳 ${docId}`);
            totalCount++;
          }
        }

        document.getElementById("output").innerHTML =
          `<p style="color:green;">✅ 全部上傳完成，共 ${totalCount} 份菜單。</p>`;
      } catch (err) {
        console.error("❌ 上傳錯誤：", err);
        alert("上傳失敗，請確認 JSON 檔案格式！");
      }
    };

    reader.readAsText(file);
  });
};
