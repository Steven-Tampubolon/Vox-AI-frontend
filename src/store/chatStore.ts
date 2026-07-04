import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CharacterSlug } from "../types/character";

// ── Types ──────────────────────────────────────────────────────
export interface UserProfile {
    name: string
    avatar: string  // path ke avatar, contoh: '/assets/avatars/jellyfish-1.png'
}

interface ChatStore {
    // User
    user: UserProfile | null
    setUser: (user: UserProfile) => void

    // Character aktif
    activeCharacter: CharacterSlug
    setActiveCharacter: (character: CharacterSlug) => void

    // Conversation aktif
    activeConversationId: string | null
    setActiveConversationId: (id: string | null) => void

    // Onboarding sudah selesai?
    hasOnboarded: boolean
    setHasOnboarded: (value: boolean) => void

    // Reset semua state (logout / clear)
    reset: () => void

    // Optimistic UI
    pendingMessage: string | null
    failedMessage:  string | null
    setPendingMessage: (msg: string | null) => void
    setFailedMessage:  (msg: string | null) => void

    isSending: boolean
    setIsSending: (value: boolean) => void
    
    
}

// ── Default values ─────────────────────────────────────────────
const DEFAULT_STATE = {
    user: null,
    activeCharacter: "betawi" as CharacterSlug,
    activeConversationId: null,
    hasOnboarded: false,
    pendingMessage: null,
    failedMessage:  null,
    isSending: false,
}

// ── Store ──────────────────────────────────────────────────────
// persist - state tetap ada setelah refresh browser (localStorage)
export const useChatStore = create<ChatStore>()(
    persist(
        (set) => ({
            ...DEFAULT_STATE,

            setUser: (user) => set({ user }),

            setActiveCharacter: (activeCharacter) =>
                set({
                    activeCharacter,
                    activeConversationId: null, // reset conversation saat ganti character
                }),

                setActiveConversationId: (activeConversationId) =>
                    set({ activeConversationId }),

                setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
                setPendingMessage: (pendingMessage) => set({ pendingMessage }),
                setFailedMessage:  (failedMessage)  => set({ failedMessage }),
                setIsSending: (isSending) => set({ isSending }),

                reset: () => set(DEFAULT_STATE),
        }),
        {
            name: "voxai-store",    // key di localStorage
            // Hanya persist state tertentu - tidak semua perlu disimpan
            partialize: (state) => ({
                user: state.user,
                activeCharacter: state.activeCharacter,
                hasOnboarded: state.hasOnboarded,
                // activeConversationId sengaja tidak dipersist
                // supaya setiap buka app mulai dari fresh conversation
            }),
        }
    )
)