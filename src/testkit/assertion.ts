// ---------------------------------------------------------------------------
// EventAssertion — chainable assertions on IngestResult
// Mirrors the Go SDK's testkit.EventAssertion.
// ---------------------------------------------------------------------------

import type { IngestResult } from '../types.js';

/**
 * Chains assertions on the result of an event send.
 * Throws on assertion failure (suitable for test frameworks).
 */
export class EventAssertion {
  private readonly result: IngestResult;

  constructor(result: IngestResult) {
    this.result = result;
  }

  /**
   * Asserts the result has a specific decision action and severity.
   * @param action - The expected action string (e.g. "block").
   * @param severity - The expected severity level.
   * @returns This assertion for chaining.
   * @throws {Error} If the decision does not match.
   */
  expectDecision(action: string, severity: string): this {
    const decision = this.result.decision;
    if (!decision) {
      throw new Error(
        `testkit: expected decision ${action}/${severity}, got no decision`,
      );
    }
    if (decision.action !== action) {
      throw new Error(
        `testkit: decision action: got "${decision.action}", want "${action}"`,
      );
    }
    if (decision.severity !== severity) {
      throw new Error(
        `testkit: decision severity: got "${decision.severity}", want "${severity}"`,
      );
    }
    return this;
  }

  /**
   * Asserts the result has no decision (action is empty or undefined).
   * @returns This assertion for chaining.
   * @throws {Error} If a decision is present.
   */
  expectNoDecision(): this {
    const decision = this.result.decision;
    if (decision && decision.action !== '') {
      throw new Error(
        `testkit: expected no decision, got ${decision.action}/${decision.severity}`,
      );
    }
    return this;
  }

  /**
   * Asserts the transient score equals the expected value.
   * @param score - The expected score value.
   * @returns This assertion for chaining.
   * @throws {Error} If the score does not match.
   */
  expectScore(score: number): this {
    if (this.result.transient_score !== score) {
      throw new Error(
        `testkit: score: got ${String(this.result.transient_score)}, want ${String(score)}`,
      );
    }
    return this;
  }

  /**
   * Returns the underlying IngestResult for custom assertions.
   * @returns The raw IngestResult.
   */
  raw(): IngestResult {
    return this.result;
  }
}
