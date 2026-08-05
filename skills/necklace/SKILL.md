---
name: necklace
description: Run the full necklace pipeline on a ticket or subsystem: a planning document, then a CUJ technical design document, then a beads breakdown worked to completion. Use when asked to plan out a ticket, feature, bug, or subsystem with necklace. Sequences necklace-spec, necklace-cuj, and necklace-beads.
---

# necklace

Three steps, in order.

1. **`necklace-spec`** turns the ticket into `spec.md`, researching it by exercising real code paths
   first. Expect to argue about the design here; that is the point of the step.
2. **`necklace-cuj`** turns `spec.md` into `cuj.md`, vertical slices each naming their tests.
3. **`necklace-beads`** breaks `cuj.md` into beads with `bd` and works them to completion.

Check `bd --version` before starting. If it exits nonzero, stop: necklace requires a working `bd`.

Move to the next step when the user is happy with the current one, not automatically. Step 1 is where
the time goes.

`ledger.md` is opened in step 1 and stays open through all three, and past them. `spec.md` holds
active design only.
