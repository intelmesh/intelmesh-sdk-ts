// ---------------------------------------------------------------------------
// Fluent RuleBuilder for provisioner — mirrors Go SDK's provision.RuleBuilder
// ---------------------------------------------------------------------------

import type { Actions, Decision, Flow, ListMutation, ScoreOperation, Severity } from '../types.js';
import type { Provisioner } from './provisioner.js';

/** Internal mutation specification. */
interface MutationSpec {
  readonly mutationType: string;
  readonly listName: string;
  readonly valuePath: string;
}

/**
 * Fluent builder for constructing rules within a Provisioner.
 * Returned by `Provisioner.rule()`, completed by calling `.done()`.
 */
export class ProvisionRuleBuilder {
  private readonly parent: Provisioner;

  /** @internal */ readonly ruleName: string;
  /** @internal */ phaseName = '';
  /** @internal */ rulePriority = 0;
  /** @internal */ applicable = '';
  /** @internal */ expression = '';
  /** @internal */ ruleDecision: Decision | undefined;
  /** @internal */ ruleScore: ScoreOperation | undefined;
  /** @internal */ ruleFlow: Flow | undefined;
  /** @internal */ ruleMutations: MutationSpec[] = [];
  /** @internal */ isDryRun = false;

  /**
   * Constructs a new ProvisionRuleBuilder.
   * @param parent
   * @param name
   * @internal
   */
  constructor(parent: Provisioner, name: string) {
    this.parent = parent;
    this.ruleName = name;
  }

  /**
   * Sets the phase for the rule (by provisioner name, not ID).
   * @param name - The phase name as registered with the provisioner.
   * @returns This builder for chaining.
   */
  inPhase(name: string): this {
    this.phaseName = name;
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
   * Sets the applicability expression.
   * @param expr - The CEL expression for applicability.
   * @returns This builder for chaining.
   */
  applicableWhen(expr: string): this {
    this.applicable = expr;
    return this;
  }

  /**
   * Sets the matching expression.
   * @param expr - The CEL expression for matching.
   * @returns This builder for chaining.
   */
  when(expr: string): this {
    this.expression = expr;
    return this;
  }

  /**
   * Sets the decision action and severity.
   * @param action - The action string (e.g. "block").
   * @param severity - The severity level.
   * @returns This builder for chaining.
   */
  decide(action: string, severity: Severity): this {
    this.ruleDecision = { action, severity };
    return this;
  }

  /**
   * Adds a score delta for the rule.
   * @param delta - The score points to add.
   * @returns This builder for chaining.
   */
  addScore(delta: number): this {
    this.ruleScore = { add: delta };
    return this;
  }

  /**
   * Sets flow to halt.
   * @returns This builder for chaining.
   */
  halt(): this {
    this.ruleFlow = 'halt';
    return this;
  }

  /**
   * Sets flow to continue.
   * @returns This builder for chaining.
   */
  continue(): this {
    this.ruleFlow = 'continue';
    return this;
  }

  /**
   * Sets flow to skip_phase.
   * @returns This builder for chaining.
   */
  skipPhase(): this {
    this.ruleFlow = 'skip_phase';
    return this;
  }

  /**
   * Adds a list mutation to the rule.
   * @param mutType - The mutation type (e.g. "list.add").
   * @param listName - The list name.
   * @param valuePath - The value path expression.
   * @returns This builder for chaining.
   */
  mutateList(mutType: string, listName: string, valuePath: string): this {
    this.ruleMutations.push({ mutationType: mutType, listName, valuePath });
    return this;
  }

  /**
   * Enables dry-run mode for the rule.
   * @returns This builder for chaining.
   */
  dryRun(): this {
    this.isDryRun = true;
    return this;
  }

  /**
   * Finishes building the rule and returns to the parent provisioner.
   * @returns The parent Provisioner for chaining.
   */
  done(): Provisioner {
    return this.parent._addRuleStep(this);
  }

  /**
   * Constructs the SDK Actions from the builder state.
   * @returns The Actions object for the API request.
   * @internal
   */
  buildActions(): Actions {
    const actions: {
      decision?: Decision;
      score?: ScoreOperation;
      flow?: Flow;
      mutations?: ListMutation[];
    } = {};

    if (this.ruleDecision) {
      actions.decision = this.ruleDecision;
    }
    if (this.ruleScore) {
      actions.score = this.ruleScore;
    }
    if (this.ruleFlow) {
      actions.flow = this.ruleFlow;
    }
    if (this.ruleMutations.length > 0) {
      actions.mutations = this.ruleMutations.map((m) => ({
        type: m.mutationType,
        target: m.listName,
        value_path: m.valuePath,
      }));
    }

    return actions;
  }
}
