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
