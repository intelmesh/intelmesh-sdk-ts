// ---------------------------------------------------------------------------
// Events resource — ingest, ingestAsync, ingestOnly, simulate
// ---------------------------------------------------------------------------

import type { HttpClient } from '../client/http.js';
import type { IngestRequest, IngestResult, SuccessResponse } from '../types.js';

/**
 * Resource for event ingestion operations.
 */
export class Events {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Ingests an event synchronously and returns the decision.
   * @param request - The ingest request payload.
   * @returns The ingestion result with decision and score.
   */
  async ingest(request: IngestRequest): Promise<IngestResult> {
    return this.http.post<IngestResult>('/api/v1/events/ingest', request);
  }

  /**
   * Ingests an event asynchronously (fire-and-forget with acknowledgement).
   * @param request - The ingest request payload.
   * @returns The event ID assigned by the server.
   */
  async ingestAsync(request: IngestRequest): Promise<string> {
    const result = await this.http.post<SuccessResponse<{ event_id: string }>>(
      '/api/v1/events/ingest-async',
      request,
    );
    return result.data.event_id;
  }

  /**
   * Ingests an event for storage only, without evaluation.
   * @param request - The ingest request payload.
   * @returns The event ID assigned by the server.
   */
  async ingestOnly(request: IngestRequest): Promise<string> {
    const result = await this.http.post<SuccessResponse<{ event_id: string }>>(
      '/api/v1/events/ingest-only',
      request,
    );
    return result.data.event_id;
  }

  /**
   * Simulates event evaluation without persisting (dry-run).
   * @param request - The ingest request payload.
   * @returns The simulated result with decision and trace.
   */
  async simulate(request: IngestRequest): Promise<IngestResult> {
    return this.http.post<IngestResult>('/api/v1/events/simulate', request);
  }
}
