// REPL: does util.parseArgs handle the flag shape the CLI needs?
//
// Specifically repeated --agent, since targets are multi-select. If it
// cannot, the zero-dependency claim needs hand-rolled parsing.
//
// Falsification: if a repeated option collapses to the last value with no
// way to collect all of them, we hand-roll or take a dependency.

import { parseArgs } from 'node:util';

const config = {
  allowPositionals: true,
  options: {
    global: { type: 'boolean', short: 'g' },
    agent: { type: 'string', multiple: true },
    force: { type: 'boolean' },
    yes: { type: 'boolean', short: 'y' },
  },
};

const cases = [
  ['init'],
  ['init', '--global'],
  ['init', '--agent', 'claude', '--agent', 'cursor'],
  ['init', '--agent=claude', '--agent=copilot', '--force'],
  ['init', '-g', '-y'],
];

for (const argv of cases) {
  try {
    const { values, positionals } = parseArgs({ args: argv, ...config });
    console.log(`${JSON.stringify(argv).padEnd(56)} -> cmd=${positionals[0]} ${JSON.stringify(values)}`);
  } catch (e) {
    console.log(`${JSON.stringify(argv).padEnd(56)} -> THREW ${e.code}: ${e.message}`);
  }
}

// unknown flag behaviour decides whether we can give a good error
try {
  parseArgs({ args: ['init', '--agnet', 'claude'], ...config });
} catch (e) {
  console.log('\ntypo in flag ->', e.code, '|', e.message);
}
