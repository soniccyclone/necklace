# ledger: bd version floor

## 2026-08-19 — the report

Nathan hit `necklace init` at work against a bd that necklace refused: `bd X.Y.Z is below the 1.1.0
floor necklace requires.` His claim is that the bd he had would have worked fine.

## Where 1.1.0 came from

`git log -S VERSION_FLOOR -- src/beads.js` returns exactly one commit, `61973b2` ("Implement the
necklace CLI, first pass"). The planning directory for that work, `.necklace/2026-08-02-cli/`, names
1.1.0 in one place only: a CUJ test row asserting the message says "1.1.0". Neither `spec.md` nor
`ledger.md` from that cycle records a reason for the number, and no probe in that cycle's `repl/`
touched a real bd.

So the floor is unsourced. It was picked, not measured. That is the whole reason we are here.

## The surface necklace actually touches

Grepped every `bd` invocation across `src/`, `skills/`, and `README.md`:

- `bd --version` — src/beads.js, necklace/SKILL.md, necklace-beads/SKILL.md, necklace-lint/SKILL.md
- `bd where` — src/beads.js (workspace check)
- `bd config get export.auto`, `bd config get export.git-add` — src/beads.js, necklace-lint
- `bd prime` — necklace-beads/SKILL.md
- `bd export -o .beads/issues.jsonl` — necklace-beads/SKILL.md
- bead create/label/close — delegated to bd's own prime output and the repo's `beads` skill

`bd init` and `bd config set` appear only as strings necklace prints for the user to run. necklace
never executes them.

## Probe 1 — does the floor bite anything real?

`repl/probe.sh` runs the whole necklace surface against one bd version inside `node:22-slim` under
podman: install from npm, `git init`, then `--version`, `init`, `where`, `config set`/`get` on both
export keys, `prime`, `create` with a `cuj:` label, `list`, `ready`, and `export -o`. Every step
reports its exit code and first line of output.

What would prove the floor right: a version below 1.1.0 failing any step.

    bd 1.2.1  — all 16 steps exit 0
    bd 1.0.2  — all 16 steps exit 0

1.0.2 is four releases below the floor and does everything necklace asks of it, including the exact
`bd config get export.auto` -> `true` string match `src/beads.js` depends on. So the floor is already
falsified at the top of the range; the remaining question is how far down it goes.

0.63.3's npm install failed. The probe swallowed the reason, which is a probe bug — fixed to capture
npm's stderr before the full sweep.

## Probe 2 — the full sweep

`repl/probe.sh` against every version npm still serves, 0.39.0 to 1.2.1, raw output in
`repl/out-sweep.txt` and `repl/out-sweep-boundary.txt`. Four distinct bands came out, and they are
not ordered the way a floor assumes:

| bd range | what happens |
| --- | --- |
| 0.39.0 | every step passes except `bd where` — `unknown command "where" for "bd"` |
| 0.39.1 – 0.49.6 | all 16 steps exit 0 |
| 0.50.1 – 0.50.3 | `config set` exits 0 but `config get` returns `export.auto (not set)` |
| 0.51.0 – 0.62.0 | Dolt era. `bd init` and `bd where` fail: `Dolt server unreachable`, or `dolt: this binary was built without CGO` |
| 1.0.2 – 1.2.1 | all 16 steps exit 0 |

0.55.4, 0.63.3 and 1.0.5 are not installable at all: `npm i -g @beads/bd@<v>` runs its postinstall,
prints `Downloading bd binary...`, and exits 1. The GitHub release assets those three postinstalls
reach for are gone. Nothing necklace can do about that, and nothing it needs to — an uninstallable
version never reaches the gate.

**The bands are not monotonic in the version number.** 0.49.6 works and 0.62.0 does not. A `>=`
comparison cannot express that, so whatever number goes in `VERSION_FLOOR`, it is wrong for some real
version. This is the argument against the floor, independent of where it is set.

The `bd config get` string contract `src/beads.js` depends on — stdout trimming to exactly `true` —
holds unchanged from 0.39.0 through 1.2.1. The one exception is the 0.50.x band, where the value does
not round-trip at all.
