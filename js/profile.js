import { getDb, getLocalUID, doc, setDoc } from './firebase.js';


const form = document.getElementById('profileForm');
const statusEl = document.getElementById('saveStatus');


// 初始化：若 localStorage 有資料就填入
(function preload(){
const saved = JSON.parse(localStorage.getItem('profile')||'null');
if(saved){
for(const [k,v] of Object.entries(saved)){
const el = form.elements.namedItem(k);
if(el) el.value = v;
}
}
})();


form.addEventListener('submit', async (e)=>{
e.preventDefault();
const data = Object.fromEntries(new FormData(form).entries());
localStorage.setItem('profile', JSON.stringify(data));
statusEl.textContent = '已儲存（本機）…';
try{
const db = getDb();
const uid = getLocalUID();
await setDoc(doc(db, 'profiles', uid), data, { merge:true });
statusEl.textContent = '已儲存到雲端 ✅';
}catch(err){
console.warn('firestore save skipped / failed', err);
statusEl.textContent = '雲端未啟用或儲存失敗（僅本機）';
}
});
