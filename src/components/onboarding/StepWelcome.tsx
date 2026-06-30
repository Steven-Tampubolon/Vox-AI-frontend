interface StepWelcomeProps {
    onNext: () => void;
}

export default function StepWelcome({ onNext }: StepWelcomeProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center max-w-2xl gap-y-11 px-6">
            <h1 className="text-5xl md:text-6xl font-bold text-[#E35336] tracking-tight">
                SELAMAT DATANG

            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-[#E35336] mt-2">
                VOX AI

            </h2>

            <p className="text-[#CFCFCF] text-base md:text-left mt-8 leading-relaxed">
                VOX AI adalah chatbot AI multi-karakter. Setiap karakter punya
                kepribadian dan kemampuan yang berbeda — mulai dari ngobrol santai,
                bantu workflow Git, sampai analisa dokumen yang kamu upload.
                <br />
                <br />
                VOX AI adalah chatbot AI multi-karakter. Setiap karakter punya
                kepribadian dan kemampuan yang berbeda — mulai dari ngobrol santai,
                bantu workflow Git, sampai analisa dokumen yang kamu upload.

            </p>

            <button
                onClick={onNext}
                aria-label="Lanjutkan"
                className="mt-16 w-14 h-14 rounded-[10px] border-2 border-[#ed50078a]
                bg-transparent text-white text-2xl transition-all duration-200
                hover:bg-[#E35336] active:scale-95"
                >
                →

            </button>
            
        </div>
    )
}