import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from "sonner";
import { useChatStore } from '../store/chatStore'
import { chatApi } from '../api/chat'
import type { CharacterSlug } from '../types/character'
import type { ChatRequest, ChatResponse } from '../types/api'
import { logger } from "../lib/logger";

const CHAT_API_MAP: Record<CharacterSlug, (req: ChatRequest) => Promise<ChatResponse>> = {
  betawi:  (req) => chatApi.chatBetawi(req).then((r) => r.data),
  rag:     (req) => chatApi.chatRag(req).then((r) => r.data),
  git:     (req) => chatApi.chatGit(req).then((r) => r.data),
  explain: (req) => chatApi.chatExplain(req).then((r) => r.data),
}

export function useChat() {
  const queryClient = useQueryClient()
  const {
    activeCharacter,
    activeConversationId,
    setActiveConversationId,
    setPendingMessage,
    setFailedMessage,
    setIsSending,
  } = useChatStore()

  const mutation = useMutation({
    mutationFn: async (message: string): Promise<ChatResponse> => {
      const req: ChatRequest = {
        message,
        conversation_id: activeConversationId ?? '',
        character: activeCharacter,
      }

      // ← set ke store SEBELUM API call, bukan setelah
      setPendingMessage(message)
      setIsSending(true)
      setFailedMessage(null)

      logger.send(activeCharacter, message)
      return CHAT_API_MAP[activeCharacter](req)
    },

    onSuccess: async (data) => {
      if (data.conversation_id && !activeConversationId) {
        setActiveConversationId(data.conversation_id)
      }

      logger.reply(activeCharacter, data.reply, data.conversation_id)

      if (data.error) {
        logger.warning(
          "BACKEND WARNING", data.error
        )
        toast.warning("Pesan terkirim tapi ada peringatan dari server", {
          description: data.error,
        })
      }

      queryClient.invalidateQueries({ queryKey: ['conversations'] })

      if (data.conversation_id) {
        // await supaya pesan real sudah masuk cache sebelum pending dihapus
        await queryClient.invalidateQueries({
          queryKey: ['messages', data.conversation_id],
        })
      }

      // ← hapus pending SETELAH pesan real sudah di cache
      setIsSending(false)
      setPendingMessage(null)
    },

    onError: (error, message) => {
      logger.error(activeCharacter, error)

      // ← pindahkan dari pending ke failed
      setIsSending(false)
      setPendingMessage(null)
      setFailedMessage(message)

      const msg = error instanceof Error ? error.message : "Terjadi kesalahan"
      const isServerError = msg.includes("503") || msg.includes("500")
      const isNetwork = msg.includes("Network")

      if (isServerError) {
        toast.error("Server AI sedang sibuk", {
          description: "Gemini API overload. Coba lagi dalam beberapa detik.",
        })
      } else if (isNetwork) {
        toast.error("Tidak dapat terhubung ke server", {
          description: "Pastikan backend berjalan di localhost:8080.",
        })
      } else {
        toast.error("Gagal mengirim pesan", { description: msg })
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