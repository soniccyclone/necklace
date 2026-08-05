# CUJ document: necklace CLI

Derived from `spec.md` in this directory. One CUJ per actor-outcome pair.

---

## CUJ-01: Installer gets the skills into the right directory for each agent

**Actor:** installer
**Trigger:** runs `necklace init` in their repo
**Journey:**
1. Installer runs the command from their repo root.
2. System writes each skill directory into every selected target's skills path.
3. Installer's agent finds the skills where it expects them.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `writes every skill to the target path` | claude selected, empty repo | all six skill directories exist under `.claude/skills/`, each containing its `SKILL.md` | |
| `writes to each selected target independently` | claude and cursor selected | the same six exist under both `.claude/skills/` and `.cursor/skills/` | |
| `resolves the payload relative to the script, not cwd` | run with cwd set outside the package | the payload is still found and written | REPL: `import.meta.dirname` tracks the script while `process.cwd()` is the target repo |
| `installs nothing outside the target paths` | claude selected | no file is written anywhere but `.claude/skills/` | |

**Done when:** the four tests above pass. All must be red when created.

**Beads:**

---

## CUJ-02: Installer sees what was detected, selected, and written

**Actor:** installer
**Trigger:** the command runs
**Journey:**
1. System reports which agents it found evidence of in the repo.
2. Installer confirms or changes the selection.
3. System reports every path it wrote and every file it skipped.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `detects a target from any of its marker paths` | a repo with only `.github/prompts/` | copilot is reported as detected | Copilot has no single marker; `.github/` alone means nothing |
| `offers undetected targets too` | a repo with no agent directories | all four remain selectable rather than the list being empty | |
| `reports each written path` | claude selected | the output names `.claude/skills/` and the six directories | |
| `--agent skips the prompt` | `--agent claude --agent cursor` | both are installed with no interactive selection | REPL: `parseArgs` with `multiple: true` collects repeated flags |

**Done when:** the four tests above pass. All must be red when created.

**Beads:**

---

## CUJ-03: Installer learns whether beads is usable before anything is written

**Actor:** installer
**Trigger:** the command runs in a repo where beads is missing or misconfigured
**Journey:**
1. System runs `bd --version` rather than looking for it on PATH.
2. On failure, system reports what is wrong and what to run, and writes nothing.
3. On success, system checks the repo is initialized and that both export keys are set.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `refuses to install when bd is missing` | a stub `bd` that exits nonzero | exits nonzero, writes no files, and names the remediation | Nathan's own `bd` was on PATH but broken, so presence is not evidence |
| `reports a bd below the version floor` | a stub `bd` reporting 1.0.9 | reports the 1.1.0 floor rather than proceeding | |
| `reports export config that is off` | working bd, `export.auto` unset | reports both `export.auto` and `export.git-add` as needed | both default false and both are required for the backlink |
| `--skip-beads-check installs anyway` | broken bd, flag set | files are written and a warning is printed | |

**Done when:** the four tests above pass. All must be red when created.

**Beads:**

---

## CUJ-04: Skill author's edits survive a reinstall

**Actor:** skill author
**Trigger:** reruns `necklace init` after editing an installed skill
**Journey:**
1. System compares what it would write against what is on disk, before writing anything.
2. System reports the full set of files that differ and leaves them alone.
3. System writes everything else.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `reports every conflict, not just the first` | two installed skills both edited | both are named in the output | REPL: `errorOnExist` aborts on the first conflict, so the copy cannot produce this list |
| `leaves an edited file untouched` | one edited `SKILL.md` | its contents are unchanged after the run | REPL: `fs.cp` defaults overwrite it silently |
| `still installs the non-conflicting skills` | one edited skill, five untouched | the other five are updated | REPL: `force: false` copies the rest but reports nothing |
| `--force overwrites and says so` | one edited skill, flag set | the file is replaced and the output names it | |

**Done when:** the four tests above pass. All must be red when created.

**Beads:**

---

## CUJ-05: Reinstaller gets newer skills without losing local edits silently

**Actor:** reinstaller
**Trigger:** reruns `necklace init` from a newer version
**Journey:**
1. System writes the newer skills.
2. System reports which files it replaced and which it preserved.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `replaces an unmodified installed skill` | an installed skill matching the shipped copy, payload since changed | the file is updated with no prompt | an unedited file is not a conflict |
| `rerunning with no changes writes nothing` | payload identical to what is installed | the run reports no writes and no conflicts | idempotence is what makes this the update path |

**Done when:** both tests above pass. Both must be red when created.

**Depends on:** CUJ-04

**Beads:**

---

<!--
Checks before finishing:

  Every actor-outcome pair in spec.md has a CUJ here.   6 pairs, 5 CUJs: the two installer-visibility
                                                        pairs are one journey and merged into CUJ-02.
  Every CUJ has at least one test row.                  yes, 18 tests.
  Every "Done when" names tests and nothing else.       yes.
  Slices are vertical.                                  each is one actor observing one outcome.
  Dependencies are sparse.                              one edge.
-->
