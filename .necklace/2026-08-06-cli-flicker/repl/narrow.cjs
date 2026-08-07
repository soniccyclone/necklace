// Falsification: lastLines counts logical lines, not display rows. At a width
// that wraps a row, the cursor-up count should be short and the frame should
// accumulate garbage. If output stays clean, the concern is imaginary.
const pty = require('node-pty');
const mode = process.argv[2], cols = +process.argv[3];
const p = pty.spawn(process.execPath, ['demo.mjs', mode], { name: 'xterm-256color', cols, rows: 30, cwd: __dirname });
let buf = '';
p.onData((d) => (buf += d));
let i = 0;
const t = setInterval(() => {
  if (i++ < 4) return p.write('\x1b[B');
  clearInterval(t);
  setTimeout(() => {
    // count how many times the header line appears in the final screen state
    const plain = buf.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '');
    const hits = (plain.match(/Install necklace skills for:/g) || []).length;
    const stale = (plain.split('\n').filter((l) => /GitHub Copilot/.test(l)).length);
    console.log(`${mode.padEnd(9)} cols=${cols}  header drawn ${hits}x, 'GitHub Copilot' lines in stream: ${stale}`);
    p.kill(); process.exit(0);
  }, 400);
}, 100);
