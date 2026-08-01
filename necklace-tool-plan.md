# necklace, as a tool

How the method in `necklace-plan.md` gets distributed. The method is unchanged. This document only
covers packaging, installation, and the one real design decision: what happens when `bd` is absent.

## 0. Provenance

Same discipline as the method document. Validated facts are separated from proposals.

**Verified in this environment on 2026-07-30.**

- `rtk init` takes `--global`, `--agent <claude|cursor|windsurf|cline|kilocode|antigravity|kimi|pi|hermes|droid>`,
  `--show`, `--hook-only`. That is the CLI shape being copied.
- Claude Code reads skills from `~/.claude/skills/<name>/SKILL.md` and the project-local
  `.claude/skills/<name>/SKILL.md`. Confirmed against a skill installed on this machine.
- `@beads/bd` on npm is version 1.1.2. It is a JS bin shim plus a `postinstall` that downloads a
  platform binary. Repo is `gastownhall/beads`, subdirectory `npm-package`.
- **That postinstall can fail and leave `bd` on PATH but non-functional.** It has failed on this
  machine. `bd --version` exits nonzero with "binary not found ... postinstall script failed to
  download". This is not hypothetical, it is the current state of Nathan's box.
- `necklace` is already published on npm as v1.0.0 with an empty description. The bare name is
  unavailable.

**Verified from vendor documentation on 2026-08-01.** All four committed targets read `SKILL.md`
with the same required frontmatter, `name` and `description`.

- Cursor reads `.cursor/skills/` and `.agents/skills/`.
- Copilot reads `.github/skills/`, `.claude/skills/`, and `.agents/skills/`. `SKILL.md` support
  landed April 2026.
- opencode reads `.opencode/skills/`, `.claude/skills/`, and `.agents/skills/`.
- No vendor documents skill-to-skill invocation either way, except Claude Code, which has an
  explicit invocation tool. §6 designs around the absence rather than depending on it.

**Read from source on 2026-08-01**, in `Fission-AI/OpenSpec`, `github/spec-kit`, and
`bmad-code-org/BMAD-METHOD`.

- BMAD publishes `tools/installer/ide/platform-codes.yaml`, 45 platforms, declarative. An earlier
  draft of this document said BMAD published no comparable list. That came from a search summary
  rather than the repository and was wrong.
- OpenSpec's `AI_TOOLS` registry in `src/core/config.ts` is 35 entries, plus one adapter file per
  tool under `src/core/command-generation/adapters/`.
- Spec Kit ships roughly 37 integration packages under `src/specify_cli/integrations/`.
- All three target Kiro.
- Windsurf was rebranded to Devin Desktop on 2026-06-02 and its config directory moved from
  `.windsurf/` to `.devin/`. OpenSpec keeps `windsurf` as an alias.

**Proposals in this document. Cut freely.**

- The `--skip-beads-check` escape hatch in §5.
- Prose sequencing in the orchestrator rather than a vendor composition API. Forced by three of four
  vendors documenting nothing either way, so it is the portable choice rather than the proven one.
- The working log in §9, and its framing as a write-ahead record rather than a summary. The need is
  Nathan's, from losing session state that had not reached the documents yet. The shape is mine.
- Moving rejected alternatives and answered judgment questions out of the spec doc and into the log,
  and the resulting edit to §2 of the method document. Nathan's call. The "open stays, settled moves"
  rule is mine.
- The single-file-script rule and the four-ecosystem table in §8. Python is verified on this machine
  with `uv run`. JBang, .NET file-based apps, and `cargo -Zscript` are reasoned from what those
  projects document and are not verified.
- The per-ecosystem build-isolation table in §8. Python is verified. Go, .NET, Rust, JVM, and Node
  are reasoned from how their build tools scope a directory and are not verified.
- The two-track approach to scanner pollution in §8, and the markings table. Reasoned from what each
  scanner documents; none are installed here.
- The §0 first-principles section in the method document, and deriving the language guidance from it.
- The lint skill in §8. Nathan's proposal, including the reasoning that newer agents know newer
  scanners so the capability grows on its own. The detect-from-the-repo constraint and the
  demonstrate-do-not-assert rule are mine, and they are what stop it hallucinating config.

**Decided. Not open for re-litigation.**

- **Every target is first class.** necklace installs per repo, so the installer knows which tool it
  is writing for and uses that tool's native paths and command surface. No consolidating through
  compatibility paths. Drift is not an argument against per-tool files here, because the files are
  generated from one source by a program. See §4.

- The five skill names in §6.
- The four install targets in §4: Claude Code, Copilot, opencode, Cursor. Nathan uses them and his
  coworkers are heavy Cursor users. Everything else waits for a request.
- The orchestrator returning control between stages rather than absorbing the pipeline.

**From Nathan's working practice.**

- One checked-in planning directory per workflow run, holding both documents. Including the reason:
  the documents answer "why was this decided" long after the conversation is gone.
- Retaining REPL work in that directory rather than deleting it. He currently builds a venv per
  planning directory.

**Already cut. Do not re-propose.**

- **The stub generator**, which inlined each SKILL.md into `.cursor/commands/` and
  `.github/prompts/`. Every target now reads SKILL.md directly, so installing is a directory copy.
  See §4.
- **Every CLI command except `init`.** `doctor`, `update`, `init --show`, and the content-hashed
  manifest that supported them were invented in this document, not asked for, and cut in §3. The
  checks `doctor` would have run belong to the lint skill. Adding a command to this tool now requires
  showing that an agent reading a SKILL.md cannot do the job.

- **Any fallback for a missing `bd`.** Beads is a hard requirement. See §5. No degraded mode, no
  file-mode output, no `.necklace/beads.jsonl` written for later import, no mirroring into a session
  todo tool. A tool that half-works teaches a workflow that is half Nathan's, which defeats the
  purpose of shipping it.
- A binary that validates artifacts. §6 of the method killed `necklace verify` and nothing here
  revives it. The npm package scaffolds files and exits. It never reads a spec doc, a CUJ doc, or a
  test result.
- Rewriting any part of beads, including rendering its graph to markdown.
- Vendoring the `bd` binary inside the necklace package.

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
└── skills/                   # the payload, verbatim from the method doc §6
    ├── necklace/
    │   └── SKILL.md          # the orchestrator. Sequences the three below.
    ├── spec/
    │   ├── SKILL.md
    │   └── spec.md
    ├── cuj/
    │   ├── SKILL.md
    │   └── cuj.md
    ├── beads/
    │   ├── SKILL.md
    │   └── beads.schema.md   # the bd JSONL contract, see §5
    └── lint/
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

### The name

`necklace` is taken. Options, in the order I would try them:

1. `@<npm-handle>/necklace`, scoped. Costs nothing, reads fine in install instructions, and the
   binary is still `necklace` because `bin` names are independent of package names.
2. Ask the squatter. v1.0.0 with an empty description and no README is usually abandoned, and npm has
   a dispute process for unused names. Slow, uncertain, not worth blocking on.

Recommendation is the scoped name. This decision is Nathan's because it depends on which npm handle
or org he wants to publish under, and it blocks nothing else in this plan.

## 3. CLI surface

**One command.**

```
necklace init [--global] [--agent <name>] [--force]
```

It copies the skills to the target directory and checks that `bd` works. That is the entire binary.

`--force` overwrites an existing file instead of skipping it. Without it, init refuses to clobber and
says which file it left alone.

An earlier draft of this document had four commands: `init`, `init --show`, `doctor`, and `update`,
plus a content-hashed manifest to support them. All of it was invented here. None of it was asked
for, and the sentence introducing it read "four commands, anything beyond this is scope creep," which
is the tell.

`init/doctor/update` is the shape every devtool CLI has, which is why I reached for it, which is
exactly the cargo-culted-best-practices reflex §0 of the method document is written against. `rtk`
was cited as the model and `rtk` has `init`. It does not have the other two.

What replaces them:

- **`doctor`** is the lint skill. Checking whether `bd` runs, whether the skills are installed, and
  whether the pollution markings are present is reading and reporting, which is what a prompt is for.
  A second binary command that duplicates it existed only because I invented it before the skill.
- **`update`** is `npm update -g` followed by `necklace init`. Init is idempotent, so there is
  nothing to add.
- **`init --show`** is `ls`.
- **The manifest** existed to let `update` tell a user edit from a new release. With no `update`
  there is nothing to tell apart, so it goes too, and with it the hashing.

Still explicitly not included: no `necklace spec`, no `necklace cuj`, no `necklace beads`. Those are
skill invocations inside the agent. A CLI command that prints "now ask your agent to run the spec
skill" is a worse README.

## 4. Install targets

**The rule for this project: every target is first class.**

necklace installs per repo, through `necklace init`, the same as OpenSpec, Spec Kit, and BMAD. That
single fact licenses everything below. A per-repo installer knows exactly which tool it is writing
for, so it can write that tool's native format and use that tool's first-class features. There is no
reason to reduce four tools to a lowest common denominator when the installer is standing right there
with the answer.

An earlier draft consolidated to two directories by routing Copilot and opencode through their
`.claude/skills/` compatibility paths. That is wrong on the merits. A compatibility path is a
fallback the vendor maintains for other people's files, and taking it means never touching the
command surface, the slash catalog, or anything else that tool ships. Consolidation also buys
nothing here: drift across per-tool files is the usual argument for it, and the files are generated
from one source by a program, so there is no drift to prevent.

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

That is a product decision, not a technical one. The tool exists to put other people on Nathan's
workflow. His workflow has beads in it. A necklace that produces two documents and then something
beads-shaped teaches a different method to whoever installs it, and the difference is invisible to
them because they have never seen the real one. Shipping a fallback would mean the most common
first-run experience is the wrong workflow.

The requirement is stated in the package description, the README first paragraph, `necklace init`
output, and the first line of the beads skill.

### Why not TodoWrite specifically

Worth recording, because it will get proposed again by someone who has not read §4 of the method.

Step 3 of the method is "task-breakdown the CUJ document into beads". §4 then requires the result to
be a DAG, to carry a `cuj:CUJ-NN` label on every bead, to encode every `Depends on` as an edge, to
support hierarchical IDs for epic-shaped CUJs, and to be queryable afterward with `bd list --json` so
§8's wide-versus-deep measurement is possible.

TodoWrite has none of those. No edges, no labels, no hierarchy, no persistence past the session, no
query. Falling back to it does not degrade step 3, it deletes it. A run that produced a spec doc, a
CUJ doc, and a flat ephemeral checklist has not followed the method, by the method's own definition
in §1.

The portability argument does not survive contact either. TodoWrite is a Claude Code tool. Cursor's
todo mechanism is different, Copilot's is different again, and a markdown skill file cannot call any
of them by name across all three. "All the major IDEs have something like it" is true and useless,
because there is no common interface to target.

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

### The import contract

Settled. Read from `gastownhall/beads` at `9fddc56`, against released 1.1.2, and written up in
[`skills/beads/beads.schema.md`](skills/beads/beads.schema.md). The beads skill references that file
rather than restating it.

Four findings change what the skill has to say.

**The `updated_at` guard.** A row only overwrites an existing bead when its `updated_at` is strictly
newer. Equal timestamps keep local state, and `updated_at` has second granularity. Regenerating the
JSONL after a CUJ document revision and re-importing is therefore a silent no-op for every bead whose
timestamp did not advance. The skill stamps a fresh `updated_at` on regeneration and reads the import
output instead of assuming it applied. This behavior landed in 1.0.5, so it is live in every version
anyone will install.

**`priority` has no import default.** An omitted priority reads as 0, which is P0. The generator
always writes it.

**File order is free.** The importer topologically sorts rows itself and commits each bead with its
blocking edges in one transaction, so the skill does not have to emit in dependency order. Removes a
constraint an earlier draft assumed.

**`--dry-run` exists.** The §4 graph validation gets a real pre-flight, and since one malformed record
aborts the entire import, running it first is free insurance rather than ceremony.

**Version floor: 1.1.0.** First stable of the current line, npm and Homebrew both serve 1.1.2, and
everything the method uses is present. Hierarchical IDs and labels are old and set no floor of their
own. This is the lint skill's version check, and it is a real number rather than a placeholder.

## 6. The skills

**Decided. These names are settled, not proposals.**

| Skill | Consumes | Produces |
| --- | --- | --- |
| `necklace` | a ticket | nothing of its own. Sequences the three below. |
| `necklace-spec` | a ticket | `spec.md`, and opens `log.md` |
| `necklace-cuj` | `spec.md` | `cuj.md`, with the mandatory test table |
| `necklace-beads` | `cuj.md` | JSONL, one `bd import`, then the red gate |
| `necklace-lint` | a repo | pollution findings. Not a pipeline stage. |

Four of the five are named for the artifact they produce, and every name is drawn from §7 of the
method document rather than invented. That is deliberate. §7 exists because the word "probe" was an
invented synonym that displaced "REPL" across forty-one occurrences of an earlier draft, and a skill
name is the most likely place for the next one to enter.

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

**No pipeline stage forks.** This is settled by argument, not by measurement.

Two turns of this document got it wrong in two different ways, so both are recorded.

**The output argument, from Spec Kit.** They forked `/speckit-analyze` on the theory that its heavy
reads collapse to a short summary. In practice it returned a 300-500 line report that was injected
back into the parent conversation, and in long sessions each later fork inherited that accumulated
context until the chat froze. Their `FORK_CONTEXT_COMMANDS` map is now deliberately empty. So a fork
must return a receipt, never a report.

This document then argued necklace satisfies that, because every stage writes its artifact to disk
and the next stage gates on the file, so a forked `necklace-cuj` could return one line. The
reasoning is correct and it is beside the point.

**The input argument, which decides it.** A subagent starts cold. `necklace-cuj` does not consume
`spec.md`, it consumes `spec.md` *plus everything that happened while `spec.md` was being written*:
the self-answer loop from §5, the judgment calls the user made and why, the REPL findings that
informed a claim without earning a row in a table. That accumulated understanding is the thing the
method exists to build, and it lives in the main agent's conversation.

Forking throws it away and hands the replacement agent a two-page document. The stage would then
re-derive from disk what the parent already knew, which is both more expensive and worse. Spawning a
subagent to write one file, when the file's whole quality depends on context the parent is already
holding, is a loss on both sides of the ledger.

`log.md` does not rescue this. It is a write-ahead record of decisions, not a transcript, and §8 is
explicit that it has no completeness requirement. If a summary were sufficient to reconstruct the
context, the parent would not need the context either.

**The two-sided test for any future fork:** the task must return a receipt *and* be startable cold.
Pipeline stages pass the first and fail the second, structurally and by design, so no measurement
will change the answer.

`necklace-lint` passes both. It walks the repo for scanner configuration and needs nothing from the
conversation, and it returns a short findings list. It is the only skill here that should ever fork,
and on Claude Code it should.

### What each pipeline skill adds

`necklace-spec` owns the planning directory from §8. It creates the run directory, opens `log.md`
before drafting anything, and invokes `necklace-lint` on the first run in a repo rather than carrying
the isolation logic itself.

`necklace-cuj` and `necklace-beads` are unchanged from the method document. All three append to the
log as they go.

`necklace-beads` gets three additions: the requirement statement on its first line, the probe from §5
with the run-it-do-not-look-for-it rule, and a pointer to `beads.schema.md`.

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

1. ~~Establish the beads JSONL schema from source.~~ Done. `skills/beads/beads.schema.md`.
2. Write the three SKILL.md files and two templates. This is the actual product. Nothing else in this
   document matters if these are weak.
3. Run the §9 trial run of the method document using those files, installed by hand with `cp`. No
   npm package, no CLI. If the trial run says the method needs changing, changing markdown is free
   and changing a published package is not.
4. Write `bin/necklace.js` with `init`, claude target only.
5. Add cursor and copilot stub generation.
6. Publish under the scoped name.

Steps 4 and 5 are perhaps an afternoon, because the program copies files. The cost is
entirely in steps 1 through 3. Ordering the trial run before the packaging is the point: it is the
cheapest place to find out the method needs revision, and §8 of the method document argues exactly
this about error detection generally.

## 8. The planning directory

One directory per workflow run, checked into the repo.

```
.necklace/
└── 2026-07-31-restore-from-snapshot/
    ├── spec.md                           # the §2 document
    ├── cuj.md                            # the §3 document
    ├── log.md                            # the working log, see below
    ├── beads.jsonl                       # what was imported, kept as the record of the graph
    └── repl/
        └── snapshot_ordering.py          # one file, deps inline, see below
```

Date prefix plus ticket slug on the run directory. Sortable, and it matches how someone looks one up
a year later.

**`.necklace/`, hidden.** An earlier draft argued for a visible `necklace/` on the grounds that these
documents are meant to be found. That was wrong, for two reasons.

The first is §0. A visible top-level directory claims peer status with `src/`, and that is precisely
the claim the other frameworks make and this one rejects. The spec is provenance about the codebase,
not a definition it answers to, so it goes where provenance goes. The dot says "tool directory" and
that is exactly what it is.

The second is mundane and would have bitten someone. A visible top-level `necklace/` collides with
the module namespace in most ecosystems. In a Python repo it reads as an importable package, and Go,
Node, and the JVM build tools all treat top-level directories as meaningful. Injecting a plausible
looking source directory into someone's repo is the same pollution this section is otherwise about.

Findability survives the dot. `.github/` is a hidden directory full of things humans read, and nobody
browses a repo to find a decision record anyway. They get sent a link.

These are checked in on purpose. When someone asks why a decision was made, the spec doc is the
answer, and an answer that lives in a chat transcript is not an answer.

### The working log

BMAD keeps a full transcript of its workflow conversation. Worth copying, with one change to what it
is for.

The log is a **write-ahead record, not a summary.** It is appended to as decisions land, during the
work, not composed at the end. That distinction is the whole feature. A log written at the end of the
workflow is worthless against the failure it exists to prevent, which is losing session state that
had not yet reached spec.md or cuj.md. Reasoning that only exists in the context window is one
compaction away from gone.

What goes in: decisions and their reasons, rejected alternatives, judgment questions and the answers
given, REPL findings as they arrive. What does not: a turn-by-turn transcript. There is no rule
forcing it to record everything asked, because a log that must be complete becomes a log nobody
writes.

It is not a ledger in the accounting sense and §7 of the method document should get a term for it
rather than letting "ledger" drift in, since that section exists precisely to catch this.

### The log makes both documents lighter

This is the log's second effect and it is worth more than the first.

Design docs balloon because they are asked to hold two different things: what we are going to do, and
the record of how we got there. The second is what grows without bound. Rejected alternatives,
judgment calls and who made them, the reasoning behind a constraint, the question someone asked in
week one that turned out to matter. All of it is worth keeping and none of it helps a reader who
opened the document to find out what is being built.

The log absorbs the second job, so the documents can be cut back to the first.

**Moves to the log.** Rejected alternatives and why. Judgment questions that have been answered,
with the answer and who gave it. REPL findings, except where one informs a specific test and earns
its `Informed by` cell. The reasoning behind a constraint, as opposed to the constraint.

**Stays in the spec doc.** The problem and its evidence, the actors, the actor-outcome pairs, the
constraints themselves, the chosen approach named at strategy level, and any judgment question still
open. The last one is the exception that matters: an unresolved judgment question is a blocking
handoff to a human, so it stays where the human is looking. Once answered it moves to the log with
its answer. The rule is clean, and it is that the document carries what is still open while the log
carries what is settled.

Naming the alternatives you rejected still happens. It happens in the log. The requirement that the
work was done survives the requirement that it appear in the deliverable, and §2 of the method
document is edited accordingly.

That should also pull the spec doc back toward its two-page guide without anyone having to trim
prose, because the sections that were making it long are the ones that left.

### Do not emit files that other tools recognize

This is the real engineering problem in the structure, and the test suite is only the first tool that
gets confused.

A repo is walked by more than its build. Dependabot and Renovate hunt manifests and lockfiles.
Renovate auto-discovers by default, so a `requirements.txt` in a planning directory becomes a pull
request against a dependency nobody ships. SBOM and license scanners read the same files. CodeQL
analyzes what it finds. Pre-commit hooks lint every staged file. Coverage tools count what they
import. GitHub's linguist will happily decide the repo is 40% Python because of a scratch directory.

There are two ways out and both are legitimate. Prefer the first where the ecosystem and the user's
toolchain both support it. Expect to need the second.

**Track 1, emit nothing they look for.** A scratch script that declares its dependencies inside
itself gives a manifest scanner nothing to find. No `requirements.txt`, no `package.json`, no
lockfile, so there is no config to maintain and a scanner invented next year also finds nothing.
This is the better outcome when it is available.

It is not always available. `uv` is not universal, most ecosystems have no single-file format at all,
and a person running plain `python -m venv` and `pip install -r requirements.txt` is doing something
completely reasonable. Track 1 is a preference, not a prerequisite.

**Track 2, commit the manifest and mark the directory ignorable.** This is the realistic default. It
means writing `.necklace/` into the exclusion config of each tool that would otherwise act on it,
which is enumerate-the-bad and does carry the maintenance cost that implies. The mitigation is that
the list is short, stable, and written once by `necklace init` rather than rediscovered per run.

**Deriving this for a language not listed below.** Search the ecosystem for how it runs a single
script with dependencies and no project. The terms that find it are "single-file script",
"inline dependencies", or "script metadata". If one exists it is the answer, because §0 says prefer
what the toolchain blesses. If none exists, you are in the manifest-plus-exclusions fallback, and the
question becomes the one in the next subsection. Do not invent a convention, and do not install a
third-party script runner to create one.

Every ecosystem is growing this, because a throwaway script that needs a dependency is a universal
problem:

| Ecosystem | Single-file mechanism | Status |
| --- | --- | --- |
| Python | PEP 723 `# /// script` header, run with `uv run` | Accepted standard, verified below |
| Java | JBang `//DEPS` comments | Mature, the reason JBang exists |
| .NET | File-based apps, `#:package` directives, `dotnet run file.cs` | .NET 10, recent |
| Rust | `cargo -Zscript` single-file packages | Nightly, not stable, assume unavailable |

**Verified here.** A `.py` file carrying a PEP 723 header with a real dependency, run through
`uv run`, resolved and executed and left nothing behind but the script. One file in the planning
directory, zero manifests, nothing for Dependabot to find.

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

The table above has an expiry date. That is the objection to any enumerate-the-bad list: a scanner
ships in eighteen months, nobody updates the table, and the planning directory quietly rejoins the
surface area.

A fourth skill fixes it, and it fixes it in the direction the rest of this design already runs. Hand
the agent the *problem*, not the list. A model whose training data postdates this document knows
about scanners this document has never heard of, so the capability grows without anyone maintaining
anything. That is the same argument as §0's "get the axis right and the language answers itself,"
applied to tooling instead of languages.

```
skills/lint/SKILL.md
```

**What it does.** Walk the repo for evidence of tools that read committed files. Determine whether
any of them would act on `.necklace/`. Report what it finds, propose the fix, and change nothing
without a yes.

**The rule that keeps it honest: detect from the repo, never from memory.** The agent's knowledge is
for *interpreting* what it finds, not for *enumerating* what might exist. Seeing
`.github/workflows/codeql.yml` and recognizing that CodeQL will scan the planning directory is the
job. Proposing CodeQL markings for a repo with no CodeQL is not, and neither is inventing a config
key that sounds plausible. A config file that is not in the repo generates no finding.

That inversion is what makes the growth safe. Newer agents recognize newer tools *that are actually
present*, which is the capability Nathan is after, without the hallucinated-config failure that a
"list every scanner you know" prompt would produce.

**Demonstrate, do not assert.** Where the tool is installed, run it and show it picking up the
planning directory. `pytest --collect-only` listing a scratch test is a finding. "Renovate may scan
this" is not. This is §4's red gate discipline pointed at a different problem: the output is the
evidence, and an agent that asserts instead of running is the failure mode both places.

Warning fatigue is the thing that kills a linter. Reporting three real findings with output attached
gets fixed. Reporting twelve theoretical ones gets the skill uninstalled.

**Bounded on purpose.** It checks whether necklace's own artifacts are polluting the repo. It is not
a general-purpose repo linter, and growing it into one would be building a worse competitor to tools
that already exist.

**When it runs.** `necklace init` invokes it once, since that is when markings get written anyway.
The spec skill invokes it on the first run in a repo, absorbing the build-isolation step §7 assigns
there rather than duplicating it. It is available on demand after that. It does not run on every
workflow invocation, because a check that fires constantly is a check nobody reads.

**It absorbs what `doctor` would have been.** §3 cut that command. Everything it was going to probe,
listed in §5, is reading and reporting, so it belongs here. `init` still checks `bd` itself, because
it refuses to install without one.

### Keeping the planning directory out of the build

Test discovery is still its own problem, since scratch tests are recognized by their filename and not
by a manifest. Getting this wrong means the project's suite silently adopts a scratch test, which is
the §5 polarity collapse arriving by accident rather than by carelessness.

**Verified here.** A bare `pytest` at repo root collects `test_*.py` out of a planning directory. I
built the layout above and it collected the scratch test alongside the real one. Adding
`norecursedirs = .necklace` to `pytest.ini` excludes it from the suite while leaving it directly
runnable by path, which is exactly the property the method wants. A venv is already safe by accident,
because pytest skips dot-directories and has `venv` in its default `norecursedirs`.

**Deriving this for a language not listed below.** The axis from §0 is whether the build tool
*discovers* directories or is *told* about them.

Discovery-based tools walk from a root and adopt whatever matches a pattern, so they need an
exclusion: Go with a root `go.mod`, Cargo workspaces, pytest, tsc, Gradle's file-tree conventions.
Find the tool's exclusion mechanism, which every one of them has, and use it. Manifest-based tools
build only what a file lists, so an undeclared directory is already invisible and there is nothing to
do: Maven modules, `settings.gradle` includes, .NET solutions.

Then verify rather than assume. Run the project's full test command and confirm the scratch test does
not appear in the output. That check takes seconds and it is the same discipline §4 applies to the
red gate.

**Reasoned, not verified.** No Go, .NET, Rust, or JVM toolchain on this machine. Each of these needs
confirming on a box that has one, and each is a one-line fact that will take about a minute to check.

| Ecosystem | The risk | The move |
| --- | --- | --- |
| Go | A root `go.mod` makes every subdirectory part of the module, so `go test ./...` walks in | Any of three blessed outs: a nested `go.mod` (the go tool excludes subdirectories that own one), a `testdata/` directory (ignored outright), or a directory whose name starts with `_` or `.`. Go is better at this than it looks. |
| .NET | SDK-style projects glob `**/*.cs`, so a planning directory nested inside a project directory gets compiled into it, and a nested `.csproj` produces duplicate-compile errors rather than isolation | Put `.necklace/` at repo root, outside any project directory. A solution only builds projects it lists, so a scratch `.csproj` there is invisible. Watch for a root `Directory.Build.props`, which chains down and can impose analyzers on scratch code. |
| Rust | A nested crate inside a workspace directory makes cargo error about a package that believes it is in a workspace | One line. Either `exclude = [".necklace"]` in the root `[workspace]`, or an empty `[workspace]` table in the scratch crate's own `Cargo.toml` to declare it a separate root. |
| JVM | The opposite problem. Maven modules and `settings.gradle` includes are explicit, so an undeclared directory is already ignored. The friction is running the scratch code at all, since it needs a build file and the parent's classpath | JBang is the right tool: single-file Java with dependencies declared in comments and no build file. Otherwise declare a standalone build file depending on the built artifact. |
| Node and TypeScript | A root `tsconfig.json` `include`, and workspace globs in `package.json` or `pnpm-workspace.yaml` | Add the directory to `exclude`, and keep workspace globs specific rather than `packages/*`-style catch-alls. |

The skill instructs the agent to make this move once, at the start of the first run in a repo, and to
say what it did. It is a change to the project's build configuration, so it gets stated rather than
slipped in.

### On disk versus committed

Two different questions, and conflating them produces bad advice in both directions. §0 has the
principle. This is what it means here.

**On disk is free.** A gitignored `.venv` inside the planning directory is fine, and often better
than the alternative, because re-resolving dependencies on every run is slow and simply fails in a
network-restricted environment. Nothing that walks a repo reads gitignored files. Build the
environment where it is convenient, keep it warm, gitignore it, and stop thinking about it.

That holds regardless of which track above the repo is on. `python -m venv .venv` inside the planning
directory with a committed `requirements.txt` is a perfectly good setup, and it needs the §8 markings
rather than a different environment strategy.

On `uv` specifically, since it changes what is even on disk: **verified here**, `uv sync --script`
builds a persistent environment for a PEP 723 script in `~/.cache/uv/environments-v2/` rather than in
the repo, and `uv run --offline` then executes against it with no network. Inline dependencies and a
warm reusable environment are not in tension. This is a nice property for people who already use
`uv`, and not a reason to make anyone adopt it.

**Committed is where the rules live.** Never commit a resolved artifact directory: `.venv`,
`node_modules`, `target/`, `bin/`, `obj/`. A venv is 27MB across 1802 files with the absolute
creation path baked into `pyvenv.cfg`, so it would not work for anyone who cloned it regardless.

Never commit a lockfile, for the less obvious reason. A lockfile is an active input to Dependabot and
Renovate, which will open pull requests against a transitive dependency of a scratch script that
ships nowhere. The planning directory has no release and no security surface, so every alert it
raises is false, and false alerts train people to ignore the real ones.

The rule the skill carries: **a committed planning directory may contain source and prose, and
nothing another machine is configured to act on. What it holds on disk and ignores is its own
business.**

## 9. Open

1. npm handle or org to publish the scoped name under. Blocks step 8 only.
2. Does opencode have a skill or command directory worth targeting? `rtk init --opencode` exists, so
   there is prior art to read.
3. Should `--global` install skills or install a Claude Code plugin? The method document said plugin.
   Skills are simpler and work for cursor and copilot too, and a plugin is Claude-only. I would ship
   skills first and add a plugin channel later if a coworker asks for it.
Two questions that were listed here are gone. Both were factual, both named a version or a schema,
and neither was ever allowed to reach a human under §5 of the method document. They were answered by
reading `gastownhall/beads` and the answers are in §5 above. Recording the failure because it is the
exact behavior the spec skill exists to prevent, and the plan for the tool should not model it.
