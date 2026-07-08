import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cva } from "class-variance-authority";
import { Copy, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { formatLanguage } from "../../lib/formatLanguage";
import type { Message } from "../../types/api";
import "highlight.js/styles/github-dark.css";

interface MessageBubbleProps {
  message: Message;
  characterAvatar: string;
  characterName: string;
  userAvatar: string;
  userName: string;
}

// ── CVA — variant system untuk bubble ─────────────────────────
const bubbleVariants = cva(
  "px-5 py-3 rounded-[30px] text-white text-sm leading-relaxed break-words",
  {
    variants: {
      role: {
        user:      "bg-[#E35336]",
        assistant: "bg-[#414141]",
      },
    },
  }
);

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
   <button
      onClick={handleCopy}
      className={cn(
        "flex items-center justify-center p-1.5 rounded-md transition-all duration-150 shrink-0",
        copied
        ? "text-green-400"
        : "text-white/50 hover:text-white hover:bg-white/10"
      )}
      title={copied ? "Tersalin" : "Salin kode"} // Tambahkan title untuk aksesibilitas
      >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {/* Teks "Salin"/"Tersalin" dihapus agar hanya icon */}
    </button>
  );
}

export default function MessageBubble({
  message,
  characterAvatar,
  characterName,
  userAvatar,
  userName,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const time   = formatTime(message.created_at);

  return (
    <div className={cn(
      "flex items-end gap-3 w-full",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>

      {/* Avatar */}
      <img
        src={isUser ? userAvatar : characterAvatar}
        alt={isUser ? userName : characterName}
        className="w-9 h-9 rounded-full object-cover border shrink-0 self-baseline scale-x-[-1]"
      />

      {/* Bubble — role variant via CVA */}
      <div className={cn(
        bubbleVariants({ role: isUser ? "user" : "assistant" }),
        "max-w-[75%]"
      )}>
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              p: ({ children }) => (
                <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
              ),
              
              // 1. Lepaskan total bungkusan pre bawaan react-markdown agar tidak merusak layout
              pre: ({ children }) => <>{children}</>, 

              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");

                if (isBlock) {
                  const lang = formatLanguage(className || "");
                  
                  // Fungsi rekursif untuk mengekstrak string murni dari token-token elemen anak
                  const extractText = (node: React.ReactNode): string => {
                    if (typeof node === "string") return node;
                    if (Array.isArray(node)) return node.map(extractText).join("");
                    
                    // Perbaikan di sini: Pastikan node adalah objek non-null sebelum memeriksa properti 'props'
                    if (node && typeof node === "object" && "props" in (node as object)) {
                      const element = node as React.ReactElement<{ children?: React.ReactNode }>;
                      return extractText(element.props.children);
                    }
                    
                    return "";
                  };

                  const codeText = extractText(children);

                  return (
                    // Gunakan bg-[#0d1117] (warna dasar github-dark) agar menyatu sempurna dengan syntax kodenya
                    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] w-full">
                      {/* Header Bar */}
                      <div className="flex items-center justify-between px-4 py-2 select-none">
                        <span className="text-[11px] text-white font-mono lowercase tracking-wide">
                          {lang}
                        </span>
                        <CopyButton text={codeText.trim()} />
                      </div>
                      
                      {/* Area Kode: Paksa bg-transparent !important lewat tailwind agar layer hitam bawaan plugin hilang */}
                      <pre className="px-4 py-4 text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed m-0 bg-transparent! text-white/90">
                        <code className={cn(className, "bg-transparent! p-0 block")}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  );
                }

                // Tampilan untuk inline-code biasa
                return (
                  <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono">
                  {children}
                  </code>
                );
              },
              ul: ({ children }) => (
              <ul className="list-disc list-inside pl-1 space-y-1 my-2">{children}</ul>
              ),
              ol: ({ children }) => (
              <ol className="list-decimal list-inside pl-1 space-y-1 my-2">{children}</ol>
              ),
              li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
              ),
              strong: ({ children }) => (
              <strong className="font-semibold text-white">{children}</strong>
              ),
              table: ({ children }) => (
              <div className="overflow-x-auto my-2">
              <table className="w-full text-xs border-collapse">{children}</table>
              </div>
              ),
              th: ({ children }) => (
              <th className="px-3 py-2 bg-black/30 text-left border border-white/10">{children}</th>
              ),
              td: ({ children }) => (
              <td className="px-3 py-2 border border-white/10">{children}</td>
              ),
            }}
            >
            {message.content}
          </ReactMarkdown>
        )}

        {/* Timestamp */}
        <span className="text-[10px] opacity-50 whitespace-nowrap select-none block text-right mt-1">
          {time}
        </span>
      </div>

    </div>
  );
}