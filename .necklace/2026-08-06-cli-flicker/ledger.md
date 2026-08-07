# Ledger: CLI prompt flicker

## The bug

`src/prompt.js` `render()` erases and draws as two separate writes:

```js
if (lastLines) output.write(`\x1b[${lastLines}A\x1b[0J`);   // erase
output.write(lines.join('\n') + '\n');                       // draw
```

Between them the terminal holds a fully-erased region and is free to paint it. Under fast input
(held arrow key, fast typing) that blank frame reaches the glass. This is the same defect
anthropics/claude-code#37283 describes.

## What the maintained libraries actually do

Read `@inquirer/core/dist/lib/screen-manager.js`. The entire technique is one line:

```js
this.write(cursorDown(this.extraLinesUnderPrompt) + eraseLines(this.height) + output);
```

Erase and content leave in a single `write()`. No double buffering, no diffing, no timers.

Checked both `@clack/prompts` 1.7.0 and `@inquirer/*` 8.5.2 for DECSET 2026 synchronized output
(`CSI ? 2026 h` / `CSI ? 2026 l`). **Neither uses it.** The escape sequence is real and degrades
silently on terminals that lack it, but nobody shipping prompts today relies on it. One write per
frame is the whole answer.

## Measured

`repl/drive.cjs` counts raw PTY chunks over the same six keypresses:

| mode | frames | writes | writes/frame |
| --- | --- | --- | --- |
| `current` | 7 | 11 | 2 after the first |
| `onewrite` | 7 | 6 | 1 |

Falsification condition stated before the probe: if the two modes emitted the same write count, the
diagnosis was wrong. They did not.

## Library survey

Asked whether to stop hand-rolling escape codes and take a dependency.

| option | ships type-to-filter | packages added | size |
| --- | --- | --- | --- |
| `@inquirer/checkbox` off the shelf | **no** | 11 | ~700K |
| `@inquirer/core` + our own prompt | yes, we write it | 10 | 652K |
| `@clack/prompts` | no | 5 | ~200K |
| fix the one line | yes, already there | 0 | 0 |

`@inquirer/checkbox` has no search: no `searchTerm`, no `isBackspaceKey`. Its `filter` occurrences
are array `.filter()` calls. Arrow keys, space, and number shortcuts only. `@inquirer/search` is
single-select. **No shipped prompt in either library is a searchable multi-select**, so the
off-the-shelf path means dropping the filter, which is a behaviour change, not a bug fix.

`@inquirer/core` is the honest library answer: it owns the terminal, we hand it a string. Rebuilt in
`repl/demo.mjs` (`core` mode) at 45 lines, behaviour identical including the filter. Costs the
zero-runtime-dependency property currently asserted in `README.md` and `.necklace/2026-08-02-cli/spec.md`.

## Runnable

```
cd .necklace/2026-08-06-cli-flicker/repl && npm i
node demo.mjs current     # the bug
node demo.mjs onewrite    # one-line fix
node demo.mjs inquirer    # off the shelf, watch typing do nothing
node demo.mjs core        # library-owned rendering, filter intact
```

Hold an arrow key down. `current` tears; the others do not.

## Open

Whether to take the dependency is Nathan's call, since it retires a documented property of the
package. Both branches are built and one commit away.
