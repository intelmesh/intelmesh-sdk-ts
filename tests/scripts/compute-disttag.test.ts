import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(here, '../../.github/scripts/compute-disttag.sh');

interface ScriptOutput {
  version: string;
  disttag: string;
  is_prerelease: string;
}

interface RawResult {
  status: number;
  stderr: string;
}

function parseOutput(raw: string): ScriptOutput {
  const map = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    map.set(line.slice(0, idx), line.slice(idx + 1));
  }
  return {
    version: map.get('version') ?? '',
    disttag: map.get('disttag') ?? '',
    is_prerelease: map.get('is_prerelease') ?? '',
  };
}

function runScriptRaw(env: Record<string, string>): RawResult {
  const dir = mkdtempSync(join(tmpdir(), 'disttag-'));
  // Ensure we do NOT inherit GITHUB_REF_NAME or GITHUB_OUTPUT from
  // the parent process — compose the env from scratch with only
  // PATH (needed for bash discovery) and whatever the caller passes.
  const cleanEnv: Record<string, string> = { PATH: process.env.PATH ?? '' };
  Object.assign(cleanEnv, env);
  const result = spawnSync('bash', [scriptPath], {
    env: cleanEnv,
    encoding: 'utf-8',
    cwd: dir,
  });
  return {
    status: result.status ?? -1,
    stderr: result.stderr,
  };
}

function runScript(refName: string): ScriptOutput {
  const dir = mkdtempSync(join(tmpdir(), 'disttag-'));
  const outputFile = join(dir, 'github_output');
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  writeFileSync(outputFile, '');
  const result = spawnSync('bash', [scriptPath], {
    env: {
      ...process.env,
      GITHUB_REF_NAME: refName,
      GITHUB_OUTPUT: outputFile,
    },
    encoding: 'utf-8',
    cwd: dir,
  });
  if (result.status !== 0) {
    throw new Error(`Script failed (status=${String(result.status)}): ${result.stderr}`);
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return parseOutput(readFileSync(outputFile, 'utf-8'));
}

describe('compute-disttag.sh', () => {
  it('stable v1.2.3 resolves to latest', () => {
    const out = runScript('v1.2.3');
    expect(out.version).toBe('1.2.3');
    expect(out.disttag).toBe('latest');
    expect(out.is_prerelease).toBe('false');
  });

  it('v1.2.3-beta.1 resolves to beta dist-tag', () => {
    const out = runScript('v1.2.3-beta.1');
    expect(out.version).toBe('1.2.3-beta.1');
    expect(out.disttag).toBe('beta');
    expect(out.is_prerelease).toBe('true');
  });

  it('v1.2.3-rc.2 resolves to rc dist-tag', () => {
    const out = runScript('v1.2.3-rc.2');
    expect(out.disttag).toBe('rc');
    expect(out.is_prerelease).toBe('true');
  });

  it('v2.0.0-alpha.7 resolves to alpha dist-tag', () => {
    const out = runScript('v2.0.0-alpha.7');
    expect(out.disttag).toBe('alpha');
    expect(out.is_prerelease).toBe('true');
  });

  it('v2.0.0-next.0 resolves to next dist-tag', () => {
    const out = runScript('v2.0.0-next.0');
    expect(out.disttag).toBe('next');
    expect(out.is_prerelease).toBe('true');
  });

  it('v1.0.0-beta without dot suffix resolves to beta', () => {
    const out = runScript('v1.0.0-beta');
    expect(out.version).toBe('1.0.0-beta');
    expect(out.disttag).toBe('beta');
    expect(out.is_prerelease).toBe('true');
  });

  it('v1.0.0-beta-2 (valid semver, hyphen in prerelease) resolves to beta-2', () => {
    const out = runScript('v1.0.0-beta-2');
    expect(out.version).toBe('1.0.0-beta-2');
    expect(out.disttag).toBe('beta-2');
    expect(out.is_prerelease).toBe('true');
  });

  it('v1.2.3-BETA.1 lowercases the disttag to beta', () => {
    const out = runScript('v1.2.3-BETA.1');
    expect(out.version).toBe('1.2.3-BETA.1');
    expect(out.disttag).toBe('beta');
    expect(out.is_prerelease).toBe('true');
  });
});

describe('compute-disttag.sh — error handling', () => {
  it('exits non-zero when GITHUB_REF_NAME is unset', () => {
    const result = runScriptRaw({ GITHUB_OUTPUT: join(tmpdir(), 'unused') });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('GITHUB_REF_NAME');
  });

  it('exits non-zero when GITHUB_REF_NAME is empty', () => {
    const result = runScriptRaw({
      GITHUB_REF_NAME: '',
      GITHUB_OUTPUT: join(tmpdir(), 'unused'),
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('GITHUB_REF_NAME');
  });

  it('exits non-zero when GITHUB_OUTPUT is unset', () => {
    const result = runScriptRaw({ GITHUB_REF_NAME: 'v1.2.3' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('GITHUB_OUTPUT');
  });

  it('rejects non-semver tag vA.B.C', () => {
    const result = runScriptRaw({
      GITHUB_REF_NAME: 'vA.B.C',
      GITHUB_OUTPUT: join(tmpdir(), 'unused'),
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('not a valid semver tag');
  });

  it('rejects non-semver tag v1.2', () => {
    const result = runScriptRaw({
      GITHUB_REF_NAME: 'v1.2',
      GITHUB_OUTPUT: join(tmpdir(), 'unused'),
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('not a valid semver tag');
  });

  it('rejects build-metadata tag v1.2.3+build.1', () => {
    const result = runScriptRaw({
      GITHUB_REF_NAME: 'v1.2.3+build.1',
      GITHUB_OUTPUT: join(tmpdir(), 'unused'),
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('not a valid semver tag');
  });
});
