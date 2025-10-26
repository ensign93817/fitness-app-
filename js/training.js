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

  renderExercises(exercises);
});

// 顯示菜單內容
function renderExercises(exercises) {
  exerciseContainer.innerHTML = "";

  // 以「第一次」那一筆設定初始重量
  const firstSet = exercises.find(ex => ex["使用者反應"] === "第一次");

  // 分組顯示不同動作
  const grouped = {};
  exercises.forEach(ex => {
    if (!grouped[ex["訓練動作"]] && ex["使用者反應"] === "第一次") {
      grouped[ex["訓練動作"]] = {
        name: ex["訓練動作"],
        sets: ex["組數"],
        reps: ex["次數"],
        rest: ex["休息時間"],
        baseWeight: parseFloat(ex["重量(KG)"]) || 0,
        delta: parseFloat(ex["每次增減重量量(KG)"]) || 2.5,
      };
    }
  });

  const actions = Object.values(grouped);

  actions.forEach((act, idx) => {
    const div = document.createElement("div");
    div.className = "exercise-item";
    div.innerHTML = `
      <h3>${idx + 1}. ${act.name}</h3>
      <p>組數：${act.sets}　次數：${act.reps}　休息：${act.rest}</p>
      <p>目前重量：<span id="w${idx}">${act.baseWeight}</span> kg</p>
      <p id="r${idx}" style="color:gray;">系統反應：等待使用者選擇</p>
      <div class="btn-group">
        <button onclick="adjustWeight(${idx}, ${act.baseWeight}, ${act.delta}, 'up')">加重</button>
        <button onclick="adjustWeight(${idx}, ${act.baseWeight}, ${act.delta}, 'same')">維持</button>
        <button onclick="adjustWeight(${idx}, ${act.baseWeight}, ${act.delta}, 'down')">減重</button>
      </div>
      <hr/>
    `;
    exerciseContainer.appendChild(div);
  });
}

// 加減重量邏輯 + 顯示系統反應
window.adjustWeight = function (idx, base, delta, action) {
  const span = document.getElementById(`w${idx}`);
  const react = document.getElementById(`r${idx}`);

  let current = parseFloat(span.textContent);
  if (isNaN(current)) current = base;

  if (action === "up") {
    current += delta;
    react.textContent = "系統反應：加重量";
  } else if (action === "down") {
    current -= delta;
    react.textContent = "系統反應：減少重量";
  } else {
    react.textContent = "系統反應：保持重量";
  }

  if (current < 0) current = 0;
  span.textContent = current.toFixed(1);
};
