import { useRef, useEffect, useState } from "react";
import { useChatStore } from "../../store/chatStore";
import { useChat } from "../../hooks/useChat";
import DocumentUploader from "./DocumentUploader";

function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPaperclip() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ChatInput() {
  const activeCharacter = useChatStore((s) => s.activeCharacter);
  const { sendMessage, isLoading, reset } = useChat();

  const [text, setText] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isRag = activeCharacter === "rag";
  const canSend = text.trim().length > 0 && !isLoading;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  useEffect(() => {
    setShowUploader(false);
    setText("");
  }, [activeCharacter]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    reset(); // bersihkan error dari percobaan sebelumnya
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

  return (
    <div className="shrink-0 w-full flex justify-center px-4 pb-5 pt-2">
      <div className="w-full max-w-190 flex flex-col gap-2">

        {/* DocumentUploader — di atas, terpisah sepenuhnya */}
        {isRag && showUploader && (
          <DocumentUploader onClose={() => setShowUploader(false)} />
        )}

{/* Satu baris: paperclip | textarea | send */}
<div className="flex flex-col bg-[#3C3C3E] rounded-2xl border border-[#4A4A4C]
                focus-within:border-[#E35336] transition-colors duration-200">

  <div className="flex items-end px-3 py-3 gap-3">

    {/* Paperclip — hanya RAG */}
    {isRag && (
      <button
        onClick={() => setShowUploader((v) => !v)}
        aria-label="Upload dokumen"
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                    transition-colors mb-0.5
                    ${showUploader
                      ? "text-[#E35336] bg-[#E35336]/10"
                      : "text-[#666668] hover:text-white hover:bg-white/10"
                    }`}
      >
        <IconPaperclip />
      </button>
    )}

    {/* Textarea */}
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      rows={1}
      placeholder={isRag ? "Tanya seputar dokumen yang kamu upload..." : "Ketik pesan..."}
      className="flex-1 bg-transparent text-white text-base placeholder-[#666668]
                 outline-none resize-none leading-6 min-h-11
                 disabled:opacity-50 py-1"
    />

    {/* Send button */}
    <button
      onClick={handleSend}
      disabled={!canSend}
      aria-label="Kirim pesan"
      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                  transition-all duration-150 mb-0.5
                  ${canSend
                    ? "bg-[#E35336] text-white hover:bg-[#c94a2e] active:scale-95"
                    : "bg-[#4A4A4C] text-[#666668] cursor-not-allowed"
                  }`}
    >
      {isLoading
        ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : <IconSend />
      }
    </button>

  </div>
</div>

        <p className="text-center text-[10px] text-[#4A4A4C]">
          Enter untuk kirim · Shift+Enter untuk baris baru
        </p>

      </div>
    </div>
  );
}