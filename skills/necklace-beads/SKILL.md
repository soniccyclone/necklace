---
name: necklace-beads
description: Break a necklace CUJ document down into beads with bd, then run the red gate that proves every named test exists and fails. Stage 3 of the necklace pipeline. Use after necklace-cuj has produced cuj.md, or when the user asks to task-break-down a CUJ document into beads. Consumes cuj.md; creates beads and produces failing tests.
---

# necklace-beads

Turn the CUJ document into beads, then prove the tests are red. This is stage 3 of 3.

**Consumes:** `.necklace/<date>-<slug>/cuj.md`.
**Produces:** beads in `bd`, a committed `.beads/issues.jsonl`, and red tests in the repo.

If `cuj.md` does not exist, stop. Run `necklace-cuj` first.

## Beads is required

**Run `bd --version` and check the exit status before doing anything else.**

Run it. Do not check whether `bd` is on PATH. A `bd` that resolves on PATH can still be a broken
install shim that exits nonzero on every call, and a PATH check would pass and then fail later,
after you had already created work.

If it exits nonzero: **stop here.** Report that necklace requires a working `bd` and point at
`necklace init`. Do not generate anything first, do not write a task list to a file, and do not use
a session todo tool. There is no fallback. A partial run that leaves an unimported artifact on disk
is how someone talks themselves into building an importer later.

Minimum version: 1.1.0.

## Do not reimplement beads

`bd init` installs a `beads` skill in the repo and wires hooks that inject `bd prime`. Between them
they own the execution loop and the creation vocabulary. Read `bd prime` and follow it.

Use the commands `bd prime` teaches:

- `bd create --title="..." --description="..." --type=... --priority=N`
- `bd create ... --parent=<id>` for hierarchy. A child inherits its parent's labels.
- `bd dep add <issue> <depends-on>` for edges.

`bd import`, `bd create --graph`, and `bd create --file` exist. `bd prime` mentions none of them, so
do not reach for them. Do not transcribe any beads file format into this repo.

Priority is `0-4` or `P0-P4`, where 0 is critical. Not "high" or "medium".

Never use `bd edit`. It opens an interactive editor and blocks.

## Mapping the CUJ document to beads

**Shape is per-CUJ sizing, not policy.** A small CUJ becomes one bead. A large one becomes an epic
with children, which gives dotted IDs like `bd-a3f8.1`. Nothing in the method reads the shape,
because the label carries traceability either way.

For each CUJ:

1. Create the bead, or the epic plus its children.
2. Label it `cuj:CUJ-NN`. Label the epic and the children inherit it.
3. Carry the CUJ's test names into the bead description. A bead that does not know which tests close
   it cannot be closed correctly.
4. Turn every `Depends on: CUJ-NN` into a `bd dep add` against the right bead of that CUJ.

## Validate before it lands

The CUJ document is the review artifact. The graph derives from it, so check the document, not a
generated file:

- The graph is a DAG.
- Every CUJ has at least one bead.
- Every `Depends on` appears as an edge.
- Every bead carries a `cuj:CUJ-NN` label.
- Every bead inherits the test names from its CUJ.

## Export, or the backlink breaks

Auto-export is gated by `export.interval`, default 60 seconds. Right after a burst of `bd create`
calls the exported file holds only part of the graph, and it does not catch up until the next `bd`
command after the interval has passed. That is the wrong moment: the person who ran the breakdown is
committing now.

So end the breakdown with both lines:

```
bd export -o .beads/issues.jsonl
git add .beads/issues.jsonl
```

Both are needed. `bd export` with no `-o` writes to stdout and leaves the file stale. `-o` writes the
file but does not stage it.

If `bd config get export.auto` is not true, say so and point at `necklace init`. The committed
`.beads/issues.jsonl` is what makes a bead ID in the CUJ document resolve for anyone reading the repo
without running `bd`.

Then write the bead IDs back into each CUJ's **Beads:** line in `cuj.md`. The labels point one way;
this points the other.

## The red gate

After the beads land and before any implementation:

1. Every test named in the CUJ document exists in the repo. Write the ones that do not.
2. Every named test **fails**, for the right reason. A missing symbol or a failed assertion counts. A
   syntax error in the test itself does not.
3. Every bead traces to a CUJ. Every CUJ traces to at least one red test.

**Run the suite and paste the failing output into the conversation.** Do not assert that the tests
are red. A test that was green the moment it was written is the most likely way this method degrades
into theater, and the output is the only thing that rules it out.

Red tests across every CUJ mean the specification is complete and executable. Implementation becomes
a mechanical march.

## Handing off

Say that the graph is in beads, that the tests are red, and that execution runs through the repo's
`beads` skill: `bd ready` to find work, `bd update <id> --claim` to take it, `bd close` when the
CUJ's tests pass.

Do not start implementing. That is a separate decision the user makes.

## Done when

Beads exist for every CUJ, `.beads/issues.jsonl` is exported and staged, `cuj.md` carries the bead
IDs, and failing test output is in the conversation.
