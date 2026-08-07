// The cover site. These run against a built site, so `npm run test:site`
// builds first. They need Emacs, htmlize and pandoc, which is why they are a
// separate job rather than part of the default suite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SITE = path.join(ROOT, 'site');
const OUT = path.join(SITE, 'www');

const read = (p) => readFile(p, 'utf8');
const build = () => execFileSync('sh', [path.join(SITE, 'build.sh')], { cwd: SITE, encoding: 'utf8' });

async function skillNames() {
  const e = await readdir(path.join(ROOT, 'skills'), { withFileTypes: true });
  return e.filter((d) => d.isDirectory()).map((d) => d.name).sort();
}
async function pages() {
  return (await readdir(OUT)).filter((f) => f.endsWith('.html')).sort();
}

// ---- CUJ-01: the splash says what necklace is -----------------------------

test('splash builds from org', async () => {
  const html = await read(path.join(OUT, 'index.html'));
  assert.ok(html.length > 500, 'index.html is suspiciously small');
});

test('splash names beads as a requirement', async () => {
  const html = await read(path.join(OUT, 'index.html'));
  assert.match(html, /beads/i);
});

test('install command matches the README', async () => {
  const readme = await read(path.join(ROOT, 'README.md'));
  const cmd = /^(npx github:[^\s]+ init)$/m.exec(readme);
  assert.ok(cmd, 'no npx line found in the README');
  const html = await read(path.join(OUT, 'index.html'));
  assert.ok(
    html.includes(cmd[1]),
    `the page must carry the README's exact install line: ${cmd[1]}`,
  );
});

test('no org default stylesheet', async () => {
  const html = await read(path.join(OUT, 'index.html'));
  const styles = (html.match(/<style>/g) ?? []).length;
  assert.equal(styles, 1, 'exactly one style block, ours');
  assert.doesNotMatch(html, /pre\.src-fortran/, "org's default stylesheet leaked in");
});

// ---- CUJ-02: the mark identifies the project ------------------------------

test('every page declares the favicon', async () => {
  for (const p of await pages()) {
    const html = await read(path.join(OUT, p));
    const m = /<link rel="icon" href="([^"]+)"/.exec(html);
    assert.ok(m, `${p} has no favicon link`);
    assert.ok(existsSync(path.join(OUT, m[1])), `${p} points at a missing favicon: ${m[1]}`);
  }
});

test('the reduced mark is the favicon', async () => {
  const html = await read(path.join(OUT, 'index.html'));
  const m = /<link rel="icon" href="([^"]+)"/.exec(html);
  const svg = await read(path.join(OUT, m[1]));
  const beads = (svg.match(/<circle/g) ?? []).length;
  assert.equal(beads, 3, 'the favicon must be the reduced three-bead mark, not the five-bead one');
});

test('both marks ship as vectors', async () => {
  for (const f of ['icon.svg', 'mark.svg']) {
    const p = path.join(OUT, f);
    assert.ok(existsSync(p), `${f} missing from the built site`);
    assert.ok((await read(p)).includes('<svg'), `${f} is not an svg`);
  }
});

// ---- CUJ-03: deep links survive a rebuild ---------------------------------

const headingIds = (html) => [...html.matchAll(/<h[23] id="([^"]+)"/g)].map((m) => m[1]);

test('heading anchors survive a rebuild', async () => {
  const page = path.join(OUT, 'skill-necklace-spec.html');
  const before = headingIds(await read(page));
  build();
  const after = headingIds(await read(page));
  assert.ok(before.length > 3, 'expected several headings to compare');
  assert.deepEqual(after, before, 'heading anchors changed between builds');
});

test('heading anchors are readable', async () => {
  const html = await read(path.join(OUT, 'skill-necklace-spec.html'));
  for (const id of headingIds(html)) {
    assert.doesNotMatch(id, /^org[0-9a-f]{6,}$/, `${id} is a generated hash, not a slug`);
  }
});

test('every internal link resolves', async () => {
  for (const p of await pages()) {
    const html = await read(path.join(OUT, p));
    for (const m of html.matchAll(/href="\.\/([^"]+)"/g)) {
      assert.ok(existsSync(path.join(OUT, m[1])), `${p} links to a missing ${m[1]}`);
    }
  }
});

// ---- CUJ-04: skill pages show the real file -------------------------------

test('a page exists per skill', async () => {
  const names = await skillNames();
  const built = (await pages()).filter((p) => p.startsWith('skill-'));
  assert.deepEqual(built, names.map((n) => `skill-${n}.html`).sort());
});

test('skill content comes from the real file', async () => {
  const target = path.join(ROOT, 'skills', 'necklace-lint', 'SKILL.md');
  const original = await read(target);
  const sentinel = `sentinel-${Date.now()}`;
  try {
    await writeFile(target, `${original}\n\n${sentinel}\n`);
    build();
    const html = await read(path.join(OUT, 'skill-necklace-lint.html'));
    assert.match(html, new RegExp(sentinel), 'an edit to the skill did not reach its page');
  } finally {
    await writeFile(target, original);
    build();
  }
});

test('skill content is rendered, not raw', async () => {
  const html = await read(path.join(OUT, 'skill-necklace-spec.html'));
  const body = html.replace(/<pre[\s\S]*?<\/pre>/g, '');
  assert.doesNotMatch(body, /^#{1,4} /m, 'literal markdown headings in the body');
  assert.doesNotMatch(body, /\*\*[A-Za-z]/, 'literal markdown bold in the body');
  assert.match(html, /<h[23] id=/, 'no rendered headings at all');
});

test('frontmatter is not shown as content', async () => {
  const html = await read(path.join(OUT, 'skill-necklace-spec.html'));
  assert.doesNotMatch(html, /name: necklace-spec/, 'the frontmatter block leaked into the page');
});

test('a skill with a lenient-YAML description still builds', async () => {
  const dir = path.join(ROOT, 'skills', 'necklace-probe-yaml');
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'SKILL.md'),
      '---\nname: necklace-probe-yaml\ndescription: A probe: it has an unquoted colon, which is not strict YAML.\n---\n\n# probe\n\nBody.\n',
    );
    build();
    assert.ok(existsSync(path.join(OUT, 'skill-necklace-probe-yaml.html')));
  } finally {
    await rm(dir, { recursive: true, force: true });
    build();
  }
});

// ---- CUJ-06: editing a skill updates the site untouched -------------------

test('the docs index lists every skill', async () => {
  const html = await read(path.join(OUT, 'docs.html'));
  for (const n of await skillNames()) {
    assert.match(html, new RegExp(`href="\\./skill-${n}\\.html"`), `docs index omits ${n}`);
  }
});
