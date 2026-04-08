// ---------------------------------------------------------------------------
// Phases resource — CRUD
// ---------------------------------------------------------------------------

import type { HttpClient } from '../client/http.js';
import type {
  CreatePhaseRequest,
  PaginatedResponse,
  PaginationParams,
  Phase,
  UpdatePhaseRequest,
} from '../types.js';

/**
 * Resource for pipeline phase management.
 */
export class Phases {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Lists all phases with cursor-based pagination.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of phases.
   */
  async list(params: PaginationParams = {}): Promise<PaginatedResponse<Phase>> {
    return this.http.get<PaginatedResponse<Phase>>('/api/v1/phases', {
      cursor: params.cursor,
      limit: params.limit,
    });
  }

  /**
   * Retrieves a single phase by ID.
   * @param id - The phase ID.
   * @returns The phase.
   */
  async get(id: string): Promise<Phase> {
    return this.http.get<Phase>(`/api/v1/phases/${id}`);
  }

  /**
   * Creates a new phase.
   * @param request - The phase creation payload.
   * @returns The created phase.
   */
  async create(request: CreatePhaseRequest): Promise<Phase> {
    return this.http.post<Phase>('/api/v1/phases', request);
  }

  /**
   * Updates an existing phase by ID.
   * @param id - The phase ID.
   * @param request - The update payload.
   * @returns The updated phase.
   */
  async update(id: string, request: UpdatePhaseRequest): Promise<Phase> {
    return this.http.put<Phase>(`/api/v1/phases/${id}`, request);
  }

  /**
   * Deletes a phase by ID.
   * @param id - The phase ID.
   */
  async delete(id: string): Promise<void> {
    await this.http.delete<unknown>(`/api/v1/phases/${id}`);
  }
}
