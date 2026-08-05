// CUJ-04: Rerunning init is the update path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tempRepo, cleanup, path, mkdir, writeFile, read, listSkills } from './helpers.js';

const skillFile = (repo, name) =>
  path.join(repo, '.claude', 'skills', name, 'SKILL.md');

test('overwrites an existing installed skill', async () => {
  const { install } = await import('../src/install.js');
  const repo = await tempRepo();
  try {
    await install({ cwd: repo, targets: ['claude'] });
    await writeFile(skillFile(repo, 'necklace-spec'), 'LOCALLY EDITED\n');
    await install({ cwd: repo, targets: ['claude'] });
    const body = await read(skillFile(repo, 'necklace-spec'));
    assert.notEqual(body.trim(), 'LOCALLY EDITED');
    assert.match(body, /^---\nname: necklace-spec/);
  } finally {
    await cleanup(repo);
  }
});

test('reports every path it wrote', async () => {
  const { install } = await import('../src/install.js');
  const repo = await tempRepo();
  try {
    await install({ cwd: repo, targets: ['claude'] });
    const second = await install({ cwd: repo, targets: ['claude'] });
    assert.equal(second.length, 6, 'a rerun still reports what it wrote');
  } finally {
    await cleanup(repo);
  }
});

test('running twice is identical', async () => {
  const { install } = await import('../src/install.js');
  const repo = await tempRepo();
  try {
    const first = await install({ cwd: repo, targets: ['claude'] });
    const bodyOnce = await read(skillFile(repo, 'necklace-beads'));
    const second = await install({ cwd: repo, targets: ['claude'] });
    const bodyTwice = await read(skillFile(repo, 'necklace-beads'));
    assert.deepEqual(second, first);
    assert.equal(bodyTwice, bodyOnce);
  } finally {
    await cleanup(repo);
  }
});

test('does not remove files it did not write', async () => {
  const { install } = await import('../src/install.js');
  const repo = await tempRepo(async (d) => {
    await mkdir(path.join(d, '.claude', 'skills', 'someone-elses'), { recursive: true });
    await writeFile(path.join(d, '.claude', 'skills', 'someone-elses', 'SKILL.md'), 'theirs\n');
  });
  try {
    await install({ cwd: repo, targets: ['claude'] });
    const all = await listSkills(path.join(repo, '.claude', 'skills'));
    assert.ok(all.includes('someone-elses'), 'another tool’s skill must survive');
    assert.equal(
      await read(path.join(repo, '.claude', 'skills', 'someone-elses', 'SKILL.md')),
      'theirs\n',
    );
  } finally {
    await cleanup(repo);
  }
});
