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

**Beads:** `necklace-c1a`

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

**Beads:** `necklace-2zo`

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

**Beads:** `necklace-zzt`

---

## CUJ-04: Reinstaller updates by running the same command

**Actor:** reinstaller
**Trigger:** reruns `necklace init` after upgrading the package
**Journey:**
1. Reinstaller runs the same command they ran the first time.
2. System writes the current payload over whatever is there.
3. System names every path it wrote.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `overwrites an existing installed skill` | a skill on disk differing from the payload | the file matches the payload afterward | REPL: `fs.cp` defaults overwrite, and this is the behaviour we want rather than one to guard against |
| `reports every path it wrote` | six skills, one target | all six appear in the output | `fs.cp` reports nothing, so the report is built before the copy |
| `running twice is identical` | run, then run again unchanged | the second run writes the same bytes and reports the same paths | this is what makes rerunning the update path |
| `does not remove files it did not write` | an unrelated skill from another tool in the same directory | it is still there afterward | overwriting our payload must not mean owning the directory |

**Done when:** the four tests above pass. All must be red when created.

**Beads:** `necklace-556`

---

## CUJ-05: Installer on Windows gets the same result as anywhere else

**Actor:** installer on Windows
**Trigger:** runs `necklace init` in a repo, having installed beads from npm
**Journey:**
1. Installer runs the command.
2. System probes `bd`, which on Windows from npm is `bd.cmd`.
3. System writes the skills and reports, identically to Linux and macOS.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| the whole suite, on windows-latest | CI matrix, Node 22 and 24 | every test passes on Windows as on Linux | CI: `bd.cmd` cannot be spawned without a shell since Node 18.20 |
| the pty suite, on windows-latest | CI matrix | the prompt works over ConPTY | CI: a live ConPTY handle held the event loop open and the job hung rather than failing |
| `fakeBd` provides a `bd.cmd` launcher | Windows | the probe resolves the fake the way it would resolve a real npm install | |

**Done when:** the CI matrix is green on windows-latest. It was red when this was written.

**Beads:** none - done directly in 5e2ab76, 2d8bc50, d36bd51

---

<!--
Checks before finishing:

  Every actor-outcome pair in spec.md has a CUJ here.   6 pairs, 5 CUJs: the two installer-visibility
                                                        pairs are one journey and merged into CUJ-02.
  Every CUJ has at least one test row.                  yes, 19 tests.
  Every CUJ's Beads line is IDs, done-directly, or       yes. An empty one means work is waiting.
    deliberately empty.
  Every "Done when" names tests and nothing else.       yes.
  Slices are vertical.                                  each is one actor observing one outcome.
  Dependencies are sparse.                              none.
-->
