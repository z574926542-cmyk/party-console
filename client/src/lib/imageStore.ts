// ============================================================
// 奇妙奇遇控制台 - IndexedDB 图片存储工具（含 localStorage 备份）
// 主存储：IndexedDB（大容量）
// 备份：localStorage（img_ 前缀），防止 Electron file:// 环境 IndexedDB 被清空
// ============================================================

const DB_NAME = 'party-console-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const LS_PREFIX = 'img_';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

// 安全写入 localStorage（超限时静默忽略）
function lsSave(id: string, dataUrl: string) {
  try {
    localStorage.setItem(LS_PREFIX + id, dataUrl);
  } catch {
    // localStorage 超限时忽略，IndexedDB 仍是主存储
  }
}

function lsLoad(id: string): string | null {
  try {
    return localStorage.getItem(LS_PREFIX + id);
  } catch {
    return null;
  }
}

function lsDelete(id: string) {
  try {
    localStorage.removeItem(LS_PREFIX + id);
  } catch { /* ignore */ }
}

export async function saveImage(id: string, dataUrl: string): Promise<void> {
  // 同时写入 localStorage 备份
  lsSave(id, dataUrl);

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, dataUrl });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB 写入失败时，localStorage 备份已保存，不报错
  }
}

export async function loadImage(id: string): Promise<string | null> {
  // 先尝试 IndexedDB
  try {
    const db = await openDB();
    const result = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result?.dataUrl ?? null);
      req.onerror = () => reject(req.error);
    });
    if (result) {
      // IndexedDB 有数据，顺便同步到 localStorage
      lsSave(id, result);
      return result;
    }
  } catch { /* fall through */ }

  // IndexedDB 失败或无数据，从 localStorage 恢复
  const lsResult = lsLoad(id);
  if (lsResult) {
    // 恢复到 IndexedDB
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ id, dataUrl: lsResult });
    } catch { /* ignore */ }
    return lsResult;
  }

  return null;
}

export async function deleteImage(id: string): Promise<void> {
  lsDelete(id);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* ignore */ }
}

export async function loadAllImages(): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  // 先从 localStorage 加载所有备份（作为基础）
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LS_PREFIX)) {
        const id = key.slice(LS_PREFIX.length);
        const val = localStorage.getItem(key);
        if (val) result[id] = val;
      }
    }
  } catch { /* ignore */ }

  // 再用 IndexedDB 数据覆盖（IndexedDB 优先）
  try {
    const db = await openDB();
    const idbResult = await new Promise<Record<string, string>>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const map: Record<string, string> = {};
        (req.result as Array<{ id: string; dataUrl: string }>).forEach(r => {
          map[r.id] = r.dataUrl;
        });
        resolve(map);
      };
      req.onerror = () => reject(req.error);
    });
    Object.assign(result, idbResult);
    // 将 IndexedDB 数据同步到 localStorage
    Object.entries(idbResult).forEach(([id, dataUrl]) => lsSave(id, dataUrl));
  } catch { /* use localStorage fallback */ }

  return result;
}
