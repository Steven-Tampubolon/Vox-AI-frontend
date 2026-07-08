/**
 * Memetakan singkatan bahasa pemrograman dari highlighter menjadi nama lengkapnya.
 */
const languageMap: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  rb: "ruby",
  sh: "shell",
  bash: "shell",
  cs: "c#",
  cpp: "c++",
  rs: "rust",
  go: "golang",
  yml: "yaml",
  md: "markdown",
};

/**
 * Membersihkan class name dari rehype-highlight dan mengembalikan nama bahasa lengkapnya.
 */
export function formatLanguage(codeClass: string): string {
  const rawLang = codeClass
    .replace(/hljs/g, "")
    .replace(/language-/g, "")
    .trim() || "code";

  return languageMap[rawLang.toLowerCase()] || rawLang;
}