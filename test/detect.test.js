// CUJ-02: Installer sees what was detected, selected, and written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tempRepo, cleanup, path, mkdir, writeFile } from './helpers.js';

test('detects a target from any of its marker paths', async () => {
  const { detect } = await import('../src/targets.js');
  const repo = await tempRepo(async (d) => {
    await mkdir(path.join(d, '.github', 'prompts'), { recursive: true });
  });
  try {
    assert.ok(detect(repo).includes('copilot'), 'copilot not detected from .github/prompts');
  } finally {
    await cleanup(repo);
  }
});

test('offers undetected targets too', async () => {
  const { TARGETS, detect } = await import('../src/targets.js');
  const repo = await tempRepo();
  try {
    assert.equal(detect(repo).length, 0);
    assert.deepEqual(
      Object.keys(TARGETS).sort(),
      ['claude', 'copilot', 'cursor', 'opencode'],
      'all four must stay selectable regardless of detection',
    );
  } finally {
    await cleanup(repo);
  }
});

test('reports each written path', async () => {
  const { install } = await import('../src/install.js');
  const repo = await tempRepo();
  try {
    const written = await install({ cwd: repo, targets: ['claude'] });
    assert.equal(written.length, 6, 'expected one entry per skill');
    for (const w of written) {
      assert.match(w, /\.claude[/\\]skills[/\\]necklace/);
    }
  } finally {
    await cleanup(repo);
  }
});

test('--agent skips the prompt', async () => {
  const { parse } = await import('../src/cli.js');
  const parsed = parse(['init', '--agent', 'claude', '--agent', 'cursor']);
  assert.equal(parsed.command, 'init');
  assert.deepEqual(parsed.targets, ['claude', 'cursor']);
  assert.equal(parsed.interactive, false, 'an explicit --agent must not prompt');
});
