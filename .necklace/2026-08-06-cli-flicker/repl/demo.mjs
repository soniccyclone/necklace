// REPL: see the flicker, and see it fixed.
//
//   node demo.mjs current    what necklace ships today: erase and draw as two writes
//   node demo.mjs onewrite   identical output, combined into a single write
//   node demo.mjs inquirer   @inquirer/checkbox off the shelf: note no type-to-filter
//   node demo.mjs core       our prompt rebuilt on @inquirer/core, filter intact
//
// Hold a key down, or hammer the arrows. `current` tears because the terminal
// can repaint between the erase and the draw. The other two cannot.
//
// Falsification: if `current` and `onewrite` look identical under fast input,
// the write count is not what causes the flicker and the diagnosis is wrong.
import readline from 'node:readline';

const MODE = process.argv[2] ?? 'current';

const CHOICES = [
  { value: 'claude', label: 'Claude Code', hint: 'detected' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'copilot', label: 'GitHub Copilot' },
  { value: 'opencode', label: 'opencode' },
];

function handRolled({ singleWrite }) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stdout;
    const selected = new Set(['claude']);
    let filter = '';
    let cursor = 0;
    let lastLines = 0;
    let frames = 0;
    let writes = 0;

    const w = (s) => {
      writes++;
      output.write(s);
    };
    const visible = () =>
      CHOICES.filter((c) => (c.label + c.value).toLowerCase().includes(filter.toLowerCase()));

    function render() {
      frames++;
      const rows = visible();
      cursor = Math.min(cursor, Math.max(rows.length - 1, 0));
      const lines = [
        `Install necklace skills for:${filter ? `  filter: ${filter}` : ''}`,
        ...rows.map((c, i) => {
          const mark = selected.has(c.value) ? 'x' : ' ';
          const point = i === cursor ? '>' : ' ';
          return `${point} [${mark}] ${c.label}${c.hint ? `  (${c.hint})` : ''}`;
        }),
        `space toggles, type to filter, enter confirms, ctrl-c aborts`,
        `mode=${MODE}  frames=${frames}  writes=${writes}  writes/frame=${(writes / frames).toFixed(2)}`,
      ];
      const body = lines.join('\n') + '\n';
      const erase = lastLines ? `\x1b[${lastLines}A\x1b[0J` : '';

      if (singleWrite) {
        // What @inquirer/core does: erase and content leave in one write, so
        // the terminal never has a chance to repaint a blank screen.
        w(erase + body);
      } else {
        // What necklace ships today. The terminal may repaint between these.
        if (erase) w(erase);
        w(body);
      }
      lastLines = lines.length;
    }

    readline.emitKeypressEvents(input);
    if (input.setRawMode) input.setRawMode(true);
    output.write('\x1b[?25l');

    const finish = (err, val) => {
      if (input.setRawMode) input.setRawMode(false);
      input.removeListener('keypress', onKey);
      input.pause();
      output.write('\x1b[?25h\n');
      err ? reject(err) : resolve(val);
    };

    function onKey(str, key) {
      const rows = visible();
      if (key.ctrl && key.name === 'c') return finish(new Error('cancelled'));
      if (key.name === 'return') return finish(null, [...selected]);
      if (key.name === 'up') cursor = Math.max(cursor - 1, 0);
      else if (key.name === 'down') cursor = Math.min(cursor + 1, rows.length - 1);
      else if (key.name === 'space') {
        const r = rows[cursor];
        if (r) (selected.has(r.value) ? selected.delete(r.value) : selected.add(r.value));
      } else if (key.name === 'backspace') filter = filter.slice(0, -1);
      else if (str && !key.ctrl && !key.meta && str.length === 1 && str >= ' ') filter += str;
      render();
    }

    input.on('keypress', onKey);
    input.resume();
    render();
  });
}

async function viaInquirer() {
  const { checkbox } = await import('@inquirer/prompts');
  return checkbox({
    message: 'Install necklace skills for:',
    choices: CHOICES.map((c) => ({
      value: c.value,
      name: c.hint ? `${c.label}  (${c.hint})` : c.label,
      checked: c.value === 'claude',
    })),
  });
}

// Same prompt, same filter, but @inquirer/core owns the terminal. We hand it a
// string; it decides how to erase and redraw. No escape codes here at all.
async function viaCore() {
  const core = await import('@inquirer/core');
  const { createPrompt, useState, useKeypress, isUpKey, isDownKey, isSpaceKey, isEnterKey, isBackspaceKey } = core;

  const prompt = createPrompt((config, done) => {
    const [selected, setSelected] = useState(new Set(['claude']));
    const [filter, setFilter] = useState('');
    const [cursor, setCursor] = useState(0);

    const rows = config.choices.filter((c) =>
      (c.label + c.value).toLowerCase().includes(filter.toLowerCase()),
    );
    const at = Math.min(cursor, Math.max(rows.length - 1, 0));

    useKeypress((key, rl) => {
      if (isEnterKey(key)) {
        if (selected.size) done([...selected]);
        return;
      }
      if (isUpKey(key)) setCursor(Math.max(at - 1, 0));
      else if (isDownKey(key)) setCursor(Math.min(at + 1, rows.length - 1));
      else if (isSpaceKey(key)) {
        const r = rows[at];
        if (!r) return;
        const next = new Set(selected);
        next.has(r.value) ? next.delete(r.value) : next.add(r.value);
        setSelected(next);
      } else if (isBackspaceKey(key)) setFilter(filter.slice(0, -1));
      else if (key.name !== 'tab' && rl.line) setFilter(filter + rl.line);
      rl.clearLine(0);
    });

    const body = rows.map((c, i) => {
      const mark = selected.has(c.value) ? 'x' : ' ';
      const point = i === at ? '>' : ' ';
      return `${point} [${mark}] ${c.label}${c.hint ? `  (${c.hint})` : ''}`;
    });
    return [
      `${config.message}${filter ? `  filter: ${filter}` : ''}\n${body.join('\n')}`,
      'space toggles, type to filter, enter confirms, ctrl-c aborts\nmode=core  the library owns every write',
    ];
  });

  return prompt({ message: 'Install necklace skills for:', choices: CHOICES });
}

const run =
  MODE === 'core' ? viaCore()
  : MODE === 'inquirer' ? viaInquirer()
  : MODE === 'onewrite' ? handRolled({ singleWrite: true })
  : handRolled({ singleWrite: false });

run.then(
  (v) => console.log('selected:', v),
  (e) => {
    console.log(e.message);
    process.exit(1);
  },
);
