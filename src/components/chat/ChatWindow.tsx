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
      <div className=" px-5 py-3.5 rounded-[30px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#8D8D8D] rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-[#8D8D8D] rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-[#8D8D8D] rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}


// Bubble jawaban AI yang lagi "diketik" realtime dari SSE
function StreamingBubble({
  avatar,
  name,
  text,
}: {
  avatar: string
  name: string
  text: string
}) {
  return (
    <div className="flex items-end gap-3">
      <img src={avatar} alt={name}
      className="w-9 h-9 rounded-full object-cover shrink-0" />
      <div className="px-5 py-3.5 rounded-[30px] bg-[#414141] text-white text-base leading-6 whitespace-pre-wrap max-w-150">
        {text}
        {/* Cursor effect */}
        <span className="inline-block w-0.5 h-4 bg-white ml-0.5 align-middle animate-pulse" />

      </div>

    </div>
  )
}


export default function ChatWindow() {
  const activeCharacter      = useChatStore((s) => s.activeCharacter);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const user                 = useChatStore((s) => s.user);

  // ← baca dari store, bukan dari useChat()
  const pendingMessage = useChatStore((s) => s.pendingMessage);
  const failedMessage  = useChatStore((s) => s.failedMessage);

  // ← state baru: teks yang lagi streaming
  const streamingText = useChatStore((s) => s.streamingText)

  const character = CHARACTERS.find((c) => c.slug === activeCharacter);
  const { messages, isLoading: isLoadingMessages } = useMessages();

  // ← isSending tetap dari useChat, tapi hanya untuk TypingIndicator
  const isSending = useChatStore((s) => s.isSending)
  const { sendMessage } = useChat()

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMessage, failedMessage, streamingText]); // tambahkan streamingText()

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
          <div className="flex items-end gap-3">
            <div className=" px-5 py-3.5 rounded-[30px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#8D8D8D] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-[#8D8D8D] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-[#8D8D8D] rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
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

        {/*
          isSending punya 2 fase:
          1. Belum ada chunk masuk sama sekali (streamingText kosong) →
             tampilkan TypingIndicator (dots) - AI masih "mikir"/retrieval
          2. Chunk pertama sudah masuk (streamingText terisi) →
             ganti ke StreamingBubble - teks tampil realtime + cursor berkedip
        */}
        
        {isSending && character && (
          streamingText
          ? <StreamingBubble avatar={character.avatar} name={character.name} text={streamingText} />
          : <TypingIndicator avatar={character.avatar} name={character.name} />
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