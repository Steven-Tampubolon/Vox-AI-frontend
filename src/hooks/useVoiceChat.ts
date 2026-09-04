import { useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useChatStore } from '../store/chatStore'
import { voiceApi } from '../api/voice'
import type { CharacterSlug } from '../types/character'

const MAX_RECORDING_SECONDS = 10

interface LastAudio {
  base64: string
  mimeType: string
}

export function useVoiceChat() {
  const queryClient = useQueryClient()
  const activeCharacter  = useChatStore((s) => s.activeCharacter)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const setIsVoiceSending = useChatStore((s) => s.setIsVoiceSending)
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId)

  const [isRecording, setIsRecording] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(MAX_RECORDING_SECONDS)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasLastAudio, setHasLastAudio] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef   = useRef<Blob[]>([])
  const streamRef        = useRef<MediaStream | null>(null)
  const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentAudioRef  = useRef<HTMLAudioElement | null>(null)
  const lastAudioRef     = useRef<LastAudio | null>(null)
  const mimeTypeRef      = useRef<string>('audio/ogg;codecs=opus')

  // ── Audio playback ────────────────────────────────────────────
  const playAudio = useCallback((base64: string, mimeType: string) => {
    // Hentikan audio sebelumnya
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
    }

    const audio = new Audio(`data:${mimeType};base64,${base64}`)

    audio.onplay   = () => setIsPlaying(true)
    audio.onended  = () => setIsPlaying(false)
    audio.onerror  = () => {
      toast.error('Gagal memutar audio AI')
      setIsPlaying(false)
    }

    currentAudioRef.current = audio
    lastAudioRef.current    = { base64, mimeType }
    setHasLastAudio(true)

    audio.play().catch(() => {
      toast.error('Gagal memutar audio AI')
      setIsPlaying(false)
    })
  }, [])

  const stopAudio = useCallback(() => {
    currentAudioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const replayAudio = useCallback(() => {
    if (!lastAudioRef.current) return
    playAudio(lastAudioRef.current.base64, lastAudioRef.current.mimeType)
  }, [playAudio])

  // ── Send voice message ────────────────────────────────────────
  const sendVoiceMessage = useCallback(async (
    blob: Blob,
    mimeType: string,
    character: CharacterSlug = activeCharacter,
    conversationId: string | null = activeConversationId,
  ) => {
    setIsVoiceSending(true)
    try {
      const data = await voiceApi.sendVoiceChat(
        blob,
        mimeType,
        character,
        conversationId ?? undefined
      )

      setActiveConversationId(data.conversation_id)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      await queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] })

      playAudio(data.audio_base64, data.mime_type)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      const isNetwork = msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Network Error')
      if (isNetwork) {
        toast.error('Tidak dapat terhubung ke server', {
          description: 'Pastikan backend berjalan di localhost:8080.',
        })
      } else if (msg.includes('400')) {
        toast.error('Voice chat gagal', { description: msg })
      } else {
        toast.error('Server AI gagal memproses suara', { description: msg })
      }
    } finally {
      setIsVoiceSending(false)
    }
  }, [activeCharacter, activeConversationId, setIsVoiceSending, setActiveConversationId, queryClient, playAudio])

  // ── Recording ─────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }

    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current })
      audioChunksRef.current = []
      sendVoiceMessage(blob, mimeTypeRef.current)
    }

    recorder.stop()

    // Release mic indicator di browser
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    setIsRecording(false)
    setSecondsLeft(MAX_RECORDING_SECONDS)
  }, [sendVoiceMessage])

  const startRecording = useCallback(async () => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast.error('Izin mikrofon ditolak', {
          description: 'Aktifkan di pengaturan browser.',
        })
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        toast.error('Mikrofon tidak ditemukan')
      } else {
        toast.error('Tidak dapat mengakses mikrofon')
      }
      return
    }

    streamRef.current    = stream
    audioChunksRef.current = []

    const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
      ? 'audio/ogg;codecs=opus'
      : 'audio/webm'
    mimeTypeRef.current = mimeType

    const recorder = new MediaRecorder(stream, { mimeType })
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data)
    }
    recorder.start()
    mediaRecorderRef.current = recorder

    setIsRecording(true)
    setSecondsLeft(MAX_RECORDING_SECONDS)

    let remaining = MAX_RECORDING_SECONDS
    countdownRef.current = setInterval(() => {
      remaining -= 1
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        stopRecording()
      }
    }, 1000)
  }, [stopRecording])

  return {
    isRecording,
    secondsLeft,
    isVoiceSending: useChatStore((s) => s.isVoiceSending),
    isPlaying,
    hasLastAudio,
    startRecording,
    stopRecording,
    stopAudio,
    replayAudio,
  }
}