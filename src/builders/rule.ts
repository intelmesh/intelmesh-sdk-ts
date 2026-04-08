// ---------------------------------------------------------------------------
// Fluent RuleBuilder
// ---------------------------------------------------------------------------

import type { Actions, CreateRuleRequest, Decision, Flow, Severity } from '../types.js';

/**
 * Fluent builder for constructing CreateRuleRequest payloads.
 */
export class RuleBuilder {
  private ruleName = '';
  private ruleExpression = '';
  private ruleApplicableWhen = '';
  private rulePhaseId = '';
  private rulePriority = 0;
  private ruleEnabled = true;
  private ruleDryRun = false;
  private ruleActions: Actions = {};

  /**
   * Sets the rule name.
   * @param n - The rule name.
   * @returns This builder for chaining.
   */
  name(n: string): this {
    this.ruleName = n;
    return this;
  }

  /**
   * Sets the CEL expression for the rule.
   * @param expr - The CEL expression.
   * @returns This builder for chaining.
   */
  expression(expr: string): this {
    this.ruleExpression = expr;
    return this;
  }

  /**
   * Sets the condition under which this rule applies.
   * @param condition - The applicable-when CEL expression.
   * @returns This builder for chaining.
   */
  applicableWhen(condition: string): this {
    this.ruleApplicableWhen = condition;
    return this;
  }

  /**
   * Sets the phase this rule belongs to.
   * @param id - The phase ID.
   * @returns This builder for chaining.
   */
  phase(id: string): this {
    this.rulePhaseId = id;
    return this;
  }

  /**
   * Sets the rule priority (lower number = higher priority).
   * @param p - The priority value.
   * @returns This builder for chaining.
   */
  priority(p: number): this {
    this.rulePriority = p;
    return this;
  }

  /**
   * Sets whether the rule is enabled.
   * @param value - True to enable, false to disable.
   * @returns This builder for chaining.
   */
  enabled(value: boolean): this {
    this.ruleEnabled = value;
    return this;
  }

  /**
   * Sets whether the rule runs in dry-run mode.
   * @param value - True for dry-run.
   * @returns This builder for chaining.
   */
  dryRun(value: boolean): this {
    this.ruleDryRun = value;
    return this;
  }

  /**
   * Sets the decision action when the rule matches.
   * @param action - The action string.
   * @param severity - The severity level.
   * @returns This builder for chaining.
   */
  decide(action: string, severity: Severity): this {
    const decision: Decision = { action, severity };
    this.ruleActions = { ...this.ruleActions, decision };
    return this;
  }

  /**
   * Sets the flow control when the rule matches.
   * @param flow - The flow control value.
   * @returns This builder for chaining.
   */
  flow(flow: Flow): this {
    this.ruleActions = { ...this.ruleActions, flow };
    return this;
  }

  /**
   * Sets the score delta when the rule matches.
   * @param delta - The score points to add.
   * @returns This builder for chaining.
   */
  scoreDelta(delta: number): this {
    this.ruleActions = { ...this.ruleActions, score: { add: delta } };
    return this;
  }

  /**
   * Builds and returns the CreateRuleRequest.
   * @returns The constructed CreateRuleRequest.
   * @throws {Error} If required fields are missing.
   */
  build(): CreateRuleRequest {
    if (!this.ruleName) throw new Error('RuleBuilder: name is required');
    if (!this.ruleExpression) throw new Error('RuleBuilder: expression is required');
    if (!this.rulePhaseId) throw new Error('RuleBuilder: phase is required');

    return {
      name: this.ruleName,
      expression: this.ruleExpression,
      applicable_when: this.ruleApplicableWhen,
      phase_id: this.rulePhaseId,
      priority: this.rulePriority,
      enabled: this.ruleEnabled,
      dry_run: this.ruleDryRun,
      actions: this.ruleActions,
    };
  }
}
