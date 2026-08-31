import { firebaseConfig } from "./firebaseConfig.js";

// Tiap "akun" adalah node terpisah di bawah path ini. Sengaja TANPA kata sandi & tanpa Google
// login: siapa pun yang tahu nama akunnya (atau memilihnya dari daftar) langsung masuk dan
// bisa melihat/mengubah progres itu — sesuai desain yang diminta (bebas, bukan sistem akun
// yang aman). Path-nya tetap spesifik (bukan root database) supaya Security Rules Firebase
// bisa dibatasi ke node ini saja — lihat README.md bagian setup Firebase untuk aturannya.
const USERS_PATH = "nihongoStepProgress/users";

let modulesPromise = null;

// Memuat SDK Firebase secara lazy (dynamic import) supaya tidak membebani bundle sama sekali
// kalau firebaseConfig masih `null` — jalur ini tidak akan pernah dieksekusi dalam mode lokal.
function loadFirebase() {
  if (!firebaseConfig) return Promise.resolve(null);
  if (!modulesPromise) {
    modulesPromise = Promise.all([import("firebase/app"), import("firebase/database")]).then(
      ([{ initializeApp, getApps }, dbModule]) => {
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const db = dbModule.getDatabase(app);
        return { db, ref: dbModule.ref, onValue: dbModule.onValue, set: dbModule.set };
      }
    );
  }
  return modulesPromise;
}

export function isFirebaseEnabled() {
  return !!firebaseConfig;
}

// Nama yang diketik -> key path yang aman untuk Firebase (huruf kecil, spasi jadi "-",
// karakter terlarang dibuang). Dua nama yang mirip penulisannya (mis. "Budi" & "budi")
// otomatis dianggap akun yang sama — supaya orang tidak sengaja bikin akun ganda.
export function slugifyAccountName(name) {
  return (name || "")
    .trim()
    .toLowerCase()
    .replace(/[.#$[\]/]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

// Berlangganan daftar akun yang sudah pernah dibuat (real-time) — dipakai layar masuk untuk
// menampilkan pilihan cepat tanpa harus tahu/ketik ulang nama persis.
export function subscribeAccountList(onChange) {
  if (!isFirebaseEnabled()) return () => {};
  let cancelled = false;
  let detach = () => {};
  loadFirebase()
    .then((fb) => {
      if (!fb || cancelled) return;
      const usersRef = fb.ref(fb.db, USERS_PATH);
      detach = fb.onValue(
        usersRef,
        (snapshot) => {
          const val = snapshot.val() || {};
          const list = Object.keys(val)
            .map((slug) => ({ slug, displayName: (val[slug] && val[slug].displayName) || slug }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
          onChange(list);
        },
        (error) => console.error("Gagal memuat daftar akun:", error)
      );
    })
    .catch((error) => console.error("Gagal memuat Firebase:", error));
  return () => {
    cancelled = true;
    detach();
  };
}

// Berlangganan progres real-time milik SATU akun (dikenali lewat slug-nya).
export function subscribeUserProgress(slug, onChange) {
  if (!isFirebaseEnabled() || !slug) return () => {};
  let cancelled = false;
  let detach = () => {};
  loadFirebase()
    .then((fb) => {
      if (!fb || cancelled) return;
      const userRef = fb.ref(fb.db, `${USERS_PATH}/${slug}`);
      detach = fb.onValue(
        userRef,
        (snapshot) => onChange(snapshot.val()),
        (error) => console.error("Sinkronisasi Firebase (baca) gagal:", error)
      );
    })
    .catch((error) => console.error("Gagal memuat Firebase:", error));
  return () => {
    cancelled = true;
    detach();
  };
}

// Menulis progres terbaru milik satu akun — otomatis terlihat real-time di semua perangkat
// lain yang sedang membuka akun (slug) yang sama.
export async function pushUserProgress(slug, state) {
  if (!isFirebaseEnabled() || !slug) return;
  try {
    const fb = await loadFirebase();
    if (!fb) return;
    await fb.set(fb.ref(fb.db, `${USERS_PATH}/${slug}`), state);
  } catch (error) {
    console.error("Sinkronisasi Firebase (simpan) gagal:", error);
  }
}

// Menghapus akun & seluruh progresnya secara permanen. Karena tidak ada lagi logika yang
// otomatis "mengisi ulang" dari cadangan lokal saat data kosong (lihat komentar di
// NihongoStepAppInner di App.jsx), begitu dihapus di sini akun itu benar-benar bersih —
// kalau ada yang masuk lagi dengan nama yang sama persis di kemudian hari, progresnya mulai
// dari nol, bukan progres lama yang muncul lagi.
export async function deleteAccountProgress(slug) {
  if (!isFirebaseEnabled() || !slug) return;
  try {
    const fb = await loadFirebase();
    if (!fb) return;
    await fb.set(fb.ref(fb.db, `${USERS_PATH}/${slug}`), null);
  } catch (error) {
    console.error("Gagal menghapus akun:", error);
  }
}
