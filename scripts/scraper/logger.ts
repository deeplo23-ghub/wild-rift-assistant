/**
 * Structured logger for scraper pipeline.
 */
type LogLevel = "debug" | "info" | "warn" | "error";
const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export function createLogger(minLevel: LogLevel = "info") {
  const threshold = LEVELS[minLevel];

  function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    if (LEVELS[level] < threshold) return;
    const ts = new Date().toISOString();
    const prefix = `[${ts}] [${level.toUpperCase().padEnd(5)}]`;
    const suffix = data ? ` ${JSON.stringify(data)}` : "";
    console.log(`${prefix} ${message}${suffix}`);
  }

  return {
    debug: (msg: string, data?: Record<string, unknown>) => log("debug", msg, data),
    info: (msg: string, data?: Record<string, unknown>) => log("info", msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log("warn", msg, data),
    error: (msg: string, data?: Record<string, unknown>) => log("error", msg, data),
  };
}

export type Logger = ReturnType<typeof createLogger>;
