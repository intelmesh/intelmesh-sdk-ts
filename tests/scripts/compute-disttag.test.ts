import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

interface ScriptOutput {
  version: string;
  disttag: string;
  is_prerelease: string;
}

function parseOutput(raw: string): ScriptOutput {
  const map: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    map[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return {
    version: map['version'] ?? '',
    disttag: map['disttag'] ?? '',
    is_prerelease: map['is_prerelease'] ?? '',
  };
}

function runScript(refName: string): ScriptOutput {
  const dir = mkdtempSync(join(tmpdir(), 'disttag-'));
  const outputFile = join(dir, 'github_output');
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  writeFileSync(outputFile, '');
  const result = spawnSync('bash', ['.github/scripts/compute-disttag.sh'], {
    env: {
      ...process.env,
      GITHUB_REF_NAME: refName,
      GITHUB_OUTPUT: outputFile,
    },
    encoding: 'utf-8',
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
});
