import { CHARACTERS } from "../../constants/character";
import { useChatStore } from "../../store/chatStore";

export default function Header() {
    const activeCharacter = useChatStore((s) => s.activeCharacter)
    const user = useChatStore((s) => s.user)

    const character = CHARACTERS.find((c) => c.slug === activeCharacter)

    return (
        <header className="h-22.5 bg-[#252525] border-b border-[#444446] flex items-center justify-between shrink-0 px-8">
                <div className="flex items-center gap-4">
                    {character && (
                        <>
                        <img 
                        src={character.avatar} 
                        alt={character.name}
                        className="w-13.75 h-13.75 rounded-full object-cover scale-x-[-1] border-[3px]"
                        style={{ borderColor: character.color }} 
                        />
                        <h3 className="text-white text-lg font-medium">
                            {character.name}

                        </h3>
                        </>
                    )}

                </div>

                <div className="flex items-center gap-4">
                    <h3 className="text-white text-lg font-medium">
                        {user?.name}

                    </h3>
                    {user?.avatar && (
                        <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-13.75 h-13.75 rounded-full object-cover border-[3px] border-[#E35336]" 
                        />
                    )}

                </div>


        </header>
    )
}