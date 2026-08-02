# necklace: planning ledger

Decisions, reversals, and what was checked. `necklace-plan.md` and `necklace-tool-plan.md` are
proposals and say what we are building. This file says how we got there and what we already ruled
out.

Read it before re-opening a settled question. Nothing here is a requirement.

This is the same split the method itself prescribes, applied to its own planning: the documents hold
what is still open, the ledger holds what is settled. See §2 of the method and §8 of the tool plan.

## Verification record

Facts established by running something or reading source, rather than by recall.

| Date | Claim | How |
| --- | --- | --- |
| 2026-07-30 | `rtk init` takes `--global`, `--agent` across ten agents, `--show`, `--hook-only` | ran `rtk init --help` |
| 2026-07-30 | Claude Code reads `.claude/skills/<name>/SKILL.md` | inspected an installed skill |
| 2026-07-30 | `@beads/bd` is an npm shim plus a postinstall that downloads a platform binary | read the shim, `npm view` |
| 2026-07-30 | That postinstall can fail and leave `bd` on PATH but non-functional | it has failed on Nathan's machine; `bd --version` exits nonzero |
| 2026-07-30 | `necklace` is taken on npm as v1.0.0 with an empty description | `npm view` |
| 2026-07-31 | The `bd import` JSONL contract, in full | read `gastownhall/beads` at `9fddc56` against released 1.1.2 |
| 2026-08-01 | `bd init` installs a `beads` skill covering the execution loop, not bulk breakdown | read `internal/templates/skills/beads/SKILL.md` |
| 2026-08-01 | `bd init` prompts `Enable auto-export? [y/N]`, default no; keys are `export.auto`, `export.path`, `export.git-add`, `export.interval` | read `cmd/bd/init.go`, `internal/config/config.go`, `cmd/bd/init_templates.go` |
| 2026-08-02 | `bd init` installs the skill at `.agents/skills/beads/SKILL.md` and wires hooks in `.claude/` and `.codex/` | ran it in `planning/repl-beads` |
| 2026-08-02 | `bd` 1.1.2 works; the broken npm shim is resolved | `bd --version` |
| 2026-08-02 | The installed skill has no epic, parent, hierarchy, or breakdown guidance. `bd prime` carries it | grepped both |
| 2026-08-02 | `bd prime` teaches `bd create`, `--parent=<id>`, `bd dep add`, and suggests parallel subagents for many creates | ran `bd prime` |
| 2026-08-02 | `bd prime` never mentions `import`, `--graph`, `--file`, or JSONL | grepped its output |
| 2026-08-02 | `bd create --parent` produces dotted hierarchical IDs; a `bd dep add` edge and the parent-child edge both land in the export | created an epic with two children in `planning/repl-beads` |
| 2026-08-02 | `export.git-add true` stages `.beads/issues.jsonl` and nothing else | ran it |
| 2026-08-02 | Auto-export is gated by `export.interval`, default 60s, so a burst of creates leaves the committed file partial. It catches up on the next `bd` command after the interval | observed the file holding only the epic while the DB had all three |
| 2026-08-02 | `bd export` writes to stdout; `-o` writes the file but does not stage it | ran both |
| 2026-08-02 | beads ships both channels: `bd init` copies skills, and `plugins/beads/` carries Claude, Codex, and Copilot plugin manifests with skills, an agent, and hooks | read the repo |
| 2026-08-02 | OpenSpec ships no plugin at all, and namespaces via `.claude/commands/opsx/` subdirectory or an `opsx-` prefix | searched the repo for plugin files |
| 2026-08-02 | rtk ships neither; it writes `RTK.md`, an `@RTK.md` include, and a settings.json hook | `rtk init --show` |
| 2026-08-02 | `bd prime` prohibits TodoWrite and markdown task files outright | ran it |
| 2026-08-01 | bd has three bulk entry points: `create --graph` (JSON plan), `create --file` (markdown), `import` (JSONL) | read `cmd/bd/create.go`, `cmd/bd/create_input.go` |
| 2026-07-31 | `bd` rewrites a row only when `updated_at` is strictly newer; landed in 1.0.5 | read `cmd/bd/import_shared.go` and the changelog |
| 2026-07-31 | A bare `pytest` at repo root collects scratch tests out of a planning directory | built the layout and ran `--collect-only` |
| 2026-07-31 | `norecursedirs` excludes them while leaving them runnable by path | ran it both ways |
| 2026-07-31 | A venv is 27MB across 1802 files with absolute paths in `pyvenv.cfg` | inspected one |
| 2026-07-31 | PEP 723 inline dependencies resolve and run with no manifest on disk | ran `uv run` on a script with a `# /// script` header |
| 2026-07-31 | `uv sync --script` builds a persistent env outside the repo; `uv run --offline` then works | ran both |
| 2026-08-01 | All four committed targets read `SKILL.md` with `name` and `description` required | vendor docs for Cursor, Copilot, opencode |
| 2026-08-01 | Copilot added `SKILL.md` support in April 2026 | GitHub docs |
| 2026-08-01 | Only Claude Code documents a skill-invocation tool; the other three document nothing either way | vendor docs |
| 2026-08-01 | BMAD publishes `platform-codes.yaml`, 45 platforms | read `bmad-code-org/BMAD-METHOD` |
| 2026-08-01 | OpenSpec's `AI_TOOLS` is 35 entries with one adapter file per tool | read `Fission-AI/OpenSpec` |
| 2026-08-01 | Spec Kit ships ~37 integration packages | read `github/spec-kit` |
| 2026-08-01 | All three prior-art projects target Kiro | read all three |
| 2026-08-01 | Windsurf became Devin Desktop on 2026-06-02; directory moved `.windsurf/` to `.devin/` | OpenSpec's alias table and comment |
| 2026-08-01 | OpenSpec's tool prompt is a searchable multi-select over every tool, not gated on detection | read `src/core/init.ts` |
| 2026-08-01 | Spec Kit's fork map is deliberately empty, with the reason recorded | read `integrations/claude/__init__.py` |

Still unverified, and each is about a minute to check on a machine with the toolchain:

- Go, .NET, Rust, and JVM build-isolation mechanisms in §8 of the tool plan.
- JBang, .NET file-based apps, and `cargo -Zscript` as single-file mechanisms.
- Every scanner marking in §8's table. None of those scanners are installed here.

## Provenance

Read this before treating anything in the method as a requirement. It mixes practice that already
works with proposals that have never been tried. Moved here from §1 of the method document, which
now points at it.

**From Nathan's working practice. Validated on real tickets.**

- The three mandatory steps.
- Both documents, in that order.
- CUJ vertical slices in the second document.
- Turning each CUJ into a verifiable test.
- Beads breakdown from the CUJ document.
- Asserting that the tests exist and trace back to the CUJs.
- A REPL-like workflow as the tool for answering the agent's own questions.
- The agent researching aggressively rather than accumulating questions.
- One checked-in planning directory per workflow run, holding both documents.
- Retaining REPL work in that directory.

**Proposals. Untried, cut them freely.**

- The two-sided altitude test in §2.
- Actor-outcome pairs as a required section.
- The "must not contain" list and the two-page length guide.
- "Fails for the right reason" as part of the red gate.
- The three-round cap on the self-answer loop.
- The falsification-condition discipline in §5.
- The ten-term dictionary in §7.
- The four trial-run counts in §9.
- Rung 2 as the test runner, and the live-code-loading test for which rung a language is on.
- The working log, and moving rejected alternatives out of the spec doc into it.
- The single-file-script rule, and every ecosystem row not verified above.
- The lint skill.
- Prose sequencing in the orchestrator, forced by three of four vendors documenting nothing.
- The `--skip-beads-check` escape hatch.

## Decisions

### Beads is required, with no fallback

Proposed: detect `bd`, fall back to the host's todo tool when absent.

Rejected. Step 3 of the method requires a DAG, `cuj:` labels, real dependency edges, hierarchical
IDs, and `bd list --json` afterward. A session todo tool has none of those, so falling back does not
degrade step 3, it deletes it. The portability argument also fails: there is no common interface to
target across Claude Code, Cursor, and Copilot.

Then considered: write the JSONL and a rendered `TASKS.md` to disk when `bd` is missing, so the work
survives. Also rejected, by Nathan. A tool that half-works teaches a workflow that is half his, and
the rendering was necklace reimplementing a slice of beads after this document said it would not.

Settled: beads is a hard requirement. `necklace init` refuses to install without a working `bd`, and
the beads skill stops before generating anything.

### The code is the source of truth, not the spec

Nathan's, and it became §0 of the method.

Spec-driven frameworks run the compiler model: edit the spec, regenerate, never touch the output.
That needs a deterministic and faithful generator. An LLM is neither. So the spec is provenance, not
authority.

This retroactively supplied the real reason `necklace verify` was cut. The stated reason had been
that the agent can read test output itself, which is shallow. The actual reason is that a binary
checking code against a spec has encoded the belief that the spec outranks the code.

It also settled the directory name. See below.

### `.necklace/`, hidden

First argued as a visible `necklace/`, on the grounds that the documents exist to be found by
someone asking why a decision was made.

Reversed. A visible top-level directory claims peer status with `src/`, which is the claim the other
frameworks make and this one rejects. And it collides with the module namespace: a top-level
`necklace/` reads as an importable package in Python, and Go, Node, and JVM tooling all treat
top-level directories as meaningful. `.github/` is a hidden directory full of things humans read.

### Every install target is first class

First designed as consolidation: route Copilot and opencode through their `.claude/skills/`
compatibility paths, so two directories cover four tools.

Reversed by Nathan. necklace installs per repo, so the installer knows which tool it is writing for
and can use that tool's native paths and command surface. A compatibility path is a fallback the
vendor maintains for other people's files, and taking it means never touching Copilot's Custom
Agents picker or opencode's slash catalog. Drift is the usual argument for consolidating and it does
not apply here, because the files are generated from one source by a program.

### The stub generator, cut

The plan had necklace inlining each `SKILL.md` into `.cursor/commands/*.md` and
`.github/prompts/*.prompt.md`, on the belief that those platforms had no skill mechanism to point at.

Cursor shipped skills. Copilot added `SKILL.md` support in April 2026. Installing is a directory
copy. This was a stale-knowledge error rather than a judgment error, and it is the second one in the
tool plan that two minutes of checking would have prevented.

Rule it earned: verify a platform's current file convention before designing around its absence.

### Every CLI command except `init`, cut

The tool plan had `init`, `init --show`, `doctor`, and `update`, plus a content-hashed manifest to
support them. All of it was invented in the document. None was asked for. The section introducing it
opened with "four commands, anything beyond this is scope creep," which is the tell.

`init/doctor/update` is the shape every devtool CLI has, which is why I reached for it. `rtk` was
cited as the model in the same document and `rtk` has `init` and not the other two.

The compounding error: when Nathan proposed the lint skill three turns later, I reconciled it against
`doctor` rather than recognising that his skill was the thing and `doctor` was scaffolding I had
invented. I wrote a "clean split" between a real idea and an imaginary one.

Where it went: `doctor`'s probes are the lint skill's, since checking whether `bd` runs and whether
markings are present is reading and reporting. `update` is `npm update -g` then `necklace init`,
which is idempotent. The manifest existed only to let `update` tell a user edit from a new release.

Rule it earned: adding a command back requires showing that an agent reading a SKILL.md cannot do the
job.

### Subagents: lint only, never the pipeline

Two wrong turns, recorded because the first rule is still true and someone will otherwise rediscover
it and reach the wrong conclusion again.

First suggested forking `necklace-cuj` and `necklace-beads` so their heavy reading would not consume
the orchestrator's context. Spec Kit tried exactly that with `/speckit-analyze` and reverted it: the
forked command returned a 300-500 line report that was injected back into the parent, and each later
fork inherited the accumulation until the chat froze. So a fork must return a receipt, not a report.

Then argued necklace satisfies that, since every stage writes its artifact to disk and the next
stage gates on the file, so a forked stage could return one line. Correct about output, and beside
the point.

Nathan's objection decided it, and it is about input. A subagent starts cold. `necklace-cuj` consumes
`spec.md` plus everything that happened while `spec.md` was written: the self-answer loop, the
judgment calls, the REPL findings that informed a claim without earning a table row. That
accumulated understanding is what the method exists to build and it lives in the parent's
conversation. Spawning a subagent to write one file whose quality depends on context the parent
already holds loses on both sides.

`log.md` does not rescue it. It is a write-ahead record with no completeness requirement, and if a
summary could reconstruct the context then the parent would not need the context either.

Settled: a fork must return a receipt *and* be startable cold. Pipeline stages fail the second
structurally, so no measurement changes it. `necklace-lint` passes both.

### REPL work is retained, not deleted

First written as: a scratch test is throwaway and gets deleted once its question is answered.

Reversed by Nathan. "Throwaway" describes the script's role in the documents, where only the finding
belongs. It says nothing about its value later, when someone asks why a decision was made and the
session that settled it is the answer.

Better consequence: retention allows enforcing the REPL/test polarity by location instead of by
discipline. The planning directory is excluded from test discovery, so the suite cannot adopt a
scratch test even when someone forgets.

### The working log, and lighter documents

Nathan's need, from losing session state that had not yet reached the documents. BMAD keeps a full
workflow transcript.

Shaped as a write-ahead record rather than a summary, because a log composed at the end is worthless
against the failure it exists to prevent.

Second effect, which is worth more than the first: it absorbs the provenance job, so rejected
alternatives, answered judgment questions, and constraint reasoning leave the spec doc. That is the
edit to §2 of the method. Open judgment questions stay in the document, because they are a blocking
handoff to a human.

This ledger is that rule applied to necklace's own planning documents.

### On-disk and committed are different questions

The single-file-script rule was first written as absolute: never emit a manifest.

Corrected by Nathan. Only committed files reach the scanners, so a gitignored `.venv` is fine and
often better, since re-resolving on every run fails outright in a network-restricted environment.
Not everyone uses `uv`. `python -m venv` with a committed `requirements.txt` is reasonable and needs
markings rather than a different environment strategy.

Lockfiles stay out regardless: they are an active input to Dependabot and Renovate, and a planning
directory has no release and no security surface, so every alert it raises is false.

### The lint skill

Nathan's proposal, including the reasoning: the set of scanners grows, so a table written today
expires, and an agent whose training postdates the document knows tools the document does not.

Two constraints added to make that safe rather than dangerous. Detect from the repo and never from
memory, so agent knowledge interprets what is present instead of enumerating what might exist and
inventing plausible config keys. And demonstrate rather than assert, which is §4's red gate
discipline pointed at a different problem.

### Rung 2 is the test runner

Nathan's observation. The ladder said "scratch `main`" for compiled languages, which invited an agent
to install a third-party REPL first.

Reasoning added: select the rung by whether the runtime can load and redefine code in a live process,
not by whether something calling itself a REPL exists. Where it cannot, that REPL is a snippet
compiler that restarts per expression, so it is rung 2 wearing a rung 1 costume.

The test runner wins rung 2 because it is already wired into the build graph and because it reaches
internals a scratch binary cannot: in-package Go tests, Rust `#[cfg(test)]`, `InternalsVisibleTo`.

### necklace does not carry a copy of any beads format

A `beads.schema.md` was written into this repo transcribing the `bd import` JSONL contract. Deleted.

beads ships its own skill via `bd init`, and it has purpose-built bulk entry points, notably
`bd create --graph`, described as creating a graph of issues with dependencies from a JSON plan file.
Transcribing a format we do not own creates a second source of truth that goes stale without anyone
noticing, and "rewriting any part of beads" was already cut.

What survives from that reading is the shape of the gap: beads' own skill covers the execution loop
and not bulk breakdown, which is what `necklace-beads` is for.

The findings from that pass are still true and still useful if the JSONL path is ever chosen: `bd`
rewrites a row only when `updated_at` is strictly newer, `priority` has no import default so an
omitted value reads as P0, file order is free because the importer sorts topologically, and both
`import` and `create --graph` support `--dry-run`.

### Build the graph the way `bd prime` teaches, not by bulk import

§4 of the method required generating one JSONL and importing it once, because forty `bd create` calls
give forty chances to drift and no way to review the graph before it lands. That drove several turns
of work on the `bd import` contract.

Run in `planning/repl-beads`, it turns out `bd prime` is injected by hook on session start and names
exactly one way to build a graph: `bd create` per bead, `--parent=<id>` for hierarchy, `bd dep add`
for edges. It never mentions `import`, `--graph`, `--file`, or JSONL. That is why Nathan's practice
of saying "task breakdown this CUJ doc into beads" produces correct epics and children without him
ever asking for bulk creation.

Revised. §0 says prefer what the toolchain blesses, and an agent in a beads repo has already been
told the other thing.

The review half of the original concern still stands and is answered elsewhere: the CUJ document is
the review artifact, and the graph is derived from it, so review happens before any `bd` command
runs. Reviewing a generated JSONL would be reviewing a translation of something already approved.

The `bd import` findings are kept above in case that path is ever needed. It is not needed now.

### Beads auto-export is required, and necklace keeps no copy of the graph

Nathan's, from running `bd init` with auto-export on and getting a git-tracked `.beads/issues.jsonl`.

Without it the graph is only in the local Dolt database, so a bead ID in a CUJ document is a dangling
pointer for anyone reading the repo on GitHub or reviewing a pull request. With it the graph is
committed and diffable, and the backlink resolves both ways: beads carry `cuj:CUJ-NN` labels and the
CUJ document names bead IDs.

Consequence: the planning directory no longer holds a `beads.jsonl`. An earlier draft kept one as
"the record of the graph", which would have been a second source of truth going stale beside the one
bd maintains. Same error as the deleted `beads.schema.md`, caught before it shipped.

`bd init` defaults auto-export to off, so `necklace init` has to ask for it rather than assume. Both
`export.auto` and `export.git-add` default false and both are needed.

Running it in `planning/repl-beads` turned up the part that would have broken silently: auto-export
is interval-gated, so right after a burst of `bd create` calls the committed file holds part of the
graph. The breakdown has to force `bd export -o` and `git add` rather than trust the timer.

### Named skills

`necklace`, `necklace-spec`, `necklace-cuj`, `necklace-beads`, `necklace-lint`. Four are named for
the artifact they produce and every name comes from §7's controlled vocabulary rather than being
invented, because a skill name is the most likely place for the next synonym to enter.

The `necklace-` prefix matches universal practice: OpenSpec generates `opsx-`, Spec Kit `speckit-`,
BMAD `bmad-`. It would disappear under a plugin channel, which is the one real argument left for
that option.

### Orchestration sequences in prose

Nathan wanted the orchestrator to call a sub-skill and get control back so it can tell the agent what
to run next.

Only Claude Code documents a skill-invocation tool. The other three document neither its presence nor
its absence, so the orchestrator sequences in prose and the agent performs the invocation. This works
identically everywhere and depends on no vendor promise.

Added: the gate between stages is the artifact on disk, not a return value. A stage recovers from a
lost session by looking at the planning directory rather than by trusting a claim.

### Prior art

OpenSpec's installer is the design to copy: adapter per tool, `detectionPaths` as a list rather than
a directory, rebrand aliases, `setupNote`, and a searchable multi-select ranked configured then
detected then the rest. Detection ranks the menu and does not gate it, which keeps the out-of-order
install a search away rather than impossible.

BMAD's `platform-codes.yaml` is the broadest at 45 platforms and the easiest to lift wholesale. Spec
Kit's per-tool packages are the heaviest structure without being the most thoughtful.

Boundary: copy the infrastructure, not the philosophy. OpenSpec is a spec-driven framework of exactly
the kind §0 rejects, and its validation subsystem exists to enforce spec conformance.

### Framings that stayed here

Concepts coined while reasoning, kept out of the planning documents because they describe how a
decision was reached rather than what to build.

- **Enumerate-the-bad versus enumerate-the-good.** The argument for preferring single-file scripts
  over per-scanner exclusion lists. The plan states the preference and the fallback; this is why.
- **Receipt versus report.** The output half of the fork test, from Spec Kit's reverted experiment.
  The plan states both halves of the test as a rule.
- **The lint skill's expiry argument.** That a table written today goes stale and a newer model does
  not. The plan states that the skill carries the problem rather than the list.
- **Warning fatigue.** Three real findings with output attached get fixed; twelve theoretical ones
  get the skill uninstalled. This is why "demonstrate, do not assert" is a rule.
- **The polarity collapse.** That a scratch test graduating into the suite is the failure mode
  behind excluding the planning directory from test discovery.

None of these are §7 terms and none should become §7 terms without a deliberate decision.

## Already cut. Do not re-propose.

From the method:

- `necklace verify`, or any binary that validates artifacts.
- A `Touches` field on each CUJ and the serialization check built on it.
- Critic agents, agent supervision, worktrees, fleets, and phase state machines.
- Graduated ceremony for small tickets. A ticket gets the full two documents.
- Bead shape as a configuration choice. It is per-CUJ sizing.

From the tool:

- Any fallback for a missing `bd`.
- Every CLI command except `init`, and the manifest that supported them.
- The stub generator.
- Rewriting any part of beads, including rendering its graph to markdown.
- Vendoring the `bd` binary.
- Consolidating install targets through compatibility paths.
- Forking any pipeline stage into a subagent.

## Open

1. ~~npm handle.~~ `@soniccyclone/necklace`.
2. ~~Skills or a plugin.~~ Skills, following OpenSpec, which ships no plugin. A plugin buys
   namespacing, hooks, and marketplace install; we need none yet. beads' plugin exists mainly to
   deliver hooks, so a session-start hook is the trigger for revisiting.
3. Whether Kiro is worth targeting at all. It is reachable, and its spec-as-source model is the one
   §0 rejects.
4. ASD-STE100 was tried on the artifacts and dropped. Not a project concern.
