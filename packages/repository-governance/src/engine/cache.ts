import type { AstCacheEntry } from "../types/index.js";
import { createHash } from "crypto";

export class AstCache {
  private store = new Map<string, AstCacheEntry>();
  private hits = 0;
  private misses = 0;

  private contentHash(content: string): string {
    return createHash("sha256").update(content).digest("hex");
  }

  getOrCompute(key: string, content: string, compute: () => any): any {
    const hash = this.contentHash(content);
    const existing = this.store.get(key);
    if (existing && existing.hash === hash) {
      this.hits++;
      return existing.ast;
    }
    this.misses++;
    const ast = compute();
    this.store.set(key, { ast, hash, computedAt: Date.now() });
    return ast;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  get stats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? this.hits / (this.hits + this.misses)
        : 0
    };
  }

  // Shared singleton for engine-wide access
  private static _instance: AstCache | null = null;

  static getInstance(): AstCache {
    if (!AstCache._instance) {
      AstCache._instance = new AstCache();
    }
    return AstCache._instance;
  }

  static resetInstance(): void {
    AstCache._instance = null;
  }
}
