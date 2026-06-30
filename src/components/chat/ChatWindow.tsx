import { CHARACTERS } from "../../constants/character";
import { useChatStore } from "../../store/chatStore";

export default function ChatWindow() {
    const activecharacter = useChatStore((s) => s.activeCharacter)
    const character = CHARACTERS.find((c) => c.slug === activecharacter)

    return (
        <section className="flex-1 overflow-y-auto flex justify-center">
            <div className="w-full max-w-300 flex flex-col items-center justify-center flex-1 px-6">
                {character && (
                    <>
                    <img 
                    src={character.avatar} 
                    alt={character.name}
                    className="w-20 h-20 rounded-full scale-x-[-1] object-cover mb-4 opacity-60" 
                    />
                    <p className="text-[#8D8D8D] text-center">
                        Mulai obrolan dengan {character.name}

                    </p>
                    </>
                )}
                {/* TODO Step 8: render MessageBubble dari useMessages(activeConversationId) */}

            </div>

        </section>
    )
}