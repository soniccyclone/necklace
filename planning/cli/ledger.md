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

**Planning artifacts live in `planning/cli/`, not `.necklace/<date>-<slug>/`.** The skill hardcodes
the latter. This repo is where necklace is built rather than a repo it was installed into, and it
already had a `planning/` convention.

Noted as a finding against `necklace-spec`: the planning root should follow an existing convention in
the repo when there is one, rather than being fixed.

**No dated slug directory here either.** The CLI is one long-lived subsystem, not a ticket. The dated
run directory suits a ticket; a subsystem being built over several sessions does not need a new one
each time.

## Open

Nothing yet.
