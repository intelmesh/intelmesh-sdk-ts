// ---------------------------------------------------------------------------
// @intelmesh/sdk — Public API exports
// ---------------------------------------------------------------------------

// Main client
export { IntelMesh } from './client/intelmesh.js';

// HTTP client (for advanced usage)
export { HttpClient } from './client/http.js';

// Error types and helpers
export {
  IntelMeshError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  InternalError,
  UnavailableError,
  NetworkError,
  ParseError,
  isNotFound,
  isValidation,
  isUnauthorized,
  isForbidden,
  isNetwork,
  isIntelMeshError,
  mapStatusToError,
} from './client/errors.js';

// Pagination
export { paginate, collectAll } from './client/pagination.js';

// Resources
export { Events } from './resources/events.js';
export { Rules } from './resources/rules.js';
export { Phases } from './resources/phases.js';
export { Scopes } from './resources/scopes.js';
export { Lists } from './resources/lists.js';
export { Scores } from './resources/scores.js';
export { APIKeys } from './resources/apikeys.js';
export { Evaluations } from './resources/evaluations.js';
export { Audit } from './resources/audit.js';

// Builders
export { EventBuilder } from './builders/event.js';
export { RuleBuilder } from './builders/rule.js';

// Provision
export { Provisioner } from './provision/index.js';
export { ProvisionRuleBuilder } from './provision/index.js';

// Testkit
export { Harness, withHarness } from './testkit/index.js';
export type { HarnessConfig } from './testkit/index.js';
export { EventAssertion } from './testkit/index.js';

// Types
export type {
  // Core domain
  Severity,
  Flow,
  Decision,
  ScoreOperation,
  ListMutation,
  Actions,
  Rule,
  RuleVersion,
  Phase,
  Scope,
  List,
  Score,
  APIKey,
  EvaluationLog,
  RuleTrace,
  PhaseTrace,
  PipelineTrace,
  // Requests
  IngestRequest,
  CreateRuleRequest,
  UpdateRuleRequest,
  CreatePhaseRequest,
  UpdatePhaseRequest,
  CreateScopeRequest,
  UpdateScopeRequest,
  CreateListRequest,
  UpdateListRequest,
  AddItemsRequest,
  BulkImportRequest,
  SetScoreRequest,
  CreateAPIKeyRequest,
  CreateAPIKeyResponse,
  UpdateAPIKeyRequest,
  // Results
  IngestResult,
  Mutation,
  // Pagination
  PaginatedResponse,
  PaginationParams,
  // Envelope
  SuccessResponse,
  ErrorBody,
  ErrorResponse,
  // Config
  ClientConfig,
} from './types.js';
