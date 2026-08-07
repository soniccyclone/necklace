// Falsification probe: does `current` really emit two writes per frame while
// `onewrite` emits one? Counts raw PTY chunks, which is what the terminal sees.
const pty = require('node-pty');
const mode = process.argv[2];
const p = pty.spawn(process.execPath, ['demo.mjs', mode], { name: 'xterm-256color', cols: 80, rows: 24, cwd: __dirname });
let chunks = 0, buf = '';
p.onData((d) => { chunks++; buf += d; });
const keys = ['\x1b[B', '\x1b[B', '\x1b[A', ' ', '\x1b[B', ' '];
let i = 0;
const tick = setInterval(() => {
  if (i < keys.length) return p.write(keys[i++]);
  clearInterval(tick);
  p.write('\r');
  setTimeout(() => {
    const m = /writes=(\d+)/g; let last;
    for (const x of buf.matchAll(/frames=(\d+)\s+writes=(\d+)/g)) last = x;
    console.log(`${mode}: pty chunks=${chunks} last frame report: frames=${last?.[1]} writes=${last?.[2]}`);
    p.kill(); process.exit(0);
  }, 300);
}, 60);
