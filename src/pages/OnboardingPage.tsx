import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepCharacterIntro from "../components/onboarding/StepCharacterIntro";
import StepProfile from "../components/onboarding/StepProfile";
import StepWelcome from "../components/onboarding/StepWelcome";
import { useChatStore } from "../store/chatStore";
import { AnimatePresence, motion } from "framer-motion";

type OnboardingStep = 1 | 2 | 3

export default function OnboardingPage() {
    const navigate = useNavigate()
    const hasOnboarded = useChatStore((s) => s.hasOnboarded)
    const [step, setStep] = useState<OnboardingStep>(1)

    useEffect(() => {
        if (hasOnboarded) {
            navigate("/chat", { replace: true })
        }
    }, [hasOnboarded, navigate])

    function handleComplete() {
        navigate("/chat", { replace: true })
    }

    const fadeVariants = {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
    }   

    return (
        <div className="min-h-screen w-full bg-[] flex flex-col items-center justify-center py-16">
            
            {/* 1. KELUARKAN STEP INDICATOR DARI ANIMATEPRESENCE */}
            <div className="flex gap-2 mb-12">
                {([1, 2, 3] as const).map((s) => (
                    <span 
                        key={s}
                        className={`w-1 h-1 rounded-full transition-colors duration-300 ${
                            s === step ? "bg-[#E35336]" : "bg-[#444446]"
                        }`}
                    />
                ))}
            </div>

            {/* 2. ANIMATEPRESENCE HANYA MEMBUNGKUS KONTEN YANG BERGANTI */}
            <div className="w-full flex justify-center min-h-67.5">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1" // <-- Key Unik 1
                            variants={fadeVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full flex justify-center"                  
                        >
                            <StepWelcome onNext={() => setStep(2)} />
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2" // <-- Key Unik 2 (Sebelumnya kamu tulis step1)
                            variants={fadeVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full flex justify-center"
                        >
                            <StepCharacterIntro onNext={() => setStep(3)} onBack={() => setStep(1)} />
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3" // <-- Key Unik 3 (Sebelumnya kamu tulis step1)
                            variants={fadeVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full flex justify-center"
                        >
                            <StepProfile onBack={() => setStep(2)} onComplete={handleComplete} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    )
}