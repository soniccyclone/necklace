# necklace, as a tool

How the method in `necklace-plan.md` gets distributed. The method is unchanged. This document only
covers packaging, installation, and the one real design decision: what happens when `bd` is absent.

## 0. Provenance

Same discipline as the method document. Validated facts are separated from proposals.

**Verified in this environment on 2026-07-30.**

- `rtk init` takes `--global`, `--agent <claude|cursor|windsurf|cline|kilocode|antigravity|kimi|pi|hermes|droid>`,
  `--show`, `--hook-only`. That is the CLI shape being copied.
- Claude Code reads skills from `~/.claude/skills/<name>/SKILL.md` and the project-local
  `.claude/skills/<name>/SKILL.md`. Confirmed against the installed `ste-writing` skill.
- `@beads/bd` on npm is version 1.1.2. It is a JS bin shim plus a `postinstall` that downloads a
  platform binary. Repo is `gastownhall/beads`, subdirectory `npm-package`.
- **That postinstall can fail and leave `bd` on PATH but non-functional.** It has failed on this
  machine. `bd --version` exits nonzero with "binary not found ... postinstall script failed to
  download". This is not hypothetical, it is the current state of Nathan's box.
- `necklace` is already published on npm as v1.0.0 with an empty description. The bare name is
  unavailable.

**Proposals in this document. Cut freely.**

- `necklace doctor` as a separate command from `necklace init --show`.
- The manifest-based update strategy in §6.
- The `--skip-beads-check` escape hatch in §5.

**Already cut. Do not re-propose.**

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

The method document says "three skill files, no binary, no runtime, no code" and that stands. The npm
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
│   ├── targets.js            # agent -> install path table
│   ├── install.js            # copy, manifest, idempotent update
│   └── doctor.js             # environment probes
├── skills/                   # the payload, verbatim from the method doc §6
│   ├── spec/
│   │   ├── SKILL.md
│   │   └── spec.md
│   ├── cuj/
│   │   ├── SKILL.md
│   │   └── cuj.md
│   └── beads/
│       ├── SKILL.md
│       └── beads.schema.md   # the bd JSONL contract, see §5
└── stubs/
    ├── cursor/               # .cursor/commands/*.md pointing at the skills
    └── copilot/              # .github/prompts/*.md
```

**Zero runtime dependencies.** The whole program copies markdown files and writes one JSON manifest.
Node has had `util.parseArgs` in stdlib since 18.3 and `fs.cp` since 16.7. Pulling in commander,
chalk, and ora to do that is the exact landing-page-driven packaging the method document is written
against. A dependency-free package also cannot break the way `@beads/bd` just broke, because there is
no postinstall step and no downloaded artifact.

**Node 18+ engines field, ESM.** No build step, no TypeScript compile, no bundler. The published
tarball is the source. Anyone can read what they installed.

**`files` in package.json is explicit.** `bin`, `src`, `skills`, `stubs`, `README.md`. Nothing else
ships.

### The name

`necklace` is taken. Options, in the order I would try them:

1. `@<npm-handle>/necklace`, scoped. Costs nothing, reads fine in install instructions, and the
   binary is still `necklace` because `bin` names are independent of package names.
2. Ask the squatter. v1.0.0 with an empty description and no README is usually abandoned, and npm has
   a dispute process for unused names. Slow, uncertain, not worth blocking on.

Recommendation is the scoped name. This decision is Nathan's because it depends on which npm handle
or org he wants to publish under, and it blocks nothing else in this plan.

## 3. CLI surface

Four commands. Anything beyond this is scope creep until proven otherwise.

```
necklace init [--global] [--agent <name>] [--force]
necklace init --show
necklace doctor
necklace update
```

**`init`** copies the three skills to the target directory. Default is project-local, and
`--global` writes to the user config directory instead. `--agent` defaults to `claude`. It writes a
manifest, then prints what it wrote and what it found in the environment. Nothing is silent.

**`init --show`** prints the resolved install paths and current manifest state without writing.
Matching `rtk init --show` so the flag means the same thing in both tools.

**`doctor`** is the environment probe. Separate from `--show` because they answer different
questions: `--show` is "what did necklace install", `doctor` is "will the method work here". Doctor
checks are in §5.

**`update`** re-copies skills when the package version is newer than the manifest, and reports files
the user edited so they are not clobbered. See §6.

**`--force`** overwrites user-modified files. Without it, a modified file is reported and skipped.

Explicitly not included: no `necklace spec`, no `necklace cuj`, no `necklace beads`. Those are skill
invocations inside the agent. A CLI command that prints "now ask your agent to run the spec skill" is
a worse README.

## 4. Install targets

One table drives everything. Adding an agent is one row, not a code path.

| Agent | Project-local | Global |
| --- | --- | --- |
| `claude` | `.claude/skills/necklace-{spec,cuj,beads}/` | `~/.claude/skills/necklace-*/` |
| `cursor` | `.cursor/commands/necklace-*.md` | not supported, print why |
| `copilot` | `.github/prompts/necklace-*.prompt.md` | not supported, print why |
| `opencode` | to be confirmed | to be confirmed |

The `necklace-` prefix on skill directory names is deliberate. Skills share a flat namespace with
whatever else the user installed, and `spec` is a name someone else will want.

For Cursor and Copilot the installed file is a stub that carries the full instruction inline. Those
platforms have no skill-loading mechanism to point at, so "stub that references the skill file" is
wishful. The stub generator reads `skills/*/SKILL.md` at install time and inlines it. That means one
source of truth in the repo and duplicated content on disk, which is the correct tradeoff: the
duplication is machine-generated and refreshed by `necklace update`.

Agent detection: if `--agent` is omitted, look for `.claude/`, `.cursor/`, `.github/prompts/` in the
project and install to every one found. Print the list. If none are found, default to `claude` and
say so.

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

`necklace doctor` reports:

| Probe | Method |
| --- | --- |
| beads installed | `bd --version` exits 0 |
| beads version | parsed from that output, compared against a known-good floor |
| repo initialized | beads database directory present |
| skills installed | manifest present, files match their recorded hashes |
| agent targets found | which of `.claude/`, `.cursor/`, `.github/prompts/` exist |

Each failed probe prints the remediation command. That is the whole doctor.

### Blocking fact to establish before writing the beads skill

The exact `bd import` JSONL schema. Field names, which are required, how dependency edges are
expressed, how labels are expressed, how hierarchical IDs are formed, and what upsert keys on.

I could not read it here because the local `bd` is broken. Get it from `gastownhall/beads` source
rather than from README examples, per the read-source-over-docs rule. It goes in
`skills/beads/beads.schema.md` and the skill references it. A wrong schema means `bd import` rejects
the file and step 3 produces nothing, with no fallback path to soften it, so this is the one item
that must be nailed before the beads skill is written.

## 6. Update and idempotency

`necklace init` writes `.necklace/manifest.json` (or the global equivalent) recording the package
version, each installed file, and a hash of the content as shipped.

`necklace update` compares three things per file: shipped content, recorded hash, on-disk content.

- On-disk matches recorded hash: safe to overwrite, do it.
- On-disk differs from recorded hash: user edited it. Report and skip, unless `--force`.
- File absent: reinstall.

This is the minimum that lets someone customize a template without `update` silently eating the
change. It is also the minimum that lets `update` do anything at all, since without a hash you
cannot tell an edit from a stale copy.

The manifest is the only state the tool keeps. No config file, no settings, no cached probe results.

## 7. What this changes in the skills themselves

The method document's §6 layout stands. Three additions, all in `skills/beads/SKILL.md`:

1. The requirement, first line: this skill needs a working `bd` and has no alternative path.
2. The probe from §5, including the "run it, do not look for it" rule and the reason, plus the
   instruction to stop before generating anything if the probe fails.
3. A pointer to `beads.schema.md`.

`skills/spec/SKILL.md` and `skills/cuj/SKILL.md` are unchanged from the method document. They carry
§2, §3, §5, and §7 and they never touch beads.

One addition across all three: each skill states which artifact it consumes and which it produces, so
running them out of order fails loudly instead of producing a CUJ doc from no spec doc.

## 8. Build order

1. Establish the beads JSONL schema from source. Blocks the beads skill and nothing else, so it
   happens first and in parallel with step 2 if convenient.
2. Write the three SKILL.md files and two templates. This is the actual product. Nothing else in this
   document matters if these are weak.
3. Run the §9 trial run of the method document using those files, installed by hand with `cp`. No
   npm package, no CLI. If the trial run says the method needs changing, changing markdown is free
   and changing a published package is not.
4. Write `bin/necklace.js` with `init` and `init --show`, claude target only.
5. Add `doctor`.
6. Add `update` and the manifest.
7. Add cursor and copilot stub generation.
8. Publish under the scoped name.

Steps 4 through 7 are perhaps a day of work combined, because the program copies files. The cost is
entirely in steps 1 through 3. Ordering the trial run before the packaging is the point: it is the
cheapest place to find out the method needs revision, and §8 of the method document argues exactly
this about error detection generally.

## 9. Open

1. npm handle or org to publish the scoped name under. Blocks step 8 only.
2. Does opencode have a skill or command directory worth targeting? `rtk init --opencode` exists, so
   there is prior art to read.
3. Should `--global` install skills or install a Claude Code plugin? The method document said plugin.
   Skills are simpler and work for cursor and copilot too, and a plugin is Claude-only. I would ship
   skills first and add a plugin channel later if a coworker asks for it.
4. Is there a minimum `bd` version the method depends on? §4 leans on hierarchical IDs and label
   support. If those landed in a specific release, the doctor's version floor is a real check rather
   than a placeholder. Answered while reading the source for the schema.
