import { beforeEach, describe, expect, it, vi } from "vitest";
import { chatApi } from "./chat";

vi.mock("./client", () => ({
  api: {
    defaults: { baseURL: "/api/v1" },
  },
}));

function makeSSEStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

function makeFetchMock(status: number, body: ReadableStream | null, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    body,
    text: vi.fn().mockResolvedValue(`HTTP ${status}`),
  });
}

const BASE_PAYLOAD = {
  message: "halo",
  conversation_id: "",
  character: "betawi" as const,
};

function waitFor(fn: () => boolean, timeout = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (fn()) { clearInterval(interval); resolve(); }
      else if (Date.now() - start > timeout) { clearInterval(interval); reject(new Error("waitFor timeout")); }
    }, 10);
  });
}

describe("chatApi.chatStream — SSE parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("memanggil onChunk untuk setiap content event", async () => {
    const stream = makeSSEStream([
      'data: {"content":"halo "}\n\n',
      'data: {"content":"dunia"}\n\n',
      "data: [DONE]\n\n",
    ]);
    vi.stubGlobal("fetch", makeFetchMock(200, stream));

    const chunks: string[] = [];
    const onDone = vi.fn();

    chatApi.chatStream("betawi", BASE_PAYLOAD, {
      onChunk: (t) => chunks.push(t),
      onDone,
      onAbort: vi.fn(),
      onError: vi.fn(),
    });

    await waitFor(() => onDone.mock.calls.length > 0);
    expect(chunks).toEqual(["halo ", "dunia"]);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("menyimpan conversation_id dari event dan meneruskannya ke onDone", async () => {
    const stream = makeSSEStream([
      'data: {"conversation_id":"conv-999"}\n\n',
      'data: {"content":"oke"}\n\n',
      "data: [DONE]\n\n",
    ]);
    vi.stubGlobal("fetch", makeFetchMock(200, stream));

    const onDone = vi.fn();
    chatApi.chatStream("betawi", BASE_PAYLOAD, {
      onChunk: vi.fn(),
      onDone,
      onAbort: vi.fn(),
      onError: vi.fn(),
    });

    await waitFor(() => onDone.mock.calls.length > 0);
    expect(onDone).toHaveBeenCalledWith({ conversation_id: "conv-999" });
  });

  it("memanggil onDone saat koneksi putus tanpa [DONE]", async () => {
    const stream = makeSSEStream([
      'data: {"content":"parsial"}\n\n',
    ]);
    vi.stubGlobal("fetch", makeFetchMock(200, stream));

    const onDone = vi.fn();
    chatApi.chatStream("betawi", BASE_PAYLOAD, {
      onChunk: vi.fn(),
      onDone,
      onAbort: vi.fn(),
      onError: vi.fn(),
    });

    await waitFor(() => onDone.mock.calls.length > 0);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("melewati event dengan payload JSON rusak tanpa menghentikan stream", async () => {
    const stream = makeSSEStream([
      "data: BUKAN_JSON\n\n",
      'data: {"content":"tetap jalan"}\n\n',
      "data: [DONE]\n\n",
    ]);
    vi.stubGlobal("fetch", makeFetchMock(200, stream));

    const chunks: string[] = [];
    const onDone = vi.fn();
    const onError = vi.fn();

    chatApi.chatStream("betawi", BASE_PAYLOAD, {
      onChunk: (t) => chunks.push(t),
      onDone,
      onAbort: vi.fn(),
      onError,
    });

    await waitFor(() => onDone.mock.calls.length > 0);
    expect(onError).not.toHaveBeenCalled();
    expect(chunks).toEqual(["tetap jalan"]);
  });

  it("memanggil onError saat server mengirim error di payload SSE", async () => {
    const stream = makeSSEStream([
      'data: {"error":"server overload"}\n\n',
    ]);
    vi.stubGlobal("fetch", makeFetchMock(200, stream));

    const onError = vi.fn();
    chatApi.chatStream("betawi", BASE_PAYLOAD, {
      onChunk: vi.fn(),
      onDone: vi.fn(),
      onAbort: vi.fn(),
      onError,
    });

    await waitFor(() => onError.mock.calls.length > 0);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0][0].message).toBe("server overload");
  });

  it("memanggil onError saat HTTP response tidak ok", async () => {
    vi.stubGlobal("fetch", makeFetchMock(503, null, false));

    const onError = vi.fn();
    chatApi.chatStream("betawi", BASE_PAYLOAD, {
      onChunk: vi.fn(),
      onDone: vi.fn(),
      onAbort: vi.fn(),
      onError,
    });

    await waitFor(() => onError.mock.calls.length > 0);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("memanggil onAbort saat controller.abort() dipanggil", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          const signal = init?.signal as AbortSignal;
          if (signal) {
            signal.addEventListener("abort", () => {
              reject(new DOMException("The user aborted a request.", "AbortError"));
            });
          }
        });
      })
    );

    const onAbort = vi.fn();
    const controller = chatApi.chatStream("betawi", BASE_PAYLOAD, {
      onChunk: vi.fn(),
      onDone: vi.fn(),
      onAbort,
      onError: vi.fn(),
    });

    await new Promise((r) => setTimeout(r, 20));
    controller.abort();

    await waitFor(() => onAbort.mock.calls.length > 0);
    expect(onAbort).toHaveBeenCalledOnce();
  });

  it("mengirim request ke URL yang benar berdasarkan karakter", async () => {
    const stream = makeSSEStream(["data: [DONE]\n\n"]);
    const fetchMock = makeFetchMock(200, stream);
    vi.stubGlobal("fetch", fetchMock);

    const onDone = vi.fn();
    chatApi.chatStream("git", BASE_PAYLOAD, {
      onChunk: vi.fn(),
      onDone,
      onAbort: vi.fn(),
      onError: vi.fn(),
    });

    await waitFor(() => onDone.mock.calls.length > 0);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/chat/git");
  });
});