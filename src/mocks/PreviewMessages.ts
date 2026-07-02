// ⚠️ FILE SEMENTARA UNTUK PREVIEW ────────────────────────────────────
// Dipakai oleh useMessages() saat VITE_PREVIEW_MODE=true di .env, supaya
// bentuk bubble chat bisa dilihat tanpa backend aktif.
// Aman dihapus (bersama flag PREVIEW_MODE di useMessages.ts) begitu
// backend sudah jalan dan tidak dibutuhkan lagi.

import type { Message } from "../types/api";
import type { CharacterSlug } from "../types/character";

function msg(id: number, role: Message["role"], content: string, minutesAgo: number): Message {
  return {
    id,
    conversation_id: "preview",
    role,
    content,
    created_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  };
}

const PREVIEW_BY_CHARACTER: Record<CharacterSlug, Message[]> = {
  betawi: [
    msg(1, "user", "Bang, bikinin pantun buat nyemangatin temen yang lagi galau dong", 4),
    msg(
      2,
      "assistant",
      "Cieee yang lagi nyari kata-kata buat temennya, siap bang!\n\nJalan-jalan ke Pasar Minggu\nBeli duku sama rambutan\nJangan sedih jangan pilu\nMasalah dateng pasti ada jalan\n\nGimana bang, cocok gak buat dikirim ke temennya?",
      3
    ),
    msg(3, "user", "Mantap bang! Ada versi yang lebih lucu lagi gak?", 2),
  ],
  rag: [
    msg(4, "user", "Tolong rangkum dokumen yang tadi aku upload ya, poin-poin penting aja", 5),
    msg(
      5,
      "assistant",
      "Oke, ini poin-poin utama dari dokumennya:\n\n- Pendapatan kuartal ini naik dibanding kuartal sebelumnya\n- Ada 3 risiko utama yang disebutkan di bagian akhir\n- Rekomendasi tim mengarah ke ekspansi pasar baru\n\nMau aku bedah lebih detail bagian risikonya?",
      3
    ),
  ],
  git: [
    msg(6, "user", "Ini diff-nya bang, tolong bikinin 3 pilihan commit message:\n\n```\n+ fix: null check on user avatar upload\n+ add fallback image\n```", 6),
    msg(
      7,
      "assistant",
      "Nih 3 pilihan buat kamu:\n\n1. `fix: add null check and fallback for user avatar upload`\n2. `fix(upload): handle missing avatar with default image`\n3. `fix: prevent crash on empty avatar upload`\n\nPilihan pertama paling deskriptif kalau tim kamu suka commit message yang detail.",
      4
    ),
  ],
  explain: [
    msg(8, "user", "Profesor, tolong jelasin apa itu closure di javascript, aku bingung terus", 7),
    msg(
      9,
      "assistant",
      "Bayangkan closuree seperti tas ransel kecil yang dibawa sebuah fungsi kemanapun ia pergi.\n\nSaat fungsi dibuat di dalam fungsi lain, ia \"mengemas\" variabel dari lingkungannya ke dalam tas itu. Jadi walaupun fungsi luar sudah selesai jalan, fungsi dalam tetap bisa mengakses isi tasnya.\n\n```js\nfunction buatTas(nama) {\n  return function () {\n    return `Halo, ${nama}!`;\n  };\n}\n\nconst tasBudi = buatTas(\"Budi\");\ntasBudi(); // \"Halo, Budi!\"\n```\n\nVariabel `nama` tetap \"nempel\" di tas walau `buatTas` sudah selesai dieksekusi.",
      5
    ),
  ],
};

export function getPreviewMessages(character: CharacterSlug): Message[] {
  return PREVIEW_BY_CHARACTER[character] ?? [];
}