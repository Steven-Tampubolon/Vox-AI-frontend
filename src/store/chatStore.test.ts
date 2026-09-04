import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useChatStore } from "./chatStore";

// Reset store ke DEFAULT_STATE sebelum tiap test supaya tidak saling bocor
beforeEach(() => {
  act(() => {
    useChatStore.getState().reset();
  });
});

describe("chatStore — user", () => {
  it("setUser menyimpan profil user", () => {
    act(() => {
      useChatStore.getState().setUser({ name: "Budi", avatar: "/avatar.png" });
    });
    expect(useChatStore.getState().user).toEqual({ name: "Budi", avatar: "/avatar.png" });
  });
});

describe("chatStore — activeCharacter", () => {
  it("default activeCharacter adalah betawi", () => {
    expect(useChatStore.getState().activeCharacter).toBe("betawi");
  });

  it("setActiveCharacter mengubah karakter dan mereset conversationId + streamingText", () => {
    act(() => {
      useChatStore.getState().setActiveConversationId("conv-123");
      useChatStore.getState().appendStreamingChunk("halo");
      useChatStore.getState().setActiveCharacter("git");
    });
    const s = useChatStore.getState();
    expect(s.activeCharacter).toBe("git");
    expect(s.activeConversationId).toBeNull();
    expect(s.streamingText).toBe("");
  });
});

describe("chatStore — conversation", () => {
  it("setActiveConversationId menyimpan id", () => {
    act(() => {
      useChatStore.getState().setActiveConversationId("conv-abc");
    });
    expect(useChatStore.getState().activeConversationId).toBe("conv-abc");
  });

  it("setActiveConversationId menerima null", () => {
    act(() => {
      useChatStore.getState().setActiveConversationId("conv-abc");
      useChatStore.getState().setActiveConversationId(null);
    });
    expect(useChatStore.getState().activeConversationId).toBeNull();
  });
});

describe("chatStore — optimistic UI", () => {
  it("setPendingMessage dan setFailedMessage bekerja independen", () => {
    act(() => {
      useChatStore.getState().setPendingMessage("pesan saya");
      useChatStore.getState().setFailedMessage("pesan gagal");
    });
    expect(useChatStore.getState().pendingMessage).toBe("pesan saya");
    expect(useChatStore.getState().failedMessage).toBe("pesan gagal");
  });

  it("setIsSending mengubah isSending", () => {
    act(() => { useChatStore.getState().setIsSending(true); });
    expect(useChatStore.getState().isSending).toBe(true);
    act(() => { useChatStore.getState().setIsSending(false); });
    expect(useChatStore.getState().isSending).toBe(false);
  });
});

describe("chatStore — streaming", () => {
  it("appendStreamingChunk mengakumulasi teks", () => {
    act(() => {
      useChatStore.getState().appendStreamingChunk("halo ");
      useChatStore.getState().appendStreamingChunk("dunia");
    });
    expect(useChatStore.getState().streamingText).toBe("halo dunia");
  });

  it("resetStreamingText mengosongkan streamingText", () => {
    act(() => {
      useChatStore.getState().appendStreamingChunk("isi");
      useChatStore.getState().resetStreamingText();
    });
    expect(useChatStore.getState().streamingText).toBe("");
  });
});

describe("chatStore — reset", () => {
  it("reset mengembalikan semua state ke DEFAULT_STATE", () => {
    act(() => {
      useChatStore.getState().setUser({ name: "Budi", avatar: "/x.png" });
      useChatStore.getState().setActiveCharacter("git");
      useChatStore.getState().setActiveConversationId("conv-xyz");
      useChatStore.getState().setPendingMessage("draft");
      useChatStore.getState().setIsSending(true);
      useChatStore.getState().appendStreamingChunk("teks");
      useChatStore.getState().reset();
    });
    const s = useChatStore.getState();
    expect(s.user).toBeNull();
    expect(s.activeCharacter).toBe("betawi");
    expect(s.activeConversationId).toBeNull();
    expect(s.pendingMessage).toBeNull();
    expect(s.isSending).toBe(false);
    expect(s.streamingText).toBe("");
  });
});

describe("chatStore — reaktivitas via renderHook", () => {
  it("komponen yang subscribe ke user re-render saat setUser dipanggil", () => {
    const { result } = renderHook(() => useChatStore((s) => s.user));
    expect(result.current).toBeNull();
    act(() => {
      useChatStore.getState().setUser({ name: "Ani", avatar: "/ani.png" });
    });
    expect(result.current).toEqual({ name: "Ani", avatar: "/ani.png" });
  });
});