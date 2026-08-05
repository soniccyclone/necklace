// CUJ-02, interactive path. Drives the real binary through a pseudo-terminal.
//
// Piped stdio is not a TTY, so `isTTY` is false and raw mode never engages,
// which means a child_process test exercises the non-interactive bailout
// rather than the prompt. A PTY is the only way to reach the keypress code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node-pty';
import { tempRepo, cleanup, listSkills, path, mkdir } from '../helpers.js';

const BIN = path.resolve(import.meta.dirname, '..', '..', 'bin', 'necklace.js');
const KEY = { down: '\x1b[B', up: '\x1b[A', space: ' ', enter: '\r', ctrlC: '\x03' };

/** Run the CLI in a PTY, feeding keys once the prompt appears. */
function drive(cwd, keys, { timeout = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    const term = spawn(process.execPath, [BIN, 'init', '--skip-beads-check'], {
      name: 'xterm-256color',
      cols: 100,
      rows: 30,
      cwd,
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    let out = '';
    let fed = false;
    const timer = setTimeout(() => {
      term.kill();
      reject(new Error(`timed out. output so far:\n${out}`));
    }, timeout);

    term.onData((d) => {
      out += d;
      if (!fed && out.includes('space toggles')) {
        fed = true;
        // Let the first render settle before driving it.
        setTimeout(() => keys.forEach((k) => term.write(k)), 60);
      }
    });

    term.onExit(({ exitCode }) => {
      clearTimeout(timer);
      resolve({ out, exitCode });
    });
  });
}

test('prompt preselects a detected target and installs it on enter', async () => {
  const repo = await tempRepo(async (d) => {
    await mkdir(path.join(d, '.claude'), { recursive: true });
  });
  try {
    const { out, exitCode } = await drive(repo, [KEY.enter]);
    assert.equal(exitCode, 0, out);
    assert.match(out, /detected: Claude Code/);
    assert.match(out, /\[x\] Claude Code/, 'a detected target must arrive preselected');
    assert.deepEqual((await listSkills(path.join(repo, '.claude', 'skills'))).length, 6);
  } finally {
    await cleanup(repo);
  }
});

test('typing filters the list and space selects an undetected target', async () => {
  const repo = await tempRepo();
  try {
    const { out, exitCode } = await drive(repo, ['curs', KEY.space, KEY.enter]);
    assert.equal(exitCode, 0, out);
    assert.match(out, /no agent directories detected/);
    assert.match(out, /filter: curs/);
    assert.deepEqual((await listSkills(path.join(repo, '.cursor', 'skills'))).length, 6);
    assert.deepEqual(await listSkills(path.join(repo, '.claude', 'skills')), []);
  } finally {
    await cleanup(repo);
  }
});

test('enter with nothing selected does not install', async () => {
  const repo = await tempRepo();
  try {
    // Nothing is detected, so nothing is preselected. Enter must not proceed.
    const { out } = await drive(repo, [KEY.enter, KEY.ctrlC], { timeout: 6000 });
    assert.deepEqual(await listSkills(path.join(repo, '.claude', 'skills')), []);
    assert.doesNotMatch(out, /installed \d+ skills/);
  } finally {
    await cleanup(repo);
  }
});

test('ctrl-c aborts without writing anything', async () => {
  const repo = await tempRepo(async (d) => {
    await mkdir(path.join(d, '.claude'), { recursive: true });
  });
  try {
    const { out, exitCode } = await drive(repo, [KEY.ctrlC]);
    assert.notEqual(exitCode, 0);
    assert.match(out, /cancelled/);
    assert.deepEqual(await listSkills(path.join(repo, '.claude', 'skills')), []);
  } finally {
    await cleanup(repo);
  }
});
