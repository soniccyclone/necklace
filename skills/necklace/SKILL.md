---
name: necklace
description: Run the full necklace pipeline on a ticket or subsystem, producing a planning document, then a CUJ technical design document, then a beads breakdown worked to completion. Use when asked to plan out a ticket, feature, bug, or subsystem with necklace. Sequences necklace-spec, necklace-cuj, and necklace-beads.
---

# necklace

Three steps, in order.

1. **`necklace-spec`** turns the ticket into `spec.md`, researching it by exercising real code paths
   first. Expect to argue about the design here; that is the point of the step.
2. **`necklace-cuj`** turns `spec.md` into `cuj.md`, vertical slices each naming their tests.
3. **`necklace-beads`** breaks `cuj.md` into beads with `bd` and works them to completion.

Check `bd --version` before starting. If it exits nonzero, stop: necklace requires a working `bd`.

Then **`necklace-tweak`**, once the user has run the feature and wants changes. It edits the code,
brings `spec.md` back in line with what the code now does, and records the change in `ledger.md`.

Move to the next step when the user is happy with the current one, not automatically. Step 1 is where
the time goes.

**It is a loop, not a line.** From `necklace-tweak` the user can go back to editing `spec.md`,
generate a new CUJ document beside the old one, break that into beads, and come back. Go around as
many times as the work needs.

`ledger.md` opens in step 1 and stays open through all of it. `spec.md` holds active design only, and
gets updated to match the code whenever the code moves ahead of it.
