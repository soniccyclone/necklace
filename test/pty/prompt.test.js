// CUJ-02, interactive path. Drives the real binary through a pseudo-terminal.
//
// Piped stdio is not a TTY, so `isTTY` is false and raw mode never engages,
// which means a child_process test exercises the non-interactive bailout
// rather than the prompt. A PTY is the only way to reach the keypress code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node-pty';
import { tempRepo, cleanup, fakeBd, listSkills, path, mkdir } from '../helpers.js';

const BIN = path.resolve(import.meta.dirname, '..', '..', 'bin', 'necklace.js');
const KEY = { down: '\x1b[B', up: '\x1b[A', space: ' ', enter: '\r', ctrlC: '\x03' };

/**
 * Put a directory at the front of PATH for a child process.
 *
 * Windows resolves PATH case-insensitively but a JS object does not, so adding
 * a `PATH` key beside the `Path` the OS actually set leaves the original in
 * charge and the child never sees the prepended directory. src/beads.js
 * carries the same fixup for the same reason.
 */
function pathWith(dir) {
  const env = { ...process.env };
  const key = Object.keys(env).find((k) => k.toUpperCase() === 'PATH') ?? 'PATH';
  env[key] = `${dir}${path.delimiter}${env[key] ?? ''}`;
  return { [key]: env[key] };
}

/**
 * Run the CLI in a PTY, optionally feeding keys once the prompt appears.
 *
 * Everything goes through here, interactive or not, so the binary is always
 * exercised as a real process with a real terminal rather than a module.
 */
function drive(cwd, keys, { timeout = 8000, argv = ['init', '--skip-beads-check'], env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const term = spawn(process.execPath, [BIN, ...argv], {
      name: 'xterm-256color',
      cols: 100,
      rows: 30,
      cwd,
      env: { ...process.env, FORCE_COLOR: '0', ...env },
    });

    let out = '';
    let fed = false;
    let settled = false;

    // Release the pty explicitly on every path. On Windows a live ConPTY
    // handle keeps the event loop open, so the runner finishes its tests and
    // then hangs forever instead of exiting.
    const teardown = () => {
      try {
        term.kill();
      } catch {
        /* already gone */
      }
    };

    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      teardown();
      fn(arg);
    };

    const timer = setTimeout(
      () => finish(reject, new Error(`timed out. output so far:\n${out}`)),
      timeout,
    );

    term.onData((d) => {
      out += d;
      if (keys.length && !fed && out.includes('space toggles')) {
        fed = true;
        setTimeout(() => {
          try {
            keys.forEach((k) => term.write(k));
          } catch {
            /* exited before we could write */
          }
        }, 60);
      }
    });

    term.onExit(({ exitCode }) => finish(resolve, { out, exitCode }));
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

// Paths that never reach the prompt. Same harness: a real process, real argv.

test('--help prints usage and exits zero', async () => {
  const repo = await tempRepo();
  try {
    const { out, exitCode } = await drive(repo, [], { argv: ['--help'] });
    assert.equal(exitCode, 0);
    assert.match(out, /necklace init/);
    assert.match(out, /--agent/);
  } finally {
    await cleanup(repo);
  }
});

test('an unknown command exits nonzero and shows usage', async () => {
  const repo = await tempRepo();
  try {
    const { out, exitCode } = await drive(repo, [], { argv: ['frobnicate'] });
    assert.notEqual(exitCode, 0);
    assert.match(out, /unknown command: frobnicate/);
  } finally {
    await cleanup(repo);
  }
});

test('a typo in a flag exits nonzero rather than being ignored', async () => {
  const repo = await tempRepo();
  try {
    const { out, exitCode } = await drive(repo, [], { argv: ['init', '--agnet', 'claude'] });
    assert.notEqual(exitCode, 0);
    assert.match(out, /agnet/);
  } finally {
    await cleanup(repo);
  }
});

test('a failing beads gate writes nothing and exits nonzero', async () => {
  const repo = await tempRepo();
  try {
    const bin = await fakeBd(repo, { exitCode: 127 });
    const { out, exitCode } = await drive(repo, [], {
      argv: ['init', '--agent', 'claude'],
      env: pathWith(bin),
    });
    assert.notEqual(exitCode, 0);
    assert.match(out, /requires a working bd/);
    assert.deepEqual(
      await listSkills(path.join(repo, '.claude', 'skills')),
      [],
      'the gate failing must leave the repo untouched',
    );
  } finally {
    await cleanup(repo);
  }
});

test('a repo without a beads workspace is told to run bd init', async () => {
  const repo = await tempRepo();
  try {
    const bin = await fakeBd(repo, { whereExit: 1 });
    const { out, exitCode } = await drive(repo, [], {
      argv: ['init', '--agent', 'claude'],
      env: pathWith(bin),
    });
    assert.notEqual(exitCode, 0);
    assert.match(out, /bd init/);
    assert.deepEqual(await listSkills(path.join(repo, '.claude', 'skills')), []);
  } finally {
    await cleanup(repo);
  }
});

test('--agent installs without ever showing the prompt', async () => {
  const repo = await tempRepo();
  try {
    const bin = await fakeBd(repo, { config: { 'export.auto': 'true', 'export.git-add': 'true' } });
    const { out, exitCode } = await drive(repo, [], {
      argv: ['init', '--agent', 'claude', '--agent', 'cursor'],
      env: pathWith(bin),
    });
    assert.equal(exitCode, 0, out);
    assert.doesNotMatch(out, /space toggles/, 'an explicit --agent must not prompt');
    assert.equal((await listSkills(path.join(repo, '.claude', 'skills'))).length, 6);
    assert.equal((await listSkills(path.join(repo, '.cursor', 'skills'))).length, 6);
  } finally {
    await cleanup(repo);
  }
});

test('the cursor is hidden during the prompt and restored on exit', async () => {
  const repo = await tempRepo(async (d) => {
    await mkdir(path.join(d, '.claude'), { recursive: true });
  });
  try {
    const { out } = await drive(repo, [KEY.enter]);
    const hide = out.indexOf('\x1b[?25l');
    const show = out.indexOf('\x1b[?25h');
    const installed = out.indexOf('installed ');
    assert.ok(hide !== -1, 'the prompt never hid the cursor');
    assert.ok(show !== -1, 'the cursor was never restored; a terminal left like this stays broken');
    assert.ok(show > hide, 'the restore must come after the hide');
    // Restoring only on process exit would leave the cursor hidden for the
    // whole install, which is the window the user actually watches.
    assert.ok(installed !== -1, 'expected the install report in the output');
    assert.ok(show < installed, 'the cursor must come back before the install output, not at exit');
  } finally {
    await cleanup(repo);
  }
});

test('ctrl-c still restores the cursor', async () => {
  const repo = await tempRepo(async (d) => {
    await mkdir(path.join(d, '.claude'), { recursive: true });
  });
  try {
    const { out } = await drive(repo, [KEY.ctrlC]);
    assert.ok(out.includes('\x1b[?25h'), 'aborting must not leave the cursor hidden');
  } finally {
    await cleanup(repo);
  }
});
