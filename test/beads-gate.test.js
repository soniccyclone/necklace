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

test('reports a bd below the version floor', async () => {
  const { checkBeads } = await import('../src/beads.js');
  const repo = await tempRepo();
  try {
    const bin = await fakeBd(repo, { version: '1.0.9' });
    const result = checkBeads({ pathPrefix: bin });
    assert.equal(result.ok, false);
    assert.match(result.reason, /1\.1\.0/, 'must name the floor, not just say too old');
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
