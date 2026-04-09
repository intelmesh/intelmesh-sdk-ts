// ---------------------------------------------------------------------------
// Provisioner unit tests — mock fetch, no network calls
// ---------------------------------------------------------------------------

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IntelMesh } from '../../src/client/intelmesh.js';
import { Provisioner } from '../../src/provision/provisioner.js';

/** Tracks resource creation and deletion counts. */
interface MockState {
  created: Record<string, number>;
  deleted: Record<string, number>;
  idSeq: number;
}

/** Creates a mock fetch that simulates the IntelMesh API. */
function createMockFetch(state: MockState): typeof globalThis.fetch {
  return vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = _init?.method ?? 'GET';

    // POST endpoints — create resources
    if (method === 'POST' && url.includes('/api/v1/phases')) {
      state.created['phases'] = (state.created['phases'] ?? 0) + 1;
      state.idSeq++;
      return jsonResponse({
        data: {
          id: `phase-${String(state.idSeq)}`,
          name: 'p',
          position: 1,
          created_at: '2025-01-01T00:00:00Z',
        },
      });
    }

    if (method === 'POST' && url.includes('/api/v1/scopes')) {
      state.created['scopes'] = (state.created['scopes'] ?? 0) + 1;
      state.idSeq++;
      return jsonResponse({
        data: {
          id: `scope-${String(state.idSeq)}`,
          name: 's',
          json_path: '$.x',
          created_at: '2025-01-01T00:00:00Z',
        },
      });
    }

    if (method === 'POST' && url.includes('/api/v1/lists')) {
      state.created['lists'] = (state.created['lists'] ?? 0) + 1;
      state.idSeq++;
      return jsonResponse({
        data: {
          id: `list-${String(state.idSeq)}`,
          name: 'l',
          description: '',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      });
    }

    if (method === 'POST' && url.includes('/api/v1/rules')) {
      state.created['rules'] = (state.created['rules'] ?? 0) + 1;
      state.idSeq++;
      return jsonResponse({
        data: {
          id: `rule-${String(state.idSeq)}`,
          name: 'r',
          phase_id: 'p1',
          priority: 1,
          expression: 'true',
          applicable_when: '',
          actions: {},
          enabled: true,
          dry_run: false,
          current_version_id: 'v1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      });
    }

    // DELETE endpoints — delete resources
    if (method === 'DELETE' && url.includes('/api/v1/phases/')) {
      state.deleted['phases'] = (state.deleted['phases'] ?? 0) + 1;
      return jsonResponse({ data: null });
    }

    if (method === 'DELETE' && url.includes('/api/v1/scopes/')) {
      state.deleted['scopes'] = (state.deleted['scopes'] ?? 0) + 1;
      return jsonResponse({ data: null });
    }

    if (method === 'DELETE' && url.includes('/api/v1/lists/')) {
      state.deleted['lists'] = (state.deleted['lists'] ?? 0) + 1;
      return jsonResponse({ data: null });
    }

    if (method === 'DELETE' && url.includes('/api/v1/rules/')) {
      state.deleted['rules'] = (state.deleted['rules'] ?? 0) + 1;
      return jsonResponse({ data: null });
    }

    return new Response('Not Found', { status: 404 });
  }) as typeof globalThis.fetch;
}

/** Creates a JSON Response. */
function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Provisioner', () => {
  let state: MockState;
  let client: IntelMesh;

  beforeEach(() => {
    state = { created: {}, deleted: {}, idSeq: 0 };
    client = new IntelMesh({
      baseUrl: 'http://localhost:8080',
      apiKey: 'test-key',
      fetch: createMockFetch(state),
    });
  });

  it('applies phases, scopes, lists, and rules in order', async () => {
    const p = new Provisioner(client)
      .phase('screening', 1)
      .scope('client_uuid', 'event.metadata.client_uuid')
      .list('blocklist')
      .rule('block-rule')
        .inPhase('screening').priority(1)
        .when('true').decide('block', 'critical').halt().done();

    await p.apply();

    expect(state.created['phases']).toBe(1);
    expect(state.created['scopes']).toBe(1);
    expect(state.created['lists']).toBe(1);
    expect(state.created['rules']).toBe(1);
  });

  it('stores resolved IDs after apply', async () => {
    const p = new Provisioner(client)
      .phase('screening', 1)
      .scope('client_uuid', 'event.metadata.client_uuid')
      .list('blocklist')
      .rule('block-rule')
        .inPhase('screening').priority(1)
        .when('true').done();

    await p.apply();

    expect(p.phaseId('screening')).toBeTruthy();
    expect(p.scopeId('client_uuid')).toBeTruthy();
    expect(p.listId('blocklist')).toBeTruthy();
    expect(p.ruleId('block-rule')).toBeTruthy();
  });

  it('returns empty string for unknown names', () => {
    const p = new Provisioner(client);
    expect(p.phaseId('unknown')).toBe('');
    expect(p.scopeId('unknown')).toBe('');
    expect(p.listId('unknown')).toBe('');
    expect(p.ruleId('unknown')).toBe('');
  });

  it('throws when rule references missing phase', async () => {
    const p = new Provisioner(client)
      .rule('orphan-rule')
        .inPhase('nonexistent').priority(1)
        .when('true').done();

    await expect(p.apply()).rejects.toThrow('phase not found');
  });

  it('tears down resources in reverse order', async () => {
    const p = new Provisioner(client)
      .phase('screening', 1)
      .scope('client_uuid', 'event.metadata.client_uuid')
      .list('blocklist')
      .rule('block-rule')
        .inPhase('screening').priority(1)
        .when('true').done();

    await p.apply();
    await p.teardown();

    expect(state.deleted['rules']).toBe(1);
    expect(state.deleted['lists']).toBe(1);
    expect(state.deleted['scopes']).toBe(1);
    expect(state.deleted['phases']).toBe(1);
  });

  it('supports multiple phases', async () => {
    const p = new Provisioner(client)
      .phase('screening', 1)
      .phase('scoring', 2)
      .phase('decision', 3);

    await p.apply();

    expect(state.created['phases']).toBe(3);
  });

  it('supports rule with score delta', async () => {
    const p = new Provisioner(client)
      .phase('scoring', 1)
      .rule('add-score')
        .inPhase('scoring').priority(1)
        .when('true').addScore(10).continue().done();

    await p.apply();

    expect(state.created['rules']).toBe(1);
  });

  it('supports rule with list mutation', async () => {
    const p = new Provisioner(client)
      .phase('scoring', 1)
      .list('med_blocked')
      .rule('med-add')
        .inPhase('scoring').priority(1)
        .applicableWhen("event.type == 'bacen.med.add'")
        .when('true')
        .mutateList('list.add', 'med_blocked', 'event.metadata.client_uuid')
        .continue().done();

    await p.apply();

    expect(state.created['lists']).toBe(1);
    expect(state.created['rules']).toBe(1);
  });

  it('supports dry-run rules', async () => {
    const p = new Provisioner(client)
      .phase('screening', 1)
      .rule('dry-rule')
        .inPhase('screening').priority(1)
        .when('true').dryRun().done();

    await p.apply();

    expect(state.created['rules']).toBe(1);
  });

  it('supports skip-phase flow', async () => {
    const p = new Provisioner(client)
      .phase('screening', 1)
      .rule('skip-rule')
        .inPhase('screening').priority(1)
        .when('true').skipPhase().done();

    await p.apply();

    expect(state.created['rules']).toBe(1);
  });
});
