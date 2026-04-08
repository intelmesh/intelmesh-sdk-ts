// ---------------------------------------------------------------------------
// API Keys resource — CRUD
// ---------------------------------------------------------------------------

import type { HttpClient } from '../client/http.js';
import type {
  APIKey,
  CreateAPIKeyRequest,
  CreateAPIKeyResponse,
  PaginatedResponse,
  PaginationParams,
  UpdateAPIKeyRequest,
} from '../types.js';

/**
 * Resource for API key management.
 */
export class APIKeys {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Lists all API keys with cursor-based pagination.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of API keys.
   */
  async list(params: PaginationParams = {}): Promise<PaginatedResponse<APIKey>> {
    return this.http.get<PaginatedResponse<APIKey>>('/api/v1/api-keys', {
      cursor: params.cursor,
      limit: params.limit,
    });
  }

  /**
   * Creates a new API key. The plain key is returned only at creation time.
   * @param request - The API key creation payload.
   * @returns The created API key with the plain key value.
   */
  async create(request: CreateAPIKeyRequest): Promise<CreateAPIKeyResponse> {
    return this.http.post<CreateAPIKeyResponse>('/api/v1/api-keys', request);
  }

  /**
   * Updates an existing API key by ID.
   * @param id - The API key ID.
   * @param request - The update payload.
   * @returns The updated API key.
   */
  async update(id: string, request: UpdateAPIKeyRequest): Promise<APIKey> {
    return this.http.put<APIKey>(`/api/v1/api-keys/${id}`, request);
  }

  /**
   * Deletes an API key by ID.
   * @param id - The API key ID.
   */
  async delete(id: string): Promise<void> {
    await this.http.delete<unknown>(`/api/v1/api-keys/${id}`);
  }
}
