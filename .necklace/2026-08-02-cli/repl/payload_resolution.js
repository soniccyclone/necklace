// REPL: run from a checkout against a different repo, does the payload resolve?
//
// The tool will be run as `node ~/necklace/bin/necklace.js init` from inside
// some other repo. If it locates skills/ relative to cwd it finds nothing and
// silently installs nothing.
//
// Falsification: if import.meta.dirname tracked cwd rather than the script,
// script-relative resolution would not work and the CLI would need an
// explicit --package-root flag.

import path from 'node:path';
import { readdir } from 'node:fs/promises';

const pkgRoot = path.resolve(import.meta.dirname, '..', '..', '..');
console.log('cwd                :', process.cwd());
console.log('import.meta.dirname:', import.meta.dirname);
console.log('payload from script:', await readdir(path.join(pkgRoot, 'skills')));
