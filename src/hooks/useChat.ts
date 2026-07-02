import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from "sonner";
import { useChatStore } from '../store/chatStore'
import { chatApi } from '../api/chat'
import type { CharacterSlug } from '../types/character'
import type { ChatRequest, ChatResponse } from '../types/api'

const CHAT_API_MAP: Record<CharacterSlug, (req: ChatRequest) => Promise<ChatResponse>> = {
  betawi:  (req) => chatApi.chatBetawi(req).then((r) => r.data),
  rag:     (req) => chatApi.chatRag(req).then((r) => r.data),
  git:     (req) => chatApi.chatGit(req).then((r) => r.data),
  explain: (req) => chatApi.chatExplain(req).then((r) => r.data),
}

const log = {
  send:  (char: string, msg: string) =>
    console.log(
      "%c[VOX AI] %c→ SEND %c[%s]",
      "color:#E35336;font-weight:bold",
      "color:#4ADE80;font-weight:bold",
      "color:#FACC15", char,
      "\n Message:", msg
    ),
  reply: (char: string, reply: string, convId: string) =>
    console.log(
      "%c[VOX AI] %c← REPLY %c[%s]",
      "color:#E35336;font-weight:bold",
      "color:#60A5FA;font-weight:bold",
      "color:#FACC15", char,
      "\n Conversation:", convId,
      "\n Reply:", reply
    ),
  error: (char: string, err: unknown) =>
    console.error(
      "%c[VOX AI] %c✕ ERROR %c[%s]",
      "color:#E35336;font-weight:bold",
      "color:#F87171;font-weight:bold",
      "color:#FACC15", char,
      "\n", err
    ),
}

export function useChat() {
  const queryClient = useQueryClient()
  const {
    activeCharacter,
    activeConversationId,
    setActiveConversationId,
    setPendingMessage,
    setFailedMessage,
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
      setFailedMessage(null)

      log.send(activeCharacter, message)
      return CHAT_API_MAP[activeCharacter](req)
    },

    onSuccess: async (data) => {
      if (data.conversation_id && !activeConversationId) {
        setActiveConversationId(data.conversation_id)
      }

      log.reply(activeCharacter, data.reply, data.conversation_id)

      if (data.error) {
        console.warn(
          "%c[VOX AI] %c⚠ BACKEND WARNING",
          "color:#E35336;font-weight:bold",
          "color:#FBBF24;font-weight:bold",
          "\n", data.error
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
      setPendingMessage(null)
    },

    onError: (error, message) => {
      log.error(activeCharacter, error)

      // ← pindahkan dari pending ke failed
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