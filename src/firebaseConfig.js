// =============================================================================
// KONFIGURASI FIREBASE — untuk progres bersama & real-time antara 2 orang
// =============================================================================
// Biarkan `null` (default) → aplikasi tetap jalan normal, progres cuma
// tersimpan di browser masing-masing (tidak disinkron ke perangkat lain).
//
// Untuk mengaktifkan progres bersama real-time, ikuti langkah di README.md
// bagian "Setup Firebase (progres bersama real-time)", lalu ganti `null` di
// bawah dengan objek config yang kamu dapat dari Firebase Console — bentuknya
// akan persis seperti contoh yang dikomentari di bawah ini.
//
// Nilai-nilai ini AMAN untuk ditaruh di kode / di-push ke GitHub. Config web
// Firebase memang didesain untuk terlihat publik; yang menjaga keamanan
// datanya adalah Security Rules yang kamu atur di Firebase Console, bukan
// dengan menyembunyikan nilai-nilai ini.

export const firebaseConfig = null;

/* Contoh setelah diisi (hapus /* dan *​/ di baris ini & baris paling bawah):

export const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "nihongo-step-xxxxx.firebaseapp.com",
  databaseURL: "https://nihongo-step-xxxxx-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nihongo-step-xxxxx",
  storageBucket: "nihongo-step-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
};

*/
