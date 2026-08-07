// The prompt's terminal handling, tested in process so the assertions are
// deterministic. Anything needing a real terminal lives in test/pty/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';

/** A stream that claims to be a TTY and records everything written to it. */
function fakeTty() {
  const s = new PassThrough();
  s.isTTY = true;
  s.setRawMode = () => {};
  s.chunks = [];
  s.on('data', (c) => s.chunks.push(c.toString()));
  return s;
}
function fakeOut() {
  const written = [];
  return { written, write: (s) => written.push(s), isTTY: true };
}

const HIDE = '\x1b[?25l';
const SHOW = '\x1b[?25h';

test('the cursor is restored before multiSelect resolves', async () => {
  const { multiSelect } = await import('../src/prompt.js');
  const input = fakeTty();
  const output = fakeOut();

  const done = multiSelect({
    message: 'pick',
    choices: [{ value: 'a', label: 'A', selected: true }],
    input,
    output,
  });

  input.emit('keypress', '\r', { name: 'return' });
  await done;

  const all = output.written.join('');
  assert.ok(all.includes(HIDE), 'the prompt never hid the cursor');
  assert.ok(
    all.includes(SHOW),
    'the cursor must be restored by the time the prompt resolves, not at process exit',
  );
  assert.ok(all.indexOf(SHOW) > all.indexOf(HIDE), 'restore must follow hide');
});

test('the cursor is restored when the prompt is cancelled', async () => {
  const { multiSelect } = await import('../src/prompt.js');
  const input = fakeTty();
  const output = fakeOut();

  const done = multiSelect({
    message: 'pick',
    choices: [{ value: 'a', label: 'A', selected: true }],
    input,
    output,
  }).then(() => 'resolved', () => 'rejected');

  input.emit('keypress', '\x03', { name: 'c', ctrl: true });
  assert.equal(await done, 'rejected');
  assert.ok(output.written.join('').includes(SHOW), 'aborting must not leave the cursor hidden');
});
