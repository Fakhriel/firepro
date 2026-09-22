// Antrian offline untuk form yang gagal terkirim karena tidak ada sinyal.
//
// SENGAJA foreground-only (bukan Background Sync API lewat service worker):
// sinkronisasi cuma jalan saat tab aplikasi terbuka & online (saat halaman
// dimuat, atau saat event "online" nyala). Ini pilihan sadar, bukan
// keterbatasan — background sync lewat SW butuh token auth bisa dibaca
// service worker, yang berarti token harus keluar dari sessionStorage.
// Dengan foreground-only, adminApiFetch() tetap baca token dari
// sessionStorage seperti biasa persis pada saat sync jalan (tab pasti
// terbuka), jadi tidak ada perubahan sama sekali ke cara token disimpan.
//
// Konsekuensinya: kalau field worker menutup total tab/browser saat masih
// offline, sync BARU jalan lagi waktu mereka buka ulang aplikasi (dan kalau
// sessionStorage sudah kosong, mereka perlu login ulang dulu — item yang
// diantre tetap aman di IndexedDB, nunggu sampai ada sesi aktif lagi).

const DB_NAME = "firepro-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-requests";

export interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  body: string | null;
  label: string; // deskripsi singkat buat ditampilkan ke user, mis. "Daily report — Proyek X"
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueRequest(entry: Omit<QueuedRequest, "id" | "createdAt">): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add({ ...entry, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listQueued(): Promise<QueuedRequest[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as QueuedRequest[]);
    req.onerror = () => reject(req.error);
  });
}

async function removeQueued(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedCount(): Promise<number> {
  return (await listQueued()).length;
}

/**
 * Kirim satu request lewat adminApiFetch. Kalau network-level gagal
 * (`TypeError: Failed to fetch` — beneran offline, bukan error HTTP dari
 * server), request diantre ke IndexedDB dan fungsi ini mengembalikan
 * `{ queued: true }` alih-alih melempar error, supaya pemanggil bisa
 * kasih tau user "tersimpan offline" bukan "gagal".
 */
export async function submitWithOfflineFallback(
  adminApiFetch: (url: string, options?: RequestInit) => Promise<Response>,
  url: string,
  options: RequestInit,
  label: string
): Promise<{ queued: boolean; response?: Response }> {
  try {
    const response = await adminApiFetch(url, options);
    return { queued: false, response };
  } catch (err) {
    // fetch() sendiri yang gagal (bukan response non-2xx) → asumsikan offline.
    await queueRequest({
      url,
      method: options.method ?? "POST",
      body: typeof options.body === "string" ? options.body : null,
      label,
    });
    return { queued: true };
  }
}

/**
 * Coba kirim ulang semua item yang diantre, satu per satu, sesuai urutan
 * masuk. Dipanggil saat halaman dimuat & saat event "online" — bukan
 * dipanggil manual oleh tiap halaman satu-satu.
 */
export async function syncQueue(
  adminApiFetch: (url: string, options?: RequestInit) => Promise<Response>,
  onItemSynced?: (label: string) => void
): Promise<{ synced: number; stillPending: number }> {
  const items = await listQueued();
  let synced = 0;

  for (const item of items) {
    try {
      const res = await adminApiFetch(item.url, {
        method: item.method,
        body: item.body ?? undefined,
      });
      if (res.ok) {
        await removeQueued(item.id as number);
        synced += 1;
        onItemSynced?.(item.label);
      }
      // Kalau response-nya error HTTP (mis. 400 validasi), item SENGAJA
      // dibiarkan di antrean — bukan dihapus — supaya tidak diam-diam
      // kehilangan data field worker. Perlu dicek manual lewat badge.
    } catch {
      // Masih offline — stop coba yang berikutnya juga, urutan tetap terjaga.
      break;
    }
  }

  const remaining = await getQueuedCount();
  return { synced, stillPending: remaining };
}

/**
 * Pasang indikator kecil (pojok bawah) yang menunjukkan berapa perubahan
 * masih menunggu sinkronisasi, dan otomatis coba sync saat halaman dimuat
 * & saat koneksi kembali online. Dipanggil sekali per halaman dari
 * SupervisorLayout/EmployeeLayout — sama seperti startIdleWatcher().
 */
export function mountOfflineIndicator(
  adminApiFetch: (url: string, options?: RequestInit) => Promise<Response>
): void {
  if (typeof window === "undefined") return;

  let badge = document.getElementById("offline-sync-badge");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "offline-sync-badge";
    badge.className =
      "fixed bottom-4 right-4 z-[60] hidden items-center gap-2 border-2 border-ink bg-surface px-3 py-2 font-mono text-[11px] text-ink shadow-[3px_3px_0_0_var(--color-ink)]";
    badge.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" class="w-3.5 h-3.5 shrink-0" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <span id="offline-sync-badge-text"></span>
    `;
    document.body.appendChild(badge);
  }

  async function refresh(): Promise<void> {
    const count = await getQueuedCount();
    const textEl = document.getElementById("offline-sync-badge-text");
    if (count > 0) {
      if (textEl) textEl.textContent = `${count} perubahan menunggu sinkronisasi`;
      badge?.classList.remove("hidden");
      badge?.classList.add("flex");
    } else {
      badge?.classList.add("hidden");
      badge?.classList.remove("flex");
    }
  }

  async function trySync(): Promise<void> {
    if (!navigator.onLine) return;
    const { synced } = await syncQueue(adminApiFetch, (label) => {
      window.showToast?.(`Tersinkron: ${label}`, "success");
    });
    if (synced > 0) await refresh();
  }

  refresh();
  trySync();
  window.addEventListener("online", trySync);
  // Cek berkala juga (tiap 60 detik) selagi tab terbuka — jaga-jaga kalau
  // event "online" browser tidak konsisten terpicu di semua device.
  window.setInterval(trySync, 60_000);
}
