import { useState } from "react";
import { CHARACTERS } from "../../constants/character";
import type { CharacterSlug } from "../../types/character";

interface StepCharacterInfoProps {
    onNext: () => void
    onBack: () => void
}

// ag presentasi khusus carousel onboarding — tidak menyentuh file constants/character.ts.
const CAPABILITY_TAGS:  Record<CharacterSlug, string[]> = {
    betawi: ["Ngobrol Santai", "Pantun", "Loga Betawi"],
    rag: ["RAG", "PDF / TXT", "Tanya Jawab"],
    git: ["Commit Message", "Git Workflow", "Review Diff"],
    explain: ["Analogi", "ELI5", "Penjelasan"],
}

function ChevronIcon({ className = "" }: { className?: string }) {
    return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    )
}

export default function StepCharacterIntro({ onNext, onBack }: StepCharacterInfoProps) {
    const [index, setIndex] = useState(0)
    const character = CHARACTERS[index]
    const isFirst = index === 0
    const isLast = index === CHARACTERS.length - 1

    return (
        <div className="flex flex-col items-center max-w-3xl mx-auto px-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
                VOX AI MEMILIKI {CHARACTERS.length} MODEL KARAKTER

            </h1>
            
            <div className="flex items-center gap-6 md:gap-10 w-full">
                <button
                    onClick={() => setIndex((i) => i - 1)}
                    disabled={isFirst}
                    aria-label="Karakter sebelumnya"
                    className={`text-white transition-opacity ${
                    isFirst ? "opacity-0 pointer-events-none" : "opacity-100 hover:opacity-70"
                    }`}
                    >
                    <ChevronIcon className="rotate-180" />

                </button>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 flex-1">
                    <div className="flex flex-col items-center shrink-0">
                        <div className="w-45 h-45 md:w-55 md:h-55 rounded-full overflow-hidden flex items-center justify-center"
                            style={{ backgroundColor: "#45454A" }}
                            >
                                <img 
                                    src={character.avatar} 
                                    alt={character.name} 
                                    className="w-full h-auto object-contain"
                                />

                        </div>

                        <div className="flex flex-wrap gap-1.5 justify-center max-w-55">
                            {CAPABILITY_TAGS[character.slug].map((tag) => (
                                <span
                                    key={tag}
                                    className="text-[10px] px-2 py-2 rounded-full text-white"
                                    style={{ backgroundColor: character.color }}
                                    >
                                    {tag}

                                </span>
                            ))}

                        </div>

                    </div>

                    <div className="text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            {character.name}

                        </h2>
                        <p className="text-[#CFCFCF] text-base md:text-lg leading-relaxed">
                            {character.description}

                        </p>

                    </div>

                </div>

                <button
                    onClick={() => setIndex((i) => i + 1)}
                    disabled={isLast}
                    aria-label="Karakter berikutnya"
                    className={`text-white transition-opacity ${
                    isLast ? "opacity-0 pointer-events-none" : "opacity-100 hover:opacity-70"
                    }`}
                    >
                    <ChevronIcon />
                    
                </button>

            </div>

            <div className="flex items-center gap-4 mt-16">
                <button 
                    onClick={onBack}
                    className="text-sm text-[#8D8D8D] hover:text-white transition-colors"
                    >
                    ← Kembali

                </button>

                {isLast && (
                    <button 
                        onClick={onNext}
                        aria-label="Lanjutkan"
                        className="w-16 h-16 rounded-[14px] border border-[#ed50078a]
                        bg-transparent text-white text-2xl transition-all duration-200
                        hover:bg-[#E35336] active:scale-95"
                        >
                        →

                    </button>
                )}

            </div>

        </div>
    )
}