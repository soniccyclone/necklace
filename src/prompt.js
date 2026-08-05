import readline from 'node:readline';

/**
 * Searchable multi-select, standard library only.
 *
 * Detected entries arrive pre-selected and sorted first, so the common case is
 * one keypress. Everything else stays in the list and reachable by typing,
 * because someone installing necklace before their editor should not be stuck.
 */
export function multiSelect({ message, choices, input = process.stdin, output = process.stdout }) {
  return new Promise((resolve, reject) => {
    if (!input.isTTY) {
      resolve(choices.filter((c) => c.selected).map((c) => c.value));
      return;
    }

    const selected = new Set(choices.filter((c) => c.selected).map((c) => c.value));
    let filter = '';
    let cursor = 0;
    let lastLines = 0;

    const visible = () =>
      choices.filter((c) => (c.label + c.value).toLowerCase().includes(filter.toLowerCase()));

    function render() {
      const rows = visible();
      cursor = Math.min(cursor, Math.max(rows.length - 1, 0));
      const lines = [
        `${message}${filter ? `  filter: ${filter}` : ''}`,
        ...rows.map((c, i) => {
          const mark = selected.has(c.value) ? 'x' : ' ';
          const point = i === cursor ? '>' : ' ';
          const note = c.hint ? `  (${c.hint})` : '';
          return `${point} [${mark}] ${c.label}${note}`;
        }),
        'space toggles, type to filter, enter confirms, ctrl-c aborts',
      ];
      if (lastLines) output.write(`\x1b[${lastLines}A\x1b[0J`);
      output.write(lines.join('\n') + '\n');
      lastLines = lines.length;
    }

    readline.emitKeypressEvents(input);
    if (input.setRawMode) input.setRawMode(true);

    function finish(err, value) {
      if (input.setRawMode) input.setRawMode(false);
      input.removeListener('keypress', onKey);
      input.pause();
      output.write('\n');
      err ? reject(err) : resolve(value);
    }

    function onKey(str, key) {
      const rows = visible();
      if (key.ctrl && key.name === 'c') return finish(new Error('cancelled'));
      if (key.name === 'return') {
        if (selected.size === 0) return;
        return finish(null, choices.filter((c) => selected.has(c.value)).map((c) => c.value));
      }
      if (key.name === 'up') cursor = Math.max(cursor - 1, 0);
      else if (key.name === 'down') cursor = Math.min(cursor + 1, rows.length - 1);
      else if (key.name === 'space') {
        const row = rows[cursor];
        if (row) selected.has(row.value) ? selected.delete(row.value) : selected.add(row.value);
      } else if (key.name === 'backspace') filter = filter.slice(0, -1);
      else if (str && !key.ctrl && !key.meta && str.length === 1 && str >= ' ') filter += str;
      render();
    }

    input.on('keypress', onKey);
    input.resume();
    render();
  });
}
