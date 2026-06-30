import { useState } from "react";
import { CHARACTERS } from "../../constants/character";
import { useChatStore } from "../../store/chatStore";

function MenuIcon({ className = "" }) {
    return (
        <svg 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect 
                x="3" 
                y="4" 
                width="18" 
                height="16" 
                rx="3" 
                stroke="currentColor" 
                strokeWidth="2"
            />
            <path 
                d="M10 4V20" 
                stroke="currentColor" 
                strokeWidth="2"
                fill="currentColor"
            />
        </svg>
    )
}

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false)
    const activeCharacter = useChatStore((s) => s.activeCharacter)
    const setActiveCharacter = useChatStore((s) => s.setActiveCharacter)

    return (
        <aside 
            className={`bg-[#252525] border-r border-[#444446] flex flex-col shrink-0
            overflow-hidden transition-[width] duration-300
            ${isOpen ? "w-65" : "w-18"}`}
        >
            {/* Bagian Header / Tombol Toggle */}
            <button 
                onClick={() => setIsOpen((v) => !v)}
                aria-label="Buka/tutup sidebar"
                className={`h-20 w-full flex items-center text-white
                hover:text-[#E35336] transition-all duration-300
                ${isOpen ? "justify-between px-10" : "justify-center px-0"}`}
            >
                {isOpen && (
                    <span className="text-white font-bold text-2xl tracking-widest select-none transition-opacity duration-300 animate-in fade-in">
                        VOX AI
                    </span>
                )}
                <MenuIcon className={`transition-transform duration-700 ${isOpen ? "scale-x-[-1]" : ""}`} />
            </button>

            {/* Bagian Konten / Daftar Karakter */}
            <div 
                className={`px-5 pb-5 flex-1 overflow-y-auto transition-opacity duration-200
                ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
                <h3 className="text-sm text-[#8D8D8D] mb-4 ml-2">
                    Ganti Karakter
                </h3>

                <div className="flex flex-col gap-3">
                    {CHARACTERS.map((character) => {
                        const isActive = character.slug === activeCharacter
                        return (
                            <button
                                key={character.slug} 
                                onClick={() => setActiveCharacter(character.slug)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-left transition-colors
                                ${isActive ? "bg-[#E35336]" : "hover:bg-[#E35336]/70"}`}
                            >
                                <img 
                                    src={character.avatar} 
                                    alt={character.name} 
                                    className="w-10 h-10 rounded-full object-cover scale-x-[-1] shrink-0"
                                />
                                <span className="text-sm text-white whitespace-nowrap">
                                    {character.name}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </aside>
    )
}