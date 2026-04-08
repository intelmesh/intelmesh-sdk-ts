// ---------------------------------------------------------------------------
// Scopes resource — CRUD
// ---------------------------------------------------------------------------

import type { HttpClient } from '../client/http.js';
import type {
  CreateScopeRequest,
  PaginatedResponse,
  PaginationParams,
  Scope,
  UpdateScopeRequest,
} from '../types.js';

/**
 * Resource for scope management.
 */
export class Scopes {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Lists all scopes with cursor-based pagination.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of scopes.
   */
  async list(params: PaginationParams = {}): Promise<PaginatedResponse<Scope>> {
    return this.http.get<PaginatedResponse<Scope>>('/api/v1/scopes', {
      cursor: params.cursor,
      limit: params.limit,
    });
  }

  /**
   * Retrieves a single scope by ID.
   * @param id - The scope ID.
   * @returns The scope.
   */
  async get(id: string): Promise<Scope> {
    return this.http.get<Scope>(`/api/v1/scopes/${id}`);
  }

  /**
   * Creates a new scope.
   * @param request - The scope creation payload.
   * @returns The created scope.
   */
  async create(request: CreateScopeRequest): Promise<Scope> {
    return this.http.post<Scope>('/api/v1/scopes', request);
  }

  /**
   * Updates an existing scope by ID.
   * @param id - The scope ID.
   * @param request - The update payload.
   * @returns The updated scope.
   */
  async update(id: string, request: UpdateScopeRequest): Promise<Scope> {
    return this.http.put<Scope>(`/api/v1/scopes/${id}`, request);
  }

  /**
   * Deletes a scope by ID.
   * @param id - The scope ID.
   */
  async delete(id: string): Promise<void> {
    await this.http.delete<unknown>(`/api/v1/scopes/${id}`);
  }
}
