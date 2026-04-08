// ---------------------------------------------------------------------------
// Audit resource — list
// ---------------------------------------------------------------------------

import type { HttpClient } from '../client/http.js';
import type { EvaluationLog, PaginatedResponse, PaginationParams } from '../types.js';

/**
 * Resource for audit log access.
 */
export class Audit {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Lists audit logs with cursor-based pagination.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of audit entries.
   */
  async list(params: PaginationParams = {}): Promise<PaginatedResponse<EvaluationLog>> {
    return this.http.get<PaginatedResponse<EvaluationLog>>('/api/v1/audit', {
      cursor: params.cursor,
      limit: params.limit,
    });
  }
}
