import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import OnboardingPage from "./pages/OnboardingPage";
import  ChatPage  from "./pages/ChatPage";
import { useChatStore } from "./store/chatStore";
import { AnimatePresence } from "framer-motion";

function RootDirect() {
  const hasOnboarded = useChatStore((s) => s.hasOnboarded)
  return <Navigate to={hasOnboarded ? "/chat" : "/onboarding"} replace />
}

// Kalau hasOnboarded masih false, /chat dilempar balik ke /onboarding.
function RequireOnboarding({ children }: { children: ReactNode }) {
  const hasOnboarded = useChatStore((s) => s.hasOnboarded);
  if (!hasOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const location = useLocation()
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#3C3C3E",
            color: "#ffffff",
            border: "1px solid #4A4A4C",
          },
          descriptionClassName: "!text-white !opacity-100",
        }}
      />
      <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RootDirect />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/chat" 
          element={
            <RequireOnboarding>
              <ChatPage />
            </RequireOnboarding>
          } 
        />
            
      </Routes>

      </AnimatePresence>
    </>
  )
}