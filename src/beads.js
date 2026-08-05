import { spawnSync } from 'node:child_process';

export const VERSION_FLOOR = [1, 1, 0];

const INSTALL_BD = `Install beads, then rerun necklace init:
  brew install beads          # macOS / Linux
  npm i -g @beads/bd          # Node`;

const INIT_BD = `Initialize beads in this repo, then rerun necklace init:
  bd init

That adds a .beads/ directory and agent instruction files, and commits them.`;

function bd(args, pathPrefix) {
  const env = pathPrefix ? { ...process.env, PATH: `${pathPrefix}:${process.env.PATH}` } : process.env;
  return spawnSync('bd', args, { env, encoding: 'utf8' });
}

function parseVersion(text) {
  const m = /(\d+)\.(\d+)\.(\d+)/.exec(text ?? '');
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function below(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}

/**
 * Run bd rather than looking for it on PATH. A bd that resolves can still be a
 * broken install shim that exits nonzero on every call, and a PATH check would
 * pass and then fail later, after work had already been created.
 */
export function checkBeads({ pathPrefix } = {}) {
  const warnings = [];
  const probe = bd(['--version'], pathPrefix);

  if (probe.error || probe.status !== 0) {
    return {
      ok: false,
      reason: 'bd is not installed, or is installed but not working.',
      remediation: INSTALL_BD,
      warnings,
    };
  }

  const version = parseVersion(probe.stdout);
  if (version && below(version, VERSION_FLOOR)) {
    return {
      ok: false,
      reason: `bd ${version.join('.')} is below the 1.1.0 floor necklace requires.`,
      remediation: INSTALL_BD,
      warnings,
    };
  }

  // necklace never runs bd init. Initializing a repo adds tracked files and
  // commits them, which is the user's call to make, so we check and ask.
  if (bd(['where'], pathPrefix).status !== 0) {
    return {
      ok: false,
      reason: 'beads is installed, but this repo has no beads workspace.',
      remediation: INIT_BD,
      warnings,
    };
  }

  // Both export keys default false and both are needed, or a bead id written
  // into a CUJ document resolves to nothing for anyone reading the repo.
  for (const key of ['export.auto', 'export.git-add']) {
    const got = bd(['config', 'get', key], pathPrefix);
    if (got.status !== 0 || got.stdout.trim() !== 'true') {
      warnings.push(`${key} is not set. Run: bd config set ${key} true`);
    }
  }

  return { ok: true, reason: null, remediation: null, version, warnings };
}
