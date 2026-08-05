# necklace, as a tool

How the method in `necklace-plan.md` gets distributed. The method is unchanged. This document only
covers packaging, installation, and the skills.

Decisions, reversals, rejected alternatives, and the record of what was verified live in
`necklace-ledger.md`. This document says what we are building.

## 1. What the tool is

An installer, not a runtime.

The method document says skill files and no binary, no runtime, no code, and that stands. The npm
package exists to solve one problem: a coworker runs one command and gets the skills in the right
directory for whichever agent they use. After `necklace init` returns, the package is inert. Nothing
in the workflow shells out to `necklace`. The agent reads markdown and runs `bd`.

This is the OpenSpec model, which §6 of the method already cites approvingly: the CLI scaffolds and
updates its own files, and validates nothing the user wrote.

The distinction matters for scope control. Every future feature request gets one question: does this
put logic in the binary that the agent could do by reading an instruction? If yes, it belongs in a
SKILL.md.

## 2. Package shape

```
necklace/
├── package.json
├── bin/
│   └── necklace.js           # entry, ~200 lines, no dependencies
├── src/
│   ├── targets.js            # registry: id, name, skillsDir, detectionPaths, setupNote
│   ├── adapters/             # one file per target, owns its command surface
│   └── install.js            # detect, prompt, copy, refuse to clobber
└── skills/                   # the payload. Directory names match the frontmatter `name`,
    ├── necklace/             # so installing is a straight copy with no renaming.
    │   └── SKILL.md          # the orchestrator. Sequences the three below.
    ├── necklace-spec/
    │   ├── SKILL.md
    │   └── spec.md
    ├── necklace-cuj/
    │   ├── SKILL.md
    │   └── cuj.md
    ├── necklace-beads/
    │   └── SKILL.md
    ├── necklace-tweak/
    │   └── SKILL.md          # post-implementation edits, backported to the documents
    └── necklace-lint/
        └── SKILL.md          # repo pollution check, see §8. Not a pipeline stage.
```

**Zero runtime dependencies.** The whole program copies markdown files and runs one subprocess.
Node has had `util.parseArgs` in stdlib since 18.3 and `fs.cp` since 16.7. Pulling in commander,
chalk, and ora to do that is the exact landing-page-driven packaging the method document is written
against. A dependency-free package also cannot break the way `@beads/bd` just broke, because there is
no postinstall step and no downloaded artifact.

**Node 18+ engines field, ESM.** No build step, no TypeScript compile, no bundler. The published
tarball is the source. Anyone can read what they installed.

**`files` in package.json is explicit.** `bin`, `src`, `skills`, `README.md`. Nothing else ships.

### Release channel

**`npx github:soniccyclone/necklace init`.** No npm publish, at least to start and possibly for good.

```
npx github:soniccyclone/necklace init          # latest on the default branch
npx github:soniccyclone/necklace#v0.2.0 init   # pinned to a tag
```

npm fetches and packs the repository, so there is nothing to publish and no release step to run. A
tag is a version. That removes deployment from the maintenance surface entirely, which is the point.

The package still needs `package.json` with a `bin` entry, and `files` must include `skills/`, since
a git install packs the repo the same way `npm pack` does. There is no build and no `prepare` step to
go wrong, because the package is plain JS with no dependencies.

**What this costs.** No `npm update` and no version metadata, so updating means rerunning the same
`npx` line. And npm caches git installs, so confirm during implementation that a rerun after a push
actually fetches the newer commit rather than serving a cached tarball. If it does not, the pinned-tag
form is the answer and the README says so.

Publishing to npm stays available later. It changes the install line and nothing else, because
nothing in the package depends on which of the two fetched it.

### The name

`necklace` is taken on npm, so the package is **`@soniccyclone/necklace`**. The binary is still
`necklace`, because `bin` names are independent of package names.

## 3. CLI surface

**One command.**

```
necklace init [--global] [--agent <name>]
```

It copies the skills to the selected targets and checks that `bd` works. That is the entire binary.

**It always overwrites, and reports every file it wrote.** No conflict detection, no `--force`, no
manifest.

The alternative needs a record of what necklace wrote last time, because "the file on disk differs
from the payload" is the same observation whether the user edited it or we shipped a new version.
Distinguishing them means a state file, and it buys protection for a case that should not happen:
the skills are necklace's payload, not user configuration. A locally edited skill means a coworker is
silently running a different workflow, which is the thing this tool exists to prevent.

Overwriting is safe because the skills are installed **into a git repo** by definition. An unwanted
overwrite is visible in `git diff` and recoverable, so the report plus version control does the job a
manifest would have done.

**Updating is the same command.** `npm update -g @soniccyclone/necklace` then `necklace init`, or
just `npx @soniccyclone/necklace init` which always fetches latest. Genuinely idempotent: running it
twice with an unchanged payload writes the same bytes.

Also not included: no `necklace spec`, no `necklace cuj`, no `necklace beads`. Those are skill
invocations inside the agent. A CLI command that prints "now ask your agent to run the spec skill" is
a worse README.

## 4. Install targets

**Every target is first class.** necklace installs per repo, so the installer knows which tool it is
writing for and writes that tool's native paths and command surface. No routing through another
vendor's compatibility path.

Installing is a directory copy plus the target's command files. Every target reads `SKILL.md` with
the same required frontmatter, `name` and `description`, in a directory whose name matches `name`, so
there is no format translation.

**Verify a platform's current file convention before designing around its absence.**

### The registry, copied from OpenSpec

OpenSpec's shape is the right one and it is worth copying closely rather than re-deriving.

A registry entry per tool: id, display name, skills directory, detection paths, and an optional setup
note for a tool that needs one more step. Then a per-tool adapter that owns that tool's command
surface, exposing `getFilePath(commandId)` and `formatFile(content)`. OpenSpec keeps one adapter file
per tool under `command-generation/adapters/`, which is why adding a tool there is a file rather than
a patch to a switch statement.

Three details in their implementation are worth taking as-is:

- **Detection ranks the menu, it does not gate it.** This is the part worth copying exactly.
  `getAvailableTools()` scans for each tool's config directory, but the prompt is a *searchable
  multi-select over every supported tool*, sorted configured first, then detected, then the rest.
  Detected tools are pre-selected on first-time setup. So the common case is one keypress and the
  out-of-order case, where someone installs necklace before the IDE, is a search away instead of
  being impossible. Gating the list on detection would have been the obvious implementation and it
  is the wrong one.
- **Detection paths are a list, not a directory.** Copilot is detected by any of
  `.github/copilot-instructions.md`, `.github/instructions`, `.github/prompts`, `.github/agents`,
  `.github/skills`, and more, because `.github/` alone means nothing.
- **Ids alias across rebrands.** OpenSpec maps `windsurf` to `devin` so scripted invocations survive
  the rename. Windsurf became Devin Desktop on 2026-06-02 and its directory moved from `.windsurf/`
  to `.devin/`.

### The four committed targets

Multi-select, searchable, pre-selected from detection. Every supported target stays reachable
whether or not its directory exists yet.

| Target | Skills | First-class surface to use |
| --- | --- | --- |
| Claude Code | `.claude/skills/necklace-*/SKILL.md` | Skill invocation tool, so the orchestrator in §6 can call and return natively. Subagent execution for `necklace-lint` only, per §6. |
| Cursor | `.cursor/skills/necklace-*/SKILL.md` | `.cursor/commands/necklace-*.md` for the slash catalog. `disable-model-invocation: true` on any skill that should be explicit-only. |
| Copilot | `.github/skills/necklace-*/SKILL.md` | `.github/agents/necklace-*.agent.md` for the Custom Agents picker, which is Copilot's own surface and invisible from a `.claude/` install. |
| opencode | `.opencode/skills/necklace-*/SKILL.md` | `.opencode/commands/` for slash commands. `metadata.opencode/autoinvoke` and `slash` to control routing per skill. |

Prefixing is universal practice among the prior art and confirms §6's choice: OpenSpec generates
`opsx-<id>`, Spec Kit generates `speckit-<name>`, and BMAD uses `bmad-`.

### Beyond the four

Stretch goals. A target is added when a person asks and its convention is verified against that
vendor's docs on a machine that runs it.

The prior art is worth reading rather than re-deriving, and all three publish a machine-readable
list. BMAD's `tools/installer/ide/platform-codes.yaml` is 45 platforms of declarative YAML and is
the easiest to lift wholesale. OpenSpec's `AI_TOOLS` in `src/core/config.ts` is 35 entries and has
the best detection logic. Spec Kit ships roughly 37 integration packages under
`src/specify_cli/integrations/`, one directory per tool, which is the heaviest per-tool structure of
the three.

All three target Kiro. OpenSpec has a `kiro` adapter writing `.kiro/prompts/`, Spec Kit has a
`kiro_cli` integration, and BMAD installs to `.kiro/skills`. That settles the question of whether it
is reachable, and leaves the §0 collision intact: Kiro generates its own `requirements.md`,
`design.md`, and `tasks.md`, and its model is the spec-as-source model §0 rejects. Reachable and
advisable are different questions.

## 5. Beads is a hard requirement

**necklace does not run without a working `bd`. There is no fallback and no degraded mode.**

The tool exists to put other people on Nathan's workflow, and his workflow has beads in it.

The requirement is stated in the package description, the README first paragraph, `necklace init`
output, and the first line of the beads skill.

### Where the requirement is enforced

Two places, because there are two moments a user can be missing beads.

**At install.** `necklace init` probes for a working `bd` before it copies anything. Missing or
broken means the command prints the remediation and exits nonzero, having written nothing. Installing
skills that cannot run is the silent-degradation failure the no-fallback rule exists to prevent.

`--skip-beads-check` exists for the person setting up a machine in an order we did not anticipate. It
is the only way past the gate, it prints a warning, and it is not in the README.

**At use.** The beads skill runs the same probe as its first instruction and stops there on failure.
It does not generate the JSONL first. A half-run that leaves an unimported artifact on disk is how
someone talks themselves into building an importer later.

### Detection

The check is `bd --version` with a zero exit status. Not `which bd`, not `command -v bd`.

This is not defensive programming, it is the observed state of this machine: `bd` resolves on PATH to
an npm shim whose postinstall never downloaded the binary, and every invocation exits nonzero with an
error on stderr. A PATH check passes on this box and the first real `bd` command then fails mid-run.
Since there is no fallback to catch that, the probe has to be the thing that actually establishes
`bd` works, not the thing that establishes a file exists.

The skill file carries the check as an instruction, not a config value. The agent runs `bd --version`
when it reaches step 3. No cached result anywhere, because a cached answer drifts the moment the user
installs, upgrades, or breaks beads and nothing invalidates it.

Separately from the binary, the repo needs an initialized beads database. That is a second probe with
a different remedy, and `necklace init` handles it at install time so the skill never has to.

### Installing and initializing beads for the user

A hard requirement makes setup `necklace init`'s job. It prompts, and acts on a yes.

**Missing binary.** Print the detected state and the command for the user's package manager, then
ask. On yes, run it in the foreground with output passed straight through, re-probe, and continue
only if the re-probe passes. On no, exit nonzero with the command still on screen.

The prompt is not ceremony. `@beads/bd`'s postinstall downloads a platform binary from the network
and we have direct evidence it can fail while still leaving `bd` on PATH. Running it under explicit
consent with visible output means that failure lands in front of the user instead of inside a
progress spinner, and the mandatory re-probe means we never report success over a broken shim.

**Uninitialized repo.** Same shape. Detect the absent beads database, explain that beads tracks the
graph in a directory it adds to the repo, ask, run `bd init` on yes. This is a change to someone's
repository and it gets a yes before it happens.

**Auto-export, which necklace depends on.** `bd init` asks `Enable auto-export? [y/N]` and the default
is no, so most repos will not have it. necklace needs it on, and needs `export.git-add` as well,
which is a separate key that also defaults false:

```
bd config set export.auto true
bd config set export.git-add true
```

That writes and stages `.beads/issues.jsonl`. Verified: `git-add` puts the file in the index without
touching anything else, including bd's own `config.yaml`.

Without it the graph lives only in the local Dolt database. A bead ID written into a CUJ document
then resolves to nothing for anyone who reads the repo without running `bd`, which includes anyone
looking at it on GitHub and anyone reviewing a pull request.

With it, the graph is a committed, diffable artifact. That is what makes the backlink work, and the
backlink runs both ways: every bead already carries a `cuj:CUJ-NN` label pointing at the document,
and the CUJ document names the bead IDs pointing back. Both directions resolve from a git checkout
alone.

**Auto-export is interval-gated, so the breakdown must force one.** Verified: the export fires on a
`bd` command and only when `export.interval` has elapsed since the last one, default 60 seconds. A
burst of `bd create` calls therefore leaves the committed file holding part of the graph. In the
trial run the file contained the epic alone while the database already had both children and the
dependency. It catches up on the next `bd` command after the interval, which is the wrong moment:
whoever ran the breakdown is committing now.

So `necklace-beads` ends with an explicit export and a stage:

```
bd export -o .beads/issues.jsonl
git add .beads/issues.jsonl
```

`bd export` with no `-o` writes to stdout, and `-o` writes the file but does not stage it, so both
lines are needed. Auto-export handles the steady state; this handles the moment the backlink is
created.

necklace keeps no copy of the graph. `.beads/issues.jsonl` is the record, maintained by the tool that
owns it.

Non-interactive invocation, meaning no TTY or a `--yes` flag, skips the prompts. `--yes` accepts,
no-TTY declines and exits nonzero, because a CI run that silently installs a global binary is worse
than one that fails with a clear message.

The lint skill reports:

| Probe | Method |
| --- | --- |
| beads installed | `bd --version` exits 0 |
| beads version | parsed from that output, compared against the 1.1.0 floor |
| repo initialized | beads database directory present |
| skills installed | the four SKILL.md files are where the target expects them |

Each failed probe prints the remediation command. `init` runs the first two itself, because it
refuses to install without a working `bd`. The rest is reading and reporting, which is why it lives
in a prompt.

### Hand off to beads, do not reimplement it

`bd init` installs a `beads` skill at `.agents/skills/beads/SKILL.md` and wires hooks that inject
`bd prime` on session start. Between them they own the execution loop and the creation vocabulary.
`necklace-beads` restates none of it and carries no copy of any beads format.

**Use the commands `bd prime` teaches.** `bd create` per bead, `--parent=<id>` for hierarchy,
`bd dep add` for edges. `bd import`, `bd create --graph`, and `bd create --file` all exist, and
`bd prime` mentions none of them, so an agent in a beads repo has already been told otherwise.
Fighting that to save a few calls trades a blessed path for a format we would have to track.

So `necklace-beads` carries three things and nothing else:

1. The probe from above, and the stop-on-failure rule.
2. The mapping from the CUJ document to beads: one bead per CUJ or an epic with children, a
   `cuj:CUJ-NN` label on every bead, every `Depends on` as a `bd dep add`, and the test names
   inherited from the CUJ. Children inherit parent labels, so labelling an epic covers its subtree.
3. The red gate from §4 of the method, the forced export above, then handoff to the beads skill for
   execution.

## 6. The skills

**Decided. These names are settled, not proposals.**

| Skill | Consumes | Produces |
| --- | --- | --- |
| `necklace` | a ticket | nothing of its own. Sequences the three below. |
| `necklace-spec` | a ticket | `spec.md`, and opens `ledger.md` |
| `necklace-cuj` | `spec.md` | `cuj.md`, with the mandatory test table |
| `necklace-beads` | `cuj.md` | JSONL, one `bd import`, then the red gate |
| `necklace-tweak` | running code, user feedback | code edits, plus `spec.md` and `ledger.md` brought in line |
| `necklace-lint` | a repo | pollution findings. Not a pipeline stage. |

Four of the five are named for the artifact they produce, and every name is drawn from §7 of the
method document rather than invented. That is deliberate: a skill name is the most likely place for a
new synonym to enter, which is what §7 of the method exists to prevent.

The `necklace-` prefix exists because skills share a flat namespace with everything else the user
installed, and `spec` is a name someone else will want. It is ugly. A Claude Code plugin would
namespace them as `necklace:spec` and the prefix would disappear, which is the one real argument for
the plugin channel still open in §9.

### The orchestrator

`necklace` is the primary entry point. A coworker runs one thing, not three, and treating the
pipeline as the advanced path rather than the default gets the method used wrong.

It **sequences without absorbing**. It invokes `necklace-spec`, waits for it to return, confirms
`spec.md` exists, tells the agent to run `necklace-cuj` next, and so on through the red gate. Each
stage stays independently invocable, which matters because redoing only the CUJ document is a normal
thing to want.

**How it sequences, given what the platforms actually support.** Claude Code has an explicit skill
invocation tool, so an orchestrator can call a sub-skill and get control back. Cursor, Copilot, and
opencode document neither a composition API nor its absence: their docs simply do not address
skill-to-skill invocation.

So do not depend on one. The orchestrator sequences **in prose**: its SKILL.md tells the agent which
skill to run, what artifact to check for before moving on, and what to do when the check fails. The
agent performs the invocation. This works identically on all four targets, needs no capability that
any vendor has promised, and is the same behavioral-instruction approach §5 of the method document
already uses for the REPL ladder. Where Claude Code's invocation tool is available the agent will use
it naturally, and nothing breaks where it is not.

The gate between stages is the artifact, not a return value. `necklace-cuj` does not start because
`necklace-spec` said it finished. It starts because `spec.md` is on disk. That is the same
enforce-by-location principle from §0, and it means a stage recovers from a lost session by looking
at the planning directory rather than by trusting a claim.

### Subagent execution: lint only, never the pipeline

**No pipeline stage forks.** A fork must both **return a receipt** rather than a report, and be
**startable cold**. Pipeline stages fail the second: `necklace-cuj` consumes `spec.md` plus the
accumulated understanding from writing it, which lives in the parent's conversation and which
`ledger.md` does not reconstruct.

`necklace-lint` passes both and should fork on Claude Code.

### What each pipeline skill adds

`necklace-spec` owns the planning directory from §8. It creates the run directory, opens `ledger.md`
before drafting anything, and invokes `necklace-lint` on the first run in a repo rather than carrying
the isolation logic itself.

`necklace-cuj` and `necklace-beads` are unchanged from the method document. All three append to the
log as they go.

`necklace-beads` is specified in §5. It hands off to the repo's `beads` skill for execution rather
than restating it.

`necklace-lint` is the only skill outside the pipeline. Its contract is in §8. The thing to preserve
when editing it is the detect-from-the-repo rule, because that single constraint is what separates a
check that improves with better models from one that invents config keys with more confidence every
year.

Every skill states which artifact it consumes and which it produces, so running them out of order
fails loudly instead of producing a CUJ document from no spec document.

### Descriptions are load-bearing

Every target routes on the `description` field. A `necklace-spec` described as "write a specification
document" will fire whenever anyone says the word spec, which trains people to disable it.

Each description names the method explicitly and states its input artifact, so the skill is only
selected inside a necklace run. `necklace-lint` and `necklace` are the two that may reasonably
trigger on their own.

## 7. Build order

1. Write the six SKILL.md files and two templates. This is the actual product. Nothing else in this
   document matters if these are weak.
2. Run the §9 trial run of the method document using those files, installed by hand with `cp`. No
   npm package, no CLI. If the trial run says the method needs changing, changing markdown is free
   and changing a published package is not.
3. Write `bin/necklace.js` with `init`, Claude Code target only.
4. Add the Cursor, Copilot, and opencode adapters.
5. Publish under the scoped name.

Steps 3 and 4 are perhaps an afternoon, because the program copies files. The cost is
entirely in steps 1 and 2. Ordering the trial run before the packaging is the point: it is the
cheapest place to find out the method needs revision, and §8 of the method document argues exactly
this about error detection generally.

## 8. The planning directory

One directory per workflow run, checked into the repo.

```
.necklace/
└── 2026-07-31-restore-from-snapshot/
    ├── spec.md                           # the §2 document
    ├── cuj.md                            # the §3 document
    ├── ledger.md                            # the ledger, see below
    └── repl/
        └── snapshot_ordering.py          # one file, deps inline, see below
```

Date prefix plus ticket slug on the run directory. Sortable, and it matches how someone looks one up
a year later.

No copy of the bead graph lives here. `.beads/issues.jsonl` is the record, and §5 requires
auto-export so it is committed. `cuj.md` names the bead IDs; the beads carry `cuj:CUJ-NN` labels back.

**`.necklace/`, hidden.** A visible top-level directory claims peer status with `src/`, and collides
with the module namespace in most ecosystems.

These are checked in on purpose. When someone asks why a decision was made, the spec doc is the
answer, and an answer that lives in a chat transcript is not an answer.

### The ledger

`ledger.md` is a **write-ahead record**, appended as decisions land, never composed at the end.

In: decisions and their reasons, rejected alternatives, judgment questions and the answers given,
REPL findings as they arrive. Out: a turn-by-turn transcript. There is no completeness requirement.

It absorbs the provenance job from both documents, which is what lets §2 of the method drop rejected
alternatives and answered judgment questions. The rule those share: **the document holds what is
still open, the log holds what is settled.** An unresolved judgment question stays in the spec doc,
because it is a blocking handoff to a human.

"Ledger" is the §7 term for it. Not ledger, not journal, not transcript.

### Do not emit files that other tools recognize

A repo is walked by more than its build: Dependabot and Renovate hunt manifests and lockfiles, SBOM
and license scanners read the same files, CodeQL analyzes what it finds, pre-commit lints every
staged file, linguist counts languages.

**Track 1, preferred where available.** A scratch script that declares its dependencies inside itself
gives a manifest scanner nothing to find, so there is no config to maintain and a scanner invented
next year also finds nothing.

| Ecosystem | Single-file mechanism | Status |
| --- | --- | --- |
| Python | PEP 723 `# /// script` header, run with `uv run` | accepted standard, verified |
| Java | JBang `//DEPS` comments | mature |
| .NET | file-based apps, `#:package`, `dotnet run file.cs` | .NET 10, recent |
| Rust | `cargo -Zscript` | nightly, assume unavailable |

To derive this for an unlisted language, search its ecosystem for "single-file script", "inline
dependencies", or "script metadata". Do not invent a convention and do not install a third-party
script runner to create one.

**Track 2, the realistic default.** Commit the manifest and mark the directory ignorable, per the
table below. `uv` is not universal and most ecosystems have no single-file format, so a plain venv
with a committed `requirements.txt` is expected.

### The markings

Track 2's checklist. `necklace init` writes these once, prompting first and reporting what it
changed, on the same rule as the beads setup in §5: it is a change to someone's repository
configuration and it gets a yes before it happens. The lint skill re-checks that they are still
present, since a config file gets rewritten by other people.

| Tool | Where | What |
| --- | --- | --- |
| git | `.gitignore` | `.necklace/**/.venv/`, `node_modules`, and the rest of the resolved-artifact list |
| Renovate | `renovate.json` `ignorePaths` | `.necklace/**`. Required, because Renovate auto-discovers manifests repo-wide by default. This is the one that actually bites. |
| Dependabot | `.github/dependabot.yml` | Nothing, normally. Dependabot is opt-in per directory, so an unlisted `.necklace/` is already invisible. Check for a `directories:` glob such as `**/*`, which re-includes it. |
| GitHub linguist | `.gitattributes` | `.necklace/** linguist-documentation=true`, so scratch code stops skewing the repo's language stats. Keeps diffs readable, unlike `linguist-generated`. |
| CodeQL | `.github/codeql/codeql-config.yml` `paths-ignore` | `.necklace` |
| pre-commit | `.pre-commit-config.yaml` top-level `exclude` | `^\.necklace/`, so hooks stop failing on scratch code that was never meant to lint |
| Coverage | tool config `omit` or equivalent | `.necklace/*`, so scratch files do not move the number |
| Test discovery | per ecosystem | See the next subsection. Different problem, same directory. |

Only add a marking for a tool the repo actually uses. Writing a `renovate.json` into a repo that has
never heard of Renovate is its own kind of pollution.

**Reasoned, not verified.** None of these scanners are installed here. The syntax above comes from
what each project documents, and each is worth confirming the first time it is used for real.

### The lint skill

The markings table expires: a scanner ships, nobody updates the table, the planning directory rejoins
the surface area. The skill carries the problem instead of the list, so a newer model covers scanners
this document never heard of.

```
skills/lint/SKILL.md
```

**What it does.** Walk the repo for evidence of tools that read committed files, determine whether
any would act on `.necklace/`, report, propose the fix, change nothing without a yes.

**Detect from the repo, never from memory.** Agent knowledge interprets what is present; it does not
enumerate what might exist. A config file absent from the repo generates no finding. This is what
keeps the skill improving with better models rather than inventing config keys with more confidence.

**Demonstrate, do not assert.** Where the tool is installed, run it and show it picking up the
planning directory. `pytest --collect-only` listing a scratch test is a finding; "Renovate may scan
this" is not.

**Bounded.** It checks whether necklace's own artifacts pollute the repo, and nothing else.

**When it runs.** `necklace init` invokes it once. `necklace-spec` invokes it on the first run in a
repo. On demand after that, and never on every workflow invocation.

It also owns the environment probes in §5. `init` still checks `bd` itself, since it refuses to
install without one.

### Keeping the planning directory out of the build

Test discovery is a separate problem, because scratch tests are recognized by filename rather than by
a manifest. Getting it wrong means the suite silently adopts a scratch test.

The axis: does the build tool **discover** directories or is it **told** about them? Discovery-based
tools need an exclusion. Manifest-based tools already ignore an undeclared directory.

| Ecosystem | Risk | Move |
| --- | --- | --- |
| Python | `pytest` collects `test_*.py` repo-wide | `norecursedirs = .necklace`. Verified: excludes from the suite, still runnable by path. |
| Go | a root `go.mod` makes every subdirectory part of the module | a nested `go.mod`, a `testdata/` directory, or a leading `_` or `.` in the name |
| .NET | SDK projects glob `**/*.cs`; a nested `.csproj` duplicates rather than isolates | keep `.necklace/` at repo root outside any project directory; watch a root `Directory.Build.props` |
| Rust | a nested crate in a workspace directory errors | `exclude = [".necklace"]` in the root `[workspace]`, or an empty `[workspace]` in the scratch crate |
| JVM | already invisible; the friction is running the scratch code at all | JBang, or a standalone build file depending on the built artifact |
| Node and TypeScript | root `tsconfig.json` `include`, workspace globs | add to `exclude`, keep workspace globs specific |

Then verify: run the project's full test command and confirm the scratch test does not appear.

### On disk versus committed

**On disk is free.** A gitignored `.venv` inside the planning directory is fine and often better, since
re-resolving on every run is slow and fails outright in a network-restricted environment. Nothing
that walks a repo reads gitignored files.

For `uv` users there is nothing to ignore: `uv sync --script` builds a persistent environment outside
the repo and `uv run --offline` then works.

**Never committed:** resolved artifact directories (`.venv`, `node_modules`, `target/`, `bin/`,
`obj/`), and lockfiles. A lockfile is an active input to Dependabot and Renovate, and the planning
directory has no release and no security surface, so every alert it raises is false.

The rule the skill carries: **a committed planning directory may contain source and prose, and
nothing another machine is configured to act on. What it holds on disk and ignores is its own
business.**

### Skills, not a plugin

Three ways the prior art ships this, and we take OpenSpec's.

| Project | Channel |
| --- | --- |
| OpenSpec | No plugin anywhere in the repo. Per-tool adapters write native files. Namespaced by subdirectory where the tool allows it, `.claude/commands/opsx/<id>.md`, and by an `opsx-` prefix where it does not. |
| beads | Both. `bd init` copies skills to `.agents/skills/`, and it also ships a plugin under `plugins/beads/` carrying `.claude-plugin/`, `.codex-plugin/`, and `.copilot-plugin/` manifests in one directory, bundling skills, an agent, and hooks, distributed through a marketplace. |
| rtk | Neither, and it is a different category. It writes `RTK.md`, an `@RTK.md` reference into `CLAUDE.md`, and a hook into `settings.json`, because its job is always-on output filtering rather than an invocable workflow. |

A plugin buys three things: namespacing, bundled hooks, and a one-command install from a marketplace.
We need none of them yet. The skills are user-invoked so there is nothing to hook, namespacing is
solvable without one, and a marketplace is a second distribution channel to maintain beside npm.

beads is the useful counterexample rather than a contradiction: its plugin exists mainly to deliver
hooks, which is how `bd prime` reaches the agent automatically. If necklace ever wants a session-start
hook, that is when a plugin earns its place.

**Namespacing follows OpenSpec.** Prefer a subdirectory where the target walks its skills root
recursively, which Cursor documents. Fall back to the `necklace-` prefix where it does not. Confirm
per target when writing its adapter.

**One pattern worth stealing from beads regardless.** Its plugin keeps `SKILL.md` short and links out
to `resources/*.md` for the long material. Cursor's docs recommend the same, under roughly 500 lines.
`necklace-spec` carries §2, the self-answer loop, and the §5 ladder, so it is the one that will need
this.

## 9. Open

Nothing.

The plugin channel is closed. It would have bought namespacing, bundled hooks, and marketplace
install: the prefix covers the first, npm the third, and necklace has no use for the second. Hooks
serve ambient behaviour, which is why beads needs one to stop agents reaching for a todo tool.
necklace is invoked explicitly, so before invocation there is nothing it needs an agent to know, and
after invocation the skill is loaded and carries everything.
