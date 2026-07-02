import { useEffect, useRef } from "react";
import { CHARACTERS } from "../../constants/character";
import { useChatStore } from "../../store/chatStore";
import { useMessages } from "../../hooks/useMessages";
import { useChat } from "../../hooks/useChat";
import MessageBubble from "./MessageBubble";

function TypingIndicator({ avatar, name }: { avatar: string; name: string }) {
  return (
    <div className="flex items-end gap-3">
      <img src={avatar} alt={name}
        className="w-9 h-9 rounded-full object-cover shrink-0" />
      <div className="bg-[#414141] px-5 py-3.5 rounded-[30px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#8D8D8D] rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-[#8D8D8D] rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-[#8D8D8D] rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow() {
  const activeCharacter      = useChatStore((s) => s.activeCharacter);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const user                 = useChatStore((s) => s.user);

  // ← baca dari store, bukan dari useChat()
  const pendingMessage = useChatStore((s) => s.pendingMessage);
  const failedMessage  = useChatStore((s) => s.failedMessage);

  const character = CHARACTERS.find((c) => c.slug === activeCharacter);
  const { messages, isLoading: isLoadingMessages } = useMessages();

  // ← isSending tetap dari useChat, tapi hanya untuk TypingIndicator
  const { sendMessage, isLoading: isSending } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMessage, failedMessage]);

  // ── Empty state ────────────────────────────────────────────────
  if (
    !activeConversationId &&
    messages.length === 0 &&
    !isLoadingMessages &&
    !isSending &&
    !pendingMessage &&
    !failedMessage
  ) {
    return (
      <section className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 opacity-40 select-none">
          {character && (
            <img src={character.avatar} alt={character.name}
              className="w-16 h-16 rounded-full object-cover scale-x-[-1]" />
          )}
          <p className="text-[#8D8D8D] text-sm">
            Mulai obrolan dengan {character?.name}
          </p>
        </div>
      </section>
    );
  }

  // ── Messages ───────────────────────────────────────────────────
  return (
    <section className="flex-1 w-full min-w-0 overflow-y-auto flex justify-center">
      <div className="w-full max-w-190 px-4 py-6 flex flex-col gap-10">

        {isLoadingMessages && (
          <div className="flex items-center gap-1 text-[#8D8D8D] px-2 pt-4">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce [animation-delay:75ms]">●</span>
            <span className="animate-bounce [animation-delay:150ms]">●</span>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            characterAvatar={character?.avatar ?? ""}
            characterName={character?.name ?? ""}
            userAvatar={user?.avatar ?? ""}
            userName={user?.name ?? ""}
          />
        ))}

        {/* Optimistic bubble */}
        {pendingMessage && (
          <MessageBubble
            key="pending-user-message"
            message={{
              id: -1,
              conversation_id: activeConversationId ?? "",
              role: "user",
              content: pendingMessage,
              created_at: new Date().toISOString(),
            }}
            characterAvatar={character?.avatar ?? ""}
            characterName={character?.name ?? ""}
            userAvatar={user?.avatar ?? ""}
            userName={user?.name ?? ""}
          />
        )}

        {/* Typing indicator dengan avatar */}
        {isSending && character && (
          <TypingIndicator avatar={character.avatar} name={character.name} />
        )}

        {/* Failed message + retry */}
        {failedMessage && (
          <div className="flex flex-col items-end gap-1">
            <MessageBubble
              key="failed-user-message"
              message={{
                id: -2,
                conversation_id: activeConversationId ?? "",
                role: "user",
                content: failedMessage,
                created_at: new Date().toISOString(),
              }}
              characterAvatar={character?.avatar ?? ""}
              characterName={character?.name ?? ""}
              userAvatar={user?.avatar ?? ""}
              userName={user?.name ?? ""}
            />
            <button
              onClick={() => sendMessage(failedMessage).catch(() => {})}
              className="text-xs text-[#E35336] hover:underline pr-2"
            >
              Gagal terkirim · Coba lagi
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </section>
  );
}