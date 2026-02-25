/**
 * Scraper configuration — all tuning knobs in one place.
 */
export const SCRAPER_CONFIG = {
  baseUrl: "https://wr-meta.com",
  tierListUrl: "https://wr-meta.com/meta/",
  requestDelayMs: 1500,
  maxConcurrent: 1,
  timeoutMs: 30000,
  userAgent: "WildRiftDraftAssistant/1.0 (research-tool)",
  maxRetries: 3,
  retryBaseDelayMs: 2000,
  expectedChampionCount: 135,
} as const;

/**
 * Complete Wild Rift champion roster (135 as of Feb 2026, excluding Mel).
 * Used as fallback to detect champions missing from the tier list page.
 * Format: [display name, wr-meta URL slug]
 */
export const CHAMPION_ROSTER: readonly [string, string][] = [
  ["Aatrox", "aatrox"], ["Ahri", "ahri"], ["Akali", "akali"], ["Akshan", "akshan"],
  ["Alistar", "alistar"], ["Ambessa", "ambessa"], ["Amumu", "amumu"], ["Annie", "annie"],
  ["Ashe", "ashe"], ["Aurelion Sol", "aurelion-sol"], ["Aurora", "aurora"],
  ["Bard", "bard"], ["Blitzcrank", "blitzcrank"], ["Brand", "brand"], ["Braum", "braum"],
  ["Caitlyn", "caitlyn"], ["Camille", "camille"], ["Corki", "corki"],
  ["Darius", "darius"], ["Diana", "diana"], ["Dr. Mundo", "dr-mundo"], ["Draven", "draven"],
  ["Ekko", "ekko"], ["Evelynn", "evelynn"], ["Ezreal", "ezreal"],
  ["Fiddlesticks", "fiddlesticks"], ["Fiora", "fiora"], ["Fizz", "fizz"],
  ["Galio", "galio"], ["Garen", "garen"], ["Gnar", "gnar"], ["Gragas", "gragas"],
  ["Graves", "graves"], ["Gwen", "gwen"],
  ["Hecarim", "hecarim"], ["Heimerdinger", "heimerdinger"],
  ["Irelia", "irelia"],
  ["Janna", "janna"], ["Jarvan IV", "jarvan-iv"], ["Jax", "jax"], ["Jayce", "jayce"],
  ["Jhin", "jhin"], ["Jinx", "jinx"],
  ["Kai'Sa", "kaisa"], ["Kalista", "kalista"], ["Karma", "karma"], ["Kassadin", "kassadin"],
  ["Katarina", "katarina"], ["Kayle", "kayle"], ["Kayn", "kayn"], ["Kennen", "kennen"],
  ["Kha'Zix", "khazix"], ["Kindred", "kindred"], ["Kog'Maw", "kogmaw"],
  ["Lee Sin", "lee-sin"], ["Leona", "leona"], ["Lillia", "lillia"], ["Lissandra", "lissandra"],
  ["Lucian", "lucian"], ["Lulu", "lulu"], ["Lux", "lux"],
  ["Malphite", "malphite"], ["Maokai", "maokai"], ["Master Yi", "master-yi"],
  ["Milio", "milio"], ["Miss Fortune", "miss-fortune"], ["Mordekaiser", "mordekaiser"],
  ["Morgana", "morgana"],
  ["Nami", "nami"], ["Nasus", "nasus"], ["Nautilus", "nautilus"], ["Nidalee", "nidalee"],
  ["Nilah", "nilah"], ["Nocturne", "nocturne"], ["Norra", "norra"],
  ["Nunu & Willump", "nunu-willump"],
  ["Olaf", "olaf"], ["Orianna", "orianna"], ["Ornn", "ornn"],
  ["Pantheon", "pantheon"], ["Poppy", "poppy"], ["Pyke", "pyke"],
  ["Rakan", "rakan"], ["Rammus", "rammus"], ["Rell", "rell"], ["Renekton", "renekton"],
  ["Rengar", "rengar"], ["Riven", "riven"], ["Rumble", "rumble"], ["Ryze", "ryze"],
  ["Samira", "samira"], ["Senna", "senna"], ["Seraphine", "seraphine"], ["Sett", "sett"],
  ["Shen", "shen"], ["Shyvana", "shyvana"], ["Singed", "singed"], ["Sion", "sion"],
  ["Sivir", "sivir"], ["Smolder", "smolder"], ["Sona", "sona"], ["Soraka", "soraka"],
  ["Swain", "swain"], ["Syndra", "syndra"],
  ["Talon", "talon"], ["Teemo", "teemo"], ["Thresh", "thresh"], ["Tristana", "tristana"],
  ["Tryndamere", "tryndamere"], ["Twisted Fate", "twisted-fate"], ["Twitch", "twitch"],
  ["Urgot", "urgot"],
  ["Varus", "varus"], ["Vayne", "vayne"], ["Veigar", "veigar"], ["Vel'Koz", "velkoz"],
  ["Vex", "vex"], ["Vi", "vi"], ["Viego", "viego"], ["Viktor", "viktor"],
  ["Vladimir", "vladimir"], ["Volibear", "volibear"],
  ["Warwick", "warwick"], ["Wukong", "wukong"],
  ["Xayah", "xayah"], ["Xin Zhao", "xin-zhao"],
  ["Yasuo", "yasuo"], ["Yone", "yone"], ["Yuumi", "yuumi"],
  ["Zed", "zed"], ["Zeri", "zeri"], ["Ziggs", "ziggs"], ["Zilean", "zilean"],
  ["Zoe", "zoe"], ["Zyra", "zyra"],
] as const;
