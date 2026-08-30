# Nihongo Step 🇯🇵

Aplikasi web untuk belajar dasar bahasa Jepang: **hiragana**, **katakana**, dan **kosakata** — lengkap dengan sistem level, kuis (pilihan ganda & menulis), pelacakan progres (XP, streak), dan pengucapan (text-to-speech).

Dibangun dengan React + Vite + Tailwind CSS.

## Fitur

- Materi Hiragana & Katakana per level, dari vokal dasar sampai yōon
- Kosakata dengan kanji, cara baca, romaji, arti, dan contoh kalimat
- Mode Latihan (pilihan ganda / menulis) dan Tes per level
- **Latihan menulis tangan** untuk hiragana & katakana: gambar huruf di kanvas (mouse/sentuh layar), diperiksa otomatis lewat perbandingan piksel dengan huruf asli — bukan cuma tebak-tebakan sendiri
- Maksimal 3x percobaan per huruf; setelah itu **panduan langkah menulis** muncul otomatis — kotak gambar huruf dengan jejak titik-titik samar (dibuat dari bentuk asli hurufnya, bukan gambar tangan) plus lingkaran bernomor di titik mulai tiap goresan, ditambah rincian teks per langkah. Panduan yang sama juga bisa dilihat lebih awal lewat tautan "Lihat cara menulis"
- Progres, XP, dan streak tersimpan otomatis (lihat "Progres bersama" di bawah)
- Pengucapan kata dalam bahasa Jepang lewat Web Speech API
- Tampilan responsif (sidebar di desktop, bottom nav di mobile)

## Progres bersama & real-time (opsional, gratis)

Secara default, progres tersimpan sendiri-sendiri di tiap browser (`localStorage`). Kalau kamu ingin progres yang **sama**, ter-update **real-time**, terlihat dari **2 perangkat berbeda** (misalnya kamu pantau progres orang lain dari HP-mu) — proyek ini sudah disiapkan untuk itu lewat **Firebase Realtime Database** (gratis, dari Google), tinggal disetel sekali. Tanpa setup ini, aplikasi tetap berjalan normal seperti biasa.

Cara kerjanya: setiap orang **masuk pakai nama bebas** (bukan Google login, tanpa kata sandi). Nama baru otomatis membuat progres baru; nama yang sudah pernah dipakai langsung membuka progres yang sama — jadi dua orang yang masuk dengan nama yang sama akan melihat & berbagi progres itu secara real-time, sementara nama yang berbeda punya progres masing-masing. Karena tidak ada kata sandi, **siapa pun yang tahu (atau melihat dari daftar) sebuah nama akun bisa bebas masuk ke akun itu** — ini memang sesuai yang diminta (bebas, bukan sistem akun yang aman), jadi jangan sebar nama akun yang ingin dijaga privasinya.

### Langkah 1 — Buat project Firebase
1. Buka [console.firebase.google.com](https://console.firebase.google.com), login dengan akun Google
2. Klik **Add project**, beri nama bebas (mis. `nihongo-step`), lanjutkan
3. Google Analytics boleh dimatikan (tidak dipakai di sini) → **Create project** → tunggu selesai → **Continue**

### Langkah 2 — Aktifkan Realtime Database
1. Di sidebar kiri, cari menu **Realtime Database** (biasanya di bawah grup **Build** atau **Databases & Storage**, tergantung tampilan console)
2. Klik **Create Database**
3. Pilih lokasi server (mis. Singapore, biar dekat dari Indonesia) → **Next**
4. Pilih mode apa saja (nanti aturannya kita timpa manual di Langkah 3) → **Enable**

### Langkah 3 — Set aturan akses jadi permanen terbuka
⚠️ Penting: kalau tadi pilih "test mode", itu **otomatis terkunci** (tidak bisa dibaca/ditulis sama sekali) setelah 30 hari. Supaya progres tidak tiba-tiba berhenti sinkron, timpa aturannya secara manual:

1. Di halaman Realtime Database, buka tab **Rules**
2. Ganti semua isinya dengan:
   ```json
   {
     "rules": {
       "nihongoStepProgress": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```
3. Klik **Publish**

### Langkah 4 — Daftarkan aplikasi web & salin konfigurasinya
1. Klik ikon gear ⚙️ di sidebar kiri atas → **Project settings**
2. Scroll ke bagian **Your apps** → klik ikon web **</>**
3. Beri nickname bebas (mis. `nihongo-step-web`) — **jangan** centang "Firebase Hosting", proyek ini di-deploy lewat GitHub Pages
4. Klik **Register app** — akan muncul blok kode berisi `apiKey`, `authDomain`, `databaseURL`, dst.

### Langkah 5 — Tempel ke proyek
Buka `src/firebaseConfig.js`, ganti baris `export const firebaseConfig = null;` dengan objek yang barusan disalin dari Firebase (contoh bentuknya sudah ada di file itu). Simpan, lalu jalankan ulang `npm run dev` / `npm run build`, atau langsung `git push` kalau sudah lewat GitHub Actions.

Nilai-nilai config ini **aman di-commit ke GitHub** — bukan rahasia; keamanan datanya diatur lewat Rules di Langkah 3, bukan dengan menyembunyikan config ini.

Saat pertama kali membuat sebuah akun (nama yang belum pernah dipakai), progres lokal perangkat itu (kalau ada) jadi titik awal akun tersebut, lalu diunggah supaya siapa pun yang masuk dengan nama yang sama ikut melihatnya.

Ada indikator kecil di pojok Dashboard yang menunjukkan status & nama akun yang aktif ("Real-time · &lt;nama&gt;" / "Mode lokal"), plus tautan **Ganti akun** untuk kembali ke layar masuk.

## Menjalankan secara lokal

Prasyarat: Node.js 18 atau lebih baru.

```bash
npm install
npm run dev
```

Lalu buka `http://localhost:5173` di browser.

## Build untuk produksi

```bash
npm run build
```

Hasilnya ada di folder `dist/`. Untuk mencoba hasil build:

```bash
npm run preview
```

## Upload ke GitHub

Setelah zip ini diekstrak:

```bash
cd nihongo-step
git init
git add .
git commit -m "Initial commit: Nihongo Step"
git branch -M main
git remote add origin https://github.com/<username>/<nama-repo>.git
git push -u origin main
```

## Deploy ke GitHub Pages

Repo ini sudah menyertakan workflow otomatis di `.github/workflows/deploy.yml`. Setelah push ke GitHub:

1. Buka repo → **Settings** → **Pages**
2. Di bagian **Build and deployment**, pilih **Source: GitHub Actions**
3. Push (atau re-run workflow) di branch `main` — situs akan otomatis live di:
   `https://<username>.github.io/<nama-repo>/`

Tidak perlu mengubah `vite.config.js` — proyek ini sudah pakai base path relatif (`base: "./"`) supaya jalan baik di root domain (mis. Vercel/Netlify) maupun di subfolder GitHub Pages.

## Struktur proyek

```
nihongo-step/
├── .github/workflows/deploy.yml   # Auto-deploy ke GitHub Pages
├── src/
│   ├── App.jsx                    # Komponen utama aplikasi
│   ├── strokeGuides.js            # Data panduan urutan goresan (46 hiragana + 46 katakana dasar,
│   │                               #   dakuten/handakuten/yōon diturunkan otomatis dari data dasar)
│   ├── firebaseConfig.js          # Konfigurasi Firebase untuk progres bersama (null = nonaktif)
│   ├── firebaseSync.js            # Logika sinkronisasi real-time (no-op kalau config kosong)
│   ├── main.jsx                   # Entry point React
│   └── index.css                  # Tailwind directives
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Catatan penyimpanan progres

Tanpa setup Firebase: progres disimpan lewat `window.storage` jika tersedia (mis. saat berjalan sebagai Claude artifact), dan otomatis jatuh ke `localStorage` browser saat di-deploy sebagai situs biasa — tidak ada setup tambahan, tapi progresnya khusus perangkat itu saja. Dengan Firebase disetel (lihat bagian "Progres bersama & real-time" di atas), `localStorage` tetap dipakai sebagai cadangan lokal, tapi Firebase Realtime Database yang jadi sumber utama & disinkron ke semua perangkat.
