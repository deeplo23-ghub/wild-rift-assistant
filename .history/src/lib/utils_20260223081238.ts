import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getJunglerIcon(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[ .&]/g, "-")
    .replace(/-+/g, "-");
  return `https://jungler.gg/games/wildrift/images/champion-squares-new/${slug}.webp?v=1771599633417`;
}
