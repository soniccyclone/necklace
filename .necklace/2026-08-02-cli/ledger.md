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

**The beads gate warns about export config in a repo that has no beads workspace.** Correct but
noisy: the real finding there is "not initialized", and the two export keys are downstream of that.
Left as is for the first pass rather than adding a third state.

**Not covered by tests:** `src/prompt.js` and `bin/necklace.js`, both TTY-bound. Verified by hand
against a scratch repo with `--agent claude --agent cursor`, which wrote 12 skill directories and
printed every path. The interactive selection path has not been exercised at all.
