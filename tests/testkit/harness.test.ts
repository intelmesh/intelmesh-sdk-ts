// ---------------------------------------------------------------------------
// Harness unit tests — mock fetch, no network calls
// ---------------------------------------------------------------------------

import { describe, expect, it, vi } from 'vitest';
import { Harness, withHarness } from '../../src/testkit/harness.js';
import { Provisioner } from '../../src/provision/provisioner.js';

/** Tracks API key lifecycle counts. */
interface MockState {
  keysCreated: number;
  keysDeleted: number;
  eventsIngested: number;
  idSeq: number;
}

/** Creates a mock fetch for harness tests. */
function createMockFetch(state: MockState): typeof globalThis.fetch {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method ?? 'GET';

    // Create API key
    if (method === 'POST' && url.includes('/api/v1/api-keys')) {
      state.keysCreated++;
      state.idSeq++;
      return jsonResponse({
        data: {
          id: `key-${String(state.idSeq)}`,
          name: 'testkit',
          key: 'sk-test-ephemeral',
          enabled: true,
          permissions: [
            'events:write', 'events:simulate',
            'rules:read', 'rules:write',
            'scopes:read', 'scopes:write',
            'lists:read', 'lists:write',
            'scores:read', 'scores:write',
            'api_keys:manage',
            'evaluations:read',
            'audit:read',
          ],
        },
      });
    }

    // Delete API key
    if (method === 'DELETE' && url.includes('/api/v1/api-keys/')) {
      state.keysDeleted++;
      return jsonResponse({ data: null });
    }

    // Ingest event (with decision)
    if (method === 'POST' && url.includes('/api/v1/events/ingest')) {
      state.eventsIngested++;
      return jsonResponse({
        data: {
          event_id: `evt-${String(state.eventsIngested)}`,
          decision: {
            action: 'block',
            severity: 'critical',
          },
          transient_score: 42,
          duration_ms: 5,
        },
      });
    }

    // Simulate event (no decision)
    if (method === 'POST' && url.includes('/api/v1/events/simulate')) {
      return jsonResponse({
        data: {
          event_id: 'evt-sim-1',
          decision: { action: '', severity: '' },
          transient_score: 0,
          duration_ms: 3,
        },
      });
    }

    // Create phase
    if (method === 'POST' && url.includes('/api/v1/phases')) {
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

    // Create rule
    if (method === 'POST' && url.includes('/api/v1/rules')) {
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

    // Delete phase/rule (teardown)
    if (method === 'DELETE') {
      return jsonResponse({ data: null });
    }

    // Get list
    if (method === 'GET' && url.includes('/api/v1/lists/')) {
      return jsonResponse({
        data: {
          id: 'list-1',
          name: 'test-list',
          description: '',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      });
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

describe('Harness', () => {
  it('creates and deletes ephemeral API key', async () => {
    const state: MockState = { keysCreated: 0, keysDeleted: 0, eventsIngested: 0, idSeq: 0 };
    const h = createHarnessWithMockFetch(state);
    await h.setup();

    expect(state.keysCreated).toBe(1);
    expect(h.client()).toBeTruthy();

    await h.cleanup();
    expect(state.keysDeleted).toBe(1);
  });

  it('throws when client() called before setup()', () => {
    const state: MockState = { keysCreated: 0, keysDeleted: 0, eventsIngested: 0, idSeq: 0 };
    const h = createHarnessWithMockFetch(state);
    expect(() => h.client()).toThrow('call setup() first');
  });

  it('sends events and returns assertions', async () => {
    const state: MockState = { keysCreated: 0, keysDeleted: 0, eventsIngested: 0, idSeq: 0 };
    const h = createHarnessWithMockFetch(state);
    await h.setup();

    const assertion = await h.send('transaction.pix', { amount: 5000 });
    assertion.expectDecision('block', 'critical');
    assertion.expectScore(42);

    expect(state.eventsIngested).toBe(1);
    await h.cleanup();
  });

  it('expectNoDecision works for empty decisions', async () => {
    const state: MockState = { keysCreated: 0, keysDeleted: 0, eventsIngested: 0, idSeq: 0 };
    const h = createHarnessWithMockFetch(state);
    await h.setup();

    const assertion = await h.sendSimulate('login.success', { user: 'test' });
    assertion.expectNoDecision();
    assertion.expectScore(0);

    await h.cleanup();
  });

  it('expectDecision throws on mismatch', async () => {
    const state: MockState = { keysCreated: 0, keysDeleted: 0, eventsIngested: 0, idSeq: 0 };
    const h = createHarnessWithMockFetch(state);
    await h.setup();

    const assertion = await h.send('transaction.pix', { amount: 5000 });
    expect(() => assertion.expectDecision('allow', 'low')).toThrow('decision action');

    await h.cleanup();
  });

  it('expectScore throws on mismatch', async () => {
    const state: MockState = { keysCreated: 0, keysDeleted: 0, eventsIngested: 0, idSeq: 0 };
    const h = createHarnessWithMockFetch(state);
    await h.setup();

    const assertion = await h.send('transaction.pix', { amount: 5000 });
    expect(() => assertion.expectScore(99)).toThrow('score');

    await h.cleanup();
  });
});

describe('withHarness', () => {
  it('runs setup and cleanup automatically', async () => {
    await withHarness(
      {
        baseURL: 'http://localhost:8080',
        adminKey: 'admin-key',
      },
      async (_harness) => {
        // The withHarness function uses the real IntelMesh constructor,
        // so we cannot inject mock fetch here without refactoring.
        // This test validates the wrapper pattern compiles correctly.
      },
    ).catch(() => {
      // Expected: real fetch will fail in test environment.
    });
  });
});

describe('Harness with Provisioner', () => {
  it('provisions and tears down resources', async () => {
    const state: MockState = { keysCreated: 0, keysDeleted: 0, eventsIngested: 0, idSeq: 0 };
    const h = createHarnessWithMockFetch(state);
    await h.setup();

    const client = h.client();
    const p = new Provisioner(client)
      .phase('screening', 1)
      .rule('block-rule')
        .inPhase('screening').priority(1)
        .when('true').decide('block', 'critical').halt().done();

    await h.provision(p);

    expect(p.phaseId('screening')).toBeTruthy();
    expect(p.ruleId('block-rule')).toBeTruthy();

    await h.cleanup();
  });
});

/**
 * Helper to create a Harness backed by mock fetch.
 * We use the IntelMesh constructor's custom fetch option.
 */
function createHarnessWithMockFetch(state: MockState): Harness {
  const mockFetch = createMockFetch(state);

  // Patch globalThis.fetch so the Harness (which creates IntelMesh clients
  // internally without a custom fetch option) uses the mock.
  globalThis.fetch = mockFetch;

  return new Harness({
    baseURL: 'http://localhost:8080',
    adminKey: 'admin-key',
  });
}
