// ===== Firebase 初始化（請替換為你專案的設定）=====
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "fitness-guide-9a8f3.firebaseapp.com",
  projectId: "fitness-guide-9a8f3",
  storageBucket: "fitness-guide-9a8f3.appspot.com",
  messagingSenderId: "969288112649",
  appId: "YOUR_APP_ID",
  measurementId: "G-XXXX"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ====== UI 元件 ======
const $goal = document.getElementById('goal');
const $muscle = document.getElementById('muscle');
const $exercise = document.getElementById('exercise');
const $feedback = document.getElementById('feedback');
const $result = document.getElementById('result');
const $recommend = document.getElementById('recommend');
const $reset = document.getElementById('reset');
const $excel = document.getElementById('excel');
const $importExcel = document.getElementById('importExcel');
const $loadFS = document.getElementById('loadFS');

// ====== 依序載入 Firestore 清單 ======
// ====== 依序載入 Firestore 清單 ======
async function getMuscles(goal) {
  try {
    const muscleSnap = await db.collection('workouts').doc(goal).get();
    // 取得該目標底下所有子集合名稱（例如：胸部+三頭肌、背部+二頭肌）
    const path = db.collection('workouts').doc(goal);
    const subRef = await db.collectionGroup('workouts')
      .where(firebase.firestore.FieldPath.documentId(), '!=', goal)
      .get();
    const muscles = [];
    subRef.forEach((doc) => {
      const pathArr = doc.ref.path.split('/');
      if (pathArr.length >= 2 && pathArr[1] === goal && pathArr.length === 4) {
        muscles.push(pathArr[2]);
      }
    });
    return [...new Set(muscles)].sort();
  } catch (err) {
    console.error('getMuscles 錯誤：', err);
    return [];
  }
}

async function getExercises(goal, muscle) {
  try {
    const coll = db.collection('workouts').doc(goal).collection(muscle);
    const snap = await coll.get();
    return snap.docs.map(d => d.id).sort();
  } catch (err) {
    console.error('getExercises 錯誤：', err);
    return [];
  }
}


async function getExerciseDoc(goal, muscle, exercise){
  const ref = db.collection('workouts').doc(goal).collection(muscle).doc(exercise);
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}

// 初始化：只先清掉下拉
function resetSelect(sel, placeholder){
  sel.innerHTML = `<option value="">${placeholder}</option>`;
}
resetSelect($muscle,'請先選上方目標');
resetSelect($exercise,'請先選上方部位');

// 當選到目標 → 載入肌群
$goal.addEventListener('change', async ()=>{
  resetSelect($muscle,'載入中…'); resetSelect($exercise,'請先選上方部位');
  if(!$goal.value){ resetSelect($muscle,'請先選上方目標'); return; }
  const list = await getMuscles($goal.value);
  $muscle.innerHTML = `<option value="">請選擇</option>` + list.map(m=>`<option>${m}</option>`).join('');
});

// 當選到肌群 → 載入動作
$muscle.addEventListener('change', async ()=>{
  resetSelect($exercise,'載入中…');
  if(!$goal.value || !$muscle.value){ resetSelect($exercise,'請先選上方部位'); return; }
  const list = await getExercises($goal.value, $muscle.value);
  $exercise.innerHTML = `<option value="">請選擇</option>` + list.map(e=>`<option>${e}</option>`).join('');
});

// 點擊產生建議
$recommend.addEventListener('click', async ()=>{
  const goal = $goal.value, muscle = $muscle.value, ex = $exercise.value, fb = $feedback.value;
  if(!goal || !muscle || !ex || !fb){
    $result.innerHTML = `<h3 class="danger">請把「目標、部位、動作、回饋」都選好</h3>`;
    return;
  }
  const data = await getExerciseDoc(goal, muscle, ex);
  if(!data){ $result.innerHTML = `<h3 class="danger">找不到資料</h3>`; return; }

  // 回饋規則：找對應狀態
  const rule = (data.rules || []).find(r => r.state === fb);
  const nextWeight = rule ? rule.weight : (data.initialWeight ?? 0);
  const delta = rule ? rule.delta : 0;

  const tag = fb.startsWith('✅') ? 'ok' : fb.startsWith('🟡') ? 'warn' : fb.startsWith('❌') ? 'bad' : '';
  const cardio = data.cardio || null;

  $result.innerHTML = `
    <h3>${goal} <span class="tag">${muscle}</span> <span class="tag">${ex}</span></h3>
    <div class="small">建議：<span class="hl mono">${nextWeight}</span> kg
      ${delta ? `<span class="muted">（下次變化：${delta>0?'+':''}${delta} kg）</span>`:''}
    </div>
    <div class="small">次數 / 組數：<b>${data.reps}</b> × <b>${data.sets}</b>　｜　休息：<b>${data.rest}</b></div>
    ${cardio ? `<div class="small">有氧：<b>${cardio}</b></div>` : ``}
    <div class="small mt">你的回饋：<span class="${tag}">${fb}</span></div>
  `;
});

// 清空
$reset.addEventListener('click', ()=>{
  $goal.value = ""; resetSelect($muscle,'請先選上方目標'); resetSelect($exercise,'請先選上方部位'); $feedback.value="";
  $result.innerHTML = `<h3 class="muted">這裡會顯示建議</h3>`;
});

// ====== Excel → Firestore 匯入（管理員用） ======
// 你的四張表欄位：目標 | 訓練肌群 | 訓練動作 | 次數 | 組數 | 休息時間 | 使用者反應 | 重量 | 每次增減重量 | (可選)有氧
function rowsToFirestoreBatch(rows){
  // 依「目標 > 肌群 > 動作」彙整；每個動作內再依回饋彙整
  const map = new Map(); // key: `${goal}|${muscle}|${exercise}` -> object
  for(const r of rows){
    const goal = String(r['目標']).trim();
    const muscle = String(r['訓練肌群']).trim();
    const exercise = String(r['訓練動作']).trim();
    const reps = String(r['次數']).trim();
    const sets = String(r['組數']).trim();
    const rest = String(r['休息時間']).trim();
    const state = String(r['使用者反應']).trim();
    const weight = (r['重量'] ?? r['重量(KG)'] ?? r['重量 ']) ?? null;
    const delta = (r['每次增減重量'] ?? r['每次增減重量 '] ?? r['每次增減重量(kg)']) ?? 0;
    const cardio = r['有氧'] ? String(r['有氧']).trim() : null;

    const key = `${goal}|${muscle}|${exercise}`;
    if(!map.has(key)){
      map.set(key, { goal, muscle, exercise, reps, sets, rest, cardio, rules: [] });
    }
    const obj = map.get(key);
    // 規則列
    obj.rules.push({
      state,                // "第一次" / "✅ 持續完成目標4次" / "🟡 完成但感吃力" / "❌ 無法完成 & 疲勞高"
      weight: weight !== null ? Number(weight) : null,
      delta: Number(delta || 0)
    });
  }
  return Array.from(map.values());
}

async function uploadToFirestore(items){
  // items: [{goal,muscle,exercise,reps,sets,rest,cardio,rules:[{state,weight,delta}]}]
  const tasks = [];
  for(const it of items){
    const ref = db.collection('workouts').doc(it.goal).collection(it.muscle).doc(it.exercise);
    const payload = {
      reps: it.reps, sets: it.sets, rest: it.rest,
      cardio: it.cardio || null,
      rules: it.rules,
      // 方便第一次沒有回饋時可給一個預設重量
      initialWeight: (it.rules.find(r=>r.state==='第一次')?.weight) ?? null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    tasks.push(ref.set(payload, { merge:true }));
  }
  await Promise.all(tasks);
}

$importExcel.addEventListener('click', async ()=>{
  const files = $excel.files;
  if(!files || files.length===0){ alert('請先選擇四份 .xlsx 檔案'); return; }
  let allRows = [];
  for(const f of files){
    const ab = await f.arrayBuffer();
    const wb = XLSX.read(ab, {type:'array'});
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet); // 自動以第一列為欄名
    allRows = allRows.concat(rows);
  }
  const items = rowsToFirestoreBatch(allRows);
  await uploadToFirestore(items);
  alert(`已匯入 ${items.length} 個動作到 Firestore！`);
});

// 重新載入（只是刷新下拉）
$loadFS.addEventListener('click', async ()=>{
  if(!$goal.value){ alert('請先選擇「訓練目標」'); return; }
  const list = await getMuscles($goal.value);
  $muscle.innerHTML = `<option value="">請選擇</option>` + list.map(m=>`<option>${m}</option>`).join('');
  resetSelect($exercise,'請先選上方部位');
});
