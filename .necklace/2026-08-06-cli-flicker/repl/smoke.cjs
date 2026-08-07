// Does each mode start, respond to keys, and confirm a selection?
const pty = require('node-pty');
const mode = process.argv[2];
const p = pty.spawn(process.execPath, ['demo.mjs', mode], { name: 'xterm-256color', cols: 80, rows: 24, cwd: __dirname });
let buf = '';
p.onData((d) => (buf += d));
const keys = ['\x1b[B', ' ', '\r'];
let i = 0;
const t = setInterval(() => {
  if (i < keys.length) return p.write(keys[i++]);
  clearInterval(t);
  setTimeout(() => {
    const ok = /selected:/.test(buf);
    console.log(`${mode.padEnd(9)} ${ok ? 'OK  ' + (/selected:.*/.exec(buf) || [''])[0].trim() : 'FAIL\n' + buf.slice(-400)}`);
    p.kill(); process.exit(ok ? 0 : 1);
  }, 400);
}, 120);
