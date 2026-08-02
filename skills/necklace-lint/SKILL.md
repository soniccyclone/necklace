---
name: necklace-lint
description: Check whether necklace's own artifacts in .necklace/ are being picked up by the repo's test discovery, dependency scanners, linters, or code scanning, and propose the exclusions that stop it. Also probes that beads is installed and configured. Use on the first necklace run in a repo, after necklace init, or when the user asks whether necklace is polluting the repo.
---

# necklace-lint

Check whether necklace's own artifacts are polluting the repo that hosts them, and propose fixes.

This is not a pipeline stage. It does not read `spec.md` or `cuj.md` and it never runs as part of the
three-stage sequence except once, on the first run in a repo.

It is also not a general-purpose linter. It checks `.necklace/` and nothing else. Do not report code
quality, style, or anything the repo's own tools already cover.

## The rule that keeps this honest

**Detect from the repo, never from memory.**

Your knowledge of build tools and scanners is for *interpreting what you find*, not for *enumerating
what might exist*. Seeing `.github/workflows/codeql.yml` and recognising that CodeQL will scan
`.necklace/` is the job. Proposing CodeQL exclusions for a repo with no CodeQL is not, and neither is
inventing a config key that sounds plausible.

**A config file that is not in the repo generates no finding.** This is what lets the check keep
improving as models get better, instead of hallucinating configuration with more confidence each
year.

The tables below are a starting point, not the scope. If you find a tool they do not mention, and it
reads committed files, and it would act on `.necklace/`, that is a finding. Read its documentation
for the exclusion syntax rather than guessing.

## Demonstrate, do not assert

Where the tool is installed, **run it and show it picking up the planning directory.**

`pytest --collect-only` listing a scratch test from `.necklace/` is a finding. "Renovate may scan
this" is not.

Report findings you can demonstrate, plus findings where the config is present and the reading is
unambiguous. Do not report theoretical ones. Three real findings with output attached get fixed;
twelve speculative ones get this skill uninstalled.

## What to check

### 1. Test discovery

The one that matters most, because a scratch test silently joining the suite is a green test nobody
designed.

The axis: does the build tool **discover** directories, or is it **told** about them? Discovery-based
tools need an exclusion; manifest-based tools already ignore an undeclared directory.

| Ecosystem | Risk | Fix |
| --- | --- | --- |
| Python | `pytest` collects `test_*.py` repo-wide | `norecursedirs = .necklace` in `pytest.ini` or equivalent |
| Go | a root `go.mod` puts every subdirectory in the module | a nested `go.mod`, a `testdata/` directory, or a leading `_` or `.` |
| Rust | a nested crate inside a workspace errors | `exclude = [".necklace"]` in the root `[workspace]`, or an empty `[workspace]` in the scratch crate |
| .NET | SDK projects glob `**/*.cs` | keep `.necklace/` at repo root outside any project directory |
| JVM | already invisible; Maven and Gradle are told what to build | nothing |
| Node, TypeScript | root `tsconfig.json` `include`, workspace globs | add to `exclude`; keep workspace globs specific |

Then verify: run the project's full test command and confirm nothing from `.necklace/` appears.

### 2. Scanners that read committed files

Only check for tools the repo actually uses. Writing a `renovate.json` into a repo that has never
heard of Renovate is its own kind of pollution.

| Tool | Present when | Fix |
| --- | --- | --- |
| Renovate | `renovate.json`, `.renovaterc*`, or the config in `package.json` | add `.necklace/**` to `ignorePaths`. Renovate auto-discovers manifests repo-wide, so this is the one that actually bites. |
| Dependabot | `.github/dependabot.yml` | usually nothing, since it is opt-in per directory. Check for a `directories:` glob such as `**/*`. |
| CodeQL | a CodeQL workflow or config | `paths-ignore: [.necklace]` |
| pre-commit | `.pre-commit-config.yaml` | top-level `exclude: ^\.necklace/` |
| linguist | any repo on GitHub | `.necklace/** linguist-documentation=true` in `.gitattributes`, so scratch code stops skewing language stats. Not `linguist-generated`, which collapses diffs. |
| Coverage | a coverage config | `omit` or equivalent for `.necklace/*` |

### 3. What must never be committed

- Resolved artifact directories: `.venv`, `node_modules`, `target/`, `bin/`, `obj/`. Gitignored is
  fine and often better, since re-resolving on every run fails in a network-restricted environment.
- Lockfiles. A lockfile is an active input to Renovate and Dependabot, and the planning directory has
  no release and no security surface, so every alert it raises is false.

Prefer the ecosystem's single-file script mechanism so no manifest exists to scan: Python PEP 723
with `uv run`, Java JBang `//DEPS`, .NET `#:package`. Where none exists, a committed manifest plus
exclusions is expected and fine.

### 4. Beads

| Probe | Method |
| --- | --- |
| installed and working | `bd --version` exits 0. Run it; do not check PATH. |
| version | at least 1.1.0 |
| repo initialized | a beads database directory is present |
| auto-export on | `bd config get export.auto` is true |
| export staged | `bd config get export.git-add` is true |

Both export keys default to false and both are needed. Without them the bead graph lives only in the
local database, and a bead ID in a CUJ document is a dangling pointer for anyone reading the repo on
GitHub or reviewing a pull request.

## Reporting

For each finding: what you found, how you know, and the exact change. Then ask.

**Change nothing without a yes.** Every fix here edits the repo's own configuration, which is a
change the owner should approve. Apply what is accepted, print what you changed, and leave the rest.

If nothing is wrong, say so in one line. Do not manufacture findings to look useful.
