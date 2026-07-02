import ReactMarkdown from "react-markdown";
import type { Message } from "../../types/api";

interface MessageBubbleProps {
  message: Message;
  characterAvatar: string;
  characterName: string;
  userAvatar: string;
  userName: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
    <div className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>

      {/* Avatar */}
      <img
        src={isUser ? userAvatar : characterAvatar}
        alt={isUser ? userName : characterName}
        className="w-9 h-9 rounded-full object-cover border shrink-0 self-end scale-x-[-1]"
      />

      {/* Bubble */}
      <div
        className={`max-w-125 px-5 py-3 rounded-[30px] text-white text-sm leading-relaxed
                    ${isUser ? "bg-[#E35336]" : "bg-[#414141]"}`}
      >
        {isUser ? (
          <span>{message.content}</span>
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="mb-1 last:mb-0">{children}</p>
              ),
              code: ({ children }) => (
                <code className="bg-black/30 px-1 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-black/30 p-3 rounded-xl text-xs font-mono overflow-x-auto my-2">
                  {children}
                </pre>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 my-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 my-1">{children}</ol>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}

        {/* Timestamp inline */}
        <span className="text-[10px] opacity-50 ml-2 whitespace-nowrap float-right mt-1">
          {time}
        </span>
      </div>

    </div>
  );
}