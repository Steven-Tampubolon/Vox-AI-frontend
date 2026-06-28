import { useQuery } from "@tanstack/react-query";
import { useChatStore } from "../store/chatStore";
import { conversationApi } from "../api/conversation";
import type { Conversation, Message } from "../types/api";

export function useMessages() {
    const { activeConversationId, activeCharacter } = useChatStore()

    const query = useQuery({
        queryKey: ["messages", activeConversationId],
        queryFn: async (): Promise<{ messages: Message[]; conversation: Conversation }> => {
            const res = await conversationApi.getMessages(
                activeCharacter!,
                activeCharacter
            )
            return {
                messages: res.data.messages,
                conversation: res.data.conversation,
            }
        },
        enabled: !!activeConversationId,
        staleTime: 100 * 10,
    })

    return {
        messages:       query.data?.messages     ?? [],
        conversation:   query.data?.conversation ?? [],
        isLoading:      query.isLoading,
        error:          query.error,
        refetch:        query.refetch,
    }
}