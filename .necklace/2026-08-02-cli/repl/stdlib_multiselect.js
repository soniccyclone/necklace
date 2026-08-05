// REPL: can a searchable multi-select be built with zero dependencies?
//
// OpenSpec uses a prompts library for this. If Node stdlib cannot deliver
// usable keypress events, "zero dependencies" dies and the package shape
// changes, so this decides more than it looks like it does.
//
// Falsification: if emitKeypressEvents does not fire on a synthetic stream,
// or arrow keys and space are not distinguishable from typed characters,
// we need a dependency.

import readline from 'node:readline';
import { PassThrough } from 'node:stream';

const ESC = String.fromCharCode(27);
const ETX = String.fromCharCode(3); // ctrl-c

const input = new PassThrough();
readline.emitKeypressEvents(input);

const seen = [];
input.on('keypress', (str, key) => seen.push({ str, name: key.name, ctrl: key.ctrl }));

input.write('cur');              // typing a filter
input.write(ESC + '[B');         // down arrow
input.write(ESC + '[A');         // up arrow
input.write(' ');                // toggle selection
input.write('\r');               // confirm
input.write(ETX);                // abort

setTimeout(() => {
  const names = seen.map((e) => e.name);
  console.log('events:', JSON.stringify(seen));
  console.log('typed chars captured  :', names.slice(0, 3).join('') === 'cur');
  console.log('down arrow named      :', names.includes('down'));
  console.log('up arrow named        :', names.includes('up'));
  console.log('space distinguishable :', names.includes('space'));
  console.log('enter distinguishable :', names.includes('return'));
  console.log('ctrl-c detectable     :', seen.some((e) => e.ctrl && e.name === 'c'));
}, 50);
