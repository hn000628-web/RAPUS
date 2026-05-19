import { Injectable } from '@nestjs/common';

type FeedCacheEntry = {
  data: any;
  expiresAt: number;
};

@Injectable()
export class FeedCache {

  private cache =
    new Map<string, FeedCacheEntry>();

  private DEFAULT_TTL =
    1000 * 20; // 20초

  /* =====================================
     Cache Key 생성
  ===================================== */

  private buildKey(
    regionId: number | null,
    cursor: string | null,
    limit: number,
  ): string {

    const r =
      regionId ?? 'all';

    const c =
      cursor ?? 'start';

    return `feed:${r}:${c}:${limit}`;

  }

  /* =====================================
     Cache 조회
  ===================================== */

  get(
    regionId: number | null,
    cursor: string | null,
    limit: number,
  ): any | null {

    const key =
      this.buildKey(regionId, cursor, limit);

    const entry =
      this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now =
      Date.now();

    if (entry.expiresAt < now) {

      this.cache.delete(key);

      return null;

    }

    return entry.data;

  }

  /* =====================================
     Cache 저장
  ===================================== */

  set(
    regionId: number | null,
    cursor: string | null,
    limit: number,
    data: any,
    ttl?: number,
  ): void {

    const key =
      this.buildKey(regionId, cursor, limit);

    const expire =
      Date.now() +
      (ttl ?? this.DEFAULT_TTL);

    this.cache.set(key, {
      data,
      expiresAt: expire,
    });

  }

  /* =====================================
     전체 캐시 삭제
  ===================================== */

  clear(): void {

    this.cache.clear();

  }

  /* =====================================
     특정 region 캐시 삭제
  ===================================== */

  clearRegion(
    regionId: number | null,
  ): void {

    const prefix =
      `feed:${regionId ?? 'all'}:`;

    for (const key of this.cache.keys()) {

      if (key.startsWith(prefix)) {

        this.cache.delete(key);

      }

    }

  }

  /* =====================================
     캐시 상태 확인
  ===================================== */

  size(): number {

    return this.cache.size;

  }

}