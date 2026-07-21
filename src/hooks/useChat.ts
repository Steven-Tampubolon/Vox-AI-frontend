import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useChatStore } from '../store/chatStore'
import { chatApi } from '../api/chat'
import type { ChatRequest } from '../types/api'
import { logger } from '../lib/logger'

export function useChat() {
  const queryClient = useQueryClient()
  const {
    activeCharacter,
    activeConversationId,
    setActiveConversationId,
    setPendingMessage,
    setFailedMessage,
    setIsSending,
    appendStreamingChunk,
    resetStreamingText,
  } = useChatStore()

  // AbortController disimpan di ref, BUKAN state - kita tidak butuh re-render
  // tiap kali controller berubah, cuma butuh referensinya untuk dipanggil
  // .abort() saat tombol Stop diklik
  const controllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    (message: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const req: ChatRequest = {
          message,
          conversation_id: activeConversationId ?? '',
          character: activeCharacter,
        }

        setPendingMessage(message)
        setIsSending(true)
        setFailedMessage(null)
        resetStreamingText()

        logger.send(activeCharacter, message)

        controllerRef.current = chatApi.chatStream(activeCharacter, req, {
          onChunk: (text) => {
            appendStreamingChunk(text)
          },

          onDone: async ({ conversation_id }) => {
            if (conversation_id && !activeConversationId) {
              setActiveConversationId(conversation_id)
            }

            const convId = conversation_id ?? activeConversationId
            logger.reply(activeCharacter, '(stream selesai)', convId ?? '')

            queryClient.invalidateQueries({ queryKey: ['conversations'] })
            if (convId) {
              // await supaya pesan asli dari DB sudah masuk cache sebelum
              // teks streaming sementara dihapus dari layar
              await queryClient.invalidateQueries({ queryKey: ['messages', convId] })
            }

            setIsSending(false)
            setPendingMessage(null)
            resetStreamingText()
            controllerRef.current = null
            resolve()
          },

          onAbort: () => {
            // user sendiri yang klik Stop - BUKAN error. Backend (lihat
            // usecase.ChatStream) sudah menyimpan reply parsial ke DB,
            // jadi cukup refresh history supaya teks yang sempat muncul
            // tetap ada, lalu bersihkan state streaming di FE
            logger.warning('STREAM DIHENTIKAN', 'User menekan tombol stop')

            queryClient.invalidateQueries({ queryKey: ['conversations'] })
            if (activeConversationId) {
              queryClient.invalidateQueries({ queryKey: ['messages', activeConversationId] })
            }

            setIsSending(false)
            setPendingMessage(null)
            resetStreamingText()
            controllerRef.current = null
            resolve() // resolve, bukan reject - ini bukan kegagalan
          },

          onError: (error) => {
            logger.error(activeCharacter, error)

            setIsSending(false)
            setPendingMessage(null)
            setFailedMessage(message)
            resetStreamingText()
            controllerRef.current = null

            const msg = error.message || 'Terjadi kesalahan'
            const isServerError = msg.includes('503') || msg.includes('500')
            const isNetwork = msg.includes('Failed to fetch') || msg.includes('NetworkError')

            if (isServerError) {
              toast.error('Server AI sedang sibuk', {
                description: 'Gemini API overload. Coba lagi dalam beberapa detik.',
              })
            } else if (isNetwork) {
              toast.error('Tidak dapat terhubung ke server', {
                description: 'Pastikan backend berjalan di localhost:8080.',
              })
            } else {
              toast.error('Gagal mengirim pesan', { description: msg })
            }

            reject(error)
          },
        })
      })
    },
    [
      activeCharacter,
      activeConversationId,
      queryClient,
      setActiveConversationId,
      setPendingMessage,
      setFailedMessage,
      setIsSending,
      appendStreamingChunk,
      resetStreamingText,
    ]
  )

  // stop untuk tombol Stop di UI (poin 3 di request Anda)
  const stop = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    setFailedMessage(null)
  }, [setFailedMessage])

  return {
    sendMessage,
    stop,
    reset,
    isLoading: useChatStore((s) => s.isSending),
  }

}