import { parseArgs } from 'node:util';
import { TARGET_IDS } from './targets.js';

export const USAGE = `necklace init [--global] [--agent <name>] [--skip-beads-check]

  --agent <name>        install for one target; repeat for several.
                        ${TARGET_IDS.join(', ')}
  --global              install to the user directory instead of this repo
  --skip-beads-check    install even when bd is missing or broken

With no --agent, necklace detects what this repo uses and asks.
Rerunning is also the update path: it always writes the current skills.`;

export function parse(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      agent: { type: 'string', multiple: true },
      global: { type: 'boolean', short: 'g' },
      'skip-beads-check': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  const targets = values.agent ?? [];
  const unknown = targets.filter((t) => !TARGET_IDS.includes(t));
  if (unknown.length) {
    throw new Error(`unknown target: ${unknown.join(', ')}. Known: ${TARGET_IDS.join(', ')}`);
  }

  return {
    command: positionals[0] ?? 'init',
    targets,
    interactive: targets.length === 0,
    global: values.global === true,
    skipBeadsCheck: values['skip-beads-check'] === true,
    help: values.help === true,
  };
}
