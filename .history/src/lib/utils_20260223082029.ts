import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Role } from "@/types/champion"

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

export function getRoleIcon(role: Role | string): string {
  const r = typeof role === 'string' ? role.toLowerCase() : role;
  switch (r) {
    case 'baron': return 'https://www.wildriftfire.com/images/lanes/white-baron.png';
    case 'jungle': return 'https://www.wildriftfire.com/images/lanes/white-jungle.png';
    case 'mid': return 'https://www.wildriftfire.com/images/lanes/white-mid.png';
    case 'dragon':
    case 'duo':
    case 'adc': return 'https://www.wildriftfire.com/images/lanes/white-adc.png';
    case 'support': return 'https://www.wildriftfire.com/images/lanes/white-support.png';
    default: return '';
  }
}
