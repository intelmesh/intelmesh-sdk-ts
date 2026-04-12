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

/**
 * Handles POST requests in the mock fetch.
 * @param url
 * @param state
 */
// eslint-disable-next-line max-lines-per-function -- each branch is a simple JSON fixture; splitting further would obscure test data
function handlePost(url: string, state: MockState): Response | null {
  if (url.includes('/api/v1/phases')) {
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
  if (url.includes('/api/v1/scopes')) {
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
  if (url.includes('/api/v1/lists')) {
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
  if (url.includes('/api/v1/rules')) {
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
  return null;
}

/**
 * Handles DELETE requests in the mock fetch.
 * @param url
 * @param state
 */
function handleDelete(url: string, state: MockState): Response | null {
  if (url.includes('/api/v1/phases/')) {
    state.deleted['phases'] = (state.deleted['phases'] ?? 0) + 1;
    return jsonResponse({ data: null });
  }
  if (url.includes('/api/v1/scopes/')) {
    state.deleted['scopes'] = (state.deleted['scopes'] ?? 0) + 1;
    return jsonResponse({ data: null });
  }
  if (url.includes('/api/v1/lists/')) {
    state.deleted['lists'] = (state.deleted['lists'] ?? 0) + 1;
    return jsonResponse({ data: null });
  }
  if (url.includes('/api/v1/rules/')) {
    state.deleted['rules'] = (state.deleted['rules'] ?? 0) + 1;
    return jsonResponse({ data: null });
  }
  return null;
}

/**
 * Creates a mock fetch that simulates the IntelMesh API.
 * @param state
 */
function createMockFetch(state: MockState): typeof globalThis.fetch {
  return vi.fn((input: string | URL | Request, init?: RequestInit) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method ?? 'GET';

    if (method === 'POST') {
      const res = handlePost(url, state);
      if (res) return Promise.resolve(res);
    }

    if (method === 'DELETE') {
      const res = handleDelete(url, state);
      if (res) return Promise.resolve(res);
    }

    return Promise.resolve(new Response('Not Found', { status: 404 }));
  }) as typeof globalThis.fetch;
}

/**
 * Creates a JSON Response.
 * @param body
 */
function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// eslint-disable-next-line max-lines-per-function -- describe block spans many test cases; splitting into multiple files would obscure test coverage
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
      .inPhase('screening')
      .priority(1)
      .when('true')
      .decide('block', 'critical')
      .halt()
      .done();

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
      .inPhase('screening')
      .priority(1)
      .when('true')
      .done();

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
      .inPhase('nonexistent')
      .priority(1)
      .when('true')
      .done();

    await expect(p.apply()).rejects.toThrow('phase not found');
  });

  it('tears down resources in reverse order', async () => {
    const p = new Provisioner(client)
      .phase('screening', 1)
      .scope('client_uuid', 'event.metadata.client_uuid')
      .list('blocklist')
      .rule('block-rule')
      .inPhase('screening')
      .priority(1)
      .when('true')
      .done();

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
      .inPhase('scoring')
      .priority(1)
      .when('true')
      .addScore(10)
      .continue()
      .done();

    await p.apply();

    expect(state.created['rules']).toBe(1);
  });

  it('supports rule with list mutation', async () => {
    const p = new Provisioner(client)
      .phase('scoring', 1)
      .list('med_blocked')
      .rule('med-add')
      .inPhase('scoring')
      .priority(1)
      .applicableWhen("event.type == 'bacen.med.add'")
      .when('true')
      .mutateList('list.add', 'med_blocked', 'event.metadata.client_uuid')
      .continue()
      .done();

    await p.apply();

    expect(state.created['lists']).toBe(1);
    expect(state.created['rules']).toBe(1);
  });

  it('supports dry-run rules', async () => {
    const p = new Provisioner(client)
      .phase('screening', 1)
      .rule('dry-rule')
      .inPhase('screening')
      .priority(1)
      .when('true')
      .dryRun()
      .done();

    await p.apply();

    expect(state.created['rules']).toBe(1);
  });

  it('supports skip-phase flow', async () => {
    const p = new Provisioner(client)
      .phase('screening', 1)
      .rule('skip-rule')
      .inPhase('screening')
      .priority(1)
      .when('true')
      .skipPhase()
      .done();

    await p.apply();

    expect(state.created['rules']).toBe(1);
  });
});
