import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Role } from "@/types/champion"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getJunglerIcon(name: string): string {
  // Map various champion name formats to Data Dragon ID (PascalCase, no special characters)
  const ddragonId = name
    .replace(/'/g, "")
    .replace(/[ .&]/g, "")
    // Special cases where Riot's ID differs from simple CamelCase
    .replace("JarvanIV", "JarvanIV")
    .replace("LeeSin", "LeeSin")
    .replace("XinZhao", "XinZhao")
    .replace("Dr.Mundo", "DrMundo")
    .replace("Wukong", "MonkeyKing");

  // Using a stable version of Data Dragon
  const version = "14.24.1";
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${ddragonId}.png`;
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

export function getWinrateColor(wr: number): string {
  if (wr >= 55) return "text-yellow-400 font-extrabold";
  if (wr >= 54) return "text-emerald-400 font-bold";
  if (wr >= 53) return "text-green-400 font-bold";
  if (wr >= 52) return "text-teal-400 font-bold";
  if (wr >= 51) return "text-cyan-400 font-bold";
  if (wr >= 50) return "text-blue-400 font-bold";
  if (wr >= 49) return "text-indigo-400";
  if (wr >= 48) return "text-violet-400";
  if (wr >= 47) return "text-rose-400";
  if (wr >= 46) return "text-red-400";
  return "text-zinc-500";
}

export function formatTag(tag: string): string {
  if (!tag) return "";
  if (tag.length <= 3) return tag.toUpperCase();
  return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
}
