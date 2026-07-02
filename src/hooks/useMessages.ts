import { useQuery } from "@tanstack/react-query";
import { useChatStore } from "../store/chatStore";
import { conversationApi } from "../api/conversation";
import type { Conversation, Message } from "../types/api";
import { getPreviewMessages } from "../mocks/PreviewMessages";

 
// ⚠️ MODE PREVIEW SEMENTARA ──────────────────────────────────────────
// Aktifkan dengan menambahkan VITE_PREVIEW_MODE=true di .env.
// Dipakai untuk melihat bentuk bubble chat TANPA backend aktif.
// Set kembali ke false (atau hapus baris-nya) di .env begitu backend
// sudah jalan — blok ini boleh dihapus total kalau sudah tidak dipakai.
const PREVIEW_MODE = import.meta.env.VITE_PREVIEW_MODE === "true";


export function useMessages() {
  const { activeConversationId, activeCharacter } = useChatStore();

  const query = useQuery({
    queryKey: ["messages", activeConversationId],
    queryFn: async (): Promise<{ messages: Message[]; conversation: Conversation }> => {
      const res = await conversationApi.getMessages(
        activeConversationId!,
        activeCharacter!
      );
      return {
        messages: res.data.messages,
        conversation: res.data.conversation,
      };
    },
    enabled: !!activeConversationId,
    staleTime: 1000 * 10,
  });

    if (PREVIEW_MODE) {
    return {
      messages:     getPreviewMessages(activeCharacter),
      conversation: null,
      isLoading:    false,
      error:        null,
      refetch:      query.refetch,
    };
  }


  return {
    messages:     query.data?.messages     ?? [],
    conversation: query.data?.conversation ?? null,
    isLoading:    query.isLoading,
    error:        query.error,
    refetch:      query.refetch,
  };
}