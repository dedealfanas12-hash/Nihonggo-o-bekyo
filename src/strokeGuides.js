/* =========================================================================
   PANDUAN URUTAN GORESAN (stroke order) — Hiragana & Katakana dasar
   =========================================================================
   Ditulis ulang dengan kata-kata sendiri dalam Bahasa Indonesia, berdasarkan
   aturan umum urutan goresan Jepang yang berlaku hampir di semua karakter:
     1) kiri → kanan
     2) atas → bawah
     3) goresan mendatar yang disilang goresan tegak ditulis lebih dulu
     4) bagian tengah sebelum sisi kanan/kiri yang simetris
     5) goresan yang "menutup" bentuk ditulis paling akhir
   Hanya mencakup 46 hiragana dasar + 46 katakana dasar. Karakter dakuten
   (゛), handakuten (゜), dan yōon (kombinasi kecil ゃゅょ/ャュョ) diturunkan
   otomatis dari data dasar ini lewat getStrokeGuide() di bawah — supaya
   datanya tidak perlu ditulis ulang untuk tiap variasi.

   `points`: posisi kira-kira (0-1, relatif ke kotak huruf) tempat tiap
   goresan DIMULAI, urut sesuai goresan — dipakai untuk menggambar lingkaran
   bernomor di atas gambar huruf. Sudah dicek visual terhadap render font
   asli (bukan tebakan mentah), tapi tetap perkiraan, bukan presisi kaligrafi.
   ========================================================================= */

export const STROKE_GUIDES = {
  /* ---------- Hiragana dasar ---------- */
  "あ": { strokes: 3, steps: [
    "Goresan mendatar pendek di bagian atas.",
    "Goresan panjang melengkung turun ke kanan-bawah, mulai dari ujung goresan pertama.",
    "Lengkungan kecil di sisi kiri-bawah, terpisah dari dua goresan sebelumnya.",
  ], points: [[0.15,0.12], [0.55,0.22], [0.22,0.62]] },
  "い": { strokes: 2, steps: [
    "Goresan melengkung pendek di kiri, dari atas ke bawah.",
    "Goresan melengkung lebih panjang di kanan, sejajar dengan goresan pertama.",
  ], points: [[0.32,0.35], [0.62,0.3]] },
  "う": { strokes: 2, steps: [
    "Goresan kecil miring di bagian atas.",
    "Goresan utama melengkung besar dari kiri-atas, turun ke kanan lalu membelok ke kiri-bawah.",
  ], points: [[0.55,0.1], [0.3,0.4]] },
  "え": { strokes: 2, steps: [
    "Goresan mendatar di bagian atas.",
    "Goresan dari tengah yang menyilang, melengkung turun lalu menyapu ke kanan-bawah.",
  ], points: [[0.3,0.22], [0.5,0.4]] },
  "お": { strokes: 3, steps: [
    "Goresan mendatar.",
    "Goresan tegak yang menyilang goresan pertama, turun ke bawah.",
    "Lengkungan kecil terpisah di kanan sebagai sentuhan akhir.",
  ], points: [[0.15,0.15], [0.55,0.2], [0.72,0.55]] },
  "か": { strokes: 3, steps: [
    "Goresan mendatar pendek di atas.",
    "Goresan diagonal panjang dari kiri-atas turun ke kanan-bawah.",
    "Goresan lengkung pendek di kanan-bawah, terpisah dari dua goresan sebelumnya.",
  ], points: [[0.15,0.15], [0.6,0.15], [0.62,0.68]] },
  "き": { strokes: 4, steps: [
    "Goresan mendatar pertama (pendek).",
    "Goresan mendatar kedua (lebih panjang) di bawahnya.",
    "Goresan melengkung yang menyilang kedua goresan mendatar itu.",
    "Goresan tegak pendek, terpisah, di bagian bawah — jangan disambung ke goresan ketiga.",
  ], points: [[0.25,0.1], [0.15,0.35], [0.55,0.45], [0.4,0.8]] },
  "く": { strokes: 1, steps: [
    "Satu goresan menyudut: dari kiri-atas menyerong turun ke kanan, lalu berbelok tajam menyerong ke kiri-bawah — seperti membuat sudut lancip.",
  ], points: [[0.35,0.2]] },
  "け": { strokes: 3, steps: [
    "Goresan tegak pendek di kiri.",
    "Goresan mendatar yang menyambung dari kanan.",
    "Goresan pendek di kanan-bawah sebagai penutup.",
  ], points: [[0.25,0.25], [0.4,0.35], [0.65,0.6]] },
  "こ": { strokes: 2, steps: [
    "Goresan mendatar di atas.",
    "Goresan melengkung di bawah, sejajar dengan goresan pertama.",
  ], points: [[0.25,0.25], [0.25,0.62]] },
  "さ": { strokes: 3, steps: [
    "Goresan mendatar pendek pertama.",
    "Goresan mendatar kedua di bawahnya.",
    "Goresan melengkung panjang yang menyilang kedua goresan mendatar, dari atas turun lalu melengkung ke kiri.",
  ], points: [[0.15,0.12], [0.15,0.4], [0.45,0.5]] },
  "し": { strokes: 1, steps: [
    "Satu goresan tegak dari atas turun ke bawah, lalu melengkung ke kanan di ujung bawah.",
  ], points: [[0.55,0.15]] },
  "す": { strokes: 2, steps: [
    "Goresan menyilang pendek di atas, seperti tanda plus kecil.",
    "Goresan melengkung besar di bawahnya, melingkar dan berakhir dengan sedikit ekor.",
  ], points: [[0.3,0.15], [0.35,0.4]] },
  "せ": { strokes: 3, steps: [
    "Goresan mendatar.",
    "Goresan tegak yang menyilang goresan pertama.",
    "Goresan mendatar di bagian bawah.",
  ], points: [[0.15,0.15], [0.5,0.22], [0.3,0.68]] },
  "そ": { strokes: 2, steps: [
    "Lengkungan kecil di bagian atas.",
    "Goresan melingkar panjang yang menyambung dari lengkungan pertama hingga ke bawah.",
  ], points: [[0.3,0.15], [0.35,0.35]] },
  "た": { strokes: 4, steps: [
    "Goresan mendatar pendek.",
    "Goresan diagonal panjang yang menyilang goresan pertama.",
    "Goresan mendatar pendek kedua yang memotong goresan diagonal.",
    "Goresan tegak pendek di kanan-bawah sebagai penutup.",
  ], points: [[0.15,0.15], [0.55,0.2], [0.35,0.5], [0.7,0.68]] },
  "ち": { strokes: 3, steps: [
    "Goresan mendatar di atas.",
    "Goresan diagonal pendek di bawahnya.",
    "Lengkungan besar yang menyambung dan melingkar ke kiri-bawah.",
  ], points: [[0.25,0.2], [0.3,0.35], [0.4,0.5]] },
  "つ": { strokes: 1, steps: [
    "Satu goresan melengkung dari kiri ke kanan seperti kurva senyum terbalik, dimulai agak dari atas.",
  ], points: [[0.25,0.35]] },
  "て": { strokes: 2, steps: [
    "Lengkungan kecil di bagian atas.",
    "Goresan panjang menyambung yang menyapu turun ke bawah, lalu membelok dengan kait kecil ke kiri.",
  ], points: [[0.35,0.15], [0.4,0.3]] },
  "と": { strokes: 2, steps: [
    "Goresan mendatar pendek di atas.",
    "Goresan tegak melengkung yang menyambung, turun ke bawah dengan kait kecil di ujung.",
  ], points: [[0.25,0.22], [0.4,0.35]] },
  "な": { strokes: 4, steps: [
    "Goresan mendatar.",
    "Goresan tegak yang menyilang goresan pertama.",
    "Goresan diagonal pendek di kanan.",
    "Lengkungan kecil terpisah sebagai penutup di kanan-bawah.",
  ], points: [[0.12,0.15], [0.5,0.2], [0.65,0.35], [0.7,0.6]] },
  "に": { strokes: 3, steps: [
    "Goresan pendek tegak-miring di kiri-atas.",
    "Goresan mendatar pertama yang menyambung ke kanan.",
    "Goresan pendek kedua di kanan-bawah.",
  ], points: [[0.2,0.15], [0.25,0.45], [0.65,0.65]] },
  "ぬ": { strokes: 3, steps: [
    "Goresan melengkung di kiri, dari atas turun sedikit ke kanan.",
    "Goresan melengkung ke kanan yang menyilang goresan pertama.",
    "Lanjutan goresan itu melingkar dan keluar membentuk ekor kecil di kanan-bawah (lingkarannya TERBUKA keluar — beda dari め yang menutup ke dalam).",
  ], points: [[0.25,0.2], [0.45,0.42], [0.6,0.65]] },
  "ね": { strokes: 4, steps: [
    "Goresan mendatar.",
    "Goresan tegak yang menyilang goresan pertama.",
    "Goresan melengkung yang menyambung turun ke kanan.",
    "Lingkaran kecil dengan ekor keluar di ujung kanan-bawah.",
  ], points: [[0.12,0.15], [0.5,0.2], [0.5,0.45], [0.68,0.68]] },
  "の": { strokes: 1, steps: [
    "Satu goresan melingkar panjang, dimulai dari atas, berputar turun membentuk huruf yang ujungnya terbuka.",
  ], points: [[0.4,0.2]] },
  "は": { strokes: 3, steps: [
    "Goresan tegak di kiri.",
    "Goresan mendatar pendek yang menyambung ke kanan.",
    "Goresan melengkung di kanan, turun lalu sedikit membuka di bawah — hanya 2 bagian di sisi kanan.",
  ], points: [[0.25,0.2], [0.3,0.42], [0.62,0.42]] },
  "ひ": { strokes: 2, steps: [
    "Goresan melengkung pendek di kiri, dari atas ke bawah.",
    "Goresan diagonal di kanan yang menyambung dan melengkung masuk ke dalam di ujung bawah.",
  ], points: [[0.35,0.25], [0.55,0.35]] },
  "ふ": { strokes: 4, steps: [
    "Goresan kecil di atas seperti topi/atap.",
    "Goresan menyapu pertama di bawahnya.",
    "Goresan menyapu kedua.",
    "Goresan menyapu ketiga — tiga goresan menyapu ini bertumpuk dan mengecil ke bawah.",
  ], points: [[0.5,0.05], [0.28,0.3], [0.5,0.48], [0.35,0.72]] },
  "へ": { strokes: 1, steps: [
    "Satu goresan berbentuk gunung: naik dari kiri lalu turun ke kanan, seperti huruf V terbalik — karakter paling sederhana.",
  ], points: [[0.5,0.35]] },
  "ほ": { strokes: 4, steps: [
    "Goresan tegak di kiri (seperti は).",
    "Goresan mendatar pendek yang menyambung ke kanan.",
    "Goresan melengkung pertama di kanan.",
    "Satu lengkungan kecil TAMBAHAN di kanan, sehingga ada 3 bagian di sisi kanan (bukan 2 seperti は).",
  ], points: [[0.22,0.2], [0.28,0.42], [0.62,0.4], [0.65,0.55]] },
  "ま": { strokes: 3, steps: [
    "Goresan mendatar pendek pertama.",
    "Goresan mendatar kedua yang lebih panjang.",
    "Goresan melengkung yang menyilang keduanya, turun lalu melingkar ke kanan-bawah.",
  ], points: [[0.15,0.15], [0.2,0.4], [0.55,0.45]] },
  "み": { strokes: 2, steps: [
    "Lengkungan kecil di bagian atas.",
    "Goresan panjang menyapu yang menyambung dan melengkung turun membentuk badan huruf.",
  ], points: [[0.35,0.15], [0.4,0.35]] },
  "む": { strokes: 3, steps: [
    "Goresan pendek diagonal di atas.",
    "Goresan melengkung besar membentuk badan utama huruf.",
    "Goresan pendek tambahan di kanan-atas sebagai sentuhan akhir.",
  ], points: [[0.15,0.12], [0.45,0.3], [0.7,0.25]] },
  "め": { strokes: 2, steps: [
    "Goresan melengkung di kiri, dari atas turun.",
    "Goresan di kanan yang menyilang goresan pertama lalu melingkar dan MENUTUP ke dalam (beda dari ぬ yang lingkarannya terbuka keluar).",
  ], points: [[0.3,0.25], [0.55,0.35]] },
  "も": { strokes: 3, steps: [
    "Goresan mendatar pendek pertama.",
    "Goresan mendatar kedua yang lebih panjang, dengan goresan tegak menyambung turun dari tengahnya.",
    "Goresan mendatar di bagian bawah sebagai penutup.",
  ], points: [[0.15,0.15], [0.2,0.42], [0.35,0.7]] },
  "や": { strokes: 3, steps: [
    "Goresan diagonal pendek di kiri.",
    "Goresan di kanan-atas yang menyambung.",
    "Goresan mendatar/melengkung di bagian bawah sebagai penutup.",
  ], points: [[0.28,0.25], [0.55,0.2], [0.45,0.68]] },
  "ゆ": { strokes: 3, steps: [
    "Goresan melengkung di kiri.",
    "Cabang goresan di kanan-atas.",
    "Goresan mendatar/melengkung di bagian bawah yang menyatukan semuanya.",
  ], points: [[0.22,0.35], [0.58,0.18], [0.45,0.68]] },
  "よ": { strokes: 2, steps: [
    "Goresan mendatar di atas.",
    "Goresan melengkung besar di bawahnya yang menyambung membentuk badan huruf.",
  ], points: [[0.3,0.2], [0.35,0.4]] },
  "ら": { strokes: 2, steps: [
    "Lengkungan kecil di bagian atas.",
    "Goresan melingkar utama di bawahnya yang berakhir dengan sedikit ekor.",
  ], points: [[0.2,0.12], [0.5,0.3]] },
  "り": { strokes: 2, steps: [
    "Goresan tegak pendek di kiri dengan sedikit kait.",
    "Goresan tegak lebih panjang di kanan, lurus ke bawah.",
  ], points: [[0.35,0.25], [0.6,0.25]] },
  "る": { strokes: 2, steps: [
    "Goresan pendek di bagian atas.",
    "Goresan melingkar utama yang MENUTUP rapat di bagian bawah (beda dari ろ yang ujungnya terbuka).",
  ], points: [[0.35,0.2], [0.4,0.4]] },
  "れ": { strokes: 3, steps: [
    "Goresan tegak di kiri.",
    "Goresan yang menyambung ke kanan.",
    "Goresan melengkung dengan ujung yang mengarah ke kiri sebagai penutup.",
  ], points: [[0.25,0.2], [0.4,0.3], [0.55,0.55]] },
  "ろ": { strokes: 2, steps: [
    "Goresan pendek di bagian atas.",
    "Goresan melingkar utama yang berakhir TERBUKA di bagian bawah (beda dari る yang menutup rapat).",
  ], points: [[0.35,0.2], [0.4,0.4]] },
  "わ": { strokes: 2, steps: [
    "Goresan tegak di kiri.",
    "Goresan melengkung di kanan yang menyambung turun — mirip れ tapi lebih sederhana.",
  ], points: [[0.25,0.25], [0.5,0.3]] },
  "を": { strokes: 3, steps: [
    "Goresan mendatar pertama.",
    "Goresan mendatar kedua di bawahnya.",
    "Goresan melengkung panjang yang menyapu dari atas turun melingkar ke bawah.",
  ], points: [[0.15,0.15], [0.15,0.42], [0.45,0.5]] },
  "ん": { strokes: 1, steps: [
    "Satu goresan menyapu: mulai dari kanan-atas, melengkung ke kiri-bawah, lalu naik kembali membentuk kait kecil di kanan-atas.",
  ], points: [[0.65,0.25]] },

  /* ---------- Katakana dasar ---------- */
  "ア": { strokes: 2, steps: [
    "Goresan diagonal pendek dari kiri-atas ke kanan-bawah.",
    "Goresan lebih panjang yang menyilang goresan pertama, melengkung turun ke kiri.",
  ], points: [[0.2,0.15], [0.6,0.28]] },
  "イ": { strokes: 2, steps: [
    "Goresan diagonal pendek dari kanan-atas ke kiri-bawah.",
    "Goresan tegak lebih panjang, lurus turun, sedikit melengkung di ujung bawah.",
  ], points: [[0.55,0.2], [0.4,0.32]] },
  "ウ": { strokes: 3, steps: [
    "Goresan mendatar pendek di atas.",
    "Goresan melengkung dari tengah yang mengait ke kiri.",
    "Goresan pendek penutup di bagian bawah.",
  ], points: [[0.35,0.12], [0.55,0.35], [0.45,0.68]] },
  "エ": { strokes: 3, steps: [
    "Goresan mendatar di atas.",
    "Goresan tegak di tengah.",
    "Goresan mendatar di bawah, sedikit lebih panjang dari goresan pertama.",
  ], points: [[0.3,0.2], [0.5,0.45], [0.3,0.72]] },
  "オ": { strokes: 3, steps: [
    "Goresan mendatar.",
    "Goresan tegak yang menyilang goresan pertama.",
    "Goresan diagonal dari tengah-atas menyapu turun ke kanan.",
  ], points: [[0.3,0.22], [0.5,0.3], [0.62,0.52]] },
  "カ": { strokes: 2, steps: [
    "Goresan mendatar.",
    "Goresan tegak yang menyilang goresan pertama, dengan sedikit kait di kanan-bawah.",
  ], points: [[0.15,0.2], [0.6,0.25]] },
  "キ": { strokes: 3, steps: [
    "Goresan mendatar pendek di atas.",
    "Goresan mendatar lebih panjang di tengah.",
    "Goresan tegak yang menyilang kedua goresan mendatar itu.",
  ], points: [[0.3,0.15], [0.15,0.38], [0.55,0.55]] },
  "ク": { strokes: 2, steps: [
    "Goresan diagonal pendek dari kiri-atas.",
    "Goresan lebih panjang yang melengkung turun dari atas lalu menyapu ke kanan.",
  ], points: [[0.3,0.2], [0.45,0.35]] },
  "ケ": { strokes: 3, steps: [
    "Goresan tegak.",
    "Goresan mendatar yang menyilang dari kanan.",
    "Goresan diagonal pendek turun dari titik pertemuan keduanya.",
  ], points: [[0.2,0.18], [0.6,0.3], [0.55,0.55]] },
  "コ": { strokes: 2, steps: [
    "Goresan mendatar di atas.",
    "Goresan tegak turun dari ujung kanan, lalu berbelok ke kiri membentuk bagian bawah.",
  ], points: [[0.28,0.22], [0.65,0.28]] },
  "サ": { strokes: 3, steps: [
    "Goresan mendatar pendek pertama.",
    "Goresan mendatar pendek kedua di bawahnya.",
    "Goresan tegak panjang yang menyilang keduanya, dengan kait di kanan-bawah.",
  ], points: [[0.3,0.15], [0.15,0.38], [0.6,0.5]] },
  "シ": { strokes: 3, steps: [
    "Goresan pendek pertama di kiri.",
    "Goresan pendek kedua di kanannya, posisinya berdampingan mendatar.",
    "Goresan panjang menyapu dari kiri-atas melengkung ke kanan-bawah.",
  ], points: [[0.15,0.25], [0.55,0.22], [0.35,0.5]] },
  "ス": { strokes: 2, steps: [
    "Goresan mendatar pendek di atas.",
    "Goresan melengkung di bawahnya, melingkar ke kiri lalu menyapu kembali ke kanan.",
  ], points: [[0.2,0.15], [0.45,0.42]] },
  "セ": { strokes: 2, steps: [
    "Goresan mendatar.",
    "Goresan yang turun dari sisi kiri goresan pertama, lalu menyudut ke kanan dan melengkung naik di ujungnya.",
  ], points: [[0.3,0.22], [0.35,0.4]] },
  "ソ": { strokes: 2, steps: [
    "Dua goresan diagonal pendek yang mengarah turun ke kanan (ditulis sebagai gerakan terpisah).",
    "Goresan panjang melengkung menyapu ke kanan-bawah sebagai penutup.",
  ], points: [[0.35,0.2], [0.5,0.4]] },
  "タ": { strokes: 3, steps: [
    "Goresan diagonal pertama.",
    "Goresan diagonal lebih panjang yang menyilang di bawahnya.",
    "Goresan melengkung dari kanan-atas menyapu turun.",
  ], points: [[0.25,0.15], [0.45,0.3], [0.62,0.45]] },
  "チ": { strokes: 3, steps: [
    "Goresan mendatar pertama.",
    "Goresan mendatar kedua di bawahnya.",
    "Goresan tegak yang menyilang keduanya, melengkung di ujung bawah.",
  ], points: [[0.3,0.15], [0.15,0.38], [0.55,0.5]] },
  "ツ": { strokes: 3, steps: [
    "Goresan pendek pertama, arah tegak, di kiri-atas.",
    "Goresan pendek kedua di bawahnya, posisinya berdampingan tegak.",
    "Goresan diagonal panjang dari kanan-atas menyapu turun lebih curam.",
  ], points: [[0.25,0.2], [0.4,0.32], [0.62,0.32]] },
  "テ": { strokes: 3, steps: [
    "Goresan mendatar.",
    "Goresan tegak turun dari tengah.",
    "Goresan pendek menyudut yang menyilang goresan tegak.",
  ], points: [[0.2,0.15], [0.58,0.32], [0.4,0.55]] },
  "ト": { strokes: 2, steps: [
    "Goresan tegak.",
    "Goresan mendatar pendek yang menonjol ke kanan dari bagian bawah goresan tegak.",
  ], points: [[0.35,0.2], [0.45,0.55]] },
  "ナ": { strokes: 2, steps: [
    "Goresan mendatar.",
    "Goresan tegak yang menyilangnya, dengan sedikit kait ke kanan di bagian bawah.",
  ], points: [[0.3,0.25], [0.55,0.28]] },
  "ニ": { strokes: 2, steps: [
    "Goresan mendatar pendek di atas.",
    "Goresan mendatar lebih panjang di bawahnya.",
  ], points: [[0.3,0.25], [0.3,0.55]] },
  "ヌ": { strokes: 2, steps: [
    "Goresan mendatar/diagonal.",
    "Goresan melengkung yang menyilang goresan pertama, melingkar dan menyapu ke bawah.",
  ], points: [[0.3,0.25], [0.5,0.35]] },
  "ネ": { strokes: 4, steps: [
    "Goresan mendatar.",
    "Goresan tegak yang menyilangnya.",
    "Goresan diagonal pendek ke kiri-bawah.",
    "Goresan diagonal pendek ke kanan-bawah.",
  ], points: [[0.3,0.15], [0.5,0.4], [0.2,0.6], [0.7,0.6]] },
  "ノ": { strokes: 1, steps: [
    "Satu goresan diagonal panjang dari kiri-atas menyapu ke kanan-bawah, sedikit melengkung di ujungnya.",
  ], points: [[0.55,0.2]] },
  "ハ": { strokes: 2, steps: [
    "Goresan diagonal condong ke kiri.",
    "Goresan diagonal condong ke kanan, sedikit lebih panjang, membentuk huruf V terbuka.",
  ], points: [[0.3,0.22], [0.65,0.22]] },
  "ヒ": { strokes: 2, steps: [
    "Goresan tegak.",
    "Goresan mendatar yang menyambung di bagian atas lalu turun membentuk goresan kedua di bawah.",
  ], points: [[0.2,0.15], [0.4,0.5]] },
  "フ": { strokes: 1, steps: [
    "Satu goresan menyapu: mendatar di bagian atas, lalu melengkung turun dan menyapu ke kiri.",
  ], points: [[0.3,0.22]] },
  "ヘ": { strokes: 1, steps: [
    "Satu goresan menyudut ke atas seperti huruf V terbalik, ditulis dalam satu gerakan halus.",
  ], points: [[0.5,0.35]] },
  "ホ": { strokes: 4, steps: [
    "Goresan mendatar.",
    "Goresan tegak yang menyilangnya.",
    "Goresan diagonal pendek ke kiri.",
    "Goresan diagonal pendek ke kanan.",
  ], points: [[0.3,0.15], [0.5,0.35], [0.25,0.52], [0.68,0.52]] },
  "マ": { strokes: 2, steps: [
    "Goresan mendatar.",
    "Goresan diagonal yang turun dari ujung kanan lalu menyapu ke kiri-bawah.",
  ], points: [[0.3,0.22], [0.55,0.3]] },
  "ミ": { strokes: 3, steps: [
    "Goresan mendatar pendek (atas).",
    "Goresan mendatar sedang (tengah).",
    "Goresan mendatar lebih panjang (bawah) — tiga goresan bertumpuk, makin panjang ke bawah.",
  ], points: [[0.35,0.1], [0.35,0.42], [0.35,0.78]] },
  "ム": { strokes: 2, steps: [
    "Goresan pendek menyudut di bagian atas.",
    "Goresan melengkung yang menyapu dari kiri-atas turun lalu melingkar kembali ke kanan.",
  ], points: [[0.4,0.2], [0.35,0.35]] },
  "メ": { strokes: 2, steps: [
    "Goresan diagonal dari kiri-atas.",
    "Goresan diagonal menyilang dari kanan-atas, dengan kait ke kiri di ujung bawah.",
  ], points: [[0.3,0.2], [0.55,0.2]] },
  "モ": { strokes: 3, steps: [
    "Goresan mendatar pendek pertama.",
    "Goresan mendatar lebih panjang di bawahnya, dengan goresan tegak menyambung turun.",
    "Goresan mendatar di bagian bawah sebagai penutup.",
  ], points: [[0.2,0.15], [0.2,0.42], [0.3,0.7]] },
  "ヤ": { strokes: 2, steps: [
    "Goresan diagonal pendek ke kiri.",
    "Goresan lebih panjang ke kanan yang menyambung lalu melengkung masuk dan menyapu ke kanan-bawah.",
  ], points: [[0.3,0.22], [0.55,0.25]] },
  "ユ": { strokes: 2, steps: [
    "Goresan pendek di kanan-atas (mendatar dan tegak menyatu).",
    "Goresan mendatar panjang di bagian bawah yang menyambungnya.",
  ], points: [[0.55,0.2], [0.3,0.55]] },
  "ヨ": { strokes: 3, steps: [
    "Goresan mendatar di atas.",
    "Goresan tegak di kanan dengan goresan mendatar tengah yang menyambung.",
    "Goresan mendatar di bagian bawah.",
  ], points: [[0.22,0.15], [0.55,0.32], [0.3,0.68]] },
  "ラ": { strokes: 2, steps: [
    "Goresan mendatar.",
    "Goresan yang turun dari tengah, melengkung ke kiri lalu menyapu keluar ke kanan-bawah.",
  ], points: [[0.3,0.2], [0.45,0.35]] },
  "リ": { strokes: 2, steps: [
    "Goresan tegak pendek dengan kait ke kanan di atas.",
    "Goresan tegak lebih panjang dan lurus di sebelah kanannya.",
  ], points: [[0.35,0.25], [0.6,0.25]] },
  "ル": { strokes: 2, steps: [
    "Goresan tegak pendek.",
    "Goresan yang menyudut ke kanan lalu melengkung kembali ke kiri dan menyapu ke kanan di bagian bawah.",
  ], points: [[0.35,0.25], [0.55,0.35]] },
  "レ": { strokes: 1, steps: [
    "Satu goresan: turun lurus lalu berbelok ke kanan dan melengkung naik sedikit di ujungnya.",
  ], points: [[0.5,0.2]] },
  "ロ": { strokes: 3, steps: [
    "Goresan mendatar di atas.",
    "Goresan tegak di sisi kiri.",
    "Goresan yang membentuk sisi kanan dan bawah, menyambung kembali ke titik awal.",
  ], points: [[0.28,0.22], [0.2,0.35], [0.65,0.4]] },
  "ワ": { strokes: 2, steps: [
    "Goresan mendatar.",
    "Goresan tegak turun dari ujung kanan, melengkung ke kiri di bagian bawah.",
  ], points: [[0.3,0.22], [0.55,0.3]] },
  "ヲ": { strokes: 3, steps: [
    "Goresan mendatar di atas.",
    "Goresan mendatar pendek kedua di bawah dan agak ke kanan.",
    "Goresan menyapu yang turun dari area atas melintasi keduanya.",
  ], points: [[0.28,0.15], [0.2,0.42], [0.6,0.52]] },
  "ン": { strokes: 2, steps: [
    "Goresan diagonal pendek ke kanan-bawah.",
    "Goresan lebih panjang yang melengkung dari kiri, masuk ke dalam, dan mengait ke kiri-atas di ujungnya (kebalikan arah dari ソ).",
  ], points: [[0.2,0.2], [0.55,0.4]] },
};
/* ---------- Peta turunan: dakuten (゛) / handakuten (゜) / yōon kecil ---------- */

export const DAKUTEN_BASE = {
  "が": "か", "ぎ": "き", "ぐ": "く", "げ": "け", "ご": "こ",
  "ざ": "さ", "じ": "し", "ず": "す", "ぜ": "せ", "ぞ": "そ",
  "だ": "た", "ぢ": "ち", "づ": "つ", "で": "て", "ど": "と",
  "ば": "は", "び": "ひ", "ぶ": "ふ", "べ": "へ", "ぼ": "ほ",
  "ガ": "カ", "ギ": "キ", "グ": "ク", "ゲ": "ケ", "ゴ": "コ",
  "ザ": "サ", "ジ": "シ", "ズ": "ス", "ゼ": "セ", "ゾ": "ソ",
  "ダ": "タ", "ヂ": "チ", "ヅ": "ツ", "デ": "テ", "ド": "ト",
  "バ": "ハ", "ビ": "ヒ", "ブ": "フ", "ベ": "ヘ", "ボ": "ホ",
};

export const HANDAKUTEN_BASE = {
  "ぱ": "は", "ぴ": "ひ", "ぷ": "ふ", "ぺ": "へ", "ぽ": "ほ",
  "パ": "ハ", "ピ": "ヒ", "プ": "フ", "ペ": "ヘ", "ポ": "ホ",
};

export const SMALL_TO_BIG = {
  "ゃ": "や", "ゅ": "ゆ", "ょ": "よ",
  "ャ": "ヤ", "ュ": "ユ", "ョ": "ヨ",
};

// Titik untuk tanda dakuten/handakuten tambahan — selalu di sudut kanan-atas kotak huruf.
const DAKUTEN_MARK_POINT = [0.88, 0.06];
const HANDAKUTEN_MARK_POINT = [0.88, 0.06];

// Menerjemahkan karakter apa pun (dasar, dakuten, handakuten, atau kombinasi
// yōon seperti きゃ) menjadi panduan { strokes, steps, points }. Untuk karakter
// turunan, panduan dasarnya diambil lalu ditambah satu langkah + satu titik
// penjelas — supaya data di atas cukup ditulis sekali untuk 46+46 karakter
// dasar saja.
export function getStrokeGuide(char) {
  if (!char) return null;
  if (STROKE_GUIDES[char]) return STROKE_GUIDES[char];

  if (char.length === 2) {
    const mainChar = char[0];
    const smallChar = char[1];
    const mainGuide = getStrokeGuide(mainChar);
    const smallBig = SMALL_TO_BIG[smallChar];
    if (!mainGuide) return null;
    const smallGuide = smallBig ? STROKE_GUIDES[smallBig] : null;
    // Di kombinasi yōon, huruf utama digambar lebih kecil & digeser ke kiri-atas (bukan
    // memenuhi kotak seperti huruf tunggal biasa) supaya huruf kecilnya muat di kanan-bawah —
    // lihat renderReferenceGlyph di App.jsx. Titik-titik goresan huruf utama perlu mengikuti
    // skala & posisi yang sama, kalau tidak nomornya akan meleset dari gambar hurufnya.
    const SCALE = 0.6 / 0.72;
    const mainPoints = mainGuide.points.map(([x, y]) => [
      0.4 + (x - 0.5) * SCALE,
      0.42 + (y - 0.5) * SCALE,
    ]);
    return {
      strokes: mainGuide.strokes + (smallGuide ? smallGuide.strokes : 0),
      steps: [
        ...mainGuide.steps,
        `Setelah itu, tulis "${smallBig || smallChar}" dalam ukuran KECIL di sisi kanan-bawah — goresannya sama seperti huruf biasa, hanya diperkecil dan diturunkan sedikit.`,
      ],
      points: [...mainPoints, [0.74, 0.72]],
    };
  }

  if (DAKUTEN_BASE[char]) {
    const baseChar = DAKUTEN_BASE[char];
    const base = STROKE_GUIDES[baseChar];
    if (!base) return null;
    return {
      strokes: base.strokes + 2,
      steps: [
        ...base.steps,
        `Setelah huruf dasar "${baseChar}" selesai, tambahkan 2 goresan pendek miring (tanda dakuten ゛) di sudut kanan atas.`,
      ],
      points: [...base.points, DAKUTEN_MARK_POINT],
    };
  }

  if (HANDAKUTEN_BASE[char]) {
    const baseChar = HANDAKUTEN_BASE[char];
    const base = STROKE_GUIDES[baseChar];
    if (!base) return null;
    return {
      strokes: base.strokes + 1,
      steps: [
        ...base.steps,
        `Setelah huruf dasar "${baseChar}" selesai, tambahkan 1 lingkaran kecil (tanda handakuten ゜) di sudut kanan atas.`,
      ],
      points: [...base.points, HANDAKUTEN_MARK_POINT],
    };
  }

  return null;
}
