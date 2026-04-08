// ---------------------------------------------------------------------------
// Main IntelMesh client — facade that creates resource instances
// ---------------------------------------------------------------------------

import type { ClientConfig } from '../types.js';
import { HttpClient } from './http.js';
import { APIKeys } from '../resources/apikeys.js';
import { Audit } from '../resources/audit.js';
import { Evaluations } from '../resources/evaluations.js';
import { Events } from '../resources/events.js';
import { Lists } from '../resources/lists.js';
import { Phases } from '../resources/phases.js';
import { Rules } from '../resources/rules.js';
import { Scores } from '../resources/scores.js';
import { Scopes } from '../resources/scopes.js';

/**
 * Main IntelMesh SDK client.
 * Provides access to all API resources through typed sub-clients.
 */
export class IntelMesh {
  /** Event ingestion and simulation. */
  readonly events: Events;
  /** Rule management and versioning. */
  readonly rules: Rules;
  /** Pipeline phase management. */
  readonly phases: Phases;
  /** Scope management. */
  readonly scopes: Scopes;
  /** Named list management. */
  readonly lists: Lists;
  /** Score management. */
  readonly scores: Scores;
  /** API key management. */
  readonly apiKeys: APIKeys;
  /** Evaluation log inspection. */
  readonly evaluations: Evaluations;
  /** Audit log access. */
  readonly audit: Audit;

  /**
   * Creates a new IntelMesh client instance.
   * @param config - Client configuration with baseUrl and apiKey.
   */
  constructor(config: ClientConfig) {
    const http = new HttpClient(config);
    this.events = new Events(http);
    this.rules = new Rules(http);
    this.phases = new Phases(http);
    this.scopes = new Scopes(http);
    this.lists = new Lists(http);
    this.scores = new Scores(http);
    this.apiKeys = new APIKeys(http);
    this.evaluations = new Evaluations(http);
    this.audit = new Audit(http);
  }
}
