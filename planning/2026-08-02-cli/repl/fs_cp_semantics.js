// REPL: what does fs.cp actually do on an existing destination?
//
// The whole installer is this one call. --force is defined in terms of its
// behaviour, so guessing here means guessing the CLI surface.
//
// Falsification: if force:false silently succeeds instead of erroring, we
// cannot detect an existing install from the copy itself and need a
// pre-check pass.

import { cp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = path.join(tmpdir(), 'necklace-cp-probe');
await rm(root, { recursive: true, force: true });

const src = path.join(root, 'src', 'necklace-spec');
const dst = path.join(root, 'dst', 'necklace-spec');
await mkdir(src, { recursive: true });
await writeFile(path.join(src, 'SKILL.md'), 'SHIPPED v2\n');
await writeFile(path.join(src, 'spec.md'), 'template\n');

async function probe(label, opts, setup) {
  await rm(path.join(root, 'dst'), { recursive: true, force: true });
  if (setup) await setup();
  try {
    await cp(src, dst, { recursive: true, ...opts });
    const body = await readFile(path.join(dst, 'SKILL.md'), 'utf8');
    const files = (await readdir(dst)).sort();
    console.log(`${label}: ok, SKILL.md=${JSON.stringify(body.trim())}, files=${files.join(',')}`);
  } catch (e) {
    console.log(`${label}: threw ${e.code}`);
  }
}

const seedModified = async () => {
  await mkdir(dst, { recursive: true });
  await writeFile(path.join(dst, 'SKILL.md'), 'USER EDITED\n');
};

await probe('fresh dest, defaults          ', {});
await probe('existing dest, defaults       ', {}, seedModified);
await probe('existing dest, force:false    ', { force: false }, seedModified);
await probe('existing dest, errorOnExist   ', { force: false, errorOnExist: true }, seedModified);

await rm(root, { recursive: true, force: true });
