# Ledger: necklace CLI

## REPL findings

**Zero dependencies survives a searchable multi-select.** `repl/stdlib_multiselect.js` fed synthetic
keypresses through a `PassThrough` with `readline.emitKeypressEvents`. Typed characters, up and down
arrows, space, return, and ctrl-c all arrive as distinguishable named events. OpenSpec takes a
dependency for this; we do not have to. Falsification was that arrows or space would be
indistinguishable from typed text. They were not.

**`fs.cp` will not tell us what it skipped.** `repl/fs_cp_semantics.js`, against an existing
destination holding a user-edited file:

| Options | Result |
| --- | --- |
| defaults | silently overwrites the user's edit |
| `force: false` | silently keeps the user's file, copies the rest, reports nothing |
| `force: false, errorOnExist: true` | throws `ERR_FS_CP_EEXIST` on the first conflict |

The falsification condition fired: `force: false` succeeds silently, so the copy cannot be the thing
that detects an existing install. `errorOnExist` aborts on the first conflict, which cannot report
the full set either.

This kills the `--force` behaviour described in the tool plan, which promised init would "refuse to
clobber and say which file it left alone". A **pre-check pass** is required: walk the intended writes,
compare against what is on disk, report the whole conflict set, then copy. Recorded as a constraint
rather than an approach, because it is a property of the API and not a preference.

**`util.parseArgs` covers the flag shape.** `repl/parseargs.js`. `multiple: true` collects repeated
`--agent` into an array, both `--agent x` and `--agent=x` forms work, shorts compose, and an unknown
flag throws `ERR_PARSE_ARGS_UNKNOWN_OPTION` with a message good enough to print directly. No
hand-rolled parsing needed.

## Decisions

**Planning root is always `.necklace/`.** An earlier version of this reused the repo's existing
`planning/` directory, and the skill said to follow whatever convention a repo already had. That is
wrong: a repo where teammates use OpenSpec or spec-kit has `openspec/` or `specs/`, and following the
local convention would drop necklace documents inside another tool's directory where both tools and
both sets of users would trip over them.

Everything moved to `.necklace/`, including the earlier freeform directories.

**Slug is `cli`, with no ticket key.** There is no ticket; this is a subsystem. The date is what makes
it findable later.

An earlier version of this ledger claimed a dated directory suits a ticket but not a long-lived
subsystem. That was wrong. The date answers "what did I decide in the thing I started last Tuesday",
which is the same question either way.

## Open

Nothing yet.

## Stage 2, CUJ document

**Six pairs became five CUJs.** The two installer-visibility pairs in `spec.md`, seeing what was
detected and seeing what was written, are one journey rather than two. Merged into CUJ-02 rather than
split for the sake of matching the table one to one.

**`repl/payload_resolution.js`.** The tool will be run as `node ~/necklace/bin/necklace.js init` from
inside a different repo before it is ever published. `import.meta.dirname` tracks the script while
`process.cwd()` stays the target repo, so script-relative resolution works and no `--package-root`
flag is needed. Falsification was that `import.meta.dirname` would follow cwd; it did not.

Worth noting the probe failed first with the `..` count one too deep, resolving silently to a
directory that did not exist. That is the failure mode CUJ-01's third test exists to catch, so it
earned its row.

**Three of CUJ-04's four tests carry REPL provenance**, which is unusual and correct here: that CUJ
exists because of what the `fs.cp` probe found, not because anyone asked for conflict reporting.

**No CUJ is blocked.** `spec.md` has no open judgment questions, so the `**Blocked:**` path in the
skills stays untested.

## Always overwrite, and updating is the same command

Nathan asked how CUJ-04 told a user edit apart from a version bump, and separately noted the CLI had
no update story. Same hole.

It cannot tell them apart. "The file on disk differs from the payload" is one observation with two
causes, and separating them needs a record of what necklace wrote last time. That is the manifest,
cut earlier as invented complexity. The cut was right about `doctor`, `update`, and `init --show`,
and wrong about the manifest, which was solving this.

The update story also contradicted itself: the tool plan said rerunning `init` covers updates because
it is idempotent, while also saying it refuses to clobber without `--force`. A rerun after a version
bump would have updated nothing.

**Settled: always overwrite, report every path, no `--force`, no manifest.**

The case a manifest protects is a locally edited skill, and that should not happen. The skills are
necklace's payload, not user configuration, and a coworker running an edited skill is silently
running a different workflow, which is what this tool exists to prevent.

It is safe because skills install **into a git repo** by definition, so an unwanted overwrite shows
up in `git diff`. The report plus version control does what the manifest would have.

CUJ-04 and CUJ-05 collapsed into one CUJ about updating. Five CUJs became four, and one of its tests
is that overwriting our payload must not mean owning the directory: another tool's skill in the same
folder has to survive.

## Release channel: npx from GitHub

Nathan's call, and it stands past the first pass unless something forces otherwise. `npx
github:soniccyclone/necklace init` packs the repository, so there is no publish step and no
deployment to manage. Tags give pinning for free.

Two things to confirm while implementing, both cheap:

- That `files` in `package.json` includes `skills/`, since a git install packs the repo the way
  `npm pack` does and an omitted payload would install nothing while appearing to succeed.
- That npm's cache does not serve a stale tarball on a rerun after a push. If it does, the README
  leads with the pinned-tag form.

Reinforces the always-overwrite decision above: with no npm version metadata there is nothing to
compare against even if we wanted to, so rerunning the line has to be the whole update story.

## Stage 3, beads and implementation

Four CUJs became four flat beads. None was large enough to want children.

**16 tests written first, all 16 red on `ERR_MODULE_NOT_FOUND`** for `src/{cli,targets,install,beads}.js`,
then green once those existed. No test was written after the code it covers.

**`node --test test/` does not do what it looks like.** It parses `test/` as the entry module and
dies with `Cannot find module`, reporting one failed test rather than none found. `node --test
test/*.test.js` is the working form. Worth knowing because the broken form reports a failure, so it
looks like a red gate rather than a broken invocation.

**The beads gate warned about export config in a repo with no beads workspace.** Fixed by adding the
`bd where` probe: an uninitialized repo now reports that alone.

**Not covered by tests:** `src/prompt.js` and `bin/necklace.js`, both TTY-bound. Verified by hand
against a scratch repo with `--agent claude --agent cursor`, which wrote 12 skill directories and
printed every path. The interactive selection path has not been exercised at all.

## Interactive testing, and bd init's blast radius

**`bd init --non-interactive` writes and commits more than beads.** Run at this repo's root it added
`.agents/`, `.codex/`, `.claude/settings.json`, `AGENTS.md`, `CLAUDE.md`, and a `.gitignore`, then
committed them itself as "bd init: initialize beads issue tracking". Nathan did not expect `.codex/`
and does not use Codex; removed in a follow-up commit. It may come back on a later `bd init`.

**necklace never runs `bd init`.** The tool plan had `necklace init` offering to install beads and
initialize the repo, prompting first. Cut. `bd init` decides which agent directories a repo gets and
commits them itself, and neither of those is necklace's call to make as a side effect of installing
skills. It checks three things and prints the command instead.

That also fixes the noisy warning noted below: export keys are downstream of being initialized, so an
uninitialized repo reports that one thing rather than three.

**The installer was never run against this repo.** Detection here returns `['claude']` only, which
matches what Nathan predicted. The end-to-end check ran in a `mktemp` directory.

**PTY tests, via node-pty as a dev dependency.** Piped stdio is not a TTY, so `isTTY` is false, raw
mode never engages, and a `child_process` test exercises the non-interactive bailout rather than the
prompt. A pseudo-terminal is the only way to reach the keypress code. Playwright does not apply here;
it drives browsers.

Four tests now drive the real binary through a PTY: a detected target arriving preselected and
installing on enter, typing to filter and space-selecting an undetected target, enter with nothing
selected refusing to proceed, and ctrl-c aborting without writing.

They live in `test/pty/` and run under a separate script, because node-pty needs a native build and
should not block the plain suite where that is unavailable. `devDependencies` do not reach anyone
installing via npx or `npm i -g`, so the zero-runtime-dependency property is intact.

**Naming caught a real problem.** The first version was `test/prompt.pty.test.js`, which the default
`test/*.test.js` glob matches, so `npm test` and `npm run test:pty` silently ran the same thing and
the separation existed only in the script names.

## Tweak pass: bringing spec.md back in line with the code

Ran after implementation, which is what `necklace-tweak` is for. Three divergences, two of which
reading would not have surfaced.

**Phase order was backwards.** The document said detect, confirm, check environment, write. The code
checks beads first, which is better: nobody should pick targets and only then be told beads is
unusable. Document follows code.

**Node floor was wrong.** The document said 18, reasoning from `parseArgs` at 18.3 and `fs.cp` at
16.7. `package.json` says 20.11, because `import.meta.dirname` is what actually sets the floor and it
landed there. The constraint had been derived from the wrong API.

**A constraint had gone stale.** "Any report of what was written must come from a pass that runs
before the copy" was true when the design still detected conflicts. Always-overwrite removed the
pre-pass, and the report is now assembled by the copy loop. The line survived the design change that
invalidated it.

**necklace never runs `bd init`** is now stated in Approach rather than implied by "what to run if
not" in the outcome table.

Classified as a tweak, not a new increment: no outcome changed and no CUJ was invalidated, so no new
beads.

## CI

Three jobs.

**tests** across Node 22 and 24 on ubuntu, macos, and windows.

The floor moved from 20.11 to 22 while adding Windows. `cmd.exe` does not expand globs, so
`node --test test/*.test.js` in an npm script passes the literal string through on Windows. Node
expands the pattern itself when it is quoted, but only from v21. Rather than work around that, the
floor moved to 22: Node 20 reached end of life in April 2026, so the old floor was pinned to an
unsupported runtime for the sake of one API that 22 also has.

**pty** on one Node version but every OS, since node-pty needs a native build but ConPTY and the unix
pty differ enough that the prompt is worth running on both.

### Windows exposed a production bug, not just a harness one

The first version of this excluded Windows because `fakeBd` wrote a `#!/bin/sh` stub. That was the
wrong thing to fix around, and fixing it properly surfaced something real.

**Beads installed from npm on Windows is `bd.cmd`, and since Node 18.20 spawning a `.cmd` without a
shell throws.** So `spawnSync('bd', ...)` would have failed for every Windows user who installed
beads through npm, while working for anyone who used winget or Homebrew. `src/beads.js` now passes
`shell` on win32, which covers both.

It also needed `path.delimiter` rather than a hardcoded colon when prepending to PATH, and a fixup
for Windows resolving PATH case-insensitively while Node's `env` object does not: a lowercase `PATH`
added next to an existing `Path` is silently ignored.

The fake `bd` is now a Node script with a `bd` shim and a `bd.cmd` shim, which mirrors how beads
actually installs.

Windows CI is unverified locally, so the first run is the test.

**package** guards the silent failure from the npx-from-GitHub decision. An omitted `files` entry
installs nothing while appearing to succeed, so the job packs the tarball, asserts every skill and
the bin are inside and that `test/` is not, then installs that tarball globally and runs
`necklace init` in a temp directory. That covers the distribution path rather than assuming it.

It also checks the frontmatter contract every target depends on: each skill directory has a
`SKILL.md`, its `name` matches the directory, and it has a `description`. All four targets require
the first two and route on the third.

**Adding `.github/workflows/` does not make this repo look like a Copilot user.** Verified: `detect`
still returns `['claude']`. That is the payoff for keying Copilot off `copilot-instructions.md`,
`prompts/`, `agents/`, and `skills/` rather than off `.github/` existing.

## What CI found on the first three runs

All ten jobs green on run 31047906661. Three real defects surfaced, none visible from Linux.

**Windows tests failed on CRLF.** Git rewrote line endings on checkout, so the frontmatter assertion
saw `---\r\nname:`. Fixed with `.gitattributes` pinning LF rather than loosening the assertion: the
skills are the shipped payload and should be byte-identical on every platform.

**macOS pty failed with `posix_spawnp` while node-pty installed cleanly.** node-pty builds from source
on Linux but ships prebuilds on darwin, so the two platforms keep the helper in different places. The
first fix chmodded `build/Release/spawn-helper` and CI answered `No such file or directory`, which is
what pointed at the split. The actual cause is upstream: `prebuilds/darwin-arm64/spawn-helper` ships
mode 644 because npm tarballs do not preserve the executable bit. Verified in the local install and
confirmed by the run, which now prints `-rwxr-xr-x` before the tests pass.

**The Windows pty job hung rather than failing.** It ran roughly ten minutes past four tests that each
cap at eight seconds. The runner finishes and the process never exits, because a live ConPTY handle
holds the event loop open. `drive()` now releases the terminal on every path behind a `settled` guard.
Both jobs also carry `timeout-minutes: 5`, since a hang costs more than a failure and reports less.

**The Node floor moved 20.11 to 22** while adding Windows, because `cmd.exe` does not expand globs and
Node only expands them itself from v21. Node 20 reached end of life in April 2026, so the old floor
pinned an unsupported runtime for one API that 22 also has.

The pattern worth keeping: excluding Windows because the harness wrote a `#!/bin/sh` stub would have
hidden a production bug. Beads from npm on Windows is `bd.cmd`, and Node has refused to spawn a `.cmd`
without a shell since 18.20, so `necklace init` would have failed for every Windows user who installed
beads that way while working for anyone on winget or Homebrew.

## PTY coverage past the prompt

The four original PTY tests all invoked the binary with identical argv,
`init --skip-beads-check`, interactive. So `bin/necklace.js` ran, but along one path:
parse, gate skipped, detect, prompt, install, report. Everything else in it was
unexercised, including the one that matters most, the gate failing and nothing being
written.

The first response to that was a proposal to extract `bin/` into a testable `run()` so
the branches could be unit tested, on the reasoning that PTY tests are heavyweight and
should stay narrow. That reasoning was invented: a PTY job is about fifteen seconds per
OS in CI. Nathan pointed it out and the refactor was dropped.

`drive()` now takes `argv` and `env`, so every path goes through the same harness as a
real process. Six tests added: `--help`, unknown command, a typo'd flag, the gate failing
with a broken `bd`, a repo with no beads workspace, and `--agent` installing without ever
showing the prompt. Ten PTY tests in total.

**Mutation-checked rather than trusted.** All six passed on the first run, so the gate was
disabled in `bin/necklace.js` to confirm they would notice: two failed, the right two, and
both passed again once it was restored. A test that has never been seen to fail is not
evidence.

## Tweak pass: CI, Windows, licensing, repo hygiene

Everything since the CLI shipped, brought back into the documents.

**spec.md gained three things.** An actor-outcome row for the Windows installer, a platform
constraint recording that npm's beads on Windows is `bd.cmd` and Node has refused to spawn one
without a shell since 18.20, and the licensing decision with the reason there is no `NOTICE`.

**cuj.md gained CUJ-05**, for Windows. It is genuinely CUJ-shaped: a new actor, an observable
outcome, and tests that were red when written, since the whole Windows matrix was failing. It has no
beads and never will, because the work was already finished when the CUJ was written.

### The Beads line needed a third state

Nathan asked how a CUJ finished outside the bead flow gets marked so no future agent picks it up.
It could not, and that is a real hole: an empty `**Beads:**` line meant both "not broken down yet"
and "done directly", which are opposite instructions to whoever reads next.

Three states now, written into the template, `necklace-cuj`, `necklace-beads`, and `necklace-tweak`:

- bead IDs, meaning broken down, check `bd`
- `none - done directly in <ref>`, meaning finished without beads
- empty, meaning work is waiting, and now the *only* state that means that

`necklace-beads` skips the first two and says which it skipped. `necklace-tweak` writes the second
when a tweak turns out to be CUJ-shaped.

### Not written into cuj.md

CI, the PTY coverage, the licence scrub, and the beads gitignore are not CUJs. None gives an actor a
new observable outcome. They are in this ledger and nowhere else, which is the correct home for work
that changes how the project is built rather than what it does.

## Tweak: the prompt left a blinking cursor on screen

Reported from a real npx install. The prompt redraws its list on every keypress and the terminal
cursor sat wherever the last redraw left it, blinking over the options. Installers do not normally
show one.

Fixed with the two standard escapes, hide on entry and show on the way out. The restore runs on
`finish`, and also on `exit` and `SIGINT`, because a cursor left hidden survives the process and the
user is left with a terminal that looks broken until they reset it. That failure is worse than the
one being fixed, which is why it gets three exits rather than one.

**The first test for it passed against a deliberately broken build.** Removing the restore from
`finish` changed nothing, because the `exit` handler still fired and the assertion only checked that
a restore appeared somewhere in the output. Functionally the cursor did come back, but only after the
install had finished printing, which is precisely the window the user is watching.

Tightened to assert the restore lands *before* the install report. That passed locally and **broke CI
on all three operating systems**, which is the second mistake and the more interesting one.

Locally the restore sits at byte 334 and the install report at 342: an eight-byte margin in a stream
whose interleaving is not something an end-to-end test should be asserting on. The fix was not to
chase why the ordering differs on a runner. It was to notice that a precise ordering guarantee does
not belong in a test that drives a real terminal through a real process.

The guarantee moved to `test/prompt.test.js`, which calls `multiSelect` directly with a fake TTY and
asserts the restore is written before the promise resolves. Deterministic, no timing, and it fails
when the restore is removed from `finish` while the process-exit handler is still in place. The pty
test keeps the end-to-end property it can actually hold: both sequences appear, in that order.

Committing on a green local run was the process failure. Three suites exist and only two were run.

Also removed the pinned-tag install line from the README. npx re-resolves the ref on every run, so
the plain form always gets `main` and the tag form was offering a solution to a problem that does
not exist.
