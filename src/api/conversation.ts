import { api } from "./client";
import type { ConversationListResponse, MessageListResponse, RenameConversationRequest } from "../types/api";
import type { CharacterSlug } from "../types/character";

export const conversationApi = {
    getAll(
        character?: CharacterSlug

    ) {
        return api.get<ConversationListResponse>(
            "/conversations",
            {
                params: character
                ? { character }
                : undefined,
            }
        )
    },

    getMessages(
        id: string,
        character?: CharacterSlug
    ) {
        return api.get<MessageListResponse>(
            `/conversations/${id}/messages`,
            {
                params: character
                ? { character }
                : undefined,
            }
        )
    },

    rename(
        id: string,
        body: RenameConversationRequest
    ) {
        return api.patch(
            `/conversations/${id}`,
            body
        )
    },

    delete(
        id: string

    ) {
        return api.delete(
            `/conversations/${id}`
        )
    },
}