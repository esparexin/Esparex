export interface Cache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  clear(): void;
}

export class MemoryCache implements Cache {
  private data = new Map<string, any>();

  get<T>(key: string): T | null {
    const val = this.data.get(key);
    return val !== undefined ? (val as T) : null;
  }

  set<T>(key: string, value: T): void {
    this.data.set(key, value);
  }

  clear(): void {
    this.data.clear();
  }
}

export class NullCache implements Cache {
  get<T>(_key: string): T | null {
    return null;
  }
  set<T>(_key: string, _value: T): void {}
  clear(): void {}
}
