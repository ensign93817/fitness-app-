import { getDb, collection, getDocs, doc, getDoc } from "./firebase.js";

const db = getDb();
const goalSelect = document.getElementById("goalSelect");
const partSelect = document.getElementById("partSelect");
const loadBtn = document.getElementById("loadBtn");
const exerciseContainer = document.getElementById("exerciseContainer");

let allMenus = []; // 暫存 Firestore 內容

// 初始化：載入所有菜單名稱
async function loadMenus() {
  const querySnapshot = await getDocs(collection(db, "menus"));
  allMenus = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.goal && data.bodyPart) allMenus.push({ id: docSnap.id, ...data });
  });

  // 產生目標選單
  const goals = [...new Set(allMenus.map(m => m.goal))];
  goalSelect.innerHTML = `<option value="">請選擇目標</option>` +
    goals.map(g => `<option value="${g}">${g}</option>`).join("");
}
loadMenus();

// 當選擇目標時更新部位
goalSelect.addEventListener("change", () => {
  const selectedGoal = goalSelect.value;
  const parts = [...new Set(allMenus.filter(m => m.goal === selectedGoal).map(m => m.bodyPart))];
  partSelect.innerHTML = parts.length
    ? parts.map(p => `<option value="${p}">${p}</option>`).join("")
    : `<option>無資料</option>`;
});

// 按下載入按鈕
loadBtn.addEventListener("click", async () => {
  const goal = goalSelect.value;
  const part = partSelect.value;
  if (!goal || !part) {
    exerciseContainer.innerHTML = "<p>⚠️ 請先選擇目標與部位</p>";
    return;
  }

  const key = `${goal}_${part}`;
  const docRef = doc(db, "menus", key);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    exerciseContainer.innerHTML = `<p>❌ 找不到 ${key} 的菜單</p>`;
    return;
  }

  const data = docSnap.data();
  renderExercises(data.exercises || []);
});

// 顯示菜單內容
function renderExercises(exercises) {
  exerciseContainer.innerHTML = "";
  exercises.forEach((ex, idx) => {
    const div = document.createElement("div");
    div.className = "exercise-item";
    div.innerHTML = `
      <h3>${idx + 1}. ${ex.name}</h3>
      <p>組數：${ex.defaultSets}　次數：${ex.defaultReps}　休息：${ex.restSec ?? "?"} 秒</p>
      <p>重量：<span id="w${idx}">${ex.defaultWeight ?? 0}</span> kg</p>
      <div class="btn-group">
        <button onclick="adjustWeight(${idx}, ${ex.defaultWeight ?? 0}, ${ex.deltaWeight ?? 2.5}, 'up')">加重</button>
        <button onclick="adjustWeight(${idx}, ${ex.defaultWeight ?? 0}, ${ex.deltaWeight ?? 2.5}, 'same')">維持</button>
        <button onclick="adjustWeight(${idx}, ${ex.defaultWeight ?? 0}, ${ex.deltaWeight ?? 2.5}, 'down')">減重</button>
      </div>
      <hr/>
    `;
    exerciseContainer.appendChild(div);
  });
}

// 調整重量
window.adjustWeight = function(idx, weight, delta, action) {
  const span = document.getElementById(`w${idx}`);
  let newWeight = weight;
  if (action === "up") newWeight += delta;
  if (action === "down") newWeight -= delta;
  span.textContent = Math.round(newWeight * 10) / 10;
};
