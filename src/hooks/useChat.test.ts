import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React, { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { mockChatStream } = vi.hoisted(() => ({
  mockChatStream: vi.fn(),
}));

vi.mock("../api/chat", () => ({
  chatApi: { chatStream: mockChatStream },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("../lib/logger", () => ({
  logger: { send: vi.fn(), reply: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const storeMock = {
  activeCharacter: "betawi" as const,
  activeConversationId: null as string | null,
  setActiveConversationId: vi.fn(),
  setPendingMessage: vi.fn(),
  setFailedMessage: vi.fn(),
  setIsSending: vi.fn(),
  appendStreamingChunk: vi.fn(),
  resetStreamingText: vi.fn(),
  isSending: false,
};

vi.mock("../store/chatStore", () => ({
  useChatStore: vi.fn((selector?: (s: typeof storeMock) => unknown) => {
    // useChatStore() tanpa selector → destructuring langsung (useChat line 20)
    if (!selector) return storeMock;
    // useChatStore((s) => s.isSending) dengan selector (useChat line 145)
    return selector(storeMock);
  }),
}));

import { useChat } from "./useChat";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

function makeStreamThatCalls(
  fn: (callbacks: Parameters<typeof mockChatStream>[2]) => void
) {
  const controller = new AbortController();
  mockChatStream.mockImplementation(
    (_char: unknown, _payload: unknown, callbacks: Parameters<typeof mockChatStream>[2]) => {
      Promise.resolve().then(() => fn(callbacks));
      return controller;
    }
  );
  return controller;
}

beforeEach(() => {
  vi.clearAllMocks();
  storeMock.activeConversationId = null;
  storeMock.isSending = false;
});

describe("useChat — sendMessage: state transitions", () => {
  it("memanggil setPendingMessage, setIsSending(true), dan resetStreamingText saat mulai", async () => {
    makeStreamThatCalls((cb) => cb.onDone({}));

    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });
    await act(async () => { await result.current.sendMessage("halo"); });

    expect(storeMock.setPendingMessage).toHaveBeenCalledWith("halo");
    expect(storeMock.setIsSending).toHaveBeenCalledWith(true);
    expect(storeMock.resetStreamingText).toHaveBeenCalled();
  });

  it("membersihkan state setelah onDone", async () => {
    makeStreamThatCalls((cb) => cb.onDone({ conversation_id: "conv-1" }));

    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });
    await act(async () => { await result.current.sendMessage("halo"); });

    expect(storeMock.setIsSending).toHaveBeenLastCalledWith(false);
    expect(storeMock.setPendingMessage).toHaveBeenLastCalledWith(null);
    expect(storeMock.resetStreamingText).toHaveBeenCalledTimes(2);
  });

  it("menyimpan conversation_id baru ke store saat belum ada conversationId", async () => {
    storeMock.activeConversationId = null;
    makeStreamThatCalls((cb) => cb.onDone({ conversation_id: "conv-baru" }));

    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });
    await act(async () => { await result.current.sendMessage("halo"); });

    expect(storeMock.setActiveConversationId).toHaveBeenCalledWith("conv-baru");
  });

  it("tidak override conversation_id jika sudah ada", async () => {
    storeMock.activeConversationId = "conv-lama";
    makeStreamThatCalls((cb) => cb.onDone({ conversation_id: "conv-baru" }));

    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });
    await act(async () => { await result.current.sendMessage("halo"); });

    expect(storeMock.setActiveConversationId).not.toHaveBeenCalled();
  });
});

describe("useChat — sendMessage: onChunk", () => {
  it("memanggil appendStreamingChunk untuk setiap chunk", async () => {
    makeStreamThatCalls((cb) => {
      cb.onChunk("halo ");
      cb.onChunk("dunia");
      cb.onDone({});
    });

    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });
    await act(async () => { await result.current.sendMessage("test"); });

    expect(storeMock.appendStreamingChunk).toHaveBeenCalledWith("halo ");
    expect(storeMock.appendStreamingChunk).toHaveBeenCalledWith("dunia");
  });
});

describe("useChat — sendMessage: onAbort", () => {
  it("membersihkan state dan resolve (bukan reject) saat stream di-abort", async () => {
    makeStreamThatCalls((cb) => cb.onAbort());

    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(result.current.sendMessage("halo")).resolves.toBeUndefined();
    });

    expect(storeMock.setIsSending).toHaveBeenLastCalledWith(false);
    expect(storeMock.setPendingMessage).toHaveBeenLastCalledWith(null);
  });
});

describe("useChat — sendMessage: onError", () => {
  it("menyimpan failedMessage dan reject saat error", async () => {
    makeStreamThatCalls((cb) => cb.onError(new Error("server mati")));

    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(result.current.sendMessage("halo")).rejects.toThrow("server mati");
    });

    expect(storeMock.setFailedMessage).toHaveBeenCalledWith("halo");
    expect(storeMock.setIsSending).toHaveBeenLastCalledWith(false);
  });
});

describe("useChat — stop", () => {
  it("stop memanggil controller.abort()", async () => {
    const controller = makeStreamThatCalls(() => {
      // stream tidak pernah selesai — sengaja
    });
    vi.spyOn(controller, "abort");

    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });
    act(() => { result.current.sendMessage("halo"); });

    await new Promise((r) => setTimeout(r, 10));
    act(() => { result.current.stop(); });

    expect(controller.abort).toHaveBeenCalledOnce();
  });
});

describe("useChat — reset", () => {
  it("reset memanggil setFailedMessage(null)", () => {
    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });
    act(() => { result.current.reset(); });
    expect(storeMock.setFailedMessage).toHaveBeenCalledWith(null);
  });
});