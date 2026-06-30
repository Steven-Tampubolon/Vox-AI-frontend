import { useState } from "react";
import { useChatStore } from "../../store/chatStore";

interface StepProfileProps {
    onBack: () => void
    onComplete: () => void
}

const AVATARS = [
    "/assets/avatars/jellyfish-1.png",
    "/assets/avatars/jellyfish-2.png",
    "/assets/avatars/jellyfish-3.png",
    "/assets/avatars/jellyfish-4.png",
    "/assets/avatars/jellyfish-5.png",
    "/assets/avatars/alien-6.png",
]

export default function StepProfile({ onBack, onComplete }: StepProfileProps ) {
    const setUser = useChatStore((s) => s.setUser)
    const setHasOnboarded = useChatStore((s) => s.setHasOnboarded)

    const [name, setName] = useState("")
    const [avatar, setAvatar] = useState<string | null>(null)
    const [error, setError] = useState("")

    const canFinish = name.trim().length > 0 && avatar !== null

    function handleFinish() {
        const trimmed = name.trim()

        if (!trimmed) {
            setError("Masukan nama terlebih dahulu")
            return
        }
        if (!avatar) {
            setError("pilih avatar terlebih dahulu")
            return
        }

        setUser({ name: trimmed, avatar })
        setHasOnboarded(true)
        onComplete()
    }

    return (
        <div className="flex flex-col items-center max-w-xl gap-10 px-6 text-center">

            <h1 className="text-3xl md:text-4xl text-white mt-12 mb-6">
                Pilih Avatar Mu

            </h1>

            <div className="grid grid-cols-3 gap-4">
                {AVATARS.map((file) => {
                    const selected = avatar === file
                    return (
                        <button
                            key={file}
                            onClick={() => {
                            setAvatar(file)
                            setError("")
                            }}
                            className={`w-33.5 h-33.5 rounded-3xl border-2 flex items-center justify-center
                            transition-all duration-200
                            ${
                            selected
                            ? "bg-[#E35336] border-[#E35336]"
                            : "bg-[#2D2D30] border-[#B97B6E] hover:-translate-y-0.5 hover:bg-[#E35336]"
                            }`}
                            >
                            <img 
                            src={file} 
                            alt="Pilih avatar" 
                            className="w-12 h-12 object-contain" />

                        </button>
                    )
                })}

            </div>
            <h2 className="text-3xl md:text-4xl font-normal text-white mb-10">
                Siapa Namamu?

            </h2>

            <input
                value={name}
                onChange={(e) => {
                    setName(e.target.value)
                    setError("")
                }} 
                onKeyDown={(e) => {
                    if (e.key === "Enter" && canFinish) handleFinish()
                }}
                type="text"
                maxLength={30}
                placeholder="  Masukan nama"
                className="w-full max-w-md h-14 bg-[#444446] border border-[#8D8D8D] rounded-lg px-5
                text-white text-base outline-none transition-colors focus:border-[#E35336]" 
            />

            {error && <p className="text-[#E35336] text-sm mt-4">{error}</p>}

            <div className="flex items-center gap-4 mt-12">
                <button 
                    onClick={onBack}
                    className="text-sm text-[#8D8D8D] hover:text-white transition-colors">
                   ← kembali

                </button>

                <button 
                    onClick={handleFinish}
                    disabled={!canFinish}
                    aria-label="Mulai chat"
                    className={`w-25 h-8 rounded-[10px] border text-white text-sm transition-all duration-200
                    ${
                    canFinish
                    ? "border-[#E35336] hover:bg-[#E35336] active:scale-95"
                    : "border-[#444446] opacity-40 cursor-not-allowed"
                    }`}
                    >
                   lanjutkan  →

                </button>

            </div>

        </div>
    )
}