// ---------------------------------------------------------------------------
// Scores resource — get, list, set, reset
// ---------------------------------------------------------------------------

import type { HttpClient } from '../client/http.js';
import type { PaginatedResponse, PaginationParams, Score, SetScoreRequest } from '../types.js';

/**
 * Resource for score management.
 */
export class Scores {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Retrieves a score for a specific scope name and value.
   * @param scopeName - The scope name (e.g. "customer_id").
   * @param scopeValue - The scope value (e.g. "12345678900").
   * @returns The score entry.
   */
  async get(scopeName: string, scopeValue: string): Promise<Score> {
    return this.http.get<Score>(`/api/v1/scores/${scopeName}/${scopeValue}`);
  }

  /**
   * Lists scores for a scope name with cursor-based pagination.
   * @param scopeName - The scope name.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of scores.
   */
  async list(
    scopeName: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Score>> {
    return this.http.get<PaginatedResponse<Score>>(`/api/v1/scores/${scopeName}`, {
      cursor: params.cursor,
      limit: params.limit,
    });
  }

  /**
   * Sets a score for a specific scope name and value.
   * @param scopeName - The scope name.
   * @param scopeValue - The scope value.
   * @param request - The score value to set.
   * @returns The updated score.
   */
  async set(scopeName: string, scopeValue: string, request: SetScoreRequest): Promise<Score> {
    return this.http.put<Score>(`/api/v1/scores/${scopeName}/${scopeValue}`, request);
  }

  /**
   * Resets a score to zero for a specific scope name and value.
   * @param scopeName - The scope name.
   * @param scopeValue - The scope value.
   */
  async reset(scopeName: string, scopeValue: string): Promise<void> {
    await this.http.delete<unknown>(`/api/v1/scores/${scopeName}/${scopeValue}`);
  }
}
