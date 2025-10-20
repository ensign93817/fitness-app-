import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBur0DoRPT0csPqtyDSOQBYMjlGaqf3EB0",
  authDomain: "fitness-guide-9a3f3.firebaseapp.com",
  projectId: "fitness-guide-9a3f3",
  storageBucket: "fitness-guide-9a3f3.appspot.com",
  messagingSenderId: "969522181249",
  appId: "1:969522181249:web:5b855bb87c14838bb183d6",
  measurementId: "G-7XLL24WKRQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const input = document.getElementById("fileInput");
  const output = document.getElementById("output");
  output.innerHTML = "";

  if (!input.files.length) {
    alert("請先選擇 JSON 檔案");
    return;
  }

  for (const file of input.files) {
    const text = await file.text();
    const data = JSON.parse(text);
    const goal = file.name.replace(".json", "");

    for (const muscle of Object.keys(data)) {
      for (const exercise of data[muscle]) {
        const ref = doc(db, "menus", goal, muscle, exercise.exercise);
        await setDoc(ref, exercise);
        output.innerHTML += `<p>✅ 已上傳 ${goal} - ${muscle} - ${exercise.exercise}</p>`;
      }
    }
  }

  output.innerHTML += "<hr><strong>🔥 所有菜單上傳完成！</strong>";
});
