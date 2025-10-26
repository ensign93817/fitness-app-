import { getDb, collection, getDocs, doc, getDoc } from "./firebase.js";

const db = getDb();
const goalSelect = document.getElementById("goalSelect");
const partSelect = document.getElementById("partSelect");
const loadBtn = document.getElementById("loadBtn");
const exerciseContainer = document.getElementById("exerciseContainer");

let allMenus = [];

// 初始化 Firestore 資料
async function loadMenus() {
  const querySnapshot = await getDocs(collection(db, "menus"));
  allMenus = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.goal && data.bodyPart) allMenus.push({ id: docSnap.id, ...data });
  });

  const goals = [...new Set(allMenus.map(m => m.goal))];
  goalSelect.innerHTML =
    `<option value="">請選擇目標</option>` +
    goals.map(g => `<option value="${g}">${g}</option>`).join("");
}
loadMenus();

// 根據目標更新部位選單
goalSelect.addEventListener("change", () => {
  const selectedGoal = goalSelect.value;
  const parts = [
    ...new Set(allMenus.filter(m => m.goal === selectedGoal).map(m => m.bodyPart))
  ];
  partSelect.innerHTML = parts.length
    ? parts.map(p => `<option value="${p}">${p}</option>`).join("")
    : `<option>無資料</option>`;
});

// 載入 Firestore 對應菜單
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
  const exercises = data.exercises || [];

  // 去除重複動作，只保留第一筆
  const seen = new Set();
  const uniqueExercises = [];
  for (let ex of exercises) {
    if (!seen.has(ex.name)) {
      uniqueExercises.push(ex);
      seen.add(ex.name);
    }
  }

  renderExercises(uniqueExercises);
});

// 顯示菜單內容
function renderExercises(exercises) {
  exerciseContainer.innerHTML = "";

  exercises.forEach((ex, idx) => {
    const name = ex.name || "未知動作";
    const sets = ex.defaultSets || "？";
    const reps = ex.defaultReps || "？";
    const rest =
      typeof ex.restSec === "number"
        ? `${ex.restSec} 秒`
        : ex.restSec
        ? ex.restSec
        : "？";
    const weight =
      typeof ex.defaultWeight === "number" ? ex.defaultWeight : 0;
    const delta =
      typeof ex.deltaWeight === "number" ? ex.deltaWeight : 2.5;

    const div = document.createElement("div");
    div.className = "exercise-item";
    div.innerHTML = `
      <h3>${idx + 1}. ${name}</h3>
      <p>組數：${sets}　次數：${reps}　休息：${rest}</p>
      <p>重量：<span id="w${idx}">${weight}</span> kg</p>
      <div class="btn-group">
        <button onclick="adjustWeight(${idx}, ${weight}, ${delta}, 'up')">加重</button>
        <button onclick="adjustWeight(${idx}, ${weight}, ${delta}, 'same')">維持</button>
        <button onclick="adjustWeight(${idx}, ${weight}, ${delta}, 'down')">減重</button>
      </div>
      <hr/>
    `;
    exerciseContainer.appendChild(div);
  });
}

// 加減重量邏輯
window.adjustWeight = function (idx, base, delta, action) {
  const span = document.getElementById(`w${idx}`);
  let current = parseFloat(span.textContent);
  if (isNaN(current)) current = base;
  if (action === "up") current += delta;
  if (action === "down") current -= delta;
  if (current < 0) current = 0;
  span.textContent = current.toFixed(1);
};
