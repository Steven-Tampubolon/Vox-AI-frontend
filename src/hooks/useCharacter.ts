import { useQuery } from "@tanstack/react-query";
import { characterApi } from "../api/character";
import { type CharacterInfo } from "../types/character";

export function useCharacter() {
    const query = useQuery({
        queryKey: ["characters"],
        queryFn: async (): Promise<CharacterInfo[]> => {
            const res = await characterApi.getAll()
            return res.data.characters
        },
        staleTime: Infinity,
    })

    return {
        characters: query.data ?? [],
        isLoading:  query.isLoading,
        error:      query.error,
    }
}