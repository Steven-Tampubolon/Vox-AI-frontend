import { useCallback, useState } from "react";
import { X, FileText, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useChatStore } from "../../store/chatStore";
import { documentApi } from "../../api/document";
import type { Document } from "../../types/api";
import { cn } from "../../lib/utils";
import { logger } from "../../lib/logger";

interface DocumentUploaderProps {
  onClose: () => void;
}

interface UploadedFile {
  doc: Document;
  filename: string;
}

export default function DocumentUploader({ onClose }: DocumentUploaderProps) {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback(
  async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    setIsUploading(true);
    setError("");

    for (const file of acceptedFiles) {
      try {
        const res = await documentApi.upload(file, activeConversationId ?? undefined);

        // simpan conversation_id dari response upload
        if (res.data.conversation_id) {
          setActiveConversationId(res.data.conversation_id);
        }

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
        logger.info("↑ UPLOAD DOCUMENT", `${res.data.filename} · ${res.data.chunk_count} chunks · conv: ${res.data.conversation_id}`)
      } catch {
        setError(`Gagal upload ${file.name}. Coba lagi.`);
      }
    }
    setIsUploading(false);
  },
  [activeConversationId, setActiveConversationId]
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
          <X />
        </button>
      </div>

      {/* Dropzone */}
      <div className="p-3">
        <div
          {...getRootProps()}
          className={cn(
          "flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed",
          "cursor-pointer transition-colors duration-200 select-none",
          isDragActive
          ? "border-[#E35336] bg-[#E35336]/10"
          : "border-[#555558] hover:border-[#8D8D8D] hover:bg-white/5",
          isUploading && "opacity-50 pointer-events-none"
          )}
          >
          <input {...getInputProps()} />
          <div className={cn(isDragActive ? "text-[#E35336]" : "text-[#666668]")}>
          <Upload />
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
              <span className="text-[#E35336] shrink-0"><FileText /></span>
              <span className="truncate flex-1">{f.filename}</span>
              <span className="text-[#555558] shrink-0">{f.doc.chunk_count} chunk</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}