import { mkdtemp, rm, mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const PKG_ROOT = path.resolve(import.meta.dirname, '..');

/** A throwaway directory standing in for someone's repo. */
export async function tempRepo(setup) {
  const dir = await mkdtemp(path.join(tmpdir(), 'necklace-test-'));
  if (setup) await setup(dir);
  return dir;
}

export async function cleanup(dir) {
  await rm(dir, { recursive: true, force: true });
}

/**
 * Write a fake `bd` onto PATH that exits how the test wants.
 *
 * The fake is a Node script plus a launcher per platform, rather than a shell
 * script, so this runs on Windows as well. That mirrors reality: beads from npm
 * on Windows is `bd.cmd`.
 */
export async function fakeBd(
  dir,
  { version = '1.1.2', exitCode = 0, whereExit = 0, whereStderr = '', config = {} } = {},
) {
  const bin = path.join(dir, 'fakebin');
  await mkdir(bin, { recursive: true });

  const behaviour = JSON.stringify({ version, exitCode, whereExit, whereStderr, config });
  await writeFile(
    path.join(bin, 'fake-bd.js'),
    `const b = ${behaviour};
const [cmd, ...rest] = process.argv.slice(2);
if (cmd === '--version') { console.log('bd version ' + b.version + ' (fake)'); process.exit(b.exitCode); }
if (cmd === 'where') { if (b.whereStderr) console.error(b.whereStderr); process.exit(b.whereExit); }
if (cmd === 'config' && rest[0] === 'get') {
  const v = b.config[rest[1]];
  if (v !== undefined) { console.log(v); process.exit(0); }
  console.log(''); process.exit(0);
}
process.exit(b.exitCode);
`,
  );

  // POSIX launcher.
  await writeFile(
    path.join(bin, 'bd'),
    `#!/bin/sh\nexec "${process.execPath}" "$(dirname "$0")/fake-bd.js" "$@"\n`,
    { mode: 0o755 },
  );
  // Windows launcher. spawnSync uses a shell there, which resolves .cmd.
  await writeFile(
    path.join(bin, 'bd.cmd'),
    `@echo off\r\n"${process.execPath}" "%~dp0fake-bd.js" %*\r\n`,
  );

  return bin;
}

export async function listSkills(dir) {
  try {
    return (await readdir(dir)).sort();
  } catch {
    return [];
  }
}

export async function read(file) {
  return readFile(file, 'utf8');
}

export { path, mkdir, writeFile, readFile, readdir, rm };
