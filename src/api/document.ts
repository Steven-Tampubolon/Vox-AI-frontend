import { api } from "./client";
import type { UploadDocumentResponse } from "../types/api";

export const documentApi = {
    upload(file: File, conversationId?: string) {
        const formData = new FormData()

        formData.append("file", file)

        if (conversationId) {
            formData.append("conversation_id", conversationId)
        }

        return api.post<UploadDocumentResponse>(
            "/document/upload",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        )
    },
}