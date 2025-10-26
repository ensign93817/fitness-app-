import { getDb, doc, setDoc } from "./firebase.js";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

const fileInput = document.getElementById("file");
const uploadBtn = document.getElementById("uploadBtn");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("uploadList");

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files?.[0];
  if (!file) {
    statusEl.textContent = "⚠️ 請先選擇 JSON 或 ZIP 檔案";
    return;
  }

  const db = getDb();
  listEl.innerHTML = "";
  statusEl.textContent = "⏳ 處理中...";

  try {
    let filesToUpload = [];

    // 檢查是否為 ZIP
    if (file.name.endsWith(".zip")) {
      const zip = await JSZip.loadAsync(file);
      for (const [name, zipEntry] of Object.entries(zip.files)) {
        if (name.endsWith(".json")) {
          const content = await zipEntry.async("string");
          filesToUpload.push({ name, json: JSON.parse(content) });
        }
      }
    } else if (file.name.endsWith(".json")) {
      const text = await file.text();
      filesToUpload.push({ name: file.name, json: JSON.parse(text) });
    } else {
      throw new Error("不支援的檔案格式");
    }

    // 寫入 Firestore
    let successCount = 0;
    for (const { name, json } of filesToUpload) {
      if (!json.goal || !json.bodyPart || !Array.isArray(json.exercises)) {
        listEl.innerHTML += `<li>❌ ${name}：格式錯誤</li>`;
        continue;
      }
      const key = `${json.goal}_${json.bodyPart}`;
      await setDoc(doc(db, "menus", key), json, { merge: false });
      successCount++;
      listEl.innerHTML += `<li>✅ ${key} 上傳成功 (${json.exercises.length} 筆)</li>`;
    }

    statusEl.textContent = `✅ 上傳完成，共 ${successCount} 份成功`;
  } catch (err) {
    console.error(err);
    statusEl.textContent = `❌ 上傳失敗：${err.message}`;
  }
});
