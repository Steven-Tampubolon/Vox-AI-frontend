# Voice Chat Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah tombol mic di ChatInput yang merekam suara (max 10 detik), mengirim ke `POST /voice/chat`, menampilkan bubble hasil di ChatWindow, dan memutar audio balasan AI.

**Architecture:** Hook `useVoiceChat` baru mengelola recording lifecycle + API call + audio playback. `isVoiceSending` ditambah ke chatStore untuk enforce mutual exclusion dengan text chat. Bubble hasil tampil via React Query cache invalidation (reuse pola yang sudah ada).

**Tech Stack:** React 19, TypeScript, Zustand, TanStack Query v5, MediaRecorder API, Lucide React icons, Sonner toast, Vitest (baru di-setup), Vite 8

## Global Constraints

- Node package manager: **bun** (bun.lock ada di root — gunakan `bun add`, bukan `npm install`)
- Base URL API dari `import.meta.env.VITE_API_BASE_URL` via axios client yang ada di `src/api/client.ts`
- Gunakan `api.post()` dari axios client (bukan `fetch` langsung) untuk konsistensi dengan `conversation.ts` dan `document.ts`
- Ikon dari `lucide-react` (sudah terpasang)
- Toast dari `sonner` (sudah terpasang) — pola: `toast.error('judul', { description: '...' })`
- Tailwind CSS v4 (bukan v3) — class utility langsung, tidak ada config file
- Karakter slug: `"betawi" | "rag" | "git" | "explain"` (dari `src/types/character.ts`)
- **Jangan** `console.log` `audio_base64` — bisa 5–10MB, akan membanjiri console
- File spec: `docs/superpowers/specs/2026-08-05-voice-chat-design.md`

---

### Task 1: Setup Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json` (tambah script `test`)

**Interfaces:**
- Produces: perintah `bun run test` yang menjalankan semua `*.test.ts`

- [ ] **Step 1: Install Vitest dan testing utilities**

```bash
bun add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Buat `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 3: Buat `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Tambah script `test` ke `package.json`**

Di bagian `"scripts"`, tambah:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verifikasi setup berjalan**

```bash
bun run test
```

Expected: `No test files found` (bukan error crash).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json bun.lock
git commit -m "chore: setup vitest for unit testing"
```

---

### Task 2: Tambah TypeScript Types

**Files:**
- Modify: `src/types/api.ts` (tambah 2 interface di akhir file)

**Interfaces:**
- Produces: `VoiceChatRequest`, `VoiceChatResponse` — digunakan Task 3 dan Task 5

- [ ] **Step 1: Tambah interfaces ke `src/types/api.ts`**

Tambahkan di akhir file (setelah `RenameConversationRequest`):

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

- [ ] **Step 2: Verifikasi TypeScript tidak error**

```bash
bunx tsc --noEmit
```

Expected: exit 0, tidak ada error.

- [ ] **Step 3: Commit**

```bash
git add src/types/api.ts
git commit -m "feat(types): add VoiceChatRequest and VoiceChatResponse"
```

---

### Task 3: Buat `src/api/voice.ts` + Test

**Files:**
- Create: `src/api/voice.ts`
- Create: `src/api/voice.test.ts`

**Interfaces:**
- Consumes: `api` dari `src/api/client.ts`, `CharacterSlug` dari `src/types/character.ts`, `VoiceChatResponse` dari `src/types/api.ts`
- Produces: `voiceApi.sendVoiceChat(blob, mimeType, character, conversationId?)` → `Promise<VoiceChatResponse>`

- [ ] **Step 1: Tulis failing test di `src/api/voice.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock axios client sebelum import voiceApi
vi.mock('./client', () => ({
  api: {
    post: vi.fn(),
  },
}))

import { voiceApi } from './voice'
import { api } from './client'

const mockPost = api.post as ReturnType<typeof vi.fn>

describe('voiceApi.sendVoiceChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mengirim FormData dengan field file, character, conversation_id', async () => {
    const fakeResponse = {
      data: {
        user_text: 'halo',
        ai_text: 'halo juga',
        audio_base64: 'abc',
        mime_type: 'audio/wav',
        conversation_id: 'conv-123',
      },
    }
    mockPost.mockResolvedValue(fakeResponse)

    const blob = new Blob(['audio'], { type: 'audio/ogg' })
    const result = await voiceApi.sendVoiceChat(blob, 'audio/ogg;codecs=opus', 'betawi', 'conv-123')

    const [endpoint, formData] = mockPost.mock.calls[0]
    expect(endpoint).toBe('/voice/chat')
    expect(formData).toBeInstanceOf(FormData)
    expect(formData.get('character')).toBe('betawi')
    expect(formData.get('conversation_id')).toBe('conv-123')
    expect(formData.get('file')).toBeInstanceOf(File)
    expect((formData.get('file') as File).name).toBe('user_voice.ogg')
    expect(result).toEqual(fakeResponse.data)
  })

  it('tidak append conversation_id jika undefined', async () => {
    mockPost.mockResolvedValue({ data: {} })
    const blob = new Blob(['audio'], { type: 'audio/webm' })
    await voiceApi.sendVoiceChat(blob, 'audio/webm', 'git')

    const [, formData] = mockPost.mock.calls[0]
    expect(formData.get('conversation_id')).toBeNull()
    expect((formData.get('file') as File).name).toBe('user_voice.webm')
  })

  it('melempar error saat API gagal', async () => {
    mockPost.mockRejectedValue(new Error('Network Error'))
    const blob = new Blob(['audio'])
    await expect(voiceApi.sendVoiceChat(blob, 'audio/ogg', 'explain')).rejects.toThrow('Network Error')
  })
})
```

- [ ] **Step 2: Jalankan test — harus FAIL**

```bash
bun run test src/api/voice.test.ts
```

Expected: FAIL dengan "Cannot find module './voice'"

- [ ] **Step 3: Implementasi `src/api/voice.ts`**

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
    if (conversationId) {
      formData.append('conversation_id', conversationId)
    }

    const res = await api.post<VoiceChatResponse>('/voice/chat', formData)
    return res.data
  },
}
```

- [ ] **Step 4: Jalankan test — harus PASS**

```bash
bun run test src/api/voice.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/voice.ts src/api/voice.test.ts
git commit -m "feat(api): add voiceApi.sendVoiceChat"
```

---

### Task 4: Extend chatStore dengan `isVoiceSending`

**Files:**
- Modify: `src/store/chatStore.ts`

**Interfaces:**
- Produces: `isVoiceSending: boolean`, `setIsVoiceSending: (value: boolean) => void` — digunakan Task 5 dan Task 6

- [ ] **Step 1: Tambah ke interface `ChatStore` di `src/store/chatStore.ts`**

Setelah baris `setIsSending: (value: boolean) => void`, tambah:
```ts
// Voice chat sending state
isVoiceSending: boolean
setIsVoiceSending: (value: boolean) => void
```

- [ ] **Step 2: Tambah ke `DEFAULT_STATE`**

Setelah `isSending: false,`, tambah:
```ts
isVoiceSending: false,
```

- [ ] **Step 3: Tambah ke store actions (dalam blok `persist`)**

Setelah `setIsSending: (isSending) => set({ isSending }),`, tambah:
```ts
setIsVoiceSending: (isVoiceSending) => set({ isVoiceSending }),
```

- [ ] **Step 4: Verifikasi TypeScript tidak error**

```bash
bunx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/store/chatStore.ts
git commit -m "feat(store): add isVoiceSending to chatStore"
```

---

### Task 5: Buat `src/hooks/useVoiceChat.ts` + Test

**Files:**
- Create: `src/hooks/useVoiceChat.ts`
- Create: `src/hooks/useVoiceChat.test.ts`

**Interfaces:**
- Consumes: `voiceApi.sendVoiceChat()` (Task 3), `useChatStore` dengan `isVoiceSending` + `setIsVoiceSending` (Task 4), `useQueryClient` dari TanStack Query
- Produces:
  ```ts
  {
    isRecording: boolean
    secondsLeft: number        // 10 → 0
    isVoiceSending: boolean
    isPlaying: boolean
    hasLastAudio: boolean
    startRecording: () => Promise<void>
    stopRecording: () => void
    stopAudio: () => void
    replayAudio: () => void
  }
  ```

- [ ] **Step 1: Tulis failing tests di `src/hooks/useVoiceChat.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock voiceApi
vi.mock('../api/voice', () => ({
  voiceApi: {
    sendVoiceChat: vi.fn(),
  },
}))

// Mock chatStore
const mockSetIsVoiceSending = vi.fn()
const mockSetActiveConversationId = vi.fn()
vi.mock('../store/chatStore', () => ({
  useChatStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({
      activeCharacter: 'betawi',
      activeConversationId: null,
      setIsVoiceSending: mockSetIsVoiceSending,
      setActiveConversationId: mockSetActiveConversationId,
    })
  ),
}))

import { useVoiceChat } from './useVoiceChat'
import { voiceApi } from '../api/voice'

const mockSendVoiceChat = voiceApi.sendVoiceChat as ReturnType<typeof vi.fn>

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useVoiceChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initial state benar', () => {
    const { result } = renderHook(() => useVoiceChat(), { wrapper: createWrapper() })
    expect(result.current.isRecording).toBe(false)
    expect(result.current.secondsLeft).toBe(10)
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.hasLastAudio).toBe(false)
  })

  it('setIsVoiceSending(true) dipanggil saat sendVoiceMessage dimulai', async () => {
    mockSendVoiceChat.mockResolvedValue({
      user_text: 'halo',
      ai_text: 'hai',
      audio_base64: 'abc',
      mime_type: 'audio/wav',
      conversation_id: 'conv-1',
    })

    const { result } = renderHook(() => useVoiceChat(), { wrapper: createWrapper() })

    // Panggil internal sendVoiceMessage via stopRecording path
    // (langsung tes sendVoiceMessage sebagai unit)
    await act(async () => {
      await result.current._sendVoiceMessageForTest(new Blob(['x']), 'audio/ogg')
    })

    expect(mockSetIsVoiceSending).toHaveBeenCalledWith(true)
    expect(mockSetIsVoiceSending).toHaveBeenLastCalledWith(false)
  })

  it('setIsVoiceSending(false) dipanggil meski API error', async () => {
    mockSendVoiceChat.mockRejectedValue(new Error('Network Error'))
    const { result } = renderHook(() => useVoiceChat(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current._sendVoiceMessageForTest(new Blob(['x']), 'audio/ogg').catch(() => {})
    })

    expect(mockSetIsVoiceSending).toHaveBeenLastCalledWith(false)
  })

  it('hasLastAudio menjadi true setelah audio berhasil diplay', async () => {
    // Mock HTMLMediaElement.play
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)

    mockSendVoiceChat.mockResolvedValue({
      user_text: 'halo',
      ai_text: 'hai',
      audio_base64: 'abc',
      mime_type: 'audio/wav',
      conversation_id: 'conv-1',
    })

    const { result } = renderHook(() => useVoiceChat(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current._sendVoiceMessageForTest(new Blob(['x']), 'audio/ogg')
    })

    expect(result.current.hasLastAudio).toBe(true)
  })
})
```

- [ ] **Step 2: Jalankan test — harus FAIL**

```bash
bun run test src/hooks/useVoiceChat.test.ts
```

Expected: FAIL dengan "Cannot find module './useVoiceChat'"

- [ ] **Step 3: Implementasi `src/hooks/useVoiceChat.ts`**

```ts
import { useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useChatStore } from '../store/chatStore'
import { voiceApi } from '../api/voice'
import type { CharacterSlug } from '../types/character'

const MAX_RECORDING_SECONDS = 10

interface LastAudio {
  base64: string
  mimeType: string
}

export function useVoiceChat() {
  const queryClient = useQueryClient()
  const activeCharacter  = useChatStore((s) => s.activeCharacter)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const setIsVoiceSending = useChatStore((s) => s.setIsVoiceSending)
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId)

  const [isRecording, setIsRecording] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(MAX_RECORDING_SECONDS)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasLastAudio, setHasLastAudio] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef   = useRef<Blob[]>([])
  const streamRef        = useRef<MediaStream | null>(null)
  const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentAudioRef  = useRef<HTMLAudioElement | null>(null)
  const lastAudioRef     = useRef<LastAudio | null>(null)
  const mimeTypeRef      = useRef<string>('audio/ogg;codecs=opus')

  // ── Audio playback ────────────────────────────────────────────
  const playAudio = useCallback((base64: string, mimeType: string) => {
    // Hentikan audio sebelumnya
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
    }

    const audio = new Audio(`data:${mimeType};base64,${base64}`)

    audio.onplay   = () => setIsPlaying(true)
    audio.onended  = () => setIsPlaying(false)
    audio.onerror  = () => {
      toast.error('Gagal memutar audio AI')
      setIsPlaying(false)
    }

    currentAudioRef.current = audio
    lastAudioRef.current    = { base64, mimeType }
    setHasLastAudio(true)

    audio.play().catch(() => {
      toast.error('Gagal memutar audio AI')
      setIsPlaying(false)
    })
  }, [])

  const stopAudio = useCallback(() => {
    currentAudioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const replayAudio = useCallback(() => {
    if (!lastAudioRef.current) return
    playAudio(lastAudioRef.current.base64, lastAudioRef.current.mimeType)
  }, [playAudio])

  // ── Send voice message ────────────────────────────────────────
  const sendVoiceMessage = useCallback(async (
    blob: Blob,
    mimeType: string,
    character: CharacterSlug = activeCharacter,
    conversationId: string | null = activeConversationId,
  ) => {
    setIsVoiceSending(true)
    try {
      const data = await voiceApi.sendVoiceChat(
        blob,
        mimeType,
        character,
        conversationId ?? undefined
      )

      setActiveConversationId(data.conversation_id)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      await queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] })

      playAudio(data.audio_base64, data.mime_type)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      const isNetwork = msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Network Error')
      if (isNetwork) {
        toast.error('Tidak dapat terhubung ke server', {
          description: 'Pastikan backend berjalan di localhost:8080.',
        })
      } else if (msg.includes('400')) {
        toast.error('Voice chat gagal', { description: msg })
      } else {
        toast.error('Server AI gagal memproses suara', { description: msg })
      }
    } finally {
      setIsVoiceSending(false)
    }
  }, [activeCharacter, activeConversationId, setIsVoiceSending, setActiveConversationId, queryClient, playAudio])

  // ── Recording ─────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }

    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current })
      audioChunksRef.current = []
      sendVoiceMessage(blob, mimeTypeRef.current)
    }

    recorder.stop()

    // Release mic indicator di browser
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    setIsRecording(false)
    setSecondsLeft(MAX_RECORDING_SECONDS)
  }, [sendVoiceMessage])

  const startRecording = useCallback(async () => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast.error('Izin mikrofon ditolak', {
          description: 'Aktifkan di pengaturan browser.',
        })
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        toast.error('Mikrofon tidak ditemukan')
      } else {
        toast.error('Tidak dapat mengakses mikrofon')
      }
      return
    }

    streamRef.current    = stream
    audioChunksRef.current = []

    const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
      ? 'audio/ogg;codecs=opus'
      : 'audio/webm'
    mimeTypeRef.current = mimeType

    const recorder = new MediaRecorder(stream, { mimeType })
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data)
    }
    recorder.start()
    mediaRecorderRef.current = recorder

    setIsRecording(true)
    setSecondsLeft(MAX_RECORDING_SECONDS)

    let remaining = MAX_RECORDING_SECONDS
    countdownRef.current = setInterval(() => {
      remaining -= 1
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        stopRecording()
      }
    }, 1000)
  }, [stopRecording])

  return {
    isRecording,
    secondsLeft,
    isVoiceSending: useChatStore((s) => s.isVoiceSending),
    isPlaying,
    hasLastAudio,
    startRecording,
    stopRecording,
    stopAudio,
    replayAudio,
    // Hanya untuk testing — tidak digunakan di UI
    _sendVoiceMessageForTest: sendVoiceMessage,
  }
}
```

- [ ] **Step 4: Jalankan test — harus PASS**

```bash
bun run test src/hooks/useVoiceChat.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Verifikasi TypeScript**

```bash
bunx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useVoiceChat.ts src/hooks/useVoiceChat.test.ts
git commit -m "feat(hooks): add useVoiceChat for recording, API, and audio playback"
```

---

### Task 6: Tambah Tombol Mic ke `ChatInput.tsx`

**Files:**
- Modify: `src/components/chat/ChatInput.tsx`

**Interfaces:**
- Consumes: `useVoiceChat()` (Task 5) — `isRecording`, `secondsLeft`, `isVoiceSending`, `isPlaying`, `hasLastAudio`, `startRecording`, `stopRecording`, `stopAudio`, `replayAudio`
- Consumes: `isSending` dari `useChatStore` (sudah ada)

- [ ] **Step 1: Tambah import di `ChatInput.tsx`**

Tambah ke baris import yang sudah ada:
```ts
import { Mic, Loader2 } from "lucide-react";
import { useVoiceChat } from "../../hooks/useVoiceChat";
```

Note: `Square` sudah di-import untuk tombol stop text chat.

- [ ] **Step 2: Tambah penggunaan `useVoiceChat` di dalam komponen**

Tambah di bawah baris `const { sendMessage, stop, isLoading, reset } = useChat();`:
```ts
const {
  isRecording,
  secondsLeft,
  isVoiceSending,
  isPlaying,
  hasLastAudio,
  startRecording,
  stopRecording,
  stopAudio,
  replayAudio,
} = useVoiceChat();
```

- [ ] **Step 3: Update kondisi `canSend` dan disabled textarea**

Ubah baris:
```ts
const canSend = text.trim().length > 0 && !isLoading;
```
Menjadi:
```ts
const canSend = text.trim().length > 0 && !isLoading && !isRecording && !isVoiceSending;
```

Pada `<textarea>`, ubah prop `disabled`:
```tsx
disabled={isLoading || isRecording || isVoiceSending}
```

- [ ] **Step 4: Buat helper `getMicButtonProps` di dalam komponen (sebelum return)**

```ts
function getMicState() {
  if (isRecording) return 'recording'
  if (isVoiceSending) return 'sending'
  if (isPlaying) return 'playing'
  if (isLoading) return 'disabled'   // text chat sedang berlangsung
  return 'idle'
}
const micState = getMicState()

function handleMicClick() {
  if (micState === 'recording') stopRecording()
  else if (micState === 'playing') stopAudio()
  else if (micState === 'idle') startRecording()
}
```

- [ ] **Step 5: Tambah tombol mic ke JSX (di dalam `<div className="flex items-end...">`)**

Tambah tombol mic **setelah** textarea dan **sebelum** tombol kirim/stop:

```tsx
{/* Tombol Mic — 5 state: idle, recording, sending, playing, disabled */}
<button
  id="voice-mic-button"
  onClick={handleMicClick}
  disabled={micState === 'disabled' || micState === 'sending'}
  aria-label={
    micState === 'recording' ? 'Hentikan rekaman' :
    micState === 'playing'   ? 'Hentikan audio' :
    'Mulai rekam suara'
  }
  className={cn(
    "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 mb-0.5 relative",
    micState === 'disabled' || micState === 'sending'
      ? "opacity-40 cursor-not-allowed text-[#666668]"
      : micState === 'recording'
      ? "text-[#E35336] hover:bg-[#E35336]/10"
      : micState === 'playing'
      ? "bg-[#E35336] text-white hover:bg-[#c94a2e] active:scale-95"
      : "text-[#666668] hover:text-white hover:bg-white/10"
  )}
>
  {micState === 'recording' && (
    <span className="absolute inset-0 rounded-lg animate-ping bg-[#E35336]/30" />
  )}
  {micState === 'sending'   ? <Loader2 className="w-4 h-4 animate-spin text-[#E35336]" /> :
   micState === 'playing'   ? <Square className="w-3.5 h-3.5 fill-white" /> :
   <Mic className="w-4 h-4" />
  }
</button>
```

- [ ] **Step 6: Tambah countdown display saat recording**

Di dalam tombol (atau di sebelah tombol, sebagai sibling `<span>`), tambah countdown.
Letakkan sebagai sibling elemen setelah tombol mic, di dalam `<div className="flex items-end...">`:

```tsx
{isRecording && (
  <span className="text-xs text-[#E35336] font-mono mb-1 shrink-0">
    {`0:${String(secondsLeft).padStart(2, '0')}`}
  </span>
)}
```

- [ ] **Step 7: Update hint text area di bawah ChatInput**

Ubah blok `<p className="text-center text-[10px] text-[#4A4A4C]">` menjadi:

```tsx
<div className="flex items-center justify-center gap-3 text-[10px] text-[#4A4A4C]">
  <span>
    {isLoading
      ? "Klik tombol untuk menghentikan balasan"
      : isRecording
      ? "Tap mic untuk berhenti · Otomatis stop setelah 10 detik"
      : isVoiceSending
      ? "Menunggu balasan AI..."
      : "Enter untuk kirim · Shift+Enter untuk baris baru"}
  </span>
  {hasLastAudio && !isRecording && !isVoiceSending && !isPlaying && (
    <button
      id="voice-replay-button"
      onClick={replayAudio}
      className="text-[#666668] hover:text-white transition-colors shrink-0"
    >
      ↺ Putar ulang
    </button>
  )}
</div>
```

- [ ] **Step 8: Verifikasi TypeScript tidak error**

```bash
bunx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 9: Jalankan dev server dan manual test**

```bash
bun run dev
```

Checklist manual:
- [ ] Tombol mic muncul di sebelah kiri tombol kirim (■/↑)
- [ ] Tap mic → animasi pulse + countdown "0:10", "0:09", ...
- [ ] Tap mic lagi → rekaman berhenti, spinner muncul
- [ ] Setelah BE reply → bubble user_text + ai_text muncul di ChatWindow
- [ ] Audio AI diputar otomatis
- [ ] Saat audio play → tombol mic berubah jadi ■ (stop)
- [ ] Klik ■ → audio berhenti
- [ ] Setelah audio selesai → tombol "↺ Putar ulang" muncul
- [ ] Klik "↺ Putar ulang" → audio diputar ulang
- [ ] Timer 10 detik habis → otomatis stop + kirim
- [ ] Saat text chat berlangsung (`isLoading`) → tombol mic disabled (opacity 40%)
- [ ] Saat recording → textarea disabled

- [ ] **Step 10: Commit**

```bash
git add src/components/chat/ChatInput.tsx
git commit -m "feat(ui): add voice mic button to ChatInput with 5 states"
```

---

### Task 7: Jalankan Semua Tests & Final Verification

**Files:** Tidak ada file baru.

- [ ] **Step 1: Jalankan seluruh test suite**

```bash
bun run test
```

Expected: semua test PASS, tidak ada failing test.

- [ ] **Step 2: Verifikasi TypeScript keseluruhan**

```bash
bunx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit final (jika ada perbaikan kecil)**

```bash
git add -A
git commit -m "feat: voice chat frontend — complete implementation"
```

---

## Ringkasan File Changes

| File | Status |
|---|---|
| `vitest.config.ts` | CREATE |
| `src/test/setup.ts` | CREATE |
| `src/api/voice.ts` | CREATE |
| `src/api/voice.test.ts` | CREATE |
| `src/hooks/useVoiceChat.ts` | CREATE |
| `src/hooks/useVoiceChat.test.ts` | CREATE |
| `src/types/api.ts` | MODIFY (+2 interfaces) |
| `src/store/chatStore.ts` | MODIFY (+isVoiceSending) |
| `src/components/chat/ChatInput.tsx` | MODIFY (+mic button, +replay) |
| `package.json` | MODIFY (+test scripts) |
