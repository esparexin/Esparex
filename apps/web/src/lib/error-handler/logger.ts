import { EsparexError, ErrorCategory, ErrorSeverity } from "./types";

class ErrorLogger {
  private logs: EsparexError[] = [];
  private maxLogs = 100;
  private seenErrors: Set<string> = new Set();

  log(error: EsparexError): void {
    const key = `${error.category}:${error.code}:${error.technicalMessage}`;
    if (this.seenErrors.has(key)) return;
    this.seenErrors.add(key);
    setTimeout(() => this.seenErrors.delete(key), 2000);
    this.logs.push(error);
    if (this.logs.length > this.maxLogs) this.logs.shift();
    try { const stored = JSON.parse(localStorage.getItem("esparex_error_logs") || "[]"); stored.push(error.toJSON()); if (stored.length > 50) stored.shift(); localStorage.setItem("esparex_error_logs", JSON.stringify(stored)); } catch { /* ignore */ }
  }

  getLogs(): EsparexError[] { return [...this.logs]; }
  clearLogs(): void { this.logs = []; try { localStorage.removeItem("esparex_error_logs"); } catch { /* ignore */ } }
  getLogsByCategory(category: ErrorCategory): EsparexError[] { return this.logs.filter((l) => l.category === category); }
  getLogsBySeverity(severity: ErrorSeverity): EsparexError[] { return this.logs.filter((l) => l.severity === severity); }
}

export const errorLogger = new ErrorLogger();
