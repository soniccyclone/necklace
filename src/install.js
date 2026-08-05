import { cp, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { TARGETS } from './targets.js';

/** Package root, resolved from this file rather than cwd. */
export const PKG_ROOT = path.resolve(import.meta.dirname, '..');
const PAYLOAD = path.join(PKG_ROOT, 'skills');

export async function skillNames() {
  const entries = await readdir(PAYLOAD, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

/**
 * Copy every skill into each target's skills directory.
 *
 * Always overwrites: the skills are necklace's payload, not user
 * configuration, so a rerun is also the update path. Only the directories we
 * ship are touched, so anything else living alongside them survives.
 *
 * Returns every path written, because fs.cp reports nothing itself.
 */
export async function install({ cwd, targets, global = false }) {
  const names = await skillNames();
  const written = [];

  for (const id of targets) {
    const target = TARGETS[id];
    if (!target) throw new Error(`unknown target: ${id}`);
    const dest = path.join(cwd, global ? target.globalSkillsDir : target.skillsDir);
    await mkdir(dest, { recursive: true });

    for (const name of names) {
      const to = path.join(dest, name);
      await cp(path.join(PAYLOAD, name), to, { recursive: true, force: true });
      written.push(path.relative(cwd, to));
    }
  }

  return written;
}
