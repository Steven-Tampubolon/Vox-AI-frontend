import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Gabungan clsx + tailwind-merge
// clsx  → handle conditional className
// twMerge → resolve konflik Tailwind class (px-4 vs px-8 → px-8 menang)
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}