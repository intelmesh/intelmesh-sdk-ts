// ---------------------------------------------------------------------------
// Evaluations resource — list, get
// ---------------------------------------------------------------------------

import type { HttpClient } from '../client/http.js';
import type { EvaluationLog, PaginatedResponse, PaginationParams } from '../types.js';

/**
 * Resource for evaluation log inspection.
 */
export class Evaluations {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Lists evaluation logs with cursor-based pagination.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of evaluation logs.
   */
  async list(params: PaginationParams = {}): Promise<PaginatedResponse<EvaluationLog>> {
    return this.http.get<PaginatedResponse<EvaluationLog>>('/api/v1/evaluations', {
      cursor: params.cursor,
      limit: params.limit,
    });
  }

  /**
   * Retrieves a single evaluation log by ID.
   * @param id - The evaluation log ID.
   * @returns The evaluation log with full pipeline trace.
   */
  async get(id: string): Promise<EvaluationLog> {
    return this.http.get<EvaluationLog>(`/api/v1/evaluations/${id}`);
  }
}
