// ---------------------------------------------------------------------------
// Provisioner — declarative resource provisioning for IntelMesh
// Mirrors the Go SDK's provision.Provisioner exactly.
// ---------------------------------------------------------------------------

import type { IntelMesh } from '../client/intelmesh.js';
import { ProvisionRuleBuilder } from './rule-builder.js';

/** Resource kinds in provisioning order. */
const STEP_PHASE = 0 as const;
const STEP_SCOPE = 1 as const;
const STEP_LIST = 2 as const;
const STEP_RULE = 3 as const;

type StepKind = typeof STEP_PHASE | typeof STEP_SCOPE | typeof STEP_LIST | typeof STEP_RULE;

/** A single resource to create during apply. */
interface Step {
  readonly kind: StepKind;
  readonly name: string;
  readonly position: number;
  readonly applicableWhen: string;
  readonly jsonPath: string;
  readonly ruleBuilder: ProvisionRuleBuilder | undefined;
}

/**
 * Builds and executes a declarative resource plan against the IntelMesh API.
 * Resources are created in dependency order (phases, scopes, lists, rules)
 * and torn down in reverse.
 */
export class Provisioner {
  private readonly client: IntelMesh;
  private readonly steps: Step[] = [];

  private readonly phases = new Map<string, string>();
  private readonly scopes = new Map<string, string>();
  private readonly lists = new Map<string, string>();
  private readonly rules = new Map<string, string>();

  /**
   * Creates a new Provisioner backed by the given SDK client.
   * @param client - The IntelMesh client instance.
   */
  constructor(client: IntelMesh) {
    this.client = client;
  }

  /**
   * Registers a pipeline phase to be created.
   * @param name - The phase name.
   * @param position - The phase position (execution order).
   * @returns This provisioner for chaining.
   */
  phase(name: string, position: number): this {
    this.steps.push({
      kind: STEP_PHASE,
      name,
      position,
      applicableWhen: '',
      jsonPath: '',
      ruleBuilder: undefined,
    });
    return this;
  }

  /**
   * Registers a pipeline phase with an applicable_when CEL expression.
   * @param name - The phase name.
   * @param position - The phase position (execution order).
   * @param applicableWhen - CEL expression controlling when this phase runs.
   * @returns This provisioner for chaining.
   */
  phaseWithFilter(name: string, position: number, applicableWhen: string): this {
    this.steps.push({
      kind: STEP_PHASE,
      name,
      position,
      applicableWhen,
      jsonPath: '',
      ruleBuilder: undefined,
    });
    return this;
  }

  /**
   * Registers a scope to be created.
   * @param name - The scope name.
   * @param jsonPath - The JSON path expression.
   * @returns This provisioner for chaining.
   */
  scope(name: string, jsonPath: string): this {
    this.steps.push({
      kind: STEP_SCOPE,
      name,
      position: 0,
      applicableWhen: '',
      jsonPath,
      ruleBuilder: undefined,
    });
    return this;
  }

  /**
   * Registers a named list to be created.
   * @param name - The list name.
   * @returns This provisioner for chaining.
   */
  list(name: string): this {
    this.steps.push({
      kind: STEP_LIST,
      name,
      position: 0,
      applicableWhen: '',
      jsonPath: '',
      ruleBuilder: undefined,
    });
    return this;
  }

  /**
   * Starts building a rule and returns a ProvisionRuleBuilder.
   * @param name - The rule name.
   * @returns A rule builder for chaining.
   */
  rule(name: string): ProvisionRuleBuilder {
    return new ProvisionRuleBuilder(this, name);
  }

  /**
   * Adds a completed rule step from the rule builder.
   * @param rb - The completed rule builder.
   * @returns This provisioner for chaining.
   * @internal
   */
  _addRuleStep(rb: ProvisionRuleBuilder): this {
    this.steps.push({
      kind: STEP_RULE,
      name: rb.ruleName,
      position: 0,
      applicableWhen: '',
      jsonPath: '',
      ruleBuilder: rb,
    });
    return this;
  }

  /**
   * Creates all registered resources via the API in registration order.
   * Throws on the first failure.
   */
  async apply(): Promise<void> {
    for (const step of this.steps) {
      await this.applyStep(step);
    }
  }

  /**
   * Deletes all created resources in reverse dependency order:
   * rules, lists, scopes, phases.
   * Collects errors but continues deleting; throws the first error at the end.
   */
  async teardown(): Promise<void> {
    let firstError: Error | undefined;

    const record = (err: unknown): void => {
      if (!firstError && err instanceof Error) {
        firstError = err;
      }
    };

    await this.deleteAll(this.rules, (id) => this.client.rules.delete(id), record);
    await this.deleteAll(this.lists, (id) => this.client.lists.delete(id), record);
    await this.deleteAll(this.scopes, (id) => this.client.scopes.delete(id), record);
    await this.deleteAll(this.phases, (id) => this.client.phases.delete(id), record);

    if (firstError) {
      throw firstError;
    }
  }

  /**
   * Returns the provisioned ID for the named phase.
   * @param name - The phase name.
   * @returns The phase ID, or empty string if not found.
   */
  phaseId(name: string): string {
    return this.phases.get(name) ?? '';
  }

  /**
   * Returns the provisioned ID for the named list.
   * @param name - The list name.
   * @returns The list ID, or empty string if not found.
   */
  listId(name: string): string {
    return this.lists.get(name) ?? '';
  }

  /**
   * Returns the provisioned ID for the named scope.
   * @param name - The scope name.
   * @returns The scope ID, or empty string if not found.
   */
  scopeId(name: string): string {
    return this.scopes.get(name) ?? '';
  }

  /**
   * Returns the provisioned ID for the named rule.
   * @param name - The rule name.
   * @returns The rule ID, or empty string if not found.
   */
  ruleId(name: string): string {
    return this.rules.get(name) ?? '';
  }

  /**
   * Dispatches a single step to the appropriate creator.
   * @param step
   */
  private async applyStep(step: Step): Promise<void> {
    switch (step.kind) {
      case STEP_PHASE:
        return this.createPhase(step);
      case STEP_SCOPE:
        return this.createScope(step);
      case STEP_LIST:
        return this.createList(step);
      case STEP_RULE:
        return this.createRule(step);
    }
  }

  /**
   * Creates a phase and stores its ID.
   * @param step
   */
  private async createPhase(step: Step): Promise<void> {
    const req: { name: string; position: number; applicable_when?: string } = {
      name: step.name,
      position: step.position,
    };
    if (step.applicableWhen) {
      req.applicable_when = step.applicableWhen;
    }
    const phase = await this.client.phases.create(req);
    this.phases.set(step.name, phase.id);
  }

  /**
   * Creates a scope and stores its ID.
   * @param step
   */
  private async createScope(step: Step): Promise<void> {
    const scope = await this.client.scopes.create({
      name: step.name,
      json_path: step.jsonPath,
    });
    this.scopes.set(step.name, scope.id);
  }

  /**
   * Creates a list and stores its ID.
   * @param step
   */
  private async createList(step: Step): Promise<void> {
    const list = await this.client.lists.create({
      name: step.name,
      description: '',
    });
    this.lists.set(step.name, list.id);
  }

  /**
   * Creates a rule after resolving its phase name to an ID.
   * @param step
   */
  private async createRule(step: Step): Promise<void> {
    const rb = step.ruleBuilder;
    if (!rb) {
      throw new Error(`provision: rule step "${step.name}" has no builder`);
    }

    const phaseID = this.phases.get(rb.phaseName);
    if (!phaseID) {
      throw new Error(`provision rule "${rb.ruleName}": phase not found: ${rb.phaseName}`);
    }

    const rule = await this.client.rules.create({
      name: rb.ruleName,
      phase_id: phaseID,
      priority: rb.rulePriority,
      applicable_when: rb.applicable,
      expression: rb.expression,
      actions: rb.buildActions(),
      enabled: true,
      dry_run: rb.isDryRun,
    });
    this.rules.set(rb.ruleName, rule.id);
  }

  /**
   * Deletes all resources in a map, recording errors.
   * @param ids
   * @param deleteFn
   * @param record
   */
  private async deleteAll(
    ids: Map<string, string>,
    deleteFn: (id: string) => Promise<void>,
    record: (err: unknown) => void,
  ): Promise<void> {
    for (const [name, id] of ids) {
      try {
        await deleteFn(id);
      } catch (err: unknown) {
        record(
          err instanceof Error
            ? new Error(`deleting ${name} (${id}): ${err.message}`)
            : new Error(`deleting ${name} (${id}): unknown error`),
        );
      }
    }
  }
}
