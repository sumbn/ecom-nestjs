import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.interface';

@Injectable()
export class MemoryCacheService implements CacheService {
  private store = new Map<string, { value: unknown; expireAt?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expireAt && entry.expireAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expireAt = ttl ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value, expireAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async reset(): Promise<void> {
    this.store.clear();
  }
}
