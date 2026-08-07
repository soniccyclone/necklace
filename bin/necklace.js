#!/usr/bin/env node
import { homedir } from 'node:os';
import { parse, USAGE, VERSION } from '../src/cli.js';
import { TARGETS, detect, rank } from '../src/targets.js';
import { install, skillNames } from '../src/install.js';
import { checkBeads } from '../src/beads.js';
import { multiSelect } from '../src/prompt.js';

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

let opts;
try {
  opts = parse(process.argv.slice(2));
} catch (e) {
  die(`${e.message}\n\n${USAGE}`);
}

if (opts.version) {
  console.log(VERSION);
  process.exit(0);
}

if (opts.help) {
  console.log(`necklace ${VERSION}\n\n${USAGE}`);
  process.exit(0);
}

if (opts.command !== 'init') {
  die(`unknown command: ${opts.command}\n\n${USAGE}`);
}

const cwd = opts.global ? homedir() : process.cwd();

// Gate before anything is written. Installing skills that cannot run is the
// failure the no-fallback rule exists to prevent.
const beads = checkBeads();
if (!beads.ok && !opts.skipBeadsCheck) {
  die(`necklace requires a working bd.\n\n${beads.reason}\n\n${beads.remediation}\n
Run with --skip-beads-check to install anyway.`);
}
if (!beads.ok && opts.skipBeadsCheck) {
  console.warn(`warning: ${beads.reason}\ninstalling anyway because --skip-beads-check was passed.\n`);
}

let targets = opts.targets;
if (opts.interactive) {
  const found = new Set(detect(cwd));
  if (found.size) {
    console.log(`detected: ${[...found].map((id) => TARGETS[id].name).join(', ')}\n`);
  } else {
    console.log('no agent directories detected here; all targets are listed.\n');
  }
  try {
    targets = await multiSelect({
      message: 'Install necklace skills for:',
      choices: rank(cwd).map((id) => ({
        value: id,
        label: TARGETS[id].name,
        hint: found.has(id) ? 'detected' : undefined,
        selected: found.has(id),
      })),
    });
  } catch {
    die('cancelled.', 130);
  }
}

const names = await skillNames();
const written = await install({ cwd, targets, global: opts.global });

console.log(`installed ${names.length} skills to ${targets.length} target(s):\n`);
for (const p of written) console.log(`  ${p}`);

for (const w of beads.warnings ?? []) console.log(`\nnote: ${w}`);

console.log(`
Rerun this command to update. It always writes the current skills.
Start with: "let's plan this with necklace" and your ticket.`);
