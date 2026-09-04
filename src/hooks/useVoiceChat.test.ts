import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { createElement } from "react";

vi.mock("../api/voice", () => ({
    voiceApi: {
        sendVoiceChat: vi.fn(),
    },
}))

const mockSetIsVoiceSending = vi.fn()
const mockSetActiveConversationId = vi.fn()
vi.mock("../store/chatStore", () => ({
    useChatStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({
        activeCharacter: "betawi",
        activeConversationId: null,
        isVoiceSending: false,
        setIsVoiceSending: mockSetIsVoiceSending,
        setActiveConversationId: mockSetActiveConversationId,
    })
),
}))

import { useVoiceChat } from "./useVoiceChat";

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

    it("stopAudio mengubah isPlaying menjadi false", () => {
        const { result } = renderHook(() => useVoiceChat(), { wrapper: createWrapper() })
        act(() => {
            result.current.stopAudio()
        })
        expect(result.current.isPlaying).toBe(false)
    })

    it("startRecording gagal gracefully jika getUserMedia tidak tersedia", async () => {
        // jsdom tidak implement getUserMedia — pastikan hook tidak crash
        const { result } = renderHook(() => useVoiceChat(), { wrapper: createWrapper() })
        await act(async () => {
            await result.current.startRecording()
        })
        // state tetap false — tidak crash
        expect(result.current.isRecording).toBe(false)
    })

    it("replayAudio tidak crash jika belum ada audio sebelumnya", () => {
        const { result } = renderHook(() => useVoiceChat(), { wrapper: createWrapper() })
        expect(() => {
            act(() => { result.current.replayAudio() })
        }).not.toThrow()
    })
})