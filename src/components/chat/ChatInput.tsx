import { useRef, useEffect, useState } from "react";
import { ArrowUp, Loader2, Mic, Paperclip, Square } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useChat } from "../../hooks/useChat";
import { useVoiceChat } from "../../hooks/useVoiceChat";
import { cn } from "../../lib/utils";
import DocumentUploader from "./DocumentUploader";

export default function ChatInput() {
  const activeCharacter = useChatStore((s) => s.activeCharacter);
  const { sendMessage, stop, isLoading, reset } = useChat();
  const {
    isRecording,
    secondsLeft,
    isVoiceSending,
    isPlaying,
    hasLastAudio,
    startRecording,
    stopRecording,
    stopAudio,
    replayAudio,
  } = useVoiceChat();

  const [text, setText] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prevCharacter, setPrevCharacter] = useState(activeCharacter);

  if (activeCharacter !== prevCharacter) {
    setPrevCharacter(activeCharacter)
    setShowUploader(false)
    setText("");
  }

  const isRag = activeCharacter === "rag";
  const canSend = text.trim().length > 0 && !isLoading && !isRecording && !isVoiceSending;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    reset(); // bersihkan pesan gagal dari percobaan sebelumnya
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      await sendMessage(trimmed);
    } catch {
      // Gagal terkirim — kembalikan teks supaya tidak hilang
      setText(trimmed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Tombol kanan: kirim pesan (default) atau hentikan stream (saat isLoading)
  function handleActionButtonClick() {
    if (isLoading) {
      stop();
    } else {
      handleSend();
    }
  }

  function getMicState() {
    if (isRecording) return "recording"
    if (isVoiceSending) return "sending"
    if (isPlaying) return "playing"
    if (isLoading) return "disabled"
    return "idle"
  }
  const micState = getMicState()

  function handleMicClick() {
    if (micState === "recording") stopRecording()
      else if (micState === "playing") stopAudio()
      else if (micState === "idle") startRecording()
  }

  return (
    <div className="shrink-0 w-full flex justify-center px-4 pb-5 pt-2">
      <div className="w-full max-w-190 flex flex-col gap-2">

        {isRag && showUploader && (
          <DocumentUploader onClose={() => setShowUploader(false)} />
        )}

<div 
  className="flex flex-col bg-[#3C3C3E] rounded-2xl border border-[#4A4A4C]
  focus-within:border-[#E35336] transition-colors duration-200">

  <div 
    className="flex items-end px-3 py-3 gap-3">

    {isRag && (
      <button
        onClick={() => setShowUploader((v) => !v)}
        disabled={isLoading}
        aria-label="Upload dokumen"
        className={cn(
        "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors mb-0.5",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        showUploader
        ? "text-[#E35336] bg-[#E35336]/10"
        : "text-[#666668] hover:text-white hover:bg-white/10"
        )}
        >
        <Paperclip />
      </button>
    )}

    {/* Disable input selama AI masih membalas (streaming berlangsung) */}
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={isLoading || isRecording || isVoiceSending}
      rows={1}
      placeholder={isRag ? "Tanya seputar dokumen yang kamu upload..." : "Ketik pesan..."}
      className="flex-1 bg-transparent text-white text-base placeholder-[#666668]
      outline-none resize-none leading-6 min-h-11
      disabled:opacity-50 py-1"
    />

    {isRecording && (
      <span className="text-xs text-[#E35336] font-mono mb-1 shrink-0">
        {`0:${String(secondsLeft).padStart(2, "0")}`}

      </span>
    )}

    {/* Tombol Mic - 5 state: idle, recording, sending, playing, disabled */}
    <button
    id="voice-mic-button"
    onClick={handleMicClick}
    disabled={micState === "disabled" || micState === "sending"}
    aria-label={
      micState === "recording" ? "Hentikan rekaman" :
      micState === "playing"   ? "Hentikan audio" :
      "Mulai rekam suara"
    }
    className={cn(
      "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 mb-0.5 relative",
      micState === "disabled" || micState === "sending"
        ? "opacity-40 cursor-not-allowed text-[#666668]"
        : micState === "recording"
        ? "text-[#E35336] hover:bg-[#E35336]/10"
        : micState === "playing"
        ? "bg-[#E35336] text-white hover:bg-[#c94a2e] active:scale-95"
        : "text-[#666668] hover:text-white hover:bg-white/10"
    )}
    >
      {micState === "recording" && (
        <span className="absolute inset-0 rounded-lg animate-ping bg-[#E35336]/30" />
      )}
      {micState === "sending"   ? <Loader2 className="w-4 h-4 animate-spin text-[#E35336]" /> :
       micState === "playing"   ? <Square className="w-3.5 h-3.5 fill-white" /> :
       <Mic className="w-5 h-5" />
       }

    </button>

    {/*
      Tombol ganda: kirim pesan saat idle, jadi tombol Stop saat isLoading.
      Selalu enabled saat isLoading supaya user bisa klik stop kapan pun,
      terlepas dari isi textarea.
    */}
    <button
      onClick={handleActionButtonClick}
      disabled={!isLoading && !canSend}
      aria-label={isLoading ? "Hentikan balasan" : "Kirim pesan"}
      className={cn(
      "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 mb-0.5",
      isLoading || canSend
      ? "bg-[#E35336] text-white hover:bg-[#c94a2e] active:scale-95"
      : "bg-[#4A4A4C] text-[#666668] cursor-not-allowed"
      )}
      >
      {isLoading
        ? <Square className="w-3.5 h-3.5 fill-white" />
        : <ArrowUp className="w-5 h-5" />
      }
    </button>

  </div>
</div>

        <div className="flex items-center justify-center gap-3 text-[10px] text-[#4A4A4C]">
          <span>
            {isLoading
            ? "Klik tombol untuk menghentikan balasan"
            : isRecording
            ? "Tap mic untuk berhenti · Otomatis stop setelah 10 detik"
            : isVoiceSending
            ? "Menunggu balasan AI..."
            : "Enter untuk kirim · Shift+Enter untuk baris baru"}
          </span>
          {hasLastAudio && !isRecording && !isVoiceSending && !isPlaying && (
            <button
            id="voice-reply-button"
            onClick={replayAudio}
            className="text-[#666668] hover:text-white transition-colors shrink-0"
            >
              ↺ Putar ulang

            </button>
          )}

        </div>

      </div>
    </div>
  );
}