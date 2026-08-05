# Design Spec: Voice Chat Feature — Frontend

- **Date**: 2026-08-05
- **Status**: Approved — ready for implementation planning
- **Author**: Antigravity (AI pair programmer)
- **Scope**: Frontend voice chat integration ke existing Vox-AI chat UI

---

## 1. Overview

Tambah kemampuan voice chat ke halaman chat yang sudah ada. User bisa tap tombol mikrofon di `ChatInput`, rekam suara (max 10 detik), lalu backend mengembalikan transkripsi user, balasan AI teks, dan audio WAV base64. Ketiganya ditampilkan dan diputar secara berurutan di `ChatWindow`.

Backend endpoint sudah tersedia di `POST /api/v1/voice/chat` (v1.2.0). Frontend belum punya integrasi sama sekali — ini adalah implementasi pertama dari sisi FE.

---

## 2. User Flow

```
1. User tap ikon mic di ChatInput
2. Browser minta izin mikrofon (sekali)
3. Rekaman dimulai — tombol mic animasi pulse merah + countdown "0:10" -> "0:00"
4. User tap mic lagi ATAU timer habis -> rekaman berhenti, otomatis kirim ke BE
5. ChatInput masuk state "sending" (spinner) — textarea + tombol teks disabled
6. BE reply (2–5 detik): { user_text, ai_text, audio_base64, mime_type, conversation_id }
7. React Query cache di-invalidate -> ChatWindow render bubble user_text + ai_text
8. Audio AI diputar otomatis
9. Tombol di ChatInput berubah: stop saat audio playing, replay setelah selesai
```

---

## 3. Architecture & Data Flow

```
ChatInput (UI)
  └─ useVoiceChat (hook)
       ├─ MediaRecorder API  ->  Blob (audio/ogg;codecs=opus)
       ├─ voiceApi.sendVoiceChat()  ->  POST /voice/chat
       ├─ chatStore.setIsVoiceSending()
       ├─ queryClient.invalidateQueries(['messages', convId])
       │    └─ ChatWindow re-render -> bubble dari DB
       └─ Audio() instance  ->  play / stop / replay
```

**Key decisions:**
- `useVoiceChat` hook baru, tidak modifikasi `useChat` — isolasi penuh
- Audio player state (`currentAudio`, `isPlaying`) hidup di `useRef` + `useState` lokal di hook — tidak perlu masuk chatStore
- `isVoiceSending` masuk chatStore supaya `ChatInput` bisa enforce mutual exclusion dengan text chat
- Bubble hasil voice chat tampil via React Query invalidation — reuse pola `onDone` di `useChat`

---

## 4. File Structure

### File Baru

| File | Tanggung jawab |
|---|---|
| `src/api/voice.ts` | `voiceApi.sendVoiceChat()` — wrap `POST /voice/chat`, return `VoiceChatResponse` |
| `src/hooks/useVoiceChat.ts` | Recording lifecycle, timer countdown, API call, audio playback |

### File yang Dimodifikasi

| File | Perubahan |
|---|---|
| `src/types/api.ts` | Tambah `VoiceChatRequest`, `VoiceChatResponse` |
| `src/store/chatStore.ts` | Tambah `isVoiceSending: boolean` + `setIsVoiceSending` |
| `src/components/chat/ChatInput.tsx` | Tambah tombol mic, wire ke `useVoiceChat` |

---

## 5. Detailed Component Specifications

### 5.1 `src/types/api.ts` — Type Additions

```ts
export interface VoiceChatRequest {
  file: Blob
  character: CharacterSlug
  conversation_id?: string
}

export interface VoiceChatResponse {
  user_text: string
  ai_text: string
  audio_base64: string
  mime_type: string           // "audio/wav"
  conversation_id: string
}
```

---

### 5.2 `src/api/voice.ts`

```ts
import { api } from './client'
import type { CharacterSlug } from '../types/character'
import type { VoiceChatResponse } from '../types/api'

export const voiceApi = {
  async sendVoiceChat(
    blob: Blob,
    mimeType: string,
    character: CharacterSlug,
    conversationId?: string
  ): Promise<VoiceChatResponse> {
    const ext = mimeType.includes('ogg') ? 'ogg' : 'webm'
    const formData = new FormData()
    formData.append('file', blob, `user_voice.${ext}`)
    formData.append('character', character)
    if (conversationId) formData.append('conversation_id', conversationId)

    const res = await api.post<VoiceChatResponse>('/voice/chat', formData)
    return res.data
  }
}
```

---

### 5.3 `src/store/chatStore.ts` — Additions

Tambah ke interface `ChatStore`:
```ts
isVoiceSending: boolean
setIsVoiceSending: (value: boolean) => void
```

Tambah ke `DEFAULT_STATE`:
```ts
isVoiceSending: false,
```

Tambah ke store actions:
```ts
setIsVoiceSending: (isVoiceSending) => set({ isVoiceSending }),
```

---

### 5.4 `src/hooks/useVoiceChat.ts`

**Interface yang di-expose:**

```ts
interface UseVoiceChatReturn {
  isRecording: boolean
  secondsLeft: number           // countdown 10 -> 0
  isVoiceSending: boolean       // menunggu BE reply
  isPlaying: boolean
  hasLastAudio: boolean         // ada audio terakhir untuk replay
  startRecording: () => Promise<void>
  stopRecording: () => void     // stop manual, langsung trigger send
  stopAudio: () => void
  replayAudio: () => void
}
```

**Internal logic:**

```
MAX_RECORDING_SECONDS = 10

startRecording():
  1. navigator.mediaDevices.getUserMedia({ audio: true })
     catch NotAllowedError -> toast.error "Izin mikrofon ditolak"
     catch NotFoundError  -> toast.error "Mikrofon tidak ditemukan"
  2. mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
       ? 'audio/ogg;codecs=opus' : 'audio/webm'
  3. new MediaRecorder(stream, { mimeType })
  4. mediaRecorder.ondataavailable -> push ke audioChunks[]
  5. mediaRecorder.start()
  6. setIsRecording(true), setSecondsLeft(10)
  7. countdown setInterval 1 detik -> saat 0: stopRecording()

stopRecording():
  1. clearInterval(countdownTimer)
  2. mediaRecorder.stop() -> onstop:
       blob = new Blob(audioChunks, { type: mimeType })
       audioChunks = []
       sendVoiceMessage(blob, mimeType)
  3. Hentikan semua track stream (release mic indicator browser)
  4. setIsRecording(false), setSecondsLeft(10)

sendVoiceMessage(blob, mimeType):
  1. chatStore.setIsVoiceSending(true)
  2. voiceApi.sendVoiceChat(blob, mimeType, activeCharacter, activeConversationId ?? undefined)
  3. onSuccess:
     a. setActiveConversationId(data.conversation_id)
     b. queryClient.invalidateQueries(['conversations'])
     c. queryClient.invalidateQueries(['messages', data.conversation_id])
     d. playAudio(data.audio_base64, data.mime_type)
  4. onError: klasifikasi error -> toast.error (lihat seksi 7)
  5. finally: chatStore.setIsVoiceSending(false)

playAudio(base64, mimeType):
  1. currentAudioRef.current?.pause()
  2. audio = new Audio(`data:${mimeType};base64,${base64}`)
  3. audio.onplay   -> setIsPlaying(true)
  4. audio.onended  -> setIsPlaying(false)
  5. audio.onerror  -> toast.error "Gagal memutar audio AI", setIsPlaying(false)
  6. currentAudioRef.current = audio
  7. lastAudioRef.current = { base64, mimeType }
  8. setHasLastAudio(true)
  9. audio.play()

stopAudio():
  currentAudioRef.current?.pause()
  setIsPlaying(false)

replayAudio():
  if (!lastAudioRef.current) return
  playAudio(lastAudioRef.current.base64, lastAudioRef.current.mimeType)
```

---

### 5.5 `src/components/chat/ChatInput.tsx` — Tombol Mic

Tambah tombol mic di sebelah kiri tombol kirim (Stop/Send). Lima state visual:

| State | Kondisi | Visual |
|---|---|---|
| `idle` | Default | Ikon `Mic`, warna `#666668` |
| `recording` | `isRecording` | Ikon `Mic` merah `#E35336` + pulse ring animasi + countdown `0:08` di sebelah tombol |
| `sending` | `isVoiceSending` | Ikon `Loader2` spin warna `#E35336` |
| `playing` | `isPlaying` | Ikon `Square` (stop ■), background `#E35336` → klik `stopAudio()` |
| `disabled` | `isSending` (text chat berlangsung) | Opacity 40%, cursor not-allowed |

**Replay button** — muncul di area hint text bawah ChatInput:
- Kondisi: `!isRecording && !isVoiceSending && !isPlaying && hasLastAudio`
- Teks: `"↺ Putar ulang balasan AI"`
- Klik: `replayAudio()`

**Mutual exclusion:**
- Tombol mic disabled saat `isSending` (text chat berlangsung)
- Textarea + tombol kirim teks disabled saat `isRecording || isVoiceSending`

---

## 6. UX States — Mutual Exclusion Matrix

| | Mic enabled | Textarea enabled | Kirim teks enabled |
|---|---|---|---|
| Idle | YES | YES | YES (jika ada teks) |
| `isRecording` | YES (jadi tombol stop) | NO | NO |
| `isVoiceSending` | NO | NO | NO |
| `isSending` (text) | NO | NO | YES (jadi tombol Stop stream) |

---

## 7. Error Handling

| Error | Penyebab | UX Response |
|---|---|---|
| `NotAllowedError` | User tolak izin mic | `toast.error("Izin mikrofon ditolak", { description: "Aktifkan di pengaturan browser." })` |
| `NotFoundError` | Tidak ada mic | `toast.error("Mikrofon tidak ditemukan")` |
| HTTP 400 dari BE | File kosong / karakter tidak valid | `toast.error("Voice chat gagal", { description: err.message })` |
| HTTP 500 dari BE | STT gagal / TTS gagal | `toast.error("Server AI gagal memproses suara")` |
| Network error | Backend tidak jalan | `toast.error("Tidak dapat terhubung ke server", { description: "Pastikan backend berjalan di localhost:8080." })` |
| Audio playback error | `audio.onerror` | `toast.error("Gagal memutar audio AI")` |

Tidak ada retry otomatis — user rekam ulang manual.

---

## 8. Audio Format

- **Preferred**: `audio/ogg;codecs=opus` — didukung Chrome & Firefox, ada di daftar resmi Gemini STT
- **Fallback**: `audio/webm` — default Chrome jika OGG tidak didukung
- **Filename**: `user_voice.ogg` atau `user_voice.webm` (ekstensi penting untuk BE normalize mimeType)
- **Max duration**: 10 detik (dibatasi di FE via countdown timer)

> PERINGATAN: `audio/webm` belum terverifikasi didukung Gemini STT — ini fallback, bukan pilihan utama.

---

## 9. Testing Strategy

### Unit Tests (Vitest)

**`src/api/voice.test.ts`**
- FormData mengandung field `file`, `character`, dan `conversation_id` (jika ada)
- `conversation_id` tidak di-append jika kosong/undefined
- Response mapped ke `VoiceChatResponse` dengan benar
- Error response (4xx/5xx) di-throw sebagai Error

**`src/hooks/useVoiceChat.test.ts`**
- `isVoiceSending` true saat send dimulai, kembali false setelah selesai (sukses maupun error)
- `secondsLeft` countdown dari 10 ke 0
- `stopRecording()` sebelum timer habis tetap trigger `sendVoiceMessage`
- `hasLastAudio` false di awal, true setelah berhasil play
- Error network → `isVoiceSending` kembali false, tidak crash

### Manual Test Checklist

- [ ] Rekam di Chrome → audio/ogg;codecs=opus dikirim ke BE
- [ ] Rekam di Firefox → fallback ke audio/webm, tetap bisa dikirim
- [ ] Timer 10 detik habis → otomatis stop + kirim
- [ ] Tap stop sebelum timer habis → kirim segera
- [ ] Tolak izin mic → toast muncul, tidak crash, tidak ada state macet
- [ ] Bubble `user_text` + `ai_text` muncul di ChatWindow setelah reply
- [ ] Audio AI diputar otomatis setelah bubble muncul
- [ ] Tombol stop (■) menghentikan audio
- [ ] Tombol replay (↺) memutar ulang audio terakhir
- [ ] Voice + text chat tidak bisa jalan bersamaan (tombol saling disable)
- [ ] Ganti karakter → `hasLastAudio` reset, tombol replay hilang

---

## 10. Out of Scope

- Waveform visualizer real-time saat rekaman
- Streaming audio response (BE sudah return sekaligus)
- Pengaturan voice ID dari FE (dikontrol BE via voice_profiles)
- Fullscreen / overlay voice mode
- E2E test (Playwright/Cypress belum di-setup di project)
