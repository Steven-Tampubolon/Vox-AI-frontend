export type CharacterSlug =
  | "betawi"
  | "rag"
  | "git"
  | "explain";

export interface CharacterInfo {
  id: CharacterSlug;
  display_name: string;
  description: string;
  capability: string[];
}

export interface CharacterFE {
  id: string;
  name: string;
  slug: CharacterSlug;
  description: string;
  avatar: string;
  color: string;
}