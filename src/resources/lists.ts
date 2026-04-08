// ---------------------------------------------------------------------------
// Lists resource — CRUD + items
// ---------------------------------------------------------------------------

import type { HttpClient } from '../client/http.js';
import type {
  AddItemsRequest,
  BulkImportRequest,
  CreateListRequest,
  List,
  PaginatedResponse,
  PaginationParams,
  UpdateListRequest,
} from '../types.js';

/**
 * Resource for named list management (blocklists, allowlists, etc.).
 */
export class Lists {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Lists all named lists with cursor-based pagination.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of named lists.
   */
  async list(params: PaginationParams = {}): Promise<PaginatedResponse<List>> {
    return this.http.get<PaginatedResponse<List>>('/api/v1/lists', {
      cursor: params.cursor,
      limit: params.limit,
    });
  }

  /**
   * Retrieves a single list by ID.
   * @param id - The list ID.
   * @returns The list.
   */
  async get(id: string): Promise<List> {
    return this.http.get<List>(`/api/v1/lists/${id}`);
  }

  /**
   * Creates a new named list.
   * @param request - The list creation payload.
   * @returns The created list.
   */
  async create(request: CreateListRequest): Promise<List> {
    return this.http.post<List>('/api/v1/lists', request);
  }

  /**
   * Updates an existing list by ID.
   * @param id - The list ID.
   * @param request - The update payload.
   * @returns The updated list.
   */
  async update(id: string, request: UpdateListRequest): Promise<List> {
    return this.http.put<List>(`/api/v1/lists/${id}`, request);
  }

  /**
   * Deletes a list by ID.
   * @param id - The list ID.
   */
  async delete(id: string): Promise<void> {
    await this.http.delete<unknown>(`/api/v1/lists/${id}`);
  }

  /**
   * Adds items to a list.
   * @param listId - The list ID.
   * @param request - The items to add.
   */
  async addItems(listId: string, request: AddItemsRequest): Promise<void> {
    await this.http.post<unknown>(`/api/v1/lists/${listId}/items`, request);
  }

  /**
   * Bulk-imports items into a list, replacing existing items.
   * @param listId - The list ID.
   * @param request - The items to import.
   */
  async bulkImport(listId: string, request: BulkImportRequest): Promise<void> {
    await this.http.post<unknown>(`/api/v1/lists/${listId}/import`, request);
  }
}
