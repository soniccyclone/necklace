// Run necklace's real checkBeads() against whatever bd is installed, in a repo
// that has already been `bd init`ed. Prints the gate's verdict as one line.
// Reading src/beads.js tells you what it intends; this tells you what it does.
// BEADS_MODULE points at the copy to test, so the same probe can run the shipped
// gate and a floor-stripped one without editing the tree.
const mod = process.env.BEADS_MODULE ?? '/necklace/src/beads.js';
const { checkBeads } = await import(mod);
const r = checkBeads();
console.log(`GATE\t${r.ok ? 'PASS' : 'BLOCK'}\t${r.reason ?? ''}\t${(r.warnings ?? []).join(' | ')}`);
