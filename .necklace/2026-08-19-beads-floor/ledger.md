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
