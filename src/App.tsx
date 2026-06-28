import { Navigate, Route, Routes } from "react-router-dom";
import OnboardingPage, {  } from "./pages/OnboardingPage";
import { useChatStore } from "./store/chatStore";


function ChatPagePlaceholder() {
  return (
    <div className="min-h-screen bg-[] text-white flex items-center justify-center">
      <p>ChatPage belum dibuat (Step 7)</p>

    </div>
  )
}

function RootDirect() {
  const hasOnboarded = useChatStore((s) => s.hasOnboarded)
  return <Navigate to={hasOnboarded ? "/chat" : "/onboarding"} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootDirect />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/chat" element={<ChatPagePlaceholder />} />
    </Routes>
  )
}