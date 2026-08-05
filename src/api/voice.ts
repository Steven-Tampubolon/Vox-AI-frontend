import { api } from "./client";
import type { CharacterSlug } from "../types/character";
import type { VoiceChatResponse } from "../types/api";

const VOICE_CHAT_TIMEOUT_MS = 90_000

export const voiceApi = {
    async sendVoiceChat (
        blob: Blob,
        mimeType: string,
        character: CharacterSlug,
        conversationId?: string
    ): Promise<VoiceChatResponse> {
        const ext = mimeType.includes("ogg") ? "ogg" : "webm"
        const formData = new FormData()
        formData.append("file", blob, `user_voice.${ext}` )
        formData.append("character", character)
        if (conversationId) {
            formData.append("conversation_id", conversationId)
        }

        const res = await api.post<VoiceChatResponse>("/voice/chat", formData, {
            timeout: VOICE_CHAT_TIMEOUT_MS,
        })
        return res.data
    },
}