import { useState, type ReactElement, type ReactNode } from "react";
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

const bubbleVariants = cva(
  "px-5 py-3 rounded-[30px] text-white text-sm leading-relaxed break-words",
  {
    variants: {
      role: {
        user: "bg-[#E35336]",
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
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch(() => {
        setCopied(false);
      });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "flex items-center justify-center p-1.5 rounded-md transition-all duration-150 shrink-0",
        copied
          ? "text-green-400"
          : "text-white/50 hover:text-white hover:bg-white/10"
      )}
      title={copied ? "Tersalin" : "Salin kode"}
      aria-label={copied ? "Kode tersalin" : "Salin kode"}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
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
  const time = formatTime(message.created_at);

  return (
    <div
      className={cn(
        "flex items-end gap-3 w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <img
        src={isUser ? userAvatar : characterAvatar}
        alt={isUser ? userName : characterName}
        className="w-9 h-9 rounded-full object-cover border shrink-0 self-baseline scale-x-[-1]"
      />

      {/* Message Bubble */}
      <div
        className={cn(
          bubbleVariants({
            role: isUser ? "user" : "assistant",
          }),
          "max-w-[75%]"
        )}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              /* Paragraph */
              p: ({ children }) => (
                <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
              ),

              /* Pre/code wrapper */
              pre: ({ children }) => <>{children}</>,

              /* Code */
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");

                if (isBlock) {
                  const lang = formatLanguage(className ?? "");

                  const extractText = (node: ReactNode): string => {
                    if (typeof node === "string") {
                      return node;
                    }

                    if (typeof node === "number") {
                      return String(node);
                    }

                    if (Array.isArray(node)) {
                      return node.map(extractText).join("");
                    }

                    if (
                      node &&
                      typeof node === "object" &&
                      "props" in node
                    ) {
                      const element =
                        node as ReactElement<{ children?: ReactNode }>;

                      return extractText(element.props.children);
                    }

                    return "";
                  };

                  const codeText = extractText(children);

                  return (
                    <div className="my-3 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
                      {/* Code Header */}
                      <div className="flex items-center justify-between px-4 py-2 select-none">
                        <span className="text-[11px] text-white font-mono lowercase tracking-wide">
                          {lang}
                        </span>

                        <CopyButton text={codeText.trim()} />
                      </div>

                      {/* Code Content */}
                      <pre className="m-0 overflow-x-auto bg-transparent! px-4 py-4 text-xs font-mono leading-relaxed whitespace-pre text-white/90">
                        <code
                          className={cn(
                            className,
                            "block bg-transparent! p-0"
                          )}
                        >
                          {children}
                        </code>
                      </pre>
                    </div>
                  );
                }

                /* Inline code */
                return (
                  <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs font-mono">
                    {children}
                  </code>
                );
              },

              /* Unordered List */
              ul: ({ children }) => (
                <ul className="my-2 list-disc list-inside space-y-1 pl-1">
                  {children}
                </ul>
              ),

              /* Ordered List */
              ol: ({ children }) => (
                <ol className="my-2 list-decimal list-inside space-y-1 pl-1">
                  {children}
                </ol>
              ),

              /* List Item */
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),

              /* Bold */
              strong: ({ children }) => (
                <strong className="font-semibold text-white">
                  {children}
                </strong>
              ),

              /* Table */
              table: ({ children }) => (
                <div className="my-2 overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    {children}
                  </table>
                </div>
              ),

              /* Table Header */
              th: ({ children }) => (
                <th className="border border-white/10 bg-black/30 px-3 py-2 text-left">
                  {children}
                </th>
              ),

              /* Table Cell */
              td: ({ children }) => (
                <td className="border border-white/10 px-3 py-2">
                  {children}
                </td>
              ),

              /*
               * SEC-HIGH-02
               * Sanitasi link dari output LLM.
               * Hanya izinkan:
               * - http://
               * - https://
               * - relative path (/...)
               */
              a: ({ href, children }) => {
                const isSafe =
                  typeof href === "string" &&
                  /^(https?:|\/)/i.test(href);

                if (!isSafe) {
                  return <span>{children}</span>;
                }

                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-[#E35336] underline transition-colors hover:text-[#ff7459]"
                  >
                    {children}
                  </a>
                );
              },

              /*
               * SEC-HIGH-02
               * Blokir gambar eksternal dari output Markdown.
               * Mencegah IP leakage / tracking beacon.
               */
              img: () => null,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}

        {/* Timestamp */}
        <span className="mt-1 block select-none whitespace-nowrap text-right text-[10px] opacity-50">
          {time}
        </span>
      </div>
    </div>
  );
}
