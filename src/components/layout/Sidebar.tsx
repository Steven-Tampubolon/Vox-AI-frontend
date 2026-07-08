import React, { useState } from "react";
import { Plus, Trash2, Pencil, PanelLeft } from "lucide-react";
import { CHARACTERS } from "../../constants/character";
import { useChatStore } from "../../store/chatStore";
import { useConversation } from "../../hooks/useConversations";
import { logger } from "../../lib/logger";
import { cn } from "../../lib/utils";


export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const activeCharacter       = useChatStore((s) => s.activeCharacter);
  const setActiveCharacter    = useChatStore((s) => s.setActiveCharacter);
  const activeConversationId  = useChatStore((s) => s.activeConversationId);
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId);

  const { conversations, deleteConversation, isDeleting, renameConversation, isRenaming } = useConversation();

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  function handleNewChat() {
    setActiveConversationId(null);
    logger.info(
      "%c[VOX AI] %c+ NEW CHAT",
      `Character: ${activeCharacter}`
    );
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id);
    logger.info(
      "%c[VOX AI] %c↩ LOAD CONVERSATION",
      `ID: ${id}`
    );
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteConversation(id);
    logger.info(
      "%c[VOX AI] %c✕ DELETE CONVERSATION",
    );
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  }

  function handleRenameStart(e: React.MouseEvent, conv: { id: string; title: string }) {
    e.stopPropagation()
    setRenamingId(conv.id)
    setRenameValue(conv.title || "")
  }

  function handleRenameSubmit(id: string) {
    const trimmed = renameValue.trim()
    if (trimmed) {
      renameConversation({ id, title: trimmed })
      logger.info("✎ RENAME CONVERSATION", `ID: ${id} → "${trimmed}"`)
    }
    setRenamingId(null)
  }

  function handleRenameCancel() {
    setRenamingId(null)
    setRenameValue("")
  }

  return (
    <aside
      className={cn("bg-[#252525] border-r border-[#444446] flex flex-col shrink-0", 
        "overflow-hidden transition-[width] duration-300", 
        isOpen ? "w-65" : "w-18")}
      >
      {/* Toggle */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Buka/tutup sidebar"
        className={cn(
        "h-18 w-full flex items-center text-white shrink-0",
        "hover:text-[#E35336] transition-all duration-300",
        isOpen ? "justify-around px-5" : "justify-center"
)}
      >
        {isOpen && (
          <span className="text-white font-bold text-xl tracking-widest select-none">
            VOX AI
          </span>
        )}
        <PanelLeft
          className={`transition-transform duration-300 ${isOpen ? "hidden" : ""}`}
        />
      </button>

      {/* New Chat */}
      <div className={`shrink-0 px-3 pt-3 pb-2 ${!isOpen && "flex justify-center"}`}>
        <button
          onClick={handleNewChat}
          className={`flex items-center gap-2 text-sm text-[#8D8D8D]
          hover:text-white hover:bg-[#333335] transition-colors rounded-xl
          ${isOpen ? "w-full px-3 py-2" : "w-10 h-10 justify-center"}`}
          >
          <Plus />
          {isOpen && <span>New Chat</span>}
        </button>
      </div>

      {/* Karakter list */}
      <div className={`shrink-0 px-3 pb-2 ${!isOpen && "flex flex-col items-center gap-2"}`}>
        {isOpen && (
          <p className="text-[10px] text-[#555558] uppercase tracking-wider px-2 pb-2">
            Karakter
          </p>
        )}
        {CHARACTERS.map((character) => {
          const isActive = character.slug === activeCharacter;
          return (
            <button
              key={character.slug}
              onClick={() => setActiveCharacter(character.slug)}
              title={!isOpen ? character.name : undefined}
              className={cn(
              "flex items-center gap-3 rounded-xl transition-colors",
              isOpen ? "w-full px-3 py-2" : "w-10 h-10 justify-center mb-1",
              isActive
              ? "bg-[#E35336] text-white"
              : "text-[#8D8D8D] hover:bg-[#333335] hover:text-white"
              )}
              >
              <img
                src={character.avatar}
                alt={character.name}
                className="w-8 h-8 rounded-full object-cover shrink-0 scale-x-[-1]"
              />
              {isOpen && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {character.name}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Conversation history — hanya saat sidebar terbuka */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <p className="text-[10px] text-[#555558] uppercase tracking-wider px-2 pb-2 pt-3">
            Riwayat · {conversations.length}
          </p>

          {conversations.length === 0 ? (
            <p className="text-xs text-[#555558] px-2">Belum ada percakapan</p>
          ) : (
            <div className="flex flex-col gap-1">
              {conversations.map((conv) => {
                const isActiveConv = conv.id === activeConversationId;
                const isRenaming_ = renamingId === conv.id
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`group flex items-center justify-between gap-2 px-3 py-2
                    rounded-xl cursor-pointer transition-colors
                    ${isActiveConv
                    ? "bg-[#3C3C3E] text-white"
                    : "text-[#8D8D8D] hover:bg-[#333335] hover:text-white"
                    }`}
                    >
                    <div className="flex-1 min-w-0">
                      {/* Mode rename: input inline */}
                      {isRenaming_ ? (
                        <input 
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSubmit(conv.id)
                          if (e.key == "Escape") handleRenameCancel()
                        }}
                        onBlur={() => handleRenameSubmit(conv.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-[#252525] text-white text-xs px-2 py-0.5
                        rounded-md outline-none border border-[#E35336]" 
                        />
                      ) : (

                        <p className="text-xs font-medium truncate">
                          {conv.title || "Percakapan baru"}
                        </p>
                      )}
                      <p className="text-[10px] text-[#555558] mt-0.5">
                        {formatDate(conv.updated_at)}
                      </p>
                    </div>

                    {/* Action buttons — muncul saat hover */}
                    {!isRenaming_ && (
                      <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleRenameStart(e, conv)}
                          disabled={isRenaming}
                          className="text-[#666668] hover:text-white p-1 rounded-lg
                          hover:bg-white/10 disabled:opacity-30"
                          >
                          <Pencil />
                        </button>

                        <button
                          onClick={(e) => handleDelete(e, conv.id)}
                          disabled={isDeleting}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity
                          text-[#666668] hover:text-[#E35336] p-1 rounded-lg
                          hover:bg-[#E35336]/10 disabled:opacity-30"
                          >
                          <Trash2 />
                        </button>
                      </div>

                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Spacer kalau sidebar tertutup */}
      {!isOpen && <div className="flex-1" />}

      {/* User profile */}
      <div
        className={`shrink-0 border-t border-[#444446] px-3 py-4
        ${isOpen ? "flex items-center gap-3" : "flex justify-center"}`}
      >
        {useChatStore.getState().user?.avatar && (
          <img
            src={useChatStore.getState().user!.avatar}
            alt={useChatStore.getState().user!.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-[#E35336] shrink-0"
          />
        )}
        {isOpen && (
          <span className="text-sm text-[#CFCFCF] truncate">
            {useChatStore.getState().user?.name}
          </span>
        )}
      </div>
    </aside>
  );
}