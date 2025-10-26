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

// 按下載入菜單
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
    const name = ex["訓練動作"] || ex.name || "未知動作";
    const sets = ex["組數"] || ex.defaultSets || "？";
    const reps = ex["次數"] || ex.defaultReps || "？";
    const rest = ex["休息時間"] || ex.restSec || "？";
    const weight = ex["重量(KG)"] || ex.defaultWeight || 0;
    const delta = ex["每次增減重量"] || ex.deltaWeight || 2.5;

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

// 調整重量
window.adjustWeight = function(idx, weight, delta, action) {
  const span = document.getElementById(`w${idx}`);
  let current = parseFloat(span.textContent);
  if (action === "up") current += delta;
  if (action === "down") current -= delta;
  span.textContent = Math.max(current, 0).toFixed(1);
};
