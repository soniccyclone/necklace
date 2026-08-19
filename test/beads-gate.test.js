// CUJ-03: Beads gate runs before anything is written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tempRepo, cleanup, fakeBd, listSkills, path } from './helpers.js';

test('refuses to install when bd is missing', async () => {
  const { checkBeads } = await import('../src/beads.js');
  const { install } = await import('../src/install.js');
  const repo = await tempRepo();
  try {
    const bin = await fakeBd(repo, { exitCode: 127 });
    const result = checkBeads({ pathPrefix: bin });
    assert.equal(result.ok, false);
    assert.match(result.remediation, /npm i -g @beads\/bd|brew install beads/);
    assert.deepEqual(
      await listSkills(path.join(repo, '.claude', 'skills')),
      [],
      'nothing may be written when the gate fails',
    );
    void install;
  } finally {
    await cleanup(repo);
  }
});

// CUJ-01: the gate tests what bd can do, not what number it reports. Measured in
// .necklace/2026-08-19-beads-floor/: every bd from 0.39.1 to 1.2.1 that answers
// these commands runs necklace, and the version bands are not monotonic, so no
// >= comparison is correct for every real version.
const WORKING = { whereExit: 0, config: { 'export.auto': 'true', 'export.git-add': 'true' } };

test('accepts a bd that answers every command necklace uses', async () => {
  const { checkBeads } = await import('../src/beads.js');
  const repo = await tempRepo();
  try {
    const bin = await fakeBd(repo, { ...WORKING, version: '1.0.2' });
    const result = checkBeads({ pathPrefix: bin });
    assert.equal(result.ok, true, 'bd 1.0.2 runs the whole necklace surface');
    assert.deepEqual(result.warnings, []);
  } finally {
    await cleanup(repo);
  }
});

test('accepts a bd from before the 1.x line', async () => {
  const { checkBeads } = await import('../src/beads.js');
  const repo = await tempRepo();
  try {
    const bin = await fakeBd(repo, { ...WORKING, version: '0.39.1' });
    const result = checkBeads({ pathPrefix: bin });
    assert.equal(result.ok, true, '0.39.1 is the oldest bd with a where command');
  } finally {
    await cleanup(repo);
  }
});

test('does not gate on the version number at all', async () => {
  const beads = await import('../src/beads.js');
  const repo = await tempRepo();
  try {
    const bin = await fakeBd(repo, { ...WORKING, version: '0.0.1' });
    assert.equal(beads.checkBeads({ pathPrefix: bin }).ok, true);
    assert.equal(
      beads.VERSION_FLOOR,
      undefined,
      'no version constant left to drift against future bd releases',
    );
  } finally {
    await cleanup(repo);
  }
});

// CUJ-02: bd already distinguishes "that command does not exist" from "no
// workspace here" from "the backend is unreachable", and each points at a
// different fix. All three strings below came off real bd builds in
// .necklace/2026-08-19-beads-floor/repl/out-sweep.txt.
test('still tells an uninitialized repo to run bd init', async () => {
  const { checkBeads } = await import('../src/beads.js');
  const repo = await tempRepo();
  try {
    const bin = await fakeBd(repo, {
      whereExit: 1,
      whereStderr: 'Error: No active beads workspace found.',
    });
    const result = checkBeads({ pathPrefix: bin });
    assert.equal(result.ok, false);
    assert.match(result.reason, /not initiali[sz]ed|no beads workspace/i);
    assert.match(result.remediation, /bd init/, 'must tell the user to run it, not run it for them');
  } finally {
    await cleanup(repo);
  }
});

test("quotes bd's own reason when where fails", async () => {
  const { checkBeads } = await import('../src/beads.js');
  const repo = await tempRepo();
  const said = 'Error: failed to open database: Dolt server unreachable at 127.0.0.1:0';
  try {
    const bin = await fakeBd(repo, { whereExit: 1, whereStderr: said });
    const result = checkBeads({ pathPrefix: bin });
    assert.equal(result.ok, false);
    assert.ok(
      result.reason.includes(said),
      `a guessed cause hides the real one; got: ${result.reason}`,
    );
  } finally {
    await cleanup(repo);
  }
});

test('tells an old bd to upgrade, not to run bd init', async () => {
  const { checkBeads } = await import('../src/beads.js');
  const repo = await tempRepo();
  try {
    const bin = await fakeBd(repo, {
      version: '0.39.0',
      whereExit: 1,
      whereStderr: 'Error: unknown command "where" for "bd"',
    });
    const result = checkBeads({ pathPrefix: bin });
    assert.equal(result.ok, false);
    assert.match(result.remediation, /brew install beads|npm i -g/);
    assert.doesNotMatch(result.remediation, /bd init/, 'the workspace is not the fault here');
  } finally {
    await cleanup(repo);
  }
});

test('does not nag about export config when the repo is not initialized', async () => {
  const { checkBeads } = await import('../src/beads.js');
  const repo = await tempRepo();
  try {
    const bin = await fakeBd(repo, { whereExit: 1 });
    const result = checkBeads({ pathPrefix: bin });
    assert.deepEqual(result.warnings, [], 'export keys are downstream of being initialized');
  } finally {
    await cleanup(repo);
  }
});

test('reports export config that is off', async () => {
  const { checkBeads } = await import('../src/beads.js');
  const repo = await tempRepo();
  try {
    const bin = await fakeBd(repo, { config: { 'export.auto': 'false', 'export.git-add': 'false' } });
    const result = checkBeads({ pathPrefix: bin });
    assert.ok(result.warnings.some((w) => w.includes('export.auto')));
    assert.ok(
      result.warnings.some((w) => w.includes('export.git-add')),
      'both keys default false and both are needed',
    );
  } finally {
    await cleanup(repo);
  }
});

test('--skip-beads-check installs anyway', async () => {
  const { parse } = await import('../src/cli.js');
  const parsed = parse(['init', '--skip-beads-check']);
  assert.equal(parsed.skipBeadsCheck, true);
});
