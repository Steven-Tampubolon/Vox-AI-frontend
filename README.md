# 🦊 VOX AI Frontend

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
| HTTP Client | Axios |
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
│   ├── useChat.ts             # Kirim pesan + optimistic UI
│   ├── useMessages.ts         # Fetch pesan dalam conversation
│   ├── useConversation.ts     # List, delete, rename conversation
│   └── useCharacter.ts        # Fetch metadata karakter
├── store/
│   └── chatStore.ts           # Global state (Zustand + persist)
├── api/
│   ├── client.ts              # Axios base instance
│   ├── chat.ts                # Endpoint 4 karakter
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
Backend balas → pesan real masuk
    ↓
Bubble optimis hilang → bubble asli muncul

Jika error:
    ↓
Bubble tetap tampil sebagai failedMessage
Tombol "Coba lagi" muncul di bawah bubble
Toast error muncul (503 / network / lainnya)
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
└── isSending         → status typing indicator (tidak persist)
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

### Endpoints

```
GET  /health
GET  /api/v1/characters
POST /api/v1/chat/betawi
POST /api/v1/chat/rag
POST /api/v1/chat/git
POST /api/v1/chat/explain
POST /api/v1/document/upload
GET  /api/v1/conversations
DELETE /api/v1/conversations/:id
PATCH  /api/v1/conversations/:id
GET  /api/v1/conversations/:id/messages
```

---

## Menjalankan Project

```bash
# Install dependencies
bun install

# Development
bun dev

# Build
bun run build
```

Pastikan backend sudah berjalan di `http://localhost:8080` sebelum menjalankan frontend.

---

## Environment

Buat file `.env` di root project:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
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