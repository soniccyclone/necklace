---
name: necklace-beads
description: Task-break-down a necklace CUJ document into beads using bd, then work them to completion. Stage 3 of the necklace pipeline. Use after cuj.md exists, or when asked to break a CUJ document down into beads and iterate through them. Consumes cuj.md; creates beads and implements them.
---

# necklace-beads

Break the CUJ document down into beads, then work them.

**Consumes:** `.necklace/<date>-<slug>/cuj.md`.

## Beads is required

Run `bd --version` and check the exit status. Run it; do not check PATH, because a `bd` that resolves
on PATH can still be a broken install shim.

If it exits nonzero, stop. necklace requires a working `bd` and there is no fallback. Do not write a
task list to a file and do not use a session todo tool.

## Follow bd, do not reimplement it

`bd init` installs a `beads` skill and wires hooks that inject `bd prime`. Read `bd prime` and use
what it teaches:

- `bd create --title=... --description=... --type=... --priority=N`
- `bd create ... --parent=<id>` for hierarchy. Children inherit parent labels.
- `bd dep add <issue> <depends-on>`

Priority is 0-4, where 0 is critical. Never use `bd edit`.

Two constraints worth knowing before you build the graph:

- **`blocks` edges are type-symmetric.** A task cannot block an epic and an epic cannot block a task.
  Express CUJ dependencies leaf to leaf.
- **Verify edges by reading them back**, with `bd list --json`. A `dep add` that printed nothing may
  have failed.

## The breakdown

Skip any CUJ carrying a `**Blocked:**` line. It waits on a judgment question nobody has answered, and
breaking it into beads creates work that was never agreed to. Say which ones you skipped.

For each CUJ: one bead, or an epic with children when it is large. Label it `cuj:CUJ-NN`. Put the
CUJ's test names in the description so whoever picks it up knows what closes it. Turn each
`Depends on` into a dependency.

## Then work them to completion

Take the ready work, implement it, and keep going until the graph is done.

For each bead: write the tests its CUJ names **first**, watch them fail, then implement until they
pass. A test that passes the moment you write it is testing nothing.

Run the suite before closing anything. `bd close <id>` when its CUJ's tests pass.

## Keep the ledger current

Append to `ledger.md` as you go, and keep appending after implementation starts. Record decisions
made while implementing, especially where the code had to depart from what the CUJ document assumed.

When the user comes back with changes after running the feature, that is `necklace-tweak`.

## Export the graph

End with:

```
bd export -o .beads/issues.jsonl
git add .beads/issues.jsonl
```

Auto-export is interval-gated, so right after a burst of `bd create` calls the exported file is
stale. Both lines are needed: `bd export` alone writes to stdout, and `-o` alone does not stage.

Then write the bead IDs back into each CUJ's **Beads:** line in `cuj.md`.
