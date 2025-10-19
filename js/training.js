// ====== Excel → Firestore 匯入（管理員用） ======
function rowsToFirestoreBatch(rows) {
  // 依「目標 > 肌群 > 動作」彙整；每個動作內再依回饋彙整
  const map = new Map(); // key: `${goal}|${muscle}|${exercise}` -> object
  for (const r of rows) {
    const goal = String(r['目標']).trim();
    const muscle = String(r['訓練肌群']).trim();
    const exercise = String(r['訓練動作']).trim();
    const reps = String(r['次數']).trim();
    const sets = String(r['組數']).trim();
    const rest = String(r['休息時間']).trim();
    const state = String(r['使用者反應']).trim();
    const weight = Number(r['重量'] ?? r['重量(KG)'] ?? 0);
    const delta = Number(r['每次增減重量'] ?? 0);
    const cardio = r['有氧'] ? String(r['有氧']).trim() : null;

    const key = `${goal}|${muscle}|${exercise}`;
    if (!map.has(key)) {
      map.set(key, { goal, muscle, exercise, reps, sets, rest, cardio, rules: [] });
    }

    // ⚙️ 自動分配 delta
    // 當 Excel 裡有填「每次增減重量」時，自動建立對應規則
    const obj = map.get(key);
    obj.rules.push({
      state,                // ✅ 🟡 ❌ 等反饋狀態
      weight: isNaN(weight) ? null : weight,
      delta: isNaN(delta) ? 0 : delta
    });
  }
  return Array.from(map.values());
}

// 上傳到 Firestore
async function uploadToFirestore(items) {
  const tasks = [];
  for (const it of items) {
    const ref = db.collection('workouts').doc(it.goal).collection(it.muscle).doc(it.exercise);
    const payload = {
      reps: it.reps,
      sets: it.sets,
      rest: it.rest,
      cardio: it.cardio || null,
      rules: it.rules,
      initialWeight: it.rules.find(r => r.state === '第一次')?.weight ?? null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    tasks.push(ref.set(payload, { merge: true }));
  }
  await Promise.all(tasks);
}
