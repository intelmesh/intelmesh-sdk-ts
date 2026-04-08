// ---------------------------------------------------------------------------
// Async cursor-based pagination iterator
// ---------------------------------------------------------------------------

import type { PaginatedResponse, PaginationParams } from '../types.js';

/** Function that fetches a single page of results. */
type PageFetcher<T> = (params: PaginationParams) => Promise<PaginatedResponse<T>>;

/**
 * Creates an async iterator that automatically follows cursor pagination.
 * @param fetcher - Function to fetch a single page.
 * @param params - Initial pagination parameters.
 * @yields {T} Individual items from paginated responses.
 * @returns An async iterable of individual items.
 */
export async function* paginate<T>(
  fetcher: PageFetcher<T>,
  params: PaginationParams = {},
): AsyncGenerator<T, void, undefined> {
  let cursor = params.cursor;
  let hasMore = true;

  while (hasMore) {
    const page = await fetcher({ cursor, limit: params.limit });

    for (const item of page.items) {
      yield item;
    }

    if (page.next_cursor) {
      cursor = page.next_cursor;
    } else {
      hasMore = false;
    }
  }
}

/**
 * Collects all items from an async iterator into an array.
 * @param iter - The async iterable to collect from.
 * @returns An array of all items.
 */
export async function collectAll<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of iter) {
    results.push(item);
  }
  return results;
}
