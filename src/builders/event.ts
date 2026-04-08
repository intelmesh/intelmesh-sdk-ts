// ---------------------------------------------------------------------------
// Fluent EventBuilder
// ---------------------------------------------------------------------------

import type { IngestRequest } from '../types.js';

/**
 * Fluent builder for constructing IngestRequest payloads.
 */
export class EventBuilder {
  private eventType = '';
  private idempotencyKey: string | undefined;
  private payload: Record<string, unknown> = {};

  /**
   * Sets the event type.
   * @param type - The event type string (e.g. "transaction.pix").
   * @returns This builder for chaining.
   */
  type(type: string): this {
    this.eventType = type;
    return this;
  }

  /**
   * Sets the idempotency key for deduplication.
   * @param key - The idempotency key.
   * @returns This builder for chaining.
   */
  idempotency(key: string): this {
    this.idempotencyKey = key;
    return this;
  }

  /**
   * Sets a single payload field.
   * @param key - The field name.
   * @param value - The field value.
   * @returns This builder for chaining.
   */
  set(key: string, value: unknown): this {
    Object.assign(this.payload, { [key]: value });
    return this;
  }

  /**
   * Merges multiple fields into the payload.
   * @param data - Record of fields to merge.
   * @returns This builder for chaining.
   */
  data(data: Record<string, unknown>): this {
    Object.assign(this.payload, data);
    return this;
  }

  /**
   * Builds and returns the IngestRequest.
   * @returns The constructed IngestRequest.
   * @throws {Error} If event type is not set.
   */
  build(): IngestRequest {
    if (!this.eventType) {
      throw new Error('EventBuilder: event type is required');
    }

    return {
      event_type: this.eventType,
      payload: { ...this.payload },
      ...(this.idempotencyKey !== undefined && { idempotency_key: this.idempotencyKey }),
    };
  }
}
