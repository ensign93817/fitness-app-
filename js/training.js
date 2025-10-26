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

// 載入 Firestore 中的對應菜單
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

  // 👉 移除重複動作（依據訓練動作名稱）
  const unique = [];
  const seen = new Set();
  for (let ex of exercises) {
    const name = ex["訓練動作"] || ex.name || "";
    if (!seen.has(name)) {
      unique.push(ex);
      seen.add(name);
    }
  }

  renderExercises(unique);
});

// 顯示菜單內容
function renderExercises(exercises) {
  exerciseContainer.innerHTML = "";
  exercises.forEach((ex, idx) => {
    // 自動尋找欄位名稱（避免 Excel 匯出中有隱藏空白）
    const getValue = (keyword) => {
      const key = Object.keys(ex).find(k => k.includes(keyword));
      return key ? ex[key] : "";
    };

    const name = getValue("訓練動作") || "未知動作";
    const sets = getValue("組數") || "？";
    const reps = getValue("次數") || "？";
    const rest = getValue("休息") || "？";
    const weight = parseFloat(getValue("重量")) || 0;
    const delta = parseFloat(getValue("增減")) || 2.5;

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
