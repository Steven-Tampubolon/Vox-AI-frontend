# 🦊 VOX AI Frontend

![Lint & Build](https://github.com/Steven-Tampubolon/vox-ai-frontend/actions/workflows/lint.yml/badge.svg)
![Docker Publish](https://github.com/Steven-Tampubolon/vox-ai-frontend/actions/workflows/docker-publish.yml/badge.svg)
![GHCR](https://img.shields.io/badge/ghcr.io-vox--ai--frontend-blue?logo=docker)

Frontend untuk aplikasi chatbot multi-karakter **VOX AI**, dibangun dengan React 19 + TypeScript + Vite.

---

## Tech Stack

| Kategori | Library |
|----------|---------|
| Runtime | Bun |
| Bundler | Vite |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| State Management | Zustand + persist |
| Server State | TanStack Query v5 |
| HTTP Client | Axios (REST) + Fetch API (SSE streaming untuk chat) |
| Animasi | Framer Motion |
| Markdown | react-markdown |
| File Upload | react-dropzone |
| Toast | Sonner |

---

## Karakter

| Slug | Nama | Kemampuan |
|------|------|-----------|
| `betawi` | Abang Betawi | Ngobrol santai, pantun, logat Betawi |
| `rag` | Dokter Dokumen | RAG, analisa PDF/TXT |
| `git` | Git Master | Commit message, Git workflow, review diff |
| `explain` | Profesor Analogi | ELI5, analogi, penjelasan konsep |

---

## Struktur Folder

```
src/
├── pages/
│   ├── OnboardingPage.tsx     # 3-step onboarding flow
│   └── ChatPage.tsx           # Halaman utama chat
├── components/
│   ├── onboarding/
│   │   ├── StepWelcome.tsx
│   │   ├── StepCharacterIntro.tsx
│   │   └── StepProfile.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx        # Navigasi karakter + riwayat
│   │   └── Header.tsx         # Info karakter aktif + user
│   └── chat/
│       ├── ChatWindow.tsx     # Area pesan
│       ├── ChatInput.tsx      # Input + kirim pesan
│       ├── MessageBubble.tsx  # Bubble pesan AI/user
│       └── DocumentUploader.tsx # Upload PDF/TXT untuk RAG
├── hooks/
│   ├── useChat.ts             # Kirim pesan streaming (SSE), stop, + optimistic UI
│   ├── useVoiceChat.ts        # Rekam suara, kirim ke /voice/chat, putar balasan audio
│   ├── useMessages.ts         # Fetch pesan dalam conversation
│   ├── useConversation.ts     # List, delete, rename conversation
│   └── useCharacter.ts        # Fetch metadata karakter
├── store/
│   └── chatStore.ts           # Global state (Zustand + persist)
├── api/
│   ├── client.ts              # Axios base instance
│   ├── chat.ts                # SSE streaming client untuk 4 karakter
│   ├── voice.ts               # Kirim FormData audio ke /voice/chat
│   ├── conversation.ts        # CRUD conversation
│   ├── document.ts            # Upload dokumen RAG
│   └── character.ts           # List karakter
├── types/
│   ├── api.ts                 # Response types dari backend
│   └── character.ts           # CharacterSlug + CharacterInfo
├── constants/
│   └── character.ts           # Data karakter hardcoded (avatar, color, dll)
└── lib/
    ├── logger.ts              # Console logger berwarna untuk DevTools
    └── motion.ts              # Framer Motion variants & transitions
```

---

## Routes

| Path | Halaman | Guard |
|------|---------|-------|
| `/` | Redirect otomatis | — |
| `/onboarding` | Onboarding 3-step | Redirect ke `/chat` jika sudah onboarding |
| `/chat` | Halaman chat | Redirect ke `/onboarding` jika belum onboarding |

---

## Onboarding Flow

```
Step 1: Welcome
    ↓
Step 2: Perkenalan 4 karakter (carousel)
    ↓
Step 3: Input nama + pilih avatar
    ↓
/chat
```

State onboarding disimpan di `localStorage` via Zustand persist.
Jika user refresh atau buka ulang, langsung masuk `/chat`.

---

## Chat Flow

```
User ketik pesan → klik send
    ↓
Bubble optimis langsung muncul (pendingMessage)
    ↓
Typing indicator (3 dots + avatar karakter)
    ↓
Token pertama tiba dari SSE
    ↓
Typing indicator berganti jadi streaming bubble
(teks muncul bertahap + cursor berkedip di ujung)
    ↓
Stream selesai → bubble streaming hilang → bubble asli dari DB muncul

User bisa klik tombol Stop kapan saja selama streaming:
    ↓
Koneksi SSE diputus (AbortController)
    ↓
Reply parsial (yang sempat tampil) tetap tersimpan ke history

Jika error (bukan karena Stop):
    ↓
Bubble tetap tampil sebagai failedMessage
Tombol "Coba lagi" muncul di bawah bubble
Toast error muncul (503 / network / lainnya)
```

---

## Voice Chat Flow

```
Idle → klik tombol mic
    ↓
Minta izin mikrofon (getUserMedia)
(jika ditolak → toast error, balik ke Idle)
    ↓ 
Merekam (MediaRecorder, format ogg/opus atau webm)
countdown 10 detik, tampil di sebelah tombol mic
user bisa tap mic buat stop lebih cepat, atau auto-stop di 0
    ↓ 
Kirim FormData (file audio + character + conversation_id) ke POST /voice/chat
timeout 90s (pipeline lebih lama dari chat teks biasa)
    ↓ 
Backend proses: Speech-to-Text → LLM → Text-to-Speech
(jika gagal/timeout → toast error, balik ke Idle)
    ↓ 
Response diterima: user_text, ai_text, audio_base64, conversation_id
    ↓
conversation_id disimpan ke store + cache messages di-invalidate
    ↓
Audio balasan diputar otomatis (data: URL dari base64)
    ↓
Selesai → balik ke Idle (tombol "↺ Putar ulang" muncul buat replay)

Selama voice chat berlangsung (recording/sending/playing):
input teks & tombol upload dokumen otomatis disable
(mutual exclusion — tidak bisa voice & text bersamaan)
```


---

## RAG Flow

```
Pilih karakter "Dokter Dokumen"
    ↓
Klik icon paperclip → DocumentUploader muncul
    ↓
Upload PDF atau TXT (max 10MB)
    ↓
Backend return conversation_id + chunk_count
    ↓
conversation_id disimpan ke store
    ↓
User langsung bisa tanya seputar dokumen
```

---

## State Management

```
chatStore (Zustand)
├── user              → nama + avatar (persist)
├── activeCharacter   → karakter aktif (persist)
├── hasOnboarded      → flag onboarding (persist)
├── activeConversationId → conversation aktif (tidak persist)
├── pendingMessage    → pesan yang sedang dikirim (tidak persist)
├── failedMessage     → pesan yang gagal (tidak persist)
├── isSending         → status typing indicator (tidak persist)
├── isVoiceSending    → status kirim/proses voice chat (tidak persist)
└── streamingText     → teks jawaban AI yang sedang di-stream (tidak persist)
```

---

## Backend

| Info | Value |
|------|-------|
| URL | `http://localhost:8080` |
| Framework | Go + Gin |
| AI Model | Gemini 2.5 Flash Lite |
| Database | SQLite |
| Rate Limit | 10 req/menit |

Repo backend: [vox-ai](https://github.com/Steven-Tampubolon/vox-ai)

### Endpoints

```
GET  /health
GET  /api/v1/characters
POST /api/v1/chat/betawi    ← SSE (text/event-stream)
POST /api/v1/chat/rag       ← SSE (text/event-stream)
POST /api/v1/chat/git       ← SSE (text/event-stream)
POST /api/v1/chat/explain   ← SSE (text/event-stream)
POST /api/v1/voice/chat     ← multipart/form-data (file audio)
POST /api/v1/document/upload
GET  /api/v1/conversations
DELETE /api/v1/conversations/:id
PATCH  /api/v1/conversations/:id
GET  /api/v1/conversations/:id/messages
```

---

## Menjalankan Project (Development)

```bash
# Install dependencies
bun install

# Development
bun dev

# Build
bun run build
```

Pastikan backend sudah berjalan di `http://localhost:8080` sebelum menjalankan frontend.

### Environment

Buat file `.env` di root project:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

---

## 🐳 Menjalankan via Docker (tanpa clone, untuk end-user)

Image resmi di-publish otomatis ke GHCR setiap kali ada rilis versi (`vX.Y.Z`).

```bash
docker pull ghcr.io/steven-tampubolon/vox-ai-frontend:latest
docker run -p 3000:80 ghcr.io/steven-tampubolon/vox-ai-frontend:latest
```

Untuk menjalankan **frontend + backend sekaligus** tanpa clone repo sama sekali,
gunakan `docker-compose.yml` yang tersedia di folder [`deploy/`](https://github.com/Steven-Tampubolon/vox-ai/tree/main/deploy)
pada repo backend, atau download langsung dari halaman
[**Releases**](https://github.com/Steven-Tampubolon/vox-ai/releases) versi terbaru.

---

## CI/CD

| Workflow | Trigger | Fungsi |
|---|---|---|
| `lint.yml` | Setiap `push` / `pull_request` | ESLint + type-check + build check |
| `docker-publish.yml` | Push tag `v*.*.*` | Build & push image ke `ghcr.io/steven-tampubolon/vox-ai-frontend` |

Rilis versi baru:
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Logger (DevTools)

Semua aktivitas API tercatat di browser console dengan warna:

```
🟢 → SEND    pesan yang dikirim
🔵 ← REPLY   balasan dari AI
🔴 ✕ ERROR   error dari server
🟡 ⚠ WARNING backend warning (200 tapi ada field error)
🟣 ℹ INFO    aksi UI (new chat, load conversation, delete)
```
---

## 📜 Changelog

### v1.2.0
- **feat**: voice chat — rekam suara (max 10 detik), kirim ke
  `/voice/chat`, balasan AI diputar otomatis sebagai audio
- Tombol mic 5-state: idle, recording (dengan countdown), sending,
  playing, disabled
- Tombol "↺ Putar ulang" untuk memutar ulang balasan audio terakhir
- Voice & text chat saling mengunci (tidak bisa jalan bersamaan)
- Timeout khusus 90s untuk endpoint voice (pipeline STT→LLM→TTS
  lebih lambat dari chat teks biasa yang pakai timeout default 30s)

### v1.1.0
- **feat**: chat sekarang streaming realtime via SSE, bukan menunggu
  jawaban penuh
- **feat**: tombol Stop untuk menghentikan balasan AI yang sedang berjalan
- **feat**: cursor berkedip di ujung teks selama streaming berlangsung
- `chat.ts` diganti total dari Axios ke `fetch()` + `ReadableStream`
  (Axios tidak bisa membaca streaming body secara native di browser)

### v1.0.0
- Rilis awal