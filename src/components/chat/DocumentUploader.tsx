import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useChatStore } from "../../store/chatStore";
import { documentApi } from "../../api/document";
import type { Document } from "../../types/api";

interface DocumentUploaderProps {
  onClose: () => void;
}

interface UploadedFile {
  doc: Document;
  filename: string;
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" />
      <path d="M17 8l-5-5-5 5M12 3v12" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DocumentUploader({ onClose }: DocumentUploaderProps) {
  const activeConversationId = useChatStore((s) => s.activeConversationId);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!activeConversationId) {
        setError("Kirim pesan dulu untuk memulai sesi, lalu upload dokumen.");
        return;
      }
      if (!acceptedFiles.length) return;

      setIsUploading(true);
      setError("");

      for (const file of acceptedFiles) {
        try {
          const res = await documentApi.upload(file, activeConversationId ?? undefined);
          setUploadedFiles((prev) => [
            ...prev,
            {
              doc: {
                id: res.data.document_id,
                conversation_id: res.data.conversation_id,
                filename: res.data.filename,
                chunk_count: res.data.chunk_count,
                created_at: new Date().toISOString(),
              },
              filename: res.data.filename,
            },
          ]);
        } catch {
          setError(`Gagal upload ${file.name}. Coba lagi.`);
        }
      }

      setIsUploading(false);
    },
    [activeConversationId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
    maxSize: 10 * 1024 * 1024,
    disabled: isUploading,
  });

  return (
    <div className="bg-[#3C3C3E] rounded-2xl ring-1 ring-[#555558] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#555558]">
        <span className="text-sm font-medium text-white">Upload Dokumen</span>
        <button
          onClick={onClose}
          className="text-[#666668] hover:text-white transition-colors"
        >
          <IconX />
        </button>
      </div>

      {/* Dropzone */}
      <div className="p-3">
        <div
          {...getRootProps()}
          className={`flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed
                      cursor-pointer transition-colors duration-200 select-none
                      ${isDragActive
                        ? "border-[#E35336] bg-[#E35336]/10"
                        : "border-[#555558] hover:border-[#8D8D8D] hover:bg-white/5"
                      }
                      ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input {...getInputProps()} />
          <div className={isDragActive ? "text-[#E35336]" : "text-[#666668]"}>
            <IconUpload />
          </div>
          {isUploading ? (
            <p className="text-sm text-[#8D8D8D]">Mengupload...</p>
          ) : isDragActive ? (
            <p className="text-sm text-[#E35336]">Lepaskan file di sini</p>
          ) : (
            <>
              <p className="text-sm text-[#CFCFCF]">
                Drag & drop,{" "}
                <span className="text-[#E35336] underline underline-offset-2">
                  atau pilih file
                </span>
              </p>
              <p className="text-xs text-[#666668]">PDF atau TXT · Maks 10MB</p>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-[#E35336] px-4 pb-3">{error}</p>
      )}

      {/* File list */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-col gap-1 px-3 pb-3">
          {uploadedFiles.map((f) => (
            <div
              key={f.doc.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl
                         bg-[#252525] text-xs text-[#CFCFCF]"
            >
              <span className="text-[#E35336] shrink-0"><IconFile /></span>
              <span className="truncate flex-1">{f.filename}</span>
              <span className="text-[#555558] shrink-0">{f.doc.chunk_count} chunk</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}