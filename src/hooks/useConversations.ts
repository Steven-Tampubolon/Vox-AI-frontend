import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "../store/chatStore";
import { conversationApi } from "../api/conversation";
import type { Conversation } from "../types/api";

export function useConversation() {
    const queryClient = useQueryClient()
    const{ activeCharacter, setActiveConversationId } = useChatStore()

    // ── Fetch list conversations ──────────────────────────
    const query = useQuery({
        queryKey: ["conversations", activeCharacter],
        queryFn: async (): Promise<Conversation[]> => {
            const res = await conversationApi.getAll(activeCharacter)
            return res.data.conversations
        },
        staleTime: 1000 * 30,
    })

    // ── Delete conversation ───────────────────────────────
    const deleteMutation = useMutation({
        mutationFn : (id: string) => conversationApi.delete(id),
        onSuccess: (_data, deletedId) => {
            const { activeConversationId } = useChatStore.getState()
            if (activeConversationId === deletedId) {
                setActiveConversationId(null)
            }
            queryClient.invalidateQueries({ queryKey: ["conversations"] })
        },
    })

    // ── Rename conversation ───────────────────────────────
    const renameMutation = useMutation({
        mutationFn: ({ id, title }: { id: string; title: string }) =>
            conversationApi.rename(id, { title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["conversations"] })
        },
    })

    return {
        // Data
        conversations: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,

        // Actions
        deleteConversation: deleteMutation.mutate,
        isDeleting: deleteMutation.isPending,

        renameConversation: renameMutation.mutate,
        isRenaming: renameMutation.isPending,
    }
}