// CUJ-03: the bd requirement is a measured range, not a version floor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PKG_ROOT, read, path } from './helpers.js';

test('the readme names the bd versions necklace was measured against', async () => {
  const readme = await read(path.join(PKG_ROOT, 'README.md'));
  assert.match(
    readme,
    /0\.39\.1[\s\S]{0,120}1\.2\.1/,
    'the beads requirement must name the range that was measured',
  );
});

test('the lint skill checks capability rather than version', async () => {
  const skill = await read(path.join(PKG_ROOT, 'skills', 'necklace-lint', 'SKILL.md'));
  assert.doesNotMatch(skill, /at least 1\.1\.0/, 'no bd version floor survives anywhere');
  assert.match(skill, /bd config get export\.auto/, 'the probes that run commands stay');
});
