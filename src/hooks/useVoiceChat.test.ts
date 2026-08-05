import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act, createElement } from "react";

// Mock voiceApi
vi.mock("../api/voice", () => ({
    voiceApi: {
        sendVoiceChat: vi.fn(),
    },
}))

// Mock chatStore
const mockSetIsVoiceSending = vi.fn()
const mockSetActiveConversationId = vi.fn()
vi.mock("../store/chatStore", () => ({
    useChatStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({
        activeCharacter: "betawi",
        activeConversationId: null,
        setIsVoiceSending: mockSetIsVoiceSending,
        setActiveConversationId: mockSetActiveConversationId,
    })
),
}))

import { useVoiceChat } from "./useVoiceChat";
import { voiceApi } from "../api/voice";

const mockSendVoiceChat = voiceApi.sendVoiceChat as ReturnType<typeof vi.fn>

function createWrapper() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return ({ children }: { children: React.ReactNode }) => 
     createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("useVoiceChat", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("initial state benar", () => {
        const { result } = renderHook(() => useVoiceChat(), { wrapper: createWrapper() })
        expect(result.current.isRecording).toBe(false)
        expect(result.current.secondsLeft).toBe(10)
        expect(result.current.isPlaying).toBe(false)
        expect(result.current.hasLastAudio).toBe(false)
    })

    it("setIsVoiceSending(true) dipanggil saat sendVoiceMessage dimulai", async () => {
        mockSendVoiceChat.mockResolvedValue({
            user_text: "halo",
            ai_text: "hai",
            audio_base64: "abc",
            mime_type: "audio/wav",
            conversation_id: "conv-1",
        })

        const { result } = renderHook(() => useVoiceChat(), { wrapper: createWrapper() })

        // Panggil internal sendVoiceMessage via stopRecording path
        // (langsung ts sendVoiceMessage senagai unit)
        await act(async () => {
            await result.current._sendVoiceMessageForTest(new Blob(["x"]), "audio/ogg")
        })

        expect(mockSetIsVoiceSending).toHaveBeenCalledWith(true)
        expect(mockSetIsVoiceSending).toHaveBeenLastCalledWith(false)
    })

    it("setIsVoiceSending(false) dipanggil meski API error", async () => {
        mockSendVoiceChat.mockRejectedValue(new Error("Network Error"))
        const { result } = renderHook(() => useVoiceChat(), { wrapper: createWrapper() })

         await act(async () => {
            await result.current._sendVoiceMessageForTest(new Blob(["x"]), "audio/ogg").catch(() => {})
        })

        expect(mockSetIsVoiceSending).toHaveBeenLastCalledWith(false)
    })

    it("hasLastAudio menjadi true setelah audio berhasil diplay", async () => {
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
            await result.current._sendVoiceMessageForTest(new Blob(["x"]), "audio/ogg")
        })

        expect(result.current.hasLastAudio).toBe(true)
    })
})