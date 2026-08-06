---
name: necklace-beads
description: Task-break-down a necklace CUJ document into beads using bd, then work them through to completion. Stage 3 of the necklace pipeline. Use after cuj.md exists, or when asked to break a CUJ document down into beads and iterate through them. Consumes cuj.md; creates beads and implements them.
---

# necklace-beads

Break the CUJ document down into beads, then work them to completion.

**Consumes:** `.necklace/<date>-<slug>/cuj.md`.

## bd owns the mechanics

Run `bd prime`. It is usually hook-injected already, and it carries the command reference, the
priority format, and the session protocol. The repo's own `beads` skill covers the execution loop.
Do not restate either of them and do not work around them.

This skill only adds what bd cannot know: how a CUJ document maps onto beads.

If `bd --version` exits nonzero, stop. necklace requires a working `bd` and there is no fallback. Run
it rather than checking PATH, because a broken install shim still resolves.

## The mapping

Skip any CUJ whose `**Beads:**` line already names beads or says `none - done directly`, and any
carrying a `**Blocked:**` line. Say which ones you skipped and why. Only an empty `**Beads:**` line
means there is work waiting.

For every other CUJ: one bead, or an epic with children when it is large. Label it `cuj:CUJ-NN`, and
put the CUJ's test names in the description so whoever picks it up knows what closes it.

## Working them

For each bead, write the tests its CUJ names **first** and watch them fail, then implement until they
pass. A test that passes the moment you write it is testing nothing.

Close a bead when its CUJ's tests pass.

## Finishing

Export the graph and stage it, so a bead ID stays resolvable for anyone reading the repo without
running bd:

```
bd export -o .beads/issues.jsonl
git add .beads/issues.jsonl
```

Both lines. Auto-export is interval-gated, so straight after a burst of creates the file is stale;
`bd export` alone writes to stdout, and `-o` alone does not stage.

Then write the bead IDs into each CUJ's **Beads:** line in `cuj.md`, and append to `ledger.md`
anything the implementation forced that the CUJ document did not anticipate.

Commit the planning directory as you go rather than at the end. What happens to the beads themselves,
including whether anything is pushed, is bd's session protocol and the user's configuration. Do not
override it.
