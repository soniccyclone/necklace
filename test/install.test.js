// CUJ-01: Skills land in the right directory for each target.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tempRepo, cleanup, listSkills, path, mkdir, writeFile, readdir } from './helpers.js';

const SKILLS = [
  'necklace',
  'necklace-beads',
  'necklace-cuj',
  'necklace-lint',
  'necklace-spec',
  'necklace-tweak',
];

test('writes every skill to the target path', async () => {
  const { install } = await import('../src/install.js');
  const repo = await tempRepo();
  try {
    await install({ cwd: repo, targets: ['claude'] });
    assert.deepEqual(await listSkills(path.join(repo, '.claude', 'skills')), SKILLS);
    for (const s of SKILLS) {
      const body = await readdir(path.join(repo, '.claude', 'skills', s));
      assert.ok(body.includes('SKILL.md'), `${s} is missing SKILL.md`);
    }
  } finally {
    await cleanup(repo);
  }
});

test('writes to each selected target independently', async () => {
  const { install } = await import('../src/install.js');
  const repo = await tempRepo();
  try {
    await install({ cwd: repo, targets: ['claude', 'cursor'] });
    assert.deepEqual(await listSkills(path.join(repo, '.claude', 'skills')), SKILLS);
    assert.deepEqual(await listSkills(path.join(repo, '.cursor', 'skills')), SKILLS);
  } finally {
    await cleanup(repo);
  }
});

test('resolves the payload relative to the script, not cwd', async () => {
  const { install } = await import('../src/install.js');
  const repo = await tempRepo();
  const elsewhere = await tempRepo();
  const original = process.cwd();
  try {
    process.chdir(elsewhere); // cwd has no skills/ of its own
    await install({ cwd: repo, targets: ['claude'] });
    assert.deepEqual(await listSkills(path.join(repo, '.claude', 'skills')), SKILLS);
  } finally {
    process.chdir(original);
    await cleanup(repo);
    await cleanup(elsewhere);
  }
});

test('installs nothing outside the target paths', async () => {
  const { install } = await import('../src/install.js');
  const repo = await tempRepo(async (d) => {
    await mkdir(path.join(d, 'src'), { recursive: true });
    await writeFile(path.join(d, 'src', 'app.js'), 'original\n');
  });
  try {
    await install({ cwd: repo, targets: ['claude'] });
    assert.deepEqual((await readdir(repo)).sort(), ['.claude', 'src']);
  } finally {
    await cleanup(repo);
  }
});
