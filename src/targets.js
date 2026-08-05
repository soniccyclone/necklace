import { statSync } from 'node:fs';
import path from 'node:path';

/**
 * Every supported target is first class: its own skills path and its own
 * detection markers. Detection ranks the selection list; it never gates it.
 */
export const TARGETS = {
  claude: {
    name: 'Claude Code',
    skillsDir: path.join('.claude', 'skills'),
    globalSkillsDir: path.join('.claude', 'skills'),
    detect: ['.claude'],
  },
  cursor: {
    name: 'Cursor',
    skillsDir: path.join('.cursor', 'skills'),
    globalSkillsDir: path.join('.cursor', 'skills'),
    detect: ['.cursor'],
  },
  copilot: {
    name: 'GitHub Copilot',
    skillsDir: path.join('.github', 'skills'),
    globalSkillsDir: path.join('.copilot', 'skills'),
    // .github alone means nothing, so key off things only Copilot puts there.
    detect: [
      path.join('.github', 'copilot-instructions.md'),
      path.join('.github', 'instructions'),
      path.join('.github', 'prompts'),
      path.join('.github', 'agents'),
      path.join('.github', 'skills'),
    ],
  },
  opencode: {
    name: 'opencode',
    skillsDir: path.join('.opencode', 'skills'),
    globalSkillsDir: path.join('.config', 'opencode', 'skills'),
    detect: ['.opencode'],
  },
};

export const TARGET_IDS = Object.keys(TARGETS);

function exists(p) {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

/** Which targets this repo shows evidence of. Ordering input, not a filter. */
export function detect(cwd) {
  return TARGET_IDS.filter((id) =>
    TARGETS[id].detect.some((marker) => exists(path.join(cwd, marker))),
  );
}

/** Detected first, then the rest, so the common case is one keypress. */
export function rank(cwd) {
  const found = new Set(detect(cwd));
  return [...TARGET_IDS].sort((a, b) => Number(found.has(b)) - Number(found.has(a)));
}
