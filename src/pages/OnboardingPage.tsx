import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepCharacterIntro, {  } from "../components/onboarding/StepCharacterIntro";
import StepProfile, {  } from "../components/onboarding/StepProfile";
import StepWelcome, {  } from "../components/onboarding/StepWelcome";
import { useChatStore } from "../store/chatStore";

type OnboardingStep = 1 | 2 | 3

export default function OnboardingPage() {
    const navigate =  useNavigate()
    const hasOnboarded = useChatStore((s) => s.hasOnboarded)
    const [step, setStep] = useState<OnboardingStep>(1)

    // Guard: kalau user sudah pernah onboarding (localStorage masih ada), langsung ke /chat.
    useEffect(() => {
        if (hasOnboarded) {
            navigate("/chat", { replace: true })
        }
    }, [hasOnboarded, navigate])

    function handleComplete() {
        navigate("/chat", { replace: true })
    }

    return (
        <div className="min-h-screen w-full bg-[] flex flex-col items-center justify-center py-16">
            {/*Step Indicator*/}

            <div className="flex gap-2 mb-12">
                {([1, 2, 3] as const).map((s) => (
                    <span 
                    key={s}
                    className={`w-2 h-2 rounded-full transition-colors ${
                    s === step ? "bg-[#E35336]" : "bg-[#444446]"
                }`}
                />
                ))}

             </div>

                {step === 1 && <StepWelcome onNext={() => setStep(2)} />}

                {step === 2 && (
                    <StepCharacterIntro onNext={() => setStep(3)} onBack={() => setStep(1)} />
                )}

                {step === 3 && (
                    <StepProfile onBack={() => setStep(2)} onComplete={handleComplete} />
                )}

        </div>

    )
}
