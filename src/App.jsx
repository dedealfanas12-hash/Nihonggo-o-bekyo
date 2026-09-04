import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Home, BookOpen, Pencil, Target, TrendingUp, Volume2, Lock, CheckCircle,
  Flame, ChevronRight, ChevronLeft, X, RotateCcw, Star, Sparkles, ArrowRight, Trophy, Eraser, Play,
} from "lucide-react";
import { getStrokeGuide, DAKUTEN_BASE, HANDAKUTEN_BASE, SMALL_TO_BIG } from "./strokeGuides.js";
import { WIKI_STROKE_GIF } from "./wikiStrokeGif.js";

// Menerjemahkan karakter apa pun jadi animasi Wikipedia yang tersedia untuknya:
//  - huruf dasar: satu animasi asli miliknya sendiri.
//  - dakuten/handakuten (mis. が): Wikipedia tidak punya animasi KHUSUS untuk ini, tapi
//    goresan badan hurufnya identik dengan huruf dasarnya (か) — jadi pakai animasi asli
//    huruf dasarnya (tanda dakuten/handakuten-nya dijelaskan lewat teks langkah, bukan
//    dianimasikan, supaya tidak perlu menebak jalur goresan tanda kecil itu).
//  - yōon (mis. きゃ): gabungkan DUA animasi asli — huruf utama (き) & bentuk besar huruf
//    kecilnya (や) — ditampilkan berdampingan, meniru proporsi huruf kecil yang sungguhan.
// Mengembalikan null kalau tidak ada animasi asli sama sekali untuk komponennya (StrokeGuidePanel
// akan otomatis jatuh ke sistem titik-titik sendiri).
function resolveWikiAnimation(char) {
  if (WIKI_STROKE_GIF[char]) return { kind: "single", url: WIKI_STROKE_GIF[char] };
  if (char.length === 2) {
    const mainUrl = resolveWikiAnimation(char[0]);
    const smallBig = SMALL_TO_BIG[char[1]];
    const smallUrl = smallBig ? WIKI_STROKE_GIF[smallBig] : null;
    if (mainUrl && mainUrl.kind === "single" && smallUrl) {
      return { kind: "compound", mainUrl: mainUrl.url, smallUrl };
    }
    return null;
  }
  const base = DAKUTEN_BASE[char] || HANDAKUTEN_BASE[char];
  if (base && WIKI_STROKE_GIF[base]) return { kind: "single", url: WIKI_STROKE_GIF[base] };
  return null;
}
import {
  isFirebaseEnabled,
  slugifyAccountName,
  subscribeAccountList,
  subscribeUserProgress,
  pushUserProgress,
  deleteAccountProgress,
} from "./firebaseSync.js";

// Confetti rayakan-lulus-tes, dimuat lazy (dynamic import) supaya tidak menambah beban awal —
// baru betulan diambil saat momen merayakannya terjadi (lihat pemicunya di QuizView).
let confettiModulePromise = null;
function launchConfetti() {
  if (!confettiModulePromise) {
    confettiModulePromise = import("canvas-confetti").then((m) => m.default);
  }
  confettiModulePromise
    .then((confetti) => {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#b91c1c", "#f59e0b", "#10b981", "#f43f5e"],
      });
    })
    .catch(() => {}); // gagal diam-diam — confetti murni kosmetik, tidak boleh bikin error
}

/* =========================================================================
   DATA — Hiragana / Katakana / Vocabulary
   ========================================================================= */

const HIRAGANA_LEVELS = [
  { id: 1, title: "Vokal Dasar", chars: [
    { char: "あ", romaji: "a" }, { char: "い", romaji: "i" }, { char: "う", romaji: "u" },
    { char: "え", romaji: "e" }, { char: "お", romaji: "o" },
  ]},
  { id: 2, title: "Baris Ka & Sa", chars: [
    { char: "か", romaji: "ka" }, { char: "き", romaji: "ki" }, { char: "く", romaji: "ku" }, { char: "け", romaji: "ke" }, { char: "こ", romaji: "ko" },
    { char: "さ", romaji: "sa" }, { char: "し", romaji: "shi" }, { char: "す", romaji: "su" }, { char: "せ", romaji: "se" }, { char: "そ", romaji: "so" },
  ]},
  { id: 3, title: "Baris Ta & Na", chars: [
    { char: "た", romaji: "ta" }, { char: "ち", romaji: "chi" }, { char: "つ", romaji: "tsu" }, { char: "て", romaji: "te" }, { char: "と", romaji: "to" },
    { char: "な", romaji: "na" }, { char: "に", romaji: "ni" }, { char: "ぬ", romaji: "nu" }, { char: "ね", romaji: "ne" }, { char: "の", romaji: "no" },
  ]},
  { id: 4, title: "Baris Ha & Ma", chars: [
    { char: "は", romaji: "ha" }, { char: "ひ", romaji: "hi" }, { char: "ふ", romaji: "fu" }, { char: "へ", romaji: "he" }, { char: "ほ", romaji: "ho" },
    { char: "ま", romaji: "ma" }, { char: "み", romaji: "mi" }, { char: "む", romaji: "mu" }, { char: "め", romaji: "me" }, { char: "も", romaji: "mo" },
  ]},
  { id: 5, title: "Baris Ya, Ra & Wa", chars: [
    { char: "や", romaji: "ya" }, { char: "ゆ", romaji: "yu" }, { char: "よ", romaji: "yo" },
    { char: "ら", romaji: "ra" }, { char: "り", romaji: "ri" }, { char: "る", romaji: "ru" }, { char: "れ", romaji: "re" }, { char: "ろ", romaji: "ro" },
    { char: "わ", romaji: "wa" }, { char: "を", romaji: "wo" }, { char: "ん", romaji: "n" },
  ]},
  { id: 6, title: "Dakuten & Handakuten", chars: [
    { char: "が", romaji: "ga" }, { char: "ぎ", romaji: "gi" }, { char: "ぐ", romaji: "gu" }, { char: "げ", romaji: "ge" }, { char: "ご", romaji: "go" },
    { char: "ざ", romaji: "za" }, { char: "じ", romaji: "ji" }, { char: "ず", romaji: "zu" }, { char: "ぜ", romaji: "ze" }, { char: "ぞ", romaji: "zo" },
    { char: "だ", romaji: "da" }, { char: "ぢ", romaji: "ji" }, { char: "づ", romaji: "zu" }, { char: "で", romaji: "de" }, { char: "ど", romaji: "do" },
    { char: "ば", romaji: "ba" }, { char: "び", romaji: "bi" }, { char: "ぶ", romaji: "bu" }, { char: "べ", romaji: "be" }, { char: "ぼ", romaji: "bo" },
    { char: "ぱ", romaji: "pa" }, { char: "ぴ", romaji: "pi" }, { char: "ぷ", romaji: "pu" }, { char: "ぺ", romaji: "pe" }, { char: "ぽ", romaji: "po" },
  ]},
  { id: 7, title: "Yōon (Kombinasi)", chars: [
    { char: "きゃ", romaji: "kya" }, { char: "きゅ", romaji: "kyu" }, { char: "きょ", romaji: "kyo" },
    { char: "しゃ", romaji: "sha" }, { char: "しゅ", romaji: "shu" }, { char: "しょ", romaji: "sho" },
    { char: "ちゃ", romaji: "cha" }, { char: "ちゅ", romaji: "chu" }, { char: "ちょ", romaji: "cho" },
    { char: "にゃ", romaji: "nya" }, { char: "にゅ", romaji: "nyu" }, { char: "にょ", romaji: "nyo" },
    { char: "ひゃ", romaji: "hya" }, { char: "ひゅ", romaji: "hyu" }, { char: "ひょ", romaji: "hyo" },
    { char: "みゃ", romaji: "mya" }, { char: "みゅ", romaji: "myu" }, { char: "みょ", romaji: "myo" },
    { char: "りゃ", romaji: "rya" }, { char: "りゅ", romaji: "ryu" }, { char: "りょ", romaji: "ryo" },
    { char: "ぎゃ", romaji: "gya" }, { char: "ぎゅ", romaji: "gyu" }, { char: "ぎょ", romaji: "gyo" },
    { char: "じゃ", romaji: "ja" }, { char: "じゅ", romaji: "ju" }, { char: "じょ", romaji: "jo" },
    { char: "びゃ", romaji: "bya" }, { char: "びゅ", romaji: "byu" }, { char: "びょ", romaji: "byo" },
    { char: "ぴゃ", romaji: "pya" }, { char: "ぴゅ", romaji: "pyu" }, { char: "ぴょ", romaji: "pyo" },
  ]},
];

// Katakana mirrors the hiragana row structure exactly (same romaji per level/index),
// so it is derived from the same layout rather than re-typed.
const KATA_FLAT = ["ア","イ","ウ","エ","オ","カ","キ","ク","ケ","コ","サ","シ","ス","セ","ソ","タ","チ","ツ","テ","ト","ナ","ニ","ヌ","ネ","ノ","ハ","ヒ","フ","ヘ","ホ","マ","ミ","ム","メ","モ","ヤ","ユ","ヨ","ラ","リ","ル","レ","ロ","ワ","ヲ","ン","ガ","ギ","グ","ゲ","ゴ","ザ","ジ","ズ","ゼ","ゾ","ダ","ヂ","ヅ","デ","ド","バ","ビ","ブ","ベ","ボ","パ","ピ","プ","ペ","ポ","キャ","キュ","キョ","シャ","シュ","ショ","チャ","チュ","チョ","ニャ","ニュ","ニョ","ヒャ","ヒュ","ヒョ","ミャ","ミュ","ミョ","リャ","リュ","リョ","ギャ","ギュ","ギョ","ジャ","ジュ","ジョ","ビャ","ビュ","ビョ","ピャ","ピュ","ピョ"];
const KATAKANA_LEVELS = HIRAGANA_LEVELS.map((lvl, li) => {
  const offset = HIRAGANA_LEVELS.slice(0, li).reduce((s, l) => s + l.chars.length, 0);
  return { id: lvl.id, title: lvl.title, chars: lvl.chars.map((c, i) => ({ char: KATA_FLAT[offset + i], romaji: c.romaji })) };
});

const VOCAB_LEVELS = [
  { id: 1, title: "Dasar", words: [
    { kanji: "人", reading: "ひと", romaji: "hito", meaning: "orang", example: "あの人は先生です。(Orang itu adalah guru.)" },
    { kanji: "水", reading: "みず", romaji: "mizu", meaning: "air", example: "水を飲みます。(Minum air.)" },
    { kanji: "本", reading: "ほん", romaji: "hon", meaning: "buku", example: "本を読みます。(Membaca buku.)" },
    { kanji: "学生", reading: "がくせい", romaji: "gakusei", meaning: "siswa", example: "私は学生です。(Saya adalah siswa.)" },
    { kanji: "先生", reading: "せんせい", romaji: "sensei", meaning: "guru", example: "先生はやさしいです。(Gurunya baik.)" },
    { kanji: "私", reading: "わたし", romaji: "watashi", meaning: "saya", example: "私は元気です。(Saya sehat.)" },
    { kanji: "名前", reading: "なまえ", romaji: "namae", meaning: "nama", example: "名前は何ですか。(Siapa namamu?)" },
    { kanji: "友達", reading: "ともだち", romaji: "tomodachi", meaning: "teman", example: "友達と話します。(Berbicara dengan teman.)" },
    { kanji: "会社", reading: "かいしゃ", romaji: "kaisha", meaning: "perusahaan", example: "父は会社で働きます。(Ayah bekerja di perusahaan.)" },
    { kanji: "車", reading: "くるま", romaji: "kuruma", meaning: "mobil", example: "車で行きます。(Pergi dengan mobil.)" },
  ]},
  { id: 2, title: "Aktivitas", words: [
    { kanji: "食べる", reading: "たべる", romaji: "taberu", meaning: "makan", example: "ご飯を食べます。(Makan nasi.)" },
    { kanji: "飲む", reading: "のむ", romaji: "nomu", meaning: "minum", example: "お茶を飲みます。(Minum teh.)" },
    { kanji: "行く", reading: "いく", romaji: "iku", meaning: "pergi", example: "学校へ行きます。(Pergi ke sekolah.)" },
    { kanji: "来る", reading: "くる", romaji: "kuru", meaning: "datang", example: "友達が来ます。(Teman datang.)" },
    { kanji: "見る", reading: "みる", romaji: "miru", meaning: "melihat", example: "映画を見ます。(Menonton film.)" },
    { kanji: "読む", reading: "よむ", romaji: "yomu", meaning: "membaca", example: "本を読みます。(Membaca buku.)" },
    { kanji: "書く", reading: "かく", romaji: "kaku", meaning: "menulis", example: "手紙を書きます。(Menulis surat.)" },
    { kanji: "話す", reading: "はなす", romaji: "hanasu", meaning: "berbicara", example: "日本語を話します。(Berbicara bahasa Jepang.)" },
    { kanji: "買う", reading: "かう", romaji: "kau", meaning: "membeli", example: "パンを買います。(Membeli roti.)" },
    { kanji: "寝る", reading: "ねる", romaji: "neru", meaning: "tidur", example: "早く寝ます。(Tidur lebih awal.)" },
  ]},
  { id: 3, title: "Waktu", words: [
    { kanji: "今日", reading: "きょう", romaji: "kyou", meaning: "hari ini", example: "今日は忙しいです。(Hari ini sibuk.)" },
    { kanji: "明日", reading: "あした", romaji: "ashita", meaning: "besok", example: "明日会いましょう。(Ayo bertemu besok.)" },
    { kanji: "昨日", reading: "きのう", romaji: "kinou", meaning: "kemarin", example: "昨日は雨でした。(Kemarin hujan.)" },
    { kanji: "朝", reading: "あさ", romaji: "asa", meaning: "pagi", example: "朝ご飯を食べます。(Makan sarapan pagi.)" },
    { kanji: "昼", reading: "ひる", romaji: "hiru", meaning: "siang", example: "昼に休みます。(Istirahat siang.)" },
    { kanji: "夜", reading: "よる", romaji: "yoru", meaning: "malam", example: "夜は静かです。(Malam hari sunyi.)" },
    { kanji: "今", reading: "いま", romaji: "ima", meaning: "sekarang", example: "今、何時ですか。(Sekarang jam berapa?)" },
    { kanji: "週間", reading: "しゅうかん", romaji: "shuukan", meaning: "minggu", example: "一週間、休みます。(Libur satu minggu.)" },
  ]},
  { id: 4, title: "Tempat", words: [
    { kanji: "学校", reading: "がっこう", romaji: "gakkou", meaning: "sekolah", example: "学校は大きいです。(Sekolahnya besar.)" },
    { kanji: "家", reading: "いえ", romaji: "ie", meaning: "rumah", example: "家に帰ります。(Pulang ke rumah.)" },
    { kanji: "駅", reading: "えき", romaji: "eki", meaning: "stasiun", example: "駅で待ちます。(Menunggu di stasiun.)" },
    { kanji: "店", reading: "みせ", romaji: "mise", meaning: "toko", example: "店で買います。(Membeli di toko.)" },
    { kanji: "病院", reading: "びょういん", romaji: "byouin", meaning: "rumah sakit", example: "病院へ行きます。(Pergi ke rumah sakit.)" },
    { kanji: "公園", reading: "こうえん", romaji: "kouen", meaning: "taman", example: "公園で遊びます。(Bermain di taman.)" },
    { kanji: "銀行", reading: "ぎんこう", romaji: "ginkou", meaning: "bank", example: "銀行はあそこです。(Bank ada di sana.)" },
    { kanji: "図書館", reading: "としょかん", romaji: "toshokan", meaning: "perpustakaan", example: "図書館は静かです。(Perpustakaan itu sunyi.)" },
  ]},
  { id: 5, title: "Orang & Keluarga", words: [
    { kanji: "家族", reading: "かぞく", romaji: "kazoku", meaning: "keluarga", example: "家族は四人です。(Keluarga saya berjumlah empat orang.)" },
    { kanji: "母", reading: "はは", romaji: "haha", meaning: "ibu", example: "母は料理が上手です。(Ibu pandai memasak.)" },
    { kanji: "父", reading: "ちち", romaji: "chichi", meaning: "ayah", example: "父は会社員です。(Ayah adalah karyawan.)" },
    { kanji: "兄", reading: "あに", romaji: "ani", meaning: "kakak laki-laki", example: "兄は背が高いです。(Kakak laki-laki tinggi.)" },
    { kanji: "姉", reading: "あね", romaji: "ane", meaning: "kakak perempuan", example: "姉は医者です。(Kakak perempuan adalah dokter.)" },
    { kanji: "弟", reading: "おとうと", romaji: "otouto", meaning: "adik laki-laki", example: "弟は学生です。(Adik laki-laki adalah siswa.)" },
    { kanji: "妹", reading: "いもうと", romaji: "imouto", meaning: "adik perempuan", example: "妹はまだ小さいです。(Adik perempuan masih kecil.)" },
    { kanji: "子供", reading: "こども", romaji: "kodomo", meaning: "anak", example: "子供が公園で遊びます。(Anak bermain di taman.)" },
  ]},
  { id: 6, title: "Makanan & Minuman", words: [
    { kanji: "ご飯", reading: "ごはん", romaji: "gohan", meaning: "nasi", example: "ご飯を食べます。(Makan nasi.)" },
    { kanji: "お茶", reading: "おちゃ", romaji: "ocha", meaning: "teh", example: "お茶をどうぞ。(Silakan minum teh.)" },
    { kanji: null, reading: "パン", romaji: "pan", meaning: "roti", example: "朝パンを食べます。(Makan roti di pagi hari.)" },
    { kanji: "魚", reading: "さかな", romaji: "sakana", meaning: "ikan", example: "魚が好きです。(Suka ikan.)" },
    { kanji: "肉", reading: "にく", romaji: "niku", meaning: "daging", example: "肉を食べません。(Tidak makan daging.)" },
    { kanji: "野菜", reading: "やさい", romaji: "yasai", meaning: "sayuran", example: "野菜は体にいいです。(Sayuran baik untuk tubuh.)" },
    { kanji: null, reading: "コーヒー", romaji: "koohii", meaning: "kopi", example: "コーヒーを飲みます。(Minum kopi.)" },
    { kanji: "果物", reading: "くだもの", romaji: "kudamono", meaning: "buah", example: "果物が大好きです。(Sangat suka buah.)" },
  ]},
  { id: 7, title: "Sifat & Keadaan", words: [
    { kanji: "大きい", reading: "おおきい", romaji: "ookii", meaning: "besar", example: "大きい家です。(Rumah yang besar.)" },
    { kanji: "小さい", reading: "ちいさい", romaji: "chiisai", meaning: "kecil", example: "小さい犬です。(Anjing yang kecil.)" },
    { kanji: "新しい", reading: "あたらしい", romaji: "atarashii", meaning: "baru", example: "新しい車です。(Mobil baru.)" },
    { kanji: "古い", reading: "ふるい", romaji: "furui", meaning: "lama", example: "古い本です。(Buku lama.)" },
    { kanji: null, reading: "いい", romaji: "ii", meaning: "bagus", example: "いい天気ですね。(Cuaca bagus, ya.)" },
    { kanji: "忙しい", reading: "いそがしい", romaji: "isogashii", meaning: "sibuk", example: "今日は忙しいです。(Hari ini sibuk.)" },
    { kanji: "楽しい", reading: "たのしい", romaji: "tanoshii", meaning: "menyenangkan", example: "旅行は楽しいです。(Perjalanan itu menyenangkan.)" },
    { kanji: "難しい", reading: "むずかしい", romaji: "muzukashii", meaning: "sulit", example: "日本語は難しいです。(Bahasa Jepang itu sulit.)" },
  ]},
  { id: 8, title: "Kehidupan Sehari-hari", words: [
    { kanji: "仕事", reading: "しごと", romaji: "shigoto", meaning: "pekerjaan", example: "仕事は楽しいです。(Pekerjaan itu menyenangkan.)" },
    { kanji: "電話", reading: "でんわ", romaji: "denwa", meaning: "telepon", example: "電話をかけます。(Menelepon.)" },
    { kanji: "音楽", reading: "おんがく", romaji: "ongaku", meaning: "musik", example: "音楽を聞きます。(Mendengarkan musik.)" },
    { kanji: "映画", reading: "えいが", romaji: "eiga", meaning: "film", example: "映画を見ます。(Menonton film.)" },
    { kanji: "買い物", reading: "かいもの", romaji: "kaimono", meaning: "belanja", example: "買い物に行きます。(Pergi belanja.)" },
    { kanji: "勉強", reading: "べんきょう", romaji: "benkyou", meaning: "belajar", example: "日本語を勉強します。(Belajar bahasa Jepang.)" },
    { kanji: "旅行", reading: "りょこう", romaji: "ryokou", meaning: "perjalanan", example: "旅行が好きです。(Suka bepergian.)" },
    { kanji: "天気", reading: "てんき", romaji: "tenki", meaning: "cuaca", example: "今日の天気はいいです。(Cuaca hari ini bagus.)" },
  ]},
];

const BADGES = [
  { id: "hiragana_beginner", title: "Hiragana Beginner", desc: "Menyelesaikan Level 1 Hiragana", icon: "🏅" },
  { id: "hiragana_master", title: "Hiragana Master", desc: "Menyelesaikan semua level Hiragana", icon: "🏆" },
  { id: "katakana_beginner", title: "Katakana Beginner", desc: "Menyelesaikan Level 1 Katakana", icon: "🏅" },
  { id: "katakana_master", title: "Katakana Master", desc: "Menyelesaikan semua level Katakana", icon: "🏆" },
  { id: "vocab_beginner", title: "Vocabulary Beginner", desc: "Menyelesaikan Level 1 Kosakata", icon: "🏅" },
  { id: "vocab_master", title: "Vocabulary Master", desc: "Menyelesaikan semua level Kosakata", icon: "🏆" },
  { id: "streak_7", title: "7 Hari Beruntun", desc: "Belajar 7 hari berturut-turut", icon: "🔥" },
];

const CATEGORY_META = {
  hiragana: { label: "Hiragana", levels: HIRAGANA_LEVELS, sample: "あ・い・う", isVocab: false, badgePrefix: "hiragana" },
  katakana: { label: "Katakana", levels: KATAKANA_LEVELS, sample: "ア・イ・ウ", isVocab: false, badgePrefix: "katakana" },
  vocabulary: { label: "Kosakata", levels: VOCAB_LEVELS, sample: "言葉", isVocab: true, badgePrefix: "vocab" },
};
const CATEGORY_ORDER = ["hiragana", "katakana", "vocabulary"];

/* =========================================================================
   ENGINE — question banks, shuffling, no-repeat cycling
   ========================================================================= */

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(correctValue, pool, n = 3) {
  const candidates = [...new Set(pool)].filter((v) => v !== correctValue);
  return shuffleArray(candidates).slice(0, n);
}

function buildKanaQuestionBank(levelChars, levelId, catPrefix) {
  const allRomaji = levelChars.map((c) => c.romaji);
  const allChars = levelChars.map((c) => c.char);
  const romajiCounts = {};
  allRomaji.forEach((r) => { romajiCounts[r] = (romajiCounts[r] || 0) + 1; });
  const bank = [];
  levelChars.forEach((c, idx) => {
    bank.push({
      id: `${catPrefix}_L${levelId}_${idx}_r`, levelId, key: c.char, type: "mc",
      prompt: `${c.char} dibaca...`, correct: c.romaji,
      options: [c.romaji, ...pickDistractors(c.romaji, allRomaji)],
      explanation: `${c.char} dibaca '${c.romaji}'.`,
    });
    // Skip the reverse (romaji -> char) direction when two characters in this level share
    // a romaji reading (じ/ぢ, ず/づ) — otherwise the question would have two valid answers.
    if (romajiCounts[c.romaji] === 1) {
      bank.push({
        id: `${catPrefix}_L${levelId}_${idx}_c`, levelId, key: c.char, type: "mc",
        prompt: `Huruf mana yang dibaca '${c.romaji}'?`, correct: c.char,
        options: [c.char, ...pickDistractors(c.char, allChars)],
        explanation: `'${c.romaji}' ditulis ${c.char}.`,
      });
    }
  });
  return bank;
}

// One handwriting question per character: shown the romaji, the learner draws the character
// by hand on a canvas (mouse or touch), then the correct character is revealed for comparison.
// There's no reliable way to auto-grade freehand strokes in a plain web app, so the learner
// self-marks whether their own drawing matched — same honest, ungraded-by-machine approach
// real stroke-practice workbooks use.
function buildKanaDrawBank(levelChars, levelId, catPrefix) {
  return levelChars.map((c, idx) => ({
    id: `${catPrefix}_L${levelId}_${idx}_d`, levelId, key: c.char, type: "draw",
    prompt: `Tulis huruf yang dibaca '${c.romaji}'`, correct: c.char,
    explanation: `Karakter untuk '${c.romaji}' adalah ${c.char}.`,
  }));
}

function buildVocabQuestionBank(levelWords, levelId) {
  const allMeanings = levelWords.map((w) => w.meaning);
  const allReadings = levelWords.map((w) => w.reading);
  const bank = [];
  levelWords.forEach((w, idx) => {
    const displayKey = w.kanji || w.reading;
    bank.push({
      id: `vocab_L${levelId}_${idx}_m`, levelId, key: displayKey, type: "mc",
      prompt: `${w.reading} artinya...`, correct: w.meaning,
      options: [w.meaning, ...pickDistractors(w.meaning, allMeanings)],
      explanation: `${w.reading} (${w.romaji}) berarti '${w.meaning}'.`,
    });
    bank.push({
      id: `vocab_L${levelId}_${idx}_w`, levelId, key: displayKey, type: "mc",
      prompt: `Kata mana yang berarti '${w.meaning}'?`, correct: w.reading,
      options: [w.reading, ...pickDistractors(w.reading, allReadings)],
      explanation: `'${w.meaning}' = ${w.reading} (${w.romaji}).`,
    });
  });
  return bank;
}

// One typed-answer question per word: shown the reading, the learner types the Indonesian
// meaning themselves instead of picking from options.
function buildVocabWriteBank(levelWords, levelId) {
  return levelWords.map((w, idx) => ({
    id: `vocab_L${levelId}_${idx}_t`, levelId, key: w.kanji || w.reading, type: "write",
    prompt: `Apa arti dari: ${w.reading}?`, correct: w.meaning,
    explanation: `${w.reading} (${w.romaji}) berarti '${w.meaning}'.`,
  }));
}

// Ad-hoc bank for the "Perlu Diulang" review flow, built from a handful of frequently-missed
// items (which may span several levels). Pads the distractor pool from the full category
// dataset when the review set itself is too small to offer 4 options.
function buildFocusedKanaBank(items, allLevels) {
  const fullChars = allLevels.flatMap((l) => l.chars);
  let romajiPool = [...new Set(items.map((c) => c.romaji))];
  let charPool = [...new Set(items.map((c) => c.char))];
  if (romajiPool.length < 4) romajiPool = [...new Set([...romajiPool, ...shuffleArray(fullChars.map((x) => x.romaji))])];
  if (charPool.length < 4) charPool = [...new Set([...charPool, ...shuffleArray(fullChars.map((x) => x.char))])];
  const romajiCounts = {};
  items.forEach((c) => { romajiCounts[c.romaji] = (romajiCounts[c.romaji] || 0) + 1; });
  const bank = [];
  items.forEach((c, idx) => {
    bank.push({
      id: `review_${idx}_r`, levelId: null, key: c.char,
      prompt: `${c.char} dibaca...`, correct: c.romaji,
      options: [c.romaji, ...pickDistractors(c.romaji, romajiPool)],
      explanation: `${c.char} dibaca '${c.romaji}'.`,
    });
    if (romajiCounts[c.romaji] === 1) {
      bank.push({
        id: `review_${idx}_c`, levelId: null, key: c.char,
        prompt: `Huruf mana yang dibaca '${c.romaji}'?`, correct: c.char,
        options: [c.char, ...pickDistractors(c.char, charPool)],
        explanation: `'${c.romaji}' ditulis ${c.char}.`,
      });
    }
  });
  return bank;
}

function buildFocusedVocabBank(items, allLevels) {
  const fullWords = allLevels.flatMap((l) => l.words);
  let meaningPool = [...new Set(items.map((w) => w.meaning))];
  let readingPool = [...new Set(items.map((w) => w.reading))];
  if (meaningPool.length < 4) meaningPool = [...new Set([...meaningPool, ...shuffleArray(fullWords.map((x) => x.meaning))])];
  if (readingPool.length < 4) readingPool = [...new Set([...readingPool, ...shuffleArray(fullWords.map((x) => x.reading))])];
  const bank = [];
  items.forEach((w, idx) => {
    const displayKey = w.kanji || w.reading;
    bank.push({
      id: `reviewv_${idx}_m`, levelId: null, key: displayKey,
      prompt: `${w.reading} artinya...`, correct: w.meaning,
      options: [w.meaning, ...pickDistractors(w.meaning, meaningPool)],
      explanation: `${w.reading} (${w.romaji}) berarti '${w.meaning}'.`,
    });
    bank.push({
      id: `reviewv_${idx}_w`, levelId: null, key: displayKey,
      prompt: `Kata mana yang berarti '${w.meaning}'?`, correct: w.reading,
      options: [w.reading, ...pickDistractors(w.reading, readingPool)],
      explanation: `'${w.meaning}' = ${w.reading} (${w.romaji}).`,
    });
  });
  return bank;
}

function pickQuestions(bank, usedIds, count) {
  let pool = bank.filter((q) => !usedIds.includes(q.id));
  let effectiveUsed = usedIds;
  let didReset = false;
  if (pool.length === 0) {
    didReset = true;
    effectiveUsed = [];
    pool = [...bank];
  }
  const shuffled = shuffleArray(pool);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length)).map((q) => (q.options ? { ...q, options: shuffleArray(q.options) } : q));
  const newUsedIds = [...effectiveUsed, ...selected.map((q) => q.id)];
  return { selected, didReset, newUsedIds };
}

function getLevelSet(category, levelId) {
  return CATEGORY_META[category].levels.find((l) => l.id === levelId);
}
// questionType: "mc" (multiple choice only), "write" (typed-answer for vocab / handwriting-draw
// for kana), or "mixed" (both — used for Tes, so a level's final test draws from both styles).
function getBankForLevel(category, levelId, questionType) {
  const level = getLevelSet(category, levelId);
  const prefix = category === "hiragana" ? "hira" : "kata";
  const isVocab = category === "vocabulary";
  const mcBank = isVocab ? buildVocabQuestionBank(level.words, levelId) : buildKanaQuestionBank(level.chars, levelId, prefix);
  const writeBank = isVocab ? buildVocabWriteBank(level.words, levelId) : buildKanaDrawBank(level.chars, levelId, prefix);
  if (questionType === "write") return writeBank;
  if (questionType === "mixed") return [...mcBank, ...writeBank];
  return mcBank;
}
function findKanaByChar(levels, char) {
  for (const lvl of levels) {
    const found = lvl.chars.find((c) => c.char === char);
    if (found) return found;
  }
  return null;
}
function findVocabByKey(levels, key) {
  for (const lvl of levels) {
    const found = lvl.words.find((w) => (w.kanji || w.reading) === key);
    if (found) return found;
  }
  return null;
}

/* =========================================================================
   STATE HELPERS — unlocking, badges, scoring, streak
   ========================================================================= */

function createDefaultState() {
  const categories = {};
  CATEGORY_ORDER.forEach((cat) => { categories[cat] = { levelStatus: {}, questionHistory: {}, wrongCounts: {} }; });
  return { xp: 0, badges: [], streak: { count: 0, lastStudyDate: null, studiedDates: [] }, categories, _syncedAt: 0 };
}
function mergeWithDefaults(parsed) {
  const def = createDefaultState();
  const categories = {};
  CATEGORY_ORDER.forEach((cat) => { categories[cat] = { ...def.categories[cat], ...((parsed && parsed.categories && parsed.categories[cat]) || {}) }; });
  return {
    xp: typeof (parsed && parsed.xp) === "number" ? parsed.xp : def.xp,
    badges: Array.isArray(parsed && parsed.badges) ? parsed.badges : def.badges,
    streak: { ...def.streak, ...((parsed && parsed.streak) || {}) },
    categories,
    _syncedAt: typeof (parsed && parsed._syncedAt) === "number" ? parsed._syncedAt : def._syncedAt,
  };
}

function categoryMaxLevel(cat) { return cat === "vocabulary" ? 8 : 7; }
function addBadge(list, id) { return list.includes(id) ? list : [...list, id]; }
function isCategoryFullyPassed(state, cat) {
  const max = categoryMaxLevel(cat);
  const ls = state.categories[cat].levelStatus;
  for (let i = 1; i <= max; i++) { if (!ls[i] || !ls[i].passed) return false; }
  return true;
}
function isCategoryUnlocked(state, cat) {
  if (cat === "hiragana") return true;
  if (cat === "katakana") return isCategoryFullyPassed(state, "hiragana");
  return isCategoryFullyPassed(state, "katakana");
}
function isLevelUnlocked(state, cat, levelId) {
  if (!isCategoryUnlocked(state, cat)) return false;
  if (levelId === 1) return true;
  const ls = state.categories[cat].levelStatus;
  return !!(ls[levelId - 1] && ls[levelId - 1].passed);
}
function categoryProgressPct(state, cat) {
  const max = categoryMaxLevel(cat);
  let sum = 0;
  for (let i = 1; i <= max; i++) { const st = state.categories[cat].levelStatus[i]; if (st && st.passed) sum++; }
  return Math.round((sum / max) * 100);
}
function overallProgressPct(state) {
  const total = CATEGORY_ORDER.reduce((s, c) => s + categoryProgressPct(state, c), 0);
  return Math.round(total / CATEGORY_ORDER.length);
}
function applyTestResult(state, cat, levelId, scorePct) {
  const next = JSON.parse(JSON.stringify(state));
  const ls = next.categories[cat].levelStatus;
  const passed = scorePct >= 80;
  const prev = ls[levelId] || { bestScore: 0, passed: false };
  ls[levelId] = { bestScore: Math.max(prev.bestScore, scorePct), passed: prev.passed || passed };
  next.xp += passed ? 50 : 0;
  const prefix = CATEGORY_META[cat].badgePrefix;
  if (passed && levelId === 1) next.badges = addBadge(next.badges, `${prefix}_beginner`);
  if (passed && isCategoryFullyPassed(next, cat)) next.badges = addBadge(next.badges, `${prefix}_master`);
  return next;
}
function scoreLabel(pct) {
  if (pct >= 90) return "Sangat Baik";
  if (pct >= 80) return "Baik";
  if (pct >= 70) return "Cukup";
  return "Ulangi";
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysBetween(a, b) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db - da) / 86400000);
}
function applyStreakTick(streak) {
  const today = todayStr();
  if (streak.lastStudyDate === today) return streak;
  let count = 1;
  if (streak.lastStudyDate) {
    const diff = daysBetween(streak.lastStudyDate, today);
    count = diff === 1 ? streak.count + 1 : 1;
  }
  const studiedDates = [...new Set([...(streak.studiedDates || []), today])].slice(-35);
  return { count, lastStudyDate: today, studiedDates };
}
function currentWeekDates() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return dates;
}

function finishSession({ state, category, levelId, mode, newUsedIds, missedKeys, correctKeys, correctCount, totalCount }) {
  let next = JSON.parse(JSON.stringify(state));
  if (mode === "review") {
    correctKeys.forEach((k) => {
      const wc = next.categories[category].wrongCounts;
      if (wc[k]) { wc[k] = wc[k] - 1; if (wc[k] <= 0) delete wc[k]; }
    });
    missedKeys.forEach((k) => { next.categories[category].wrongCounts[k] = (next.categories[category].wrongCounts[k] || 0) + 1; });
  } else {
    if (levelId != null) next.categories[category].questionHistory[levelId] = newUsedIds;
    missedKeys.forEach((k) => { next.categories[category].wrongCounts[k] = (next.categories[category].wrongCounts[k] || 0) + 1; });
  }
  const xpPerCorrect = mode === "test" ? 20 : 10;
  next.xp += correctCount * xpPerCorrect;
  next.streak = applyStreakTick(next.streak);
  if (next.streak.count >= 7) next.badges = addBadge(next.badges, "streak_7");
  const scorePct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  if (mode === "test") next = applyTestResult(next, category, levelId, scorePct);
  return { next, scorePct };
}

/* =========================================================================
   STORAGE — persists across sessions via the artifact key-value store
   ========================================================================= */

const STORAGE_KEY = "nihongo-step-progress";

// Uses Claude's built-in artifact storage when available (inside Claude.ai); falls back to the
// browser's own localStorage once this file is deployed as a standalone site, so progress is
// saved either way with no other code changes needed.
async function loadProgress() {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const result = await window.storage.get(STORAGE_KEY, false);
      if (result && result.value) return mergeWithDefaults(JSON.parse(result.value));
      return createDefaultState();
    }
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return mergeWithDefaults(JSON.parse(raw));
    }
    return createDefaultState();
  } catch (e) {
    return createDefaultState();
  }
}
async function persistProgress(state) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      await window.storage.set(STORAGE_KEY, JSON.stringify(state), false);
      return;
    }
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    // best effort — a save failure shouldn't break the session
  }
}

function speak(text) {
  try {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ja-JP";
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    }
  } catch (e) {}
}

/* =========================================================================
   SMALL UI PIECES
   ========================================================================= */

const NAV_ITEMS = [
  { key: "dashboard", label: "Beranda", icon: Home, route: { view: "dashboard" } },
  { key: "belajar", label: "Belajar", icon: BookOpen, route: { view: "hub", mode: "belajar" } },
  { key: "latihan", label: "Latihan", icon: Pencil, route: { view: "hub", mode: "latihan" } },
  { key: "tes", label: "Tes", icon: Target, route: { view: "hub", mode: "tes" } },
  { key: "progress", label: "Progress", icon: TrendingUp, route: { view: "progress" } },
];

function isNavActive(route, item) {
  if (item.route.view === route.view) {
    if (item.route.view === "hub") return item.route.mode === route.mode;
    return true;
  }
  if (route.view === "materi" && item.route.view === "hub" && item.route.mode === "belajar") return true;
  if (route.view === "quiz") {
    if (item.route.view === "hub" && item.route.mode === "latihan" && route.mode === "practice") return true;
    if (item.route.view === "hub" && item.route.mode === "tes" && route.mode === "test") return true;
  }
  return false;
}

function SpeakerButton({ text, className }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); speak(text); }}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 ${className || ""}`}
      aria-label="Dengarkan pelafalan"
      type="button"
    >
      <Volume2 size={14} />
    </button>
  );
}

// Menggambar karakter target ke sebuah canvas 2D context, dengan font asli browser — dipakai
// bersama oleh scoreDrawing (buat menilai) dan drawStippledGlyph (buat panduan visual) supaya
// keduanya SELALU konsisten satu sama lain. Menangani dua kasus:
//  - karakter dasar (1 code point, termasuk dakuten/handakuten): satu fillText biasa, besar.
//  - kombinasi yōon (2 code point, mis. "りゃ"): TIDAK ditulis apa adanya (browser akan
//    menaruh keduanya berdampingan di ukuran penuh dan meluber keluar kotak) — sebagai
//    gantinya karakter utama digambar besar di kiri-atas, karakter kecilnya digambar lebih
//    kecil di kanan-bawah, meniru cara huruf yōon sungguhan ditulis.
function renderReferenceGlyph(ctx, char, size) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (char.length >= 2) {
    ctx.font = `${Math.floor(size * 0.6)}px "Noto Sans JP", sans-serif`;
    ctx.fillText(char[0], size * 0.4, size * 0.42);
    ctx.font = `${Math.floor(size * 0.34)}px "Noto Sans JP", sans-serif`;
    ctx.fillText(char[1], size * 0.74, size * 0.72);
  } else {
    ctx.font = `${Math.floor(size * 0.72)}px "Noto Sans JP", sans-serif`;
    ctx.fillText(char, size / 2, size / 2 + size * 0.03);
  }
}

// Compares a hand-drawn canvas against the real character rendered by the browser's own font
// (so the reference shape is always accurate — never hand-authored by Claude). Downsamples both
// to a grid and returns three metrics: `iou` (Intersection-over-Union — penalizes both missed
// target area AND stray extra ink), `recall` (how much of the target got covered — ignores
// extra ink on its own), and `precision` (how much of the user's ink actually landed on target —
// ignores missed target area on its own). No AI, no network call — pure client-side geometry.
// Deciding pass/fail from these lives in the caller (DrawQuestion), combined with stroke count.
async function scoreDrawing(canvas, targetChar) {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) {}
  }
  const size = canvas.width;
  const refCanvas = document.createElement("canvas");
  refCanvas.width = size;
  refCanvas.height = size;
  const rctx = refCanvas.getContext("2d");
  renderReferenceGlyph(rctx, targetChar, size);

  const uctx = canvas.getContext("2d");
  const uData = uctx.getImageData(0, 0, size, size).data;
  const rData = rctx.getImageData(0, 0, size, size).data;
  function isInk(data, x, y) {
    const i = (y * size + x) * 4;
    return data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200;
  }

  const gridN = 32;
  const cell = size / gridN;
  let both = 0, either = 0, refFilled = 0, userFilled = 0;
  for (let gy = 0; gy < gridN; gy++) {
    for (let gx = 0; gx < gridN; gx++) {
      let uInk = false, rInk = false;
      for (let sy = 0; sy < 3 && !(uInk && rInk); sy++) {
        for (let sx = 0; sx < 3 && !(uInk && rInk); sx++) {
          const px = Math.min(size - 1, Math.floor(gx * cell + (sx + 0.5) * (cell / 3)));
          const py = Math.min(size - 1, Math.floor(gy * cell + (sy + 0.5) * (cell / 3)));
          if (isInk(uData, px, py)) uInk = true;
          if (isInk(rData, px, py)) rInk = true;
        }
      }
      if (uInk && rInk) both++;
      if (uInk || rInk) either++;
      if (rInk) refFilled++;
      if (uInk) userFilled++;
    }
  }
  return {
    iou: either > 0 ? both / either : 0,
    recall: refFilled > 0 ? both / refFilled : 0,
    precision: userFilled > 0 ? both / userFilled : 0,
  };
}

// Maximum wrong attempts allowed on a single handwriting question before the correct
// stroke-order guide is revealed automatically and the learner is let through to the next
// question (still counted as missed for scoring / "Perlu Diulang").
const MAX_DRAW_ATTEMPTS = 3;

// Renders `char` as a faint, dotted trace inside a light genkouyoushi-style guide box. The
// dots are sampled straight from the same real-font glyph scoreDrawing uses for grading above
// (same font, same fillText call) — so the traced shape is always the true character, never a
// hand-drawn approximation.
function drawStippledGlyph(canvas, char) {
  const size = canvas.width;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  // Faint centre cross + dashed border, like Japanese genkouyoushi practice paper.
  ctx.save();
  ctx.strokeStyle = "rgba(28,25,23,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(size / 2, 4); ctx.lineTo(size / 2, size - 4);
  ctx.moveTo(4, size / 2); ctx.lineTo(size - 4, size / 2);
  ctx.stroke();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(28,25,23,0.22)";
  ctx.strokeRect(2, 2, size - 4, size - 4);
  ctx.restore();

  const off = document.createElement("canvas");
  off.width = size; off.height = size;
  const octx = off.getContext("2d");
  renderReferenceGlyph(octx, char, size);
  const data = octx.getImageData(0, 0, size, size).data;
  const isInk = (x, y) => {
    const i = (y * size + x) * 4;
    return data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200;
  };

  const spacing = Math.max(3, Math.round(size / 32));
  const radius = spacing * 0.58;
  ctx.fillStyle = "rgba(28,25,23,0.68)";
  for (let y = 0; y < size; y += spacing) {
    for (let x = 0; x < size; x += spacing) {
      if (isInk(x, y)) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// Dotted trace box + numbered badges showing where each stroke begins, using the `points`
// data in strokeGuides.js — checked against real Noto Sans CJK JP glyph renders (not a blind
// guess), so the numbers land on the actual shape instead of a generic text-derived zone.
// `visibleCount` opsional: kalau diisi, cuma nomor goresan 1..visibleCount yang ditampilkan
// (dipakai animasi "Putar" di StrokeGuidePanel). Kalau tidak diisi, semua nomor tampil sekaligus
// seperti semula.
function StrokeOrderImage({ char, size = 140, visibleCount }) {
  const canvasRef = useRef(null);
  const guide = getStrokeGuide(char);

  useEffect(() => {
    if (canvasRef.current && char) drawStippledGlyph(canvasRef.current, char);
  }, [char]);

  if (!guide) return null;
  const shown = typeof visibleCount === "number" ? visibleCount : guide.points.length;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} width={size} height={size} className="rounded-xl bg-white" />
      {guide.points.map(([px, py], i) => {
        if (i >= shown) return null;
        const isLatest = i === shown - 1;
        return (
          <span
            key={i}
            className={`absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-700 text-[10px] font-bold text-white shadow transition-transform duration-300 ${
              isLatest ? "scale-125 ring-4 ring-amber-300" : ""
            }`}
            style={{ left: `${px * 100}%`, top: `${py * 100}%` }}
          >
            {i + 1}
          </span>
        );
      })}
    </div>
  );
}

const STROKE_ANIM_STEP_MS = 900;

// Full "how to write this" panel: dotted image + numbered steps — shown automatically once
// MAX_DRAW_ATTEMPTS is reached, or any time earlier via the optional "Lihat cara menulis" link.
// Auto-plays a step-by-step animation once when first shown (numbers appear one at a time,
// synced with the matching text step highlighting) — a stand-in for a real video, built from
// the same verified stroke data. "Putar Ulang" replays it any time.
function StrokeGuidePanel({ char }) {
  const guide = getStrokeGuide(char);
  const [visibleCount, setVisibleCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [wikiFailed, setWikiFailed] = useState(false);
  const [smallWikiFailed, setSmallWikiFailed] = useState(false);
  const timerRef = useRef(null);
  const wiki = resolveWikiAnimation(char);
  const useWiki = !!wiki && !wikiFailed && !(wiki.kind === "compound" && smallWikiFailed);

  function playAnimation() {
    if (!guide) return;
    clearInterval(timerRef.current);
    setPlaying(true);
    setVisibleCount(1);
    let count = 1;
    timerRef.current = setInterval(() => {
      count += 1;
      if (count > guide.steps.length) {
        clearInterval(timerRef.current);
        setPlaying(false);
        return;
      }
      setVisibleCount(count);
    }, STROKE_ANIM_STEP_MS);
  }

  useEffect(() => {
    setWikiFailed(false);
    setSmallWikiFailed(false);
    if (!useWiki) playAnimation();
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char]);

  if (!guide) return null;
  const activeIdx = playing ? visibleCount - 1 : -1;

  return (
    <div className="mt-4 w-full max-w-md rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-left">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-amber-800">Panduan Cara Menulis</p>
        <p className="text-xs font-semibold text-amber-700">{guide.strokes} goresan</p>
      </div>
      {/* Kotak gambar & daftar langkah berdampingan (bukan bertumpuk), supaya semuanya kelihatan
          tanpa perlu gulir jauh — daftar langkahnya sendiri yang scroll kalau kepanjangan. */}
      <div className="mt-3 flex gap-3">
        <div className="flex shrink-0 flex-col items-center gap-2">
          {useWiki && wiki.kind === "single" && (
            <img
              src={wiki.url}
              alt={`Animasi urutan goresan menulis ${char}`}
              width={140}
              height={140}
              onError={() => setWikiFailed(true)}
              className="rounded-xl border border-stone-200 bg-white object-contain"
              style={{ width: 140, height: 140 }}
            />
          )}
          {useWiki && wiki.kind === "compound" && (
            <div className="relative" style={{ width: 140, height: 140 }}>
              <img
                src={wiki.mainUrl}
                alt={`Animasi urutan goresan huruf utama ${char[0]}`}
                onError={() => setWikiFailed(true)}
                className="absolute left-0 top-0 rounded-xl border border-stone-200 bg-white object-contain"
                style={{ width: 96, height: 96 }}
              />
              <img
                src={wiki.smallUrl}
                alt={`Animasi urutan goresan huruf kecil ${char[1]}`}
                onError={() => setSmallWikiFailed(true)}
                className="absolute bottom-0 right-0 rounded-lg border border-stone-200 bg-white object-contain"
                style={{ width: 56, height: 56 }}
              />
            </div>
          )}
          {!useWiki && <StrokeOrderImage char={char} visibleCount={visibleCount} />}
          {!useWiki && (
            <button
              onClick={playAnimation}
              disabled={playing}
              type="button"
              className="flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-500 disabled:opacity-50"
            >
              <Play size={11} />
              {playing ? "Memutar..." : "Putar Ulang"}
            </button>
          )}
        </div>
        <ol className="max-h-52 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {guide.steps.map((step, i) => (
            <li
              key={i}
              className={`flex items-start gap-1.5 rounded-lg p-1.5 text-xs text-stone-700 transition-colors duration-300 ${
                i === activeIdx ? "bg-amber-200/70 font-semibold" : ""
              }`}
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-700 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-2 text-center text-[10px] text-amber-700">
        {useWiki
          ? "Animasi asli — Wikimedia Commons (domain publik)."
          : "Angka = urutan goresan (posisi perkiraan) — ikuti bentuk titik-titik samarnya."}
      </p>
    </div>
  );
}

// Freehand handwriting canvas for kana "menulis" questions. Works with mouse and touch.
// Checked automatically (no self-report) via scoreDrawing above. A wrong attempt shows the
// correct shape as a hint and loops back to drawing; after MAX_DRAW_ATTEMPTS wrong tries the
// full stroke-order guide is revealed and the question is marked done either way, so the
// learner is never stuck forever on one character.
function DrawQuestion({ current, onAttempt }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const strokeCountRef = useRef(0); // berapa kali pena diangkat-turunkan sejak kanvas terakhir bersih
  const [hasDrawn, setHasDrawn] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null); // null | "correct" | "incorrect"
  const [resolved, setResolved] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const capped = wrongAttempts >= MAX_DRAW_ATTEMPTS;

  function fillWhite() {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }
  useEffect(() => { fillWhite(); }, []);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const t = e.touches && e.touches.length ? e.touches[0] : null;
    return { x: (t ? t.clientX : e.clientX) - rect.left, y: (t ? t.clientY : e.clientY) - rect.top };
  }
  function startDraw(e) {
    if (checking || resolved || capped) return;
    e.preventDefault();
    isDrawing.current = true;
    strokeCountRef.current += 1;
    lastPos.current = getPos(e);
    setHasDrawn(true);
  }
  function drawMove(e) {
    if (!isDrawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }
  function endDraw() { isDrawing.current = false; }
  function clearCanvas() {
    if (checking || resolved || capped) return;
    fillWhite();
    setHasDrawn(false);
    setFeedback(null);
    strokeCountRef.current = 0;
  }

  async function checkAnswer() {
    if (checking || resolved || capped || !hasDrawn) return;
    setChecking(true);
    setFeedback(null);
    const { iou, recall, precision } = await scoreDrawing(canvasRef.current, current.correct);
    const isYoon = current.correct.length >= 2;

    let isCorrect;
    if (isYoon) {
      // Huruf yōon (kombinasi 2 karakter, mis. りゃ) jauh lebih sulit dicocokkan secara piksel
      // dengan akurat — dua bentuk beda ukuran dalam satu kotak kecil. Supaya orang yang sudah
      // menulis dengan benar tidak terus-menerus ditolak gara-gara ketatnya perbandingan
      // piksel, longgarkan standarnya di sini dan JANGAN ikut standar ketat jumlah-goresan
      // (perkiraan jumlah goresan untuk yōon kurang bisa diandalkan dibanding huruf tunggal).
      isCorrect = iou >= 0.22 || recall >= 0.45;
    } else {
      // Jumlah goresan (berapa kali pena diangkat) itu sinyal kuat khusus huruf tunggal: huruf
      // yang jumlah/pola goresannya jauh berbeda dari seharusnya kemungkinan besar salah
      // walau kebetulan menyentuh area yang mirip. Kalau jauh beda (selisih ≥ 2), naikkan
      // standar kecocokan bentuknya jauh lebih ketat — kalau dekat/sama, pakai standar normal.
      const guide = getStrokeGuide(current.correct);
      const expected = guide ? guide.strokes : null;
      const strokeFarOff = expected != null && Math.abs(strokeCountRef.current - expected) >= 2;
      const iouMin = strokeFarOff ? 0.55 : 0.40;
      const recallMin = strokeFarOff ? 0.85 : 0.70;
      const precisionMin = strokeFarOff ? 0.55 : 0.40;
      // Lolos kalau bentuknya benar-benar mirip secara keseluruhan (IoU tinggi — ini menghukum
      // baik area yang terlewat MAUPUN coretan berlebih di luar target), ATAU kalau sudah
      // menutupi hampir semua target TANPA banyak coretan di luar target (recall & precision
      // dua-duanya cukup tinggi).
      isCorrect = iou >= iouMin || (recall >= recallMin && precision >= precisionMin);
    }
    setChecking(false);

    if (isCorrect) {
      setFeedback("correct");
      setResolved(true);
      onAttempt(true);
      return;
    }

    const nextWrong = wrongAttempts + 1;
    setWrongAttempts(nextWrong);
    setFeedback("incorrect");
    if (nextWrong >= MAX_DRAW_ATTEMPTS) {
      // Out of attempts: the guide below renders automatically (capped === true), and the
      // parent is told to mark this question as done so the learner can move on.
      onAttempt(false, { capped: true });
    } else {
      onAttempt(false); // logs a miss for "Perlu Diulang" even though the question stays open
    }
  }

  return (
    <div className="mt-6 flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={260}
        height={260}
        onMouseDown={startDraw}
        onMouseMove={drawMove}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={drawMove}
        onTouchEnd={endDraw}
        className="touch-none rounded-xl border-2 border-stone-300 bg-white shadow-sm"
      />
      {!resolved && !capped && (
        <p className="mt-2 text-xs text-stone-400">Percobaan ke-{wrongAttempts + 1} dari {MAX_DRAW_ATTEMPTS}</p>
      )}
      {!capped && (
        <div className="mt-3 flex gap-2">
          <button onClick={clearCanvas} disabled={checking || resolved} type="button" className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-200 disabled:opacity-40">
            <Eraser size={14} /> Hapus
          </button>
          {!resolved && (
            <button onClick={checkAnswer} disabled={!hasDrawn || checking} type="button" className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-40">
              {checking ? "Memeriksa..." : "Periksa Jawaban"}
            </button>
          )}
        </div>
      )}
      {feedback === "incorrect" && !capped && (
        <div className="mt-4 text-center">
          <p className="text-sm font-semibold text-rose-600">Belum sesuai, coba lagi ya!</p>
          <p className="mt-2 text-xs text-stone-500">Bentuk yang benar:</p>
          <p className="font-display text-4xl font-bold text-stone-700">{current.correct}</p>
        </div>
      )}
      {resolved && (
        <p className="mt-4 font-display text-2xl font-bold text-emerald-600">Benar! ✓</p>
      )}
      {capped && (
        <p className="mt-4 text-center text-sm font-semibold text-rose-600">
          Sudah {MAX_DRAW_ATTEMPTS}x percobaan — ini cara menulisnya yang benar:
        </p>
      )}
      {!resolved && !capped && !showGuide && (
        <button
          onClick={() => setShowGuide(true)}
          type="button"
          className="mt-3 text-xs font-semibold text-stone-400 underline decoration-dotted hover:text-red-700"
        >
          Lihat cara menulis
        </button>
      )}
      {(capped || (!resolved && showGuide)) && <StrokeGuidePanel char={current.correct} />}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <div className="font-display text-2xl font-bold text-red-700">Nihongo Step</div>
      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-red-700" />
      </div>
    </div>
  );
}

function DesktopSidebar({ route, setRoute }) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-stone-200 bg-white px-4 py-8 md:flex">
      <div className="mb-8 px-2">
        <p className="font-display text-lg font-bold text-red-700">Nihongo Step</p>
        <p className="text-xs text-stone-400">Satu Langkah Setiap Hari</p>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(route, item);
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setRoute(item.route)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-200 ${active ? "bg-red-50 text-red-700" : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"}`}
              type="button"
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileBottomNav({ route, setRoute }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-stone-200 bg-white md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(route, item);
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => setRoute(item.route)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${active ? "text-red-700" : "text-stone-400"}`}
            type="button"
          >
            <Icon size={20} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

/* =========================================================================
   VIEWS
   ========================================================================= */

function findNextStop(data) {
  for (const cat of CATEGORY_ORDER) {
    if (!isCategoryUnlocked(data, cat)) continue;
    for (const level of CATEGORY_META[cat].levels) {
      const st = data.categories[cat].levelStatus[level.id];
      if (!st || !st.passed) {
        return { title: `${CATEGORY_META[cat].label} · Level ${level.id}`, route: { view: "materi", category: cat, levelId: level.id } };
      }
    }
  }
  return null;
}

// Kecil, non-intrusif: menunjukkan akun mana yang aktif & apakah progres ini disinkron
// real-time (Firebase sudah disetel di src/firebaseConfig.js), plus tautan ganti akun.
function SyncStatusBadge({ account, onSwitchAccount }) {
  if (!isFirebaseEnabled()) {
    return (
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-500">
        <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
        Mode lokal
      </span>
    );
  }
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span
        className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
        title="Progres disinkron real-time lewat Firebase"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Real-time · {account && account.displayName}
      </span>
      {onSwitchAccount && (
        <button
          onClick={onSwitchAccount}
          type="button"
          className="text-[10px] font-semibold text-stone-400 underline decoration-dotted hover:text-red-700"
        >
          Ganti akun
        </button>
      )}
    </div>
  );
}

// Layar "masuk" sebelum masuk ke aplikasi utama — hanya muncul kalau Firebase aktif. Sengaja
// tanpa kata sandi: ketik nama apa saja untuk membuat akun baru, atau pilih salah satu nama
// yang sudah ada untuk langsung membuka progres itu. Siapa pun yang tahu/melihat nama sebuah
// akun bisa masuk ke akun itu — ini memang by design (bebas, bukan sistem akun yang aman).
function AccountGate({ onEnter }) {
  const [name, setName] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeAccountList(setAccounts);
    return unsubscribe;
  }, []);

  function enterWith(rawName) {
    const slug = slugifyAccountName(rawName);
    if (!slug) {
      setError("Nama tidak boleh kosong — pakai setidaknya satu huruf atau angka.");
      return;
    }
    const displayName = rawName.trim() || slug;
    const account = { slug, displayName };
    try {
      window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
    } catch (e) {
      // best effort
    }
    onEnter(account);
  }

  function handleDelete(a) {
    const ok = window.confirm(
      `Hapus akun "${a.displayName}"? Semua progresnya akan hilang permanen dan tidak bisa dikembalikan. Kalau ada yang masuk lagi dengan nama ini nanti, progresnya mulai dari nol.`
    );
    if (!ok) return;
    deleteAccountProgress(a.slug);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="font-display text-2xl font-bold text-stone-900">Masuk ke Nihongo Step</p>
      <p className="mt-2 text-sm text-stone-500">
        Ketik nama apa saja. Nama baru akan membuat progres baru; nama yang sudah pernah
        dipakai akan membuka progres yang sama — tidak ada kata sandi, jadi siapa pun yang
        tahu namanya bisa ikut masuk.
      </p>
      <form
        onSubmit={(e) => { e.preventDefault(); enterWith(name); }}
        className="mt-5 flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="Nama kamu"
          autoFocus
          className="flex-1 rounded-lg border-2 border-stone-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
        >
          Masuk
        </button>
      </form>
      {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}

      {accounts.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Atau masuk sebagai:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {accounts.map((a) => (
              <div
                key={a.slug}
                className="flex items-center gap-1 rounded-full bg-stone-100 py-1 pl-3 pr-1.5"
              >
                <button
                  onClick={() => enterWith(a.displayName)}
                  type="button"
                  className="text-sm font-semibold text-stone-700 hover:text-red-700"
                >
                  {a.displayName}
                </button>
                <button
                  onClick={() => handleDelete(a)}
                  type="button"
                  title={`Hapus akun "${a.displayName}"`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-stone-400 hover:bg-rose-100 hover:text-rose-600"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-stone-400">
            Tanda × di sebelah nama untuk menghapus akun itu beserta progresnya.
          </p>
        </div>
      )}
    </div>
  );
}

function DashboardView({ data, onNavigate, account, onSwitchAccount }) {
  const overall = overallProgressPct(data);
  const nextStop = findNextStop(data);
  const earnedBadges = BADGES.filter((b) => data.badges.includes(b.id));
  const week = currentWeekDates();
  const weekLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const userLvl = Math.floor(data.xp / 100) + 1;
  const today = todayStr();

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-bold text-stone-900">Selamat datang, Namily!</p>
          <p className="mt-1 text-sm text-stone-500">Satu langkah setiap hari membawamu semakin dekat.</p>
        </div>
        <SyncStatusBadge account={account} onSwitchAccount={onSwitchAccount} />
      </div>

      <div className="rounded-2xl bg-red-700 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-red-100">Progress Keseluruhan</p>
            <p className="font-display text-3xl font-bold">{overall}%</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-red-900/40 px-3 py-1.5">
            <Star size={16} className="text-amber-300" />
            <span className="text-sm font-semibold">Lv.{userLvl} · {data.xp} XP</span>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-red-900/40">
          <div className="h-full rounded-full bg-amber-300" style={{ width: `${overall}%` }} />
        </div>
      </div>

      {nextStop && (
        <button
          onClick={() => onNavigate(nextStop.route)}
          className="flex w-full items-center justify-between rounded-2xl border border-red-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-200"
          type="button"
        >
          <span>
            <span className="block text-xs font-medium text-red-700">Lanjutkan Belajar</span>
            <span className="block font-display text-base font-bold text-stone-900">{nextStop.title}</span>
          </span>
          <ArrowRight className="shrink-0 text-red-700" size={22} />
        </button>
      )}
      {!nextStop && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="font-display text-base font-bold text-amber-800">Semua level selesai! 🎉</p>
          <p className="mt-1 text-sm text-amber-700">Buka halaman Latihan kapan saja untuk mengulang materi.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CATEGORY_ORDER.map((cat) => {
          const meta = CATEGORY_META[cat];
          const pct = categoryProgressPct(data, cat);
          const locked = !isCategoryUnlocked(data, cat);
          return (
            <button
              key={cat}
              disabled={locked}
              onClick={() => onNavigate({ view: "hub", mode: "belajar", category: cat })}
              className={`rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-200 ${locked ? "cursor-not-allowed border-stone-200 bg-stone-100 opacity-60" : "border-stone-200 bg-white hover:border-red-200 hover:shadow-md"}`}
              type="button"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-stone-800">{meta.label}</span>
                {locked && <Lock size={14} className="text-stone-400" />}
              </div>
              <p className="mt-1 font-display text-lg font-semibold text-stone-400">{meta.sample}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-red-700" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-stone-500">{pct}% selesai</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Flame className={data.streak.count > 0 ? "text-amber-500" : "text-stone-300"} size={20} />
          <span className="font-display text-base font-bold text-stone-800">{data.streak.count} Hari Berturut-turut</span>
        </div>
        <div className="mt-3 flex justify-between">
          {week.map((d, i) => {
            const studied = data.streak.studiedDates.includes(d);
            const isFuture = d > today;
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <span className="text-xs text-stone-400">{weekLabels[i]}</span>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${studied ? "bg-amber-400 text-white" : isFuture ? "bg-stone-50 text-stone-300" : "bg-stone-100 text-stone-400"}`}>
                  {studied ? <CheckCircle size={14} /> : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {earnedBadges.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="mb-3 font-display text-sm font-bold text-stone-800">Lencana</p>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((b) => (
              <span key={b.id} title={b.desc} className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                <span>{b.icon}</span>{b.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LevelPath({ levels, category, data, onSelectLevel }) {
  const ls = data.categories[category].levelStatus;
  return (
    <div className="relative pl-2">
      <div className="absolute bottom-3 left-7 top-3 border-l-2 border-dashed border-stone-300" />
      <div className="flex flex-col">
        {levels.map((level) => {
          const passed = !!(ls[level.id] && ls[level.id].passed);
          const unlocked = level.id === 1 || !!(ls[level.id - 1] && ls[level.id - 1].passed);
          const status = passed ? "passed" : unlocked ? "available" : "locked";
          return (
            <button
              key={level.id}
              onClick={() => status !== "locked" && onSelectLevel(level)}
              disabled={status === "locked"}
              className={`relative z-10 flex items-center gap-4 pb-7 text-left last:pb-0 focus:outline-none ${status === "locked" ? "cursor-not-allowed" : ""}`}
              type="button"
            >
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-stone-50 font-display text-lg font-bold shadow-sm ${status === "locked" ? "bg-stone-200 text-stone-400" : status === "passed" ? "bg-emerald-500 text-white" : "animate-pulse bg-red-700 text-white"}`}>
                {status === "locked" ? <Lock size={18} /> : status === "passed" ? <CheckCircle size={22} /> : level.id}
              </span>
              <span className={`flex-1 rounded-2xl border px-4 py-3 shadow-sm ${status === "locked" ? "border-stone-200 bg-stone-100" : "border-stone-200 bg-white"}`}>
                <span className="block text-sm font-semibold text-stone-800">Level {level.id}</span>
                <span className="block text-xs text-stone-500">{level.title}</span>
                {status !== "locked" && ls[level.id] && (
                  <span className="mt-1 block text-xs font-medium text-stone-400">Skor terbaik: {ls[level.id].bestScore}%</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HubView({ mode, category, data, onPickCategory, onBackToCategories, onSelectLevel }) {
  const modeLabels = { belajar: "Belajar", latihan: "Latihan", tes: "Tes" };

  if (!category) {
    return (
      <div className="space-y-4 pb-6">
        <h1 className="font-display text-xl font-bold text-stone-900">{modeLabels[mode]}</h1>
        <div className="space-y-3">
          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            const locked = !isCategoryUnlocked(data, cat);
            const pct = categoryProgressPct(data, cat);
            return (
              <button
                key={cat}
                disabled={locked}
                onClick={() => onPickCategory(cat)}
                className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-200 ${locked ? "cursor-not-allowed border-stone-200 bg-stone-100 opacity-60" : "border-stone-200 bg-white hover:border-red-200 hover:shadow-md"}`}
                type="button"
              >
                <span>
                  <span className="font-display block text-base font-bold text-stone-900">{meta.label}</span>
                  <span className="block font-display text-lg text-stone-400">{meta.sample}</span>
                  <span className="mt-1 block text-xs text-stone-500">{pct}% selesai</span>
                </span>
                {locked ? <Lock className="shrink-0 text-stone-400" size={20} /> : <ChevronRight className="shrink-0 text-stone-300" size={20} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const meta = CATEGORY_META[category];
  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2">
        <button onClick={onBackToCategories} className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-red-200" type="button">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display text-xl font-bold text-stone-900">{meta.label} · {modeLabels[mode]}</h1>
      </div>
      <LevelPath levels={meta.levels} category={category} data={data} onSelectLevel={(level) => onSelectLevel(category, level.id)} />
    </div>
  );
}

function MateriView({ category, levelId, onBack, onStartPractice, onStartWrite, onStartTest }) {
  const level = getLevelSet(category, levelId);
  const isVocab = CATEGORY_META[category].isVocab;
  if (!level) return null;
  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-red-200" type="button">
          <ChevronLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-semibold text-red-700">{CATEGORY_META[category].label} · Level {levelId}</p>
          <p className="font-display text-lg font-bold text-stone-900">{level.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {isVocab ? level.words.map((w) => (
          <div key={w.kanji || w.reading} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-xl font-bold text-stone-900">{w.kanji || w.reading}</p>
              <SpeakerButton text={w.reading || w.kanji} />
            </div>
            {w.kanji && <p className="text-sm text-stone-500">{w.reading}</p>}
            <p className="mt-1 text-xs font-semibold text-red-700">{w.romaji} · {w.meaning}</p>
            <p className="mt-2 text-xs leading-relaxed text-stone-400">{w.example}</p>
          </div>
        )) : level.chars.map((c) => (
          <div key={c.char} className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="font-display text-3xl font-bold text-stone-900">{c.char}</p>
            <p className="mt-1 text-sm font-semibold text-stone-500">{c.romaji}</p>
            <SpeakerButton text={c.char} className="mt-2" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button onClick={onStartPractice} className="rounded-xl bg-red-700 py-3 text-center font-semibold text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-300" type="button">Mulai Latihan</button>
        <button onClick={onStartWrite} className="rounded-xl border-2 border-red-200 bg-white py-3 text-center font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200" type="button">{isVocab ? "Latihan Menulis (Ketik)" : "Latihan Menulis (Tangan)"}</button>
        <button onClick={onStartTest} className="rounded-xl bg-stone-100 py-3 text-center font-semibold text-stone-700 transition hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300" type="button">Mulai Tes</button>
      </div>
    </div>
  );
}

function LatihanChoiceView({ category, levelId, onBack, onChooseMc, onChooseWrite }) {
  const level = getLevelSet(category, levelId);
  const isVocab = CATEGORY_META[category].isVocab;
  if (!level) return null;
  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-red-200" type="button">
          <ChevronLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-semibold text-red-700">{CATEGORY_META[category].label} · Level {levelId}</p>
          <p className="font-display text-lg font-bold text-stone-900">{level.title}</p>
        </div>
      </div>
      <p className="text-sm text-stone-500">Pilih jenis latihan:</p>
      <div className="flex flex-col gap-3">
        <button onClick={onChooseMc} className="rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-red-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-200" type="button">
          <span className="font-display block text-base font-bold text-stone-900">Pilihan Ganda</span>
          <span className="block text-xs text-stone-500">Pilih jawaban dari 4 opsi</span>
        </button>
        <button onClick={onChooseWrite} className="rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-red-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-200" type="button">
          <span className="font-display block text-base font-bold text-stone-900">Menulis</span>
          <span className="block text-xs text-stone-500">{isVocab ? "Ketik sendiri artinya" : "Tulis hurufnya dengan tangan — maks. 3x salah, lalu dapat panduan cara menulis"}</span>
        </button>
      </div>
    </div>
  );
}

function QuizView({ data, category, levelId, mode, questionType, customBank, onExit, onFinish, onRetry, onPassContinue }) {
  const bank = useMemo(() => customBank || getBankForLevel(category, levelId, questionType), [category, levelId, customBank, questionType]);
  const questionCount = mode === "test" ? 10 : 8;
  const usedIds = levelId != null ? (data.categories[category].questionHistory[levelId] || []) : [];
  const [session] = useState(() => pickQuestions(bank, usedIds, questionCount));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [writeInput, setWriteInput] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [missedKeysList, setMissedKeysList] = useState([]);
  const [correctKeysList, setCorrectKeysList] = useState([]);
  const [phase, setPhase] = useState("active");
  const [resultInfo, setResultInfo] = useState(null);

  // Rayakan dengan confetti sekali saja, tepat saat layar hasil tes yang LULUS muncul.
  useEffect(() => {
    if (mode === "test" && phase === "result" && resultInfo && resultInfo.passed) {
      launchConfetti();
    }
  }, [phase, resultInfo, mode]);

  const questions = session.selected;
  const current = questions[index];

  function selectOption(opt) {
    if (answered || !current) return;
    setSelected(opt);
    setAnswered(true);
    if (opt === current.correct) {
      setCorrectCount((c) => c + 1);
      setCorrectKeysList((k) => [...k, current.key]);
    } else {
      setMissedKeysList((k) => [...k, current.key]);
    }
  }

  function submitWrite() {
    if (answered || !current || !writeInput.trim()) return;
    const isCorrect = writeInput.trim().toLowerCase() === current.correct.trim().toLowerCase();
    setSelected(isCorrect ? current.correct : writeInput.trim());
    setAnswered(true);
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setCorrectKeysList((k) => [...k, current.key]);
    } else {
      setMissedKeysList((k) => [...k, current.key]);
    }
  }

  function handleDrawAttempt(isCorrect, opts = {}) {
    if (answered || !current) return;
    if (isCorrect) {
      setSelected(current.correct);
      setAnswered(true);
      setCorrectCount((c) => c + 1);
      setCorrectKeysList((k) => [...k, current.key]);
    } else {
      // Wrong attempt: logged for "Perlu Diulang". Below the 3-attempt cap the question stays
      // open — the canvas component itself requires another try before this can resolve to
      // correct. At the cap, DrawQuestion has already revealed the writing guide, so mark this
      // question as done (as missed) so the learner isn't stuck forever on one character.
      setMissedKeysList((k) => [...k, current.key]);
      if (opts.capped) {
        setSelected(null);
        setAnswered(true);
      }
    }
  }

  function goNext() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
      setWriteInput("");
    } else {
      const result = onFinish({
        category, levelId, mode,
        newUsedIds: session.newUsedIds,
        missedKeys: missedKeysList,
        correctKeys: correctKeysList,
        correctCount, totalCount: questions.length,
      });
      setResultInfo(result);
      setPhase("result");
    }
  }

  const modeTitle = mode === "test" ? "Tes" : mode === "review" ? "Latihan Fokus" : (questionType === "write" ? "Latihan Menulis" : "Latihan");

  if (phase === "result" && resultInfo) {
    return (
      <div className="pb-6 text-center">
        <button onClick={onExit} className="ml-auto flex rounded-full p-2 text-stone-400 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-red-200" type="button">
          <X size={20} />
        </button>
        {mode === "test" ? (
          <>
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${resultInfo.passed ? "bg-emerald-100" : "bg-stone-100"}`}>
              {resultInfo.passed ? <Trophy className="text-emerald-600" size={36} /> : <RotateCcw className="text-stone-400" size={32} />}
            </div>
            <p className="mt-4 font-display text-2xl font-bold text-stone-900">{resultInfo.scorePct}%</p>
            <p className="text-sm font-semibold text-stone-500">{scoreLabel(resultInfo.scorePct)}</p>
            <p className="mt-2 text-sm text-stone-600">{correctCount} dari {questions.length} benar · +{resultInfo.xpEarned} XP</p>
            {!resultInfo.passed && missedKeysList.length > 0 && (
              <div className="mx-auto mt-4 max-w-xs rounded-xl border border-rose-200 bg-rose-50 p-3 text-left">
                <p className="text-xs font-semibold text-rose-700">Perlu dipelajari lagi:</p>
                <p className="mt-1 font-display text-base text-rose-800">{[...new Set(missedKeysList)].join("  ")}</p>
              </div>
            )}
            <div className="mx-auto mt-6 flex max-w-xs flex-col gap-2">
              {resultInfo.passed ? (
                <button onClick={onPassContinue} className="rounded-xl bg-red-700 py-3 font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-300" type="button">Lanjutkan</button>
              ) : (
                <button onClick={onRetry} className="rounded-xl bg-red-700 py-3 font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-300" type="button">Coba Lagi</button>
              )}
              <button onClick={onExit} className="rounded-xl bg-stone-100 py-3 font-semibold text-stone-600 hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300" type="button">Kembali</button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <Sparkles className="text-amber-500" size={32} />
            </div>
            <p className="mt-4 font-display text-2xl font-bold text-stone-900">{correctCount} / {questions.length} benar</p>
            <p className="mt-1 text-sm text-stone-600">+{resultInfo.xpEarned} XP</p>
            <div className="mx-auto mt-6 flex max-w-xs flex-col gap-2">
              <button onClick={onRetry} className="rounded-xl bg-red-700 py-3 font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-300" type="button">Latihan Lagi</button>
              <button onClick={onExit} className="rounded-xl bg-stone-100 py-3 font-semibold text-stone-600 hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300" type="button">Kembali</button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="pb-6">
      <div className="mb-1 flex items-center justify-between">
        <button onClick={onExit} className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-red-200" type="button">
          <X size={20} />
        </button>
        <span className="text-sm font-semibold text-stone-500">{modeTitle} · {index + 1} / {questions.length}</span>
        <span className="w-9" />
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-red-700 transition-all" style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>

      <div className="mt-8 text-center">
        <p className="font-display text-3xl font-bold text-stone-900 sm:text-4xl">{current.prompt}</p>
      </div>

      {current.type === "draw" ? (
        <DrawQuestion key={current.id} current={current} onAttempt={handleDrawAttempt} />
      ) : current.type === "write" ? (
        <div className="mt-8">
          <input
            type="text"
            value={writeInput}
            onChange={(e) => setWriteInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitWrite(); }}
            disabled={answered}
            autoFocus
            placeholder="Ketik jawabanmu di sini..."
            className="w-full rounded-xl border-2 border-stone-200 px-4 py-3 text-center font-body text-lg focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:bg-stone-50"
          />
          {!answered && (
            <button onClick={submitWrite} className="mt-3 w-full rounded-xl bg-red-700 py-3 text-center font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-300" type="button">
              Periksa Jawaban
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {current.options.map((opt) => {
            let stateClass = "border-stone-200 bg-white hover:border-red-300";
            if (answered) {
              if (opt === current.correct) stateClass = "border-emerald-400 bg-emerald-50 text-emerald-700";
              else if (opt === selected) stateClass = "border-rose-400 bg-rose-50 text-rose-700";
              else stateClass = "border-stone-200 bg-white opacity-50";
            }
            return (
              <button
                key={opt}
                onClick={() => selectOption(opt)}
                disabled={answered}
                className={`rounded-xl border-2 px-4 py-3 text-left font-body text-base font-medium transition focus:outline-none focus:ring-2 focus:ring-red-200 ${stateClass}`}
                type="button"
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {answered && current.type !== "draw" && (
        <div className="mt-6 rounded-xl bg-stone-100 p-4">
          {current.type === "write" && (
            <p className={`mb-2 font-display text-lg font-bold ${selected === current.correct ? "text-emerald-600" : "text-rose-600"}`}>
              {selected === current.correct ? "Benar!" : `Jawaban yang benar: ${current.correct}`}
            </p>
          )}
          <p className="text-sm text-stone-600">{current.explanation}</p>
          <button onClick={goNext} className="mt-3 w-full rounded-xl bg-red-700 py-3 text-center font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-300" type="button">
            {index + 1 < questions.length ? "Lanjut" : "Lihat Hasil"}
          </button>
        </div>
      )}
      {answered && current.type === "draw" && (
        <div className="mt-4 text-center">
          <p className="mb-3 text-sm text-stone-600">{current.explanation}</p>
          <button onClick={goNext} className="mx-auto w-full max-w-xs rounded-xl bg-red-700 py-3 text-center font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-300" type="button">
            {index + 1 < questions.length ? "Lanjut" : "Lihat Hasil"}
          </button>
        </div>
      )}
    </div>
  );
}

function ProgressPageView({ data }) {
  return (
    <div className="space-y-6 pb-6">
      <h1 className="font-display text-xl font-bold text-stone-900">Progress Belajar</h1>
      {CATEGORY_ORDER.map((cat) => {
        const meta = CATEGORY_META[cat];
        const pct = categoryProgressPct(data, cat);
        return (
          <div key={cat} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-bold text-stone-800">{meta.label}</span>
              <span className="text-sm font-semibold text-red-700">{pct}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-red-700" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {meta.levels.map((lvl) => {
                const st = data.categories[cat].levelStatus[lvl.id];
                const passed = st && st.passed;
                return (
                  <div key={lvl.id} className={`flex flex-col items-center rounded-lg border py-2 text-xs ${passed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-stone-50 text-stone-400"}`}>
                    <span className="font-semibold">L{lvl.id}</span>
                    <span>{st ? `${st.bestScore}%` : "-"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewPageView({ data, onStartFocused }) {
  const anyReview = CATEGORY_ORDER.some((cat) => Object.keys(data.categories[cat].wrongCounts).length > 0);
  if (!anyReview) {
    return (
      <div className="space-y-3 py-16 pb-6 text-center">
        <Sparkles className="mx-auto text-amber-400" size={36} />
        <p className="font-display text-lg font-bold text-stone-800">Belum ada yang perlu diulang</p>
        <p className="text-sm text-stone-500">Teruslah berlatih — catatan kesalahanmu akan muncul di sini.</p>
      </div>
    );
  }
  return (
    <div className="space-y-5 pb-6">
      <h1 className="font-display text-xl font-bold text-stone-900">Perlu Diulang</h1>
      {CATEGORY_ORDER.map((cat) => {
        const meta = CATEGORY_META[cat];
        const wc = data.categories[cat].wrongCounts;
        const entries = Object.entries(wc).sort((a, b) => b[1] - a[1]).slice(0, 8);
        if (entries.length === 0) return null;
        return (
          <div key={cat} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="font-display text-sm font-bold text-stone-800">{meta.label}</p>
            <p className="mt-1 text-xs text-stone-500">Kamu sering salah di bagian ini:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {entries.map(([key, count]) => (
                <span key={key} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 font-display text-sm font-semibold text-rose-700">
                  {key} <span className="text-xs font-normal text-rose-400">×{count}</span>
                </span>
              ))}
            </div>
            <button onClick={() => onStartFocused(cat, entries.map(([k]) => k))} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-800 focus:outline-none" type="button">
              Latih Fokus <ArrowRight size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================================
   ROOT APP
   ========================================================================= */

const ACCOUNT_STORAGE_KEY = "nihongo-step-account";

export default function NihongoStepApp() {
  const firebaseOn = isFirebaseEnabled();
  const [account, setAccount] = useState(() => {
    if (!firebaseOn) return null; // mode lokal: tidak butuh akun sama sekali
    try {
      const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  function handleSwitchAccount() {
    try { window.localStorage.removeItem(ACCOUNT_STORAGE_KEY); } catch (e) {}
    setAccount(null);
  }

  // Firebase aktif tapi belum ada akun terpilih di perangkat ini -> tampilkan layar masuk dulu.
  if (firebaseOn && !account) {
    return <AccountGate onEnter={setAccount} />;
  }

  return (
    <NihongoStepAppInner
      account={account}
      onSwitchAccount={firebaseOn ? handleSwitchAccount : null}
    />
  );
}

function NihongoStepAppInner({ account, onSwitchAccount }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState({ view: "dashboard" });
  const [quizNonce, setQuizNonce] = useState(0);
  const slug = account && account.slug;

  // Progres: kalau firebaseConfig sudah diisi (lihat src/firebaseConfig.js) DAN sebuah akun
  // sudah dipilih lewat AccountGate, progres akun itu di Firebase Realtime Database jadi
  // SATU-SATUNYA sumber kebenaran begitu akun itu aktif — kalau datanya kosong (akun baru
  // ATAU baru saja direset manual lewat Firebase Console), mulai dari nol. Sengaja TIDAK
  // ditimpa lagi dari cadangan lokal lama, supaya reset manual di Firebase Console benar-benar
  // berlaku (sebelumnya ini jadi bug: data yang dihapus manual otomatis "hidup lagi" dari
  // cadangan lokal browser yang masih membuka halaman itu). Kalau Firebase belum disetel,
  // aplikasi berjalan seperti biasa dengan penyimpanan lokal per-perangkat saja.
  useEffect(() => {
    let alive = true;
    let unsubscribe = () => {};

    if (isFirebaseEnabled() && slug) {
      unsubscribe = subscribeUserProgress(slug, (remote) => {
        if (!alive) return;
        const merged = remote ? mergeWithDefaults(remote) : createDefaultState();
        setData((prev) => (prev && prev._syncedAt > merged._syncedAt ? prev : merged));
        setLoading(false);
      });
    } else {
      loadProgress().then((localLoaded) => {
        if (alive) {
          setData(localLoaded);
          setLoading(false);
        }
      });
    }

    return () => { alive = false; unsubscribe(); };
  }, [slug]);

  const mutate = useCallback((updater) => {
    setData((prev) => {
      const next = {
        ...updater(prev),
        _syncedAt: Date.now(),
        displayName: account && account.displayName,
      };
      persistProgress(next);
      if (isFirebaseEnabled() && slug) pushUserProgress(slug, next);
      return next;
    });
  }, [slug, account]);

  function goToQuiz(params) {
    setQuizNonce((n) => n + 1);
    setRoute({ view: "quiz", ...params });
  }

  function handleQuizFinish(payload) {
    const { next, scorePct } = finishSession({ state: data, ...payload });
    mutate(() => next);
    const xpEarned = payload.correctCount * (payload.mode === "test" ? 20 : 10);
    return { scorePct, passed: scorePct >= 80, xpEarned };
  }

  function handlePassContinue(category, levelId) {
    const levels = CATEGORY_META[category].levels;
    const nextLevel = levels.find((l) => l.id === levelId + 1);
    if (nextLevel) setRoute({ view: "materi", category, levelId: nextLevel.id });
    else setRoute({ view: "hub", mode: "belajar", category });
  }

  function startReview(category, keys) {
    const levels = CATEGORY_META[category].levels;
    let bank;
    if (category === "vocabulary") {
      const items = keys.map((k) => findVocabByKey(levels, k)).filter(Boolean);
      bank = buildFocusedVocabBank(items, levels);
    } else {
      const items = keys.map((k) => findKanaByChar(levels, k)).filter(Boolean);
      bank = buildFocusedKanaBank(items, levels);
    }
    goToQuiz({ category, levelId: null, mode: "review", customBank: bank });
  }

  function renderView() {
    if (route.view === "dashboard") return <DashboardView data={data} onNavigate={setRoute} account={account} onSwitchAccount={onSwitchAccount} />;

    if (route.view === "hub") {
      return (
        <HubView
          mode={route.mode}
          category={route.category}
          data={data}
          onPickCategory={(category) => setRoute({ view: "hub", mode: route.mode, category })}
          onBackToCategories={() => setRoute({ view: "hub", mode: route.mode })}
          onSelectLevel={(category, levelId) => {
            if (route.mode === "belajar") setRoute({ view: "materi", category, levelId });
            else if (route.mode === "latihan") setRoute({ view: "latihan-choice", category, levelId });
            else goToQuiz({ category, levelId, mode: "test", questionType: "mixed" });
          }}
        />
      );
    }

    if (route.view === "latihan-choice") {
      return (
        <LatihanChoiceView
          category={route.category}
          levelId={route.levelId}
          onBack={() => setRoute({ view: "hub", mode: "latihan", category: route.category })}
          onChooseMc={() => goToQuiz({ category: route.category, levelId: route.levelId, mode: "practice", questionType: "mc" })}
          onChooseWrite={() => goToQuiz({ category: route.category, levelId: route.levelId, mode: "practice", questionType: "write" })}
        />
      );
    }

    if (route.view === "materi") {
      return (
        <MateriView
          category={route.category}
          levelId={route.levelId}
          onBack={() => setRoute({ view: "hub", mode: "belajar", category: route.category })}
          onStartPractice={() => goToQuiz({ category: route.category, levelId: route.levelId, mode: "practice", questionType: "mc" })}
          onStartWrite={() => goToQuiz({ category: route.category, levelId: route.levelId, mode: "practice", questionType: "write" })}
          onStartTest={() => goToQuiz({ category: route.category, levelId: route.levelId, mode: "test", questionType: "mixed" })}
        />
      );
    }

    if (route.view === "quiz") {
      return (
        <QuizView
          key={`${route.category}-${route.levelId}-${route.mode}-${route.questionType}-${quizNonce}`}
          data={data}
          category={route.category}
          levelId={route.levelId}
          mode={route.mode}
          questionType={route.questionType}
          customBank={route.customBank}
          onExit={() => {
            if (route.mode === "test") setRoute({ view: "hub", mode: "tes", category: route.category });
            else if (route.mode === "practice") setRoute({ view: "hub", mode: "latihan", category: route.category });
            else setRoute({ view: "review" });
          }}
          onFinish={handleQuizFinish}
          onRetry={() => goToQuiz({ category: route.category, levelId: route.levelId, mode: route.mode, questionType: route.questionType, customBank: route.customBank })}
          onPassContinue={() => handlePassContinue(route.category, route.levelId)}
        />
      );
    }

    if (route.view === "progress") return <ProgressPageView data={data} />;
    if (route.view === "review") return <ReviewPageView data={data} onStartFocused={startReview} />;
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 font-body text-stone-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&family=Noto+Sans+JP:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif; }
        .font-body { font-family: 'Noto Sans JP', sans-serif; }
      `}</style>
      {loading || !data ? (
        <LoadingScreen />
      ) : (
        <>
          <DesktopSidebar route={route} setRoute={setRoute} />
          <main className="pb-24 md:pb-10 md:pl-64">
            <div className="mx-auto max-w-2xl px-4 pt-6 md:pt-10">{renderView()}</div>
          </main>
          <MobileBottomNav route={route} setRoute={setRoute} />
        </>
      )}
    </div>
  );
}
