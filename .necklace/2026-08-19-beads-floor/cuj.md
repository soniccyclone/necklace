# CUJ document: necklace refuses working installs of bd

Derived from `spec.md` in this directory. One CUJ per actor-outcome pair.

---

## CUJ-01: Someone on an old but working bd gets their skills installed

**Actor:** someone running `necklace init` on a bd below 1.1.0 that answers every command necklace uses
**Trigger:** `necklace init` in a repo with a beads workspace
**Journey:**
1. Person runs `necklace init`.
2. necklace runs `bd --version`, `bd where`, and `bd config get` on both export keys.
3. Every command answers, so necklace writes the skills and reports no version complaint.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `accepts a bd that answers every command necklace uses` | a stub `bd` reporting 1.0.2, `where` exiting 0, both export keys `true` | the gate passes with no warnings | REPL: 1.0.2 runs all 16 surface steps clean, `repl/out-sweep.txt` |
| `accepts a bd from before the 1.x line` | a stub `bd` reporting 0.39.1, otherwise working | the gate passes | REPL: 0.39.1 is the oldest version with `bd where`, `repl/out-sweep-boundary.txt` |
| `does not gate on the version number at all` | a stub `bd` reporting 0.0.1, otherwise working | the gate passes, and `src/beads.js` exports no version constant | REPL: the working bands are not monotonic, so no `>=` is correct — 0.49.6 works where 0.62.0 does not |

**Done when:** the three tests above pass. All must be red when created.

**Beads:** necklace-sux

---

## CUJ-02: Someone on an unusable bd is told what bd actually said

**Actor:** someone running `necklace init` on a bd that cannot answer the commands necklace uses
**Trigger:** `necklace init` where `bd where` exits nonzero
**Journey:**
1. Person runs `necklace init` on a bd too old to have `bd where`, or one whose backend is unreachable.
2. necklace runs `bd where`, which fails.
3. necklace refuses, quoting bd's own failure line rather than a substituted cause.
4. The remediation matches the fault: upgrade bd when the command is missing, initialize the workspace when the workspace is missing.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `quotes bd's own reason when where fails` | a stub `bd` whose `where` exits 1 printing `Error: failed to open database: Dolt server unreachable at 127.0.0.1:0` | the reason contains bd's line verbatim | REPL: 0.51.0–0.62.0 fail exactly this way and necklace currently reports "no beads workspace" instead |
| `tells an old bd to upgrade, not to run bd init` | a stub `bd` whose `where` exits 1 printing `Error: unknown command "where" for "bd"` | remediation names installing beads, and does not name `bd init` | REPL: 0.39.0 has no `where` command; today necklace tells that user to run `bd init`, which is not the fault |
| `still tells an uninitialized repo to run bd init` | a stub `bd` whose `where` exits 1 printing `Error: No active beads workspace found.` | remediation names `bd init` | REPL: 1.2.1 in a repo with no workspace prints exactly this |

**Done when:** the three tests above pass. All must be red when created.

**Beads:** necklace-pnw

---

## CUJ-03: A maintainer can check which bd versions were measured

**Actor:** someone maintaining necklace against a future bd release
**Trigger:** wondering whether necklace supports some bd version
**Journey:**
1. Maintainer reads the repository's stated bd requirement.
2. It names the range that was measured and the surface it was measured against, not a floor.
3. The probe that produced the range is in the repository and can be re-run.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `the readme names the bd versions necklace was measured against` | `README.md` | the beads requirement names the measured range, which it currently states nowhere | grep across README, docs and skills: `skills/necklace-lint/SKILL.md:95` is the only stated bd version anywhere in the repo |
| `the lint skill checks capability rather than version` | `skills/necklace-lint/SKILL.md` | its bd probe table has no row asserting a version, and keeps the rows that run commands | the row reads `| version | at least 1.1.0 |` today |

**Done when:** the two tests above pass. Both must be red when created.

**Depends on:** CUJ-01

**Beads:** necklace-uoj

---

<!--
Checks before finishing:

  Every actor-outcome pair in spec.md has a CUJ here.
  Every CUJ has at least one test row with a real input and a real assertion.
  Every "Done when" names tests and nothing else.
  Slices are vertical. If this reads as phases or layers, re-slice.
  Dependencies are sparse.
-->
