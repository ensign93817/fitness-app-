import { getDb, getLocalUID, doc, getDoc, addDoc, collection, setDoc } from './firebase.js';


async function saveWorkout(){
if(!currentPlan){
els.saveStatus.textContent = '尚未載入菜單';
return;
}
const uid = getLocalUID();
const rows = Array.from(els.exerciseTableBody.querySelectorAll('tr'));
const records = rows.map((tr, i)=>{
const name = currentPlan.exercises[i]?.name ?? `EX${i+1}`;
const sets = Number(tr.querySelector('.rec-sets').value||0);
const reps = Number(tr.querySelector('.rec-reps').value||0);
const weight = Number(tr.querySelector('.rec-weight').value||0);
return { name, sets, reps, weight };
});


const payload = {
dateISO: new Date().toISOString(),
goal: currentPlan.goal,
bodyPart: currentPlan.bodyPart,
exercises: records
};


try{
const db = getDb();
const ref = await addDoc(collection(db, 'workouts', uid, 'sessions'), payload);
savedSessionId = ref.id;
els.saveStatus.textContent = '已儲存訓練紀錄 ✅';
els.feedbackArea.style.display = 'block';
}catch(err){
console.warn(err);
els.saveStatus.textContent = '雲端未啟用或儲存失敗（仍可截圖留存）';
}
}


async function submitFeedback(){
if(!savedSessionId){
els.fbStatus.textContent = '請先儲存訓練紀錄';
return;
}
const fb = els.feedback.value.trim();
if(!fb){ els.fbStatus.textContent = '請選擇回饋'; return; }
try{
const db = getDb();
const uid = getLocalUID();
await setDoc(doc(db,'workouts',uid,'sessions',savedSessionId), { feedback: fb }, { merge:true });
els.fbStatus.textContent = '已提交 ✅';
}catch(err){
console.warn(err);
els.fbStatus.textContent = '提交失敗（可稍後再試）';
}
}
