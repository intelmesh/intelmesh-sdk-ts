// ---------------------------------------------------------------------------
// Rules resource — CRUD + versions
// ---------------------------------------------------------------------------

import type { HttpClient } from '../client/http.js';
import type {
  CreateRuleRequest,
  PaginatedResponse,
  PaginationParams,
  Rule,
  RuleVersion,
  UpdateRuleRequest,
} from '../types.js';

/**
 * Resource for rule management operations.
 */
export class Rules {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Lists all rules with cursor-based pagination.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of rules.
   */
  async list(params: PaginationParams = {}): Promise<PaginatedResponse<Rule>> {
    return this.http.get<PaginatedResponse<Rule>>('/api/v1/rules', {
      cursor: params.cursor,
      limit: params.limit,
    });
  }

  /**
   * Retrieves a single rule by ID.
   * @param id - The rule ID.
   * @returns The rule.
   */
  async get(id: string): Promise<Rule> {
    return this.http.get<Rule>(`/api/v1/rules/${id}`);
  }

  /**
   * Creates a new rule.
   * @param request - The rule creation payload.
   * @returns The created rule.
   */
  async create(request: CreateRuleRequest): Promise<Rule> {
    return this.http.post<Rule>('/api/v1/rules', request);
  }

  /**
   * Updates an existing rule by ID.
   * @param id - The rule ID.
   * @param request - The update payload.
   * @returns The updated rule.
   */
  async update(id: string, request: UpdateRuleRequest): Promise<Rule> {
    return this.http.put<Rule>(`/api/v1/rules/${id}`, request);
  }

  /**
   * Deletes a rule by ID.
   * @param id - The rule ID.
   */
  async delete(id: string): Promise<void> {
    await this.http.delete<unknown>(`/api/v1/rules/${id}`);
  }

  /**
   * Lists all versions of a rule.
   * @param ruleId - The rule ID.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of rule versions.
   */
  async listVersions(
    ruleId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<RuleVersion>> {
    return this.http.get<PaginatedResponse<RuleVersion>>(
      `/api/v1/rules/${ruleId}/versions`,
      { cursor: params.cursor, limit: params.limit },
    );
  }

  /**
   * Retrieves a specific version of a rule.
   * @param ruleId - The rule ID.
   * @param versionId - The version ID.
   * @returns The rule version.
   */
  async getVersion(ruleId: string, versionId: string): Promise<RuleVersion> {
    return this.http.get<RuleVersion>(`/api/v1/rules/${ruleId}/versions/${versionId}`);
  }
}
