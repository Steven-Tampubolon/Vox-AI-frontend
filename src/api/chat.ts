import { api } from "./client";
import type { ChatRequest } from "../types/api";
import type { CharacterSlug } from "../types/character";

// mapping karakter
const CHAT_ENDPOINT: Record<CharacterSlug, string> = {
    betawi: "/chat/betawi",
    git: "/chat/git",
    explain: "/chat/explain",
    rag: "/chat/rag",
};

export interface ChatStreamResult {
    conversation_id?: string;
}

export interface ChatStreamCallbacks {
    onChunk: (text: string) => void;
    onDone: (result: ChatStreamResult) => void;
    onAbort: () => void;
    onError: (error: Error) => void;
}

// bentuk 1 event SSE dari BE (sse.go: writeSSE)
interface SSEEventPayload {
    content?: string;
    conversation_id?: string;
    error?: string;
}

export const chatApi = {
    chatStream(               // chatStream mengirim pesan ke endpoint karakter tertentu via SSE
        character: CharacterSlug,
        payload: ChatRequest,
        callbacks: ChatStreamCallbacks
    ): AbortController {
        const controller = new AbortController();
        const baseURL = api.defaults.baseURL ?? "";
        const url = `${baseURL}${CHAT_ENDPOINT[character]}`;

        // IIFE async - jalan di background
        (async () => {
            let conversationId: string | undefined
            
            try {
              const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
              });
              
              if (!res.ok || !res.body) {
                const text = await res.text().catch(() => "")
                throw new Error(text || `HTTP ${res.status}`)
              }

              const reader = res.body.getReader()
              const decoder = new TextDecoder()
              let buffer = ""

              while (true) {
                    const { value, done } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })

                    // 1 event SSE dipisah baris kosong
                    const events = buffer.split("\n\n")
                    buffer = events.pop() ?? ""

                    for (const rawEvent of events) {
                        const line = rawEvent.trim()
                        if (!line.startsWith("data: ")) continue

                        const data = line.slice("data: ".length)

                        if (data === "[DONE") {
                            callbacks.onDone({ conversation_id: conversationId })
                            return
                        }

                        let parsed: SSEEventPayload
                        try {
                            parsed = JSON.parse(data)
                        } catch {
                            continue          // payload rusak -  skip, jangan hentikan stream
                        }

                        if (parsed.error) {
                            callbacks.onError(new Error(parsed.error))
                            continue
                        }
                        if (parsed.conversation_id) {
                            conversationId = parsed.conversation_id
                            continue
                        }
                        if (parsed.content) {
                            callbacks.onChunk(parsed.content)
                        }
                    }
                }

                // jaga-jaga kalu koneksi putus tanpa [DONE] ekplisit
              callbacks.onDone({ conversation_id: conversationId })
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") {
                    // controller.abort() dipanggil user (tombol stop) - buka error
                    callbacks.onAbort()
                    return
                }
                callbacks.onError(
                    err instanceof Error ? err : new Error("Gagal terhubung ke server")
                )
            }
        })();

        return controller
    },

};