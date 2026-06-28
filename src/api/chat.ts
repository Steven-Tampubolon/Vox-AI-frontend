import { api } from "./client";
import type { ChatRequest, ChatResponse } from "../types/api";

export const chatApi = {
    chatBetawi(payload: ChatRequest) {
        return api.post<ChatResponse>(
            "/chat/betawi",
            payload
        )
    },

    chatGit(payload: ChatRequest) {
        return api.post<ChatResponse>(
            "/chat/git",
            payload
        )
    },

    chatExplain(payload: ChatRequest) {
        return api.post<ChatResponse>(
            "/chat/explain",
            payload
        )
    },

    chatRag(payload: ChatRequest) {
        return api.post<ChatResponse>(
            "/chat/rag",
            payload
        )
    },

}