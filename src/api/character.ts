import { api } from "./client";
import type { CharacterListResponse } from "../types/api";

export const characterApi = {
  getAll() {
    return api.get<CharacterListResponse>(
      "/characters"
    );
  },
};