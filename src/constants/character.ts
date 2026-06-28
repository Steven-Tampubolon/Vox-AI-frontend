import { type Character } from "../types/character";

export const CHARACTERS: Character[] = [
    {
        id: "1",
        name: "Abang Betawi",
        slug: "betawi",
        description: "Ngobrol santai dengan logat Betawi dan bisa membuat pantun.",
        avatar: "/assets/characters/abang-betawi.png",
        color: "#F97316",
    },
    {
        id: "2",
        name: "Dokter Dokumen",
        slug: "rag",
        description: "Menjawab pertanyaan berdasarkan dokumen yang kamu upload.",
        avatar: "/assets/characters/dokter-dokumen.png",
        color: "#3B82F6",
    },
    {
        id: "3",
        name: "Git Master",
        slug: "git",
        description: "Membantu membuat commit message dan menjelaskan workflow Git.",
        avatar: "/assets/characters/git-master.png",
        color: "#10B981",
    },
    {
        id: "4",
        name: "Profesor Analogi",
        slug: "explain",
        description: "Menjelaskan konsep rumit menggunakan analogi sederhana.",
        avatar: "/assets/characters/profesor-analogi.png",
        color: "#8B5CF6",
    }
]