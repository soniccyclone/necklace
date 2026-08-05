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

/** Write a fake `bd` onto PATH that exits how the test wants. */
export async function fakeBd(dir, { version = '1.1.2', exitCode = 0, config = {} } = {}) {
  const bin = path.join(dir, 'fakebin');
  await mkdir(bin, { recursive: true });
  const script = `#!/bin/sh
case "$1" in
  --version) echo "bd version ${version} (fake)"; exit ${exitCode} ;;
  config) case "$3" in
${Object.entries(config).map(([k, v]) => `    ${k}) echo "${v}"; exit 0 ;;`).join('\n')}
    *) echo ""; exit 0 ;;
  esac ;;
  where) echo "${dir}/.beads"; exit ${exitCode} ;;
  *) exit ${exitCode} ;;
esac
`;
  await writeFile(path.join(bin, 'bd'), script, { mode: 0o755 });
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
