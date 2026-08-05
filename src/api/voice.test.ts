import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({
    api: {
        post: vi.fn(),
    }
}))

import { voiceApi } from "./voice";
import { api } from "./client";

const mockPost = api.post as ReturnType<typeof vi.fn>

describe("voiceApi.sendVoiceChat", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("mengirim FormData dengan field file, character, conversation_id", async () => {
        const fakeResponse = {
            data: {
                user_text: "halo",
                ai_text: "halo juga",
                audio_base64: "abc",
                mime_type: "audio/wav",
                conversation_id: "conv-123",
            },
        }
        mockPost.mockResolvedValue(fakeResponse)

        const blob = new Blob(["audio"], { type: "audio/ogg" })
        const result = await voiceApi.sendVoiceChat(blob, "audio/ogg;codecs=opus", "betawi", "conv-123")

        const [endpoint, formData] = mockPost.mock.calls[0]
        expect(endpoint).toBe("/voice/chat")
        expect(formData).toBeInstanceOf(FormData)
        expect(formData.get("character")).toBe("betawi")
        expect(formData.get("conversation_id")).toBe("conv-123")
        expect(formData.get("file")).toBeInstanceOf(File)
        expect((formData.get("file") as File).name).toBe("user_voice.ogg")
        expect(result).toEqual(fakeResponse.data)
    })

    it("tidak append conversation_id jika udefined", async () => {
        mockPost.mockResolvedValue({ data: {} })
        const blob = new Blob(["audio"], { type: "audio/webm" })
        await voiceApi.sendVoiceChat(blob, "audio/webm", "git")

        const [, formData] = mockPost.mock.calls[0]
        expect(formData.get("conversation_id")).toBeNull()
        expect((formData.get("file") as File).name).toBe("user_voice.webm")
    })

    it("melempar error saat API gagal", async () => {
        mockPost.mockRejectedValue(new Error("Network Error"))
        const blob = new Blob(["audio"])
        await expect(voiceApi.sendVoiceChat(blob, "audio/ogg", "explain")).rejects.toThrow("Network Error")
    })
})