import { getDb, doc, setDoc, collection } from './firebase.js';


const fileInput = document.getElementById('file');
const uploadBtn = document.getElementById('uploadBtn');
const statusEl = document.getElementById('status');


uploadBtn.addEventListener('click', async ()=>{
const file = fileInput.files?.[0];
if(!file){ statusEl.textContent = '請先選擇 JSON 檔'; return; }
try{
const text = await file.text();
const json = JSON.parse(text);
const db = getDb();


// 支援 A（單組）或 B（扁平陣列）
if(Array.isArray(json)){
// B: flat → group by (goal, bodyPart)
const groups = new Map();
for(const row of json){
const key = `${row.goal}_${row.bodyPart}`;
if(!groups.has(key)) groups.set(key, { goal: row.goal, bodyPart: row.bodyPart, exercises: [] });
groups.get(key).exercises.push({
name: row.name,
defaultSets: Number(row.defaultSets)||null,
defaultReps: Number(row.defaultReps)||null,
restSec: Number(row.restSec)||null
});
}
for(const [key, docData] of groups){
await setDoc(doc(db,'menus', key), docData, { merge:false });
}
}else if(json && json.goal && json.bodyPart && Array.isArray(json.exercises)){
// A: grouped object
const key = `${json.goal}_${json.bodyPart}`;
await setDoc(doc(db,'menus', key), json, { merge:false });
}else{
throw new Error('JSON 格式不符合 A 或 B');
}


statusEl.textContent = '上傳完成 ✅';
}catch(err){
console.error(err);
statusEl.textContent = '上傳失敗：' + err.message;
}
});
