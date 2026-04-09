// ---------------------------------------------------------------------------
// API Types — mirrors the IntelMesh swagger definitions
// ---------------------------------------------------------------------------

/** Severity levels for decisions. */
export type Severity = 'low' | 'medium' | 'high' | 'critical';

/** Rule flow control. */
export type Flow = 'continue' | 'skip_phase' | 'halt';

/** A decision produced by rule evaluation. */
export interface Decision {
  readonly action: string;
  readonly severity: Severity;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Score mutation attached to rule actions. */
export interface ScoreOperation {
  readonly add: number;
}

/** A side-effect mutation triggered by a rule (e.g. list add/remove). */
export interface ListMutation {
  readonly type: string;
  readonly target: string;
  readonly value_path: string;
}

/** Actions triggered when a rule matches. */
export interface Actions {
  readonly decision?: Decision;
  readonly flow?: Flow;
  readonly score?: ScoreOperation;
  readonly mutations?: readonly ListMutation[];
}

// ---- Rules -----------------------------------------------------------------

/** A rule definition. */
export interface Rule {
  readonly id: string;
  readonly name: string;
  readonly expression: string;
  readonly applicable_when: string;
  readonly phase_id: string;
  readonly priority: number;
  readonly enabled: boolean;
  readonly dry_run: boolean;
  readonly actions: Actions;
  readonly current_version_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/** A versioned snapshot of a rule. */
export interface RuleVersion {
  readonly id: string;
  readonly rule_id: string;
  readonly version: number;
  readonly name: string;
  readonly expression: string;
  readonly applicable_when: string;
  readonly phase_id: string;
  readonly priority: number;
  readonly enabled: boolean;
  readonly dry_run: boolean;
  readonly actions: readonly number[];
  readonly created_at: string;
}

/** Payload to create a rule. */
export interface CreateRuleRequest {
  readonly name: string;
  readonly expression: string;
  readonly applicable_when: string;
  readonly phase_id: string;
  readonly priority: number;
  readonly enabled: boolean;
  readonly dry_run: boolean;
  readonly actions: Actions;
}

/** Payload to update a rule. */
export interface UpdateRuleRequest {
  readonly name?: string;
  readonly expression?: string;
  readonly applicable_when?: string;
  readonly phase_id?: string;
  readonly priority?: number;
  readonly enabled?: boolean;
  readonly dry_run?: boolean;
  readonly actions?: Actions;
}

// ---- Phases ----------------------------------------------------------------

/** An evaluation phase in the pipeline. */
export interface Phase {
  readonly id: string;
  readonly name: string;
  readonly position: number;
  readonly applicable_when?: string;
  readonly created_at: string;
}

/** Payload to create a phase. */
export interface CreatePhaseRequest {
  readonly name: string;
  readonly position: number;
  readonly applicable_when?: string;
}

/** Payload to update a phase. */
export interface UpdatePhaseRequest {
  readonly name?: string;
  readonly position?: number;
  readonly applicable_when?: string;
}

// ---- Scopes ----------------------------------------------------------------

/** A scope definition for event field projection. */
export interface Scope {
  readonly id: string;
  readonly name: string;
  readonly json_path: string;
  readonly created_at: string;
}

/** Payload to create a scope. */
export interface CreateScopeRequest {
  readonly name: string;
  readonly json_path: string;
}

/** Payload to update a scope. */
export interface UpdateScopeRequest {
  readonly name?: string;
  readonly json_path?: string;
}

// ---- Lists -----------------------------------------------------------------

/** A named list (blocklist, allowlist, etc.). */
export interface List {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/** Payload to create a list. */
export interface CreateListRequest {
  readonly name: string;
  readonly description: string;
}

/** Payload to update a list. */
export interface UpdateListRequest {
  readonly name?: string;
  readonly description?: string;
}

/** Payload to add items to a list. */
export interface AddItemsRequest {
  readonly values: readonly string[];
}

/** Payload to bulk-import items into a list. */
export interface BulkImportRequest {
  readonly values: readonly string[];
}

// ---- Scores ----------------------------------------------------------------

/** A score entry for a scope. */
export interface Score {
  readonly scope_name: string;
  readonly scope_value: string;
  readonly score: number;
}

/** Payload to set a score. */
export interface SetScoreRequest {
  readonly value: number;
}

// ---- API Keys --------------------------------------------------------------

/** An API key. */
export interface APIKey {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly permissions: readonly string[];
  readonly created_at: string;
  readonly last_used_at?: string;
}

/** Payload to create an API key. */
export interface CreateAPIKeyRequest {
  readonly name: string;
  readonly permissions: readonly string[];
}

/** Response after creating an API key (plain key shown once). */
export interface CreateAPIKeyResponse {
  readonly id: string;
  readonly name: string;
  readonly key: string;
  readonly enabled: boolean;
  readonly permissions: readonly string[];
}

/** Payload to update an API key. */
export interface UpdateAPIKeyRequest {
  readonly name?: string;
  readonly enabled?: boolean;
  readonly permissions?: readonly string[];
}

// ---- Events / Ingest -------------------------------------------------------

/** Payload to ingest an event. */
export interface IngestRequest {
  readonly event_type: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly idempotency_key?: string;
}

/** Result of a synchronous event ingestion. */
export interface IngestResult {
  readonly event_id: string;
  readonly decision: Decision;
  readonly transient_score: number;
  readonly duration_ms: number;
}

// ---- Audit / Evaluations ---------------------------------------------------

/** Trace of a single rule evaluation. */
export interface RuleTrace {
  readonly rule_id: string;
  readonly rule_name: string;
  readonly rule_version_id: string;
  readonly matched: boolean;
  readonly skipped: boolean;
  readonly dry_run: boolean;
  readonly decision?: Decision;
  readonly flow: string;
  readonly score_delta: number;
  readonly duration_ms: number;
}

/** Trace of a phase evaluation. */
export interface PhaseTrace {
  readonly name: string;
  readonly duration_ms: number;
  readonly rules: readonly RuleTrace[];
}

/** Full pipeline trace. */
export interface PipelineTrace {
  readonly phases: readonly PhaseTrace[];
}

/** An evaluation log entry. */
export interface EvaluationLog {
  readonly id: string;
  readonly event_id: string;
  readonly event_type: string;
  readonly decision: Decision;
  readonly duration_ms: number;
  readonly pipeline_trace: PipelineTrace;
  readonly created_at: string;
}

// ---- Pagination ------------------------------------------------------------

/** A paginated response envelope. */
export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly count: number;
  readonly next_cursor?: string;
}

/** Common pagination parameters. */
export interface PaginationParams {
  readonly cursor?: string;
  readonly limit?: number;
}

// ---- API Response Envelope -------------------------------------------------

/** Success response envelope. */
export interface SuccessResponse<T> {
  readonly data: T;
}

/** Error body. */
export interface ErrorBody {
  readonly code: string;
  readonly message: string;
}

/** Error response envelope. */
export interface ErrorResponse {
  readonly error: ErrorBody;
}

// ---- Client Configuration --------------------------------------------------

/** Configuration for the IntelMesh client. */
export interface ClientConfig {
  /** Base URL of the IntelMesh API (e.g. "https://api.intelmesh.io"). */
  readonly baseUrl: string;
  /** API key for authentication. */
  readonly apiKey: string;
  /** Optional request timeout in milliseconds (default: 30000). */
  readonly timeout?: number;
  /** Optional custom fetch implementation. */
  readonly fetch?: typeof globalThis.fetch;
}

/** Mutation result containing the updated resource. */
export interface Mutation<T> {
  readonly data: T;
}
