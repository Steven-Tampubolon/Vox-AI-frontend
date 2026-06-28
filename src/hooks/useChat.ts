import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useChatStore } from '../store/chatStore'
import { chatApi } from '../api/chat'
import type { CharacterSlug } from '../types/character'
import type { ChatRequest, ChatResponse } from '../types/api'

// Map karakter → method di chatApi
const CHAT_API_MAP: Record<CharacterSlug, (req: ChatRequest) => Promise<ChatResponse>> = {
    betawi: (req) => chatApi.chatBetawi(req).then((r) => r.data),
    rag: (req) => chatApi.chatRag(req).then((r) => r.data),
    git: (req) => chatApi.chatGit(req).then((r) => r.data),
    explain: (req) => chatApi.chatExplain(req).then((r) => r.data),
}

export function useChat() {
  const queryClient = useQueryClient()
  const {
    activeCharacter,
    activeConversationId,
    setActiveConversationId,
  } = useChatStore()

  const mutation = useMutation({
    mutationFn: async (message: string): Promise<ChatResponse> => {
      const apiFn = CHAT_API_MAP[activeCharacter]

      const req: ChatRequest = {
        message,
        conversation_id: activeConversationId ?? '',
        character:       activeCharacter,
      }

      return apiFn(req)
    },

    onSuccess: (data) => {
      // Simpan conversation_id dari response pertama
      if (data.conversation_id && !activeConversationId) {
        setActiveConversationId(data.conversation_id)
      }

      // Refresh sidebar
      queryClient.invalidateQueries({ queryKey: ['conversations'] })

      // Refresh messages di ChatWindow
      if (data.conversation_id) {
        queryClient.invalidateQueries({
          queryKey: ['messages', data.conversation_id],
        })
      }
    },
  })

  return {
    sendMessage: mutation.mutateAsync,
    isLoading:   mutation.isPending,
    error:       mutation.error,
    reset:       mutation.reset,
  }
}