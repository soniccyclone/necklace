---
name: necklace-tweak
description: Make code edits the user asks for after running a feature locally, then bring the planning document back in line with what the code now does and record the change in the ledger. Use after necklace-beads has finished a feature and the user has tried it and wants changes. Consumes running code and user feedback; updates the code, spec.md, and ledger.md.
---

# necklace-tweak

The user ran the feature and wants changes. Make them, then bring the documents back in line.

**Consumes:** the working code, and what the user asked for.
**Updates:** the code, `spec.md`, and `ledger.md` in the relevant planning directory.

This is the step after `necklace-beads`. It is also the step you return to after any later loop
through the pipeline.

## Make the edit

Normal work. Read the surrounding code, match it, change what was asked for, run the tests.

If the change breaks a test that a CUJ named, that is a real decision point, not a nuisance. Either
the test was wrong about what the system should do, or the edit is wrong. Say which, and say it
before changing the test.

## Then bring the documents in line

Two different jobs. Do both.

**`spec.md` gets updated to describe what the code now does.** It holds active design, and after this
edit the active design has changed. Update the affected part so the document is true again. This is
the direction the method runs: the code is the source of truth and the document follows it. A
planning document that disagrees with shipped code is worse than no document, because someone will
believe it.

Do not append a changelog to `spec.md`. Change the section in place, so it reads as though it always
said this. History lives elsewhere.

**`ledger.md` records that the change happened.** What changed, what the document said before, what
prompted it, and any decision made along the way. This is where the history goes.

Keep both edits small and specific. Most tweaks touch one paragraph of `spec.md` and add a few lines
to `ledger.md`.

## When a tweak is actually a new increment

Judgment call, and it is the one worth getting right.

**Just a tweak:** the outcomes in `spec.md` are unchanged and you are correcting how one of them
works. Edit the code, update the document, note it in the ledger, done. No new beads.

If the tweak turns out to be CUJ-shaped, meaning it gave an actor a new observable outcome and it has
tests, write the CUJ into `cuj.md` anyway and set its `**Beads:** none - done directly in <ref>`.
The work is finished, so it never gets beads, and the marker is what stops a later agent picking it
up as pending. A CUJ with an empty `**Beads:**` line reads as available work.

**A new increment:** the change adds an outcome, changes who the feature is for, or invalidates a CUJ
rather than adjusting one. Say so and offer to loop:

1. Edit `spec.md` for the new shape.
2. Run `necklace-cuj` to generate a new CUJ document from the updated `spec.md`. Put it beside the
   existing one as `cuj-2.md`, `cuj-3.md`, and so on. Do not overwrite the old one; it records what
   the earlier beads were cut from.
3. Run `necklace-beads` on the new CUJ document.
4. Come back here when the user has run it again.

The pipeline is a loop, not a line. Someone can go around it as many times as the work needs.

Do not start that loop on your own. Say which of the two you think this is and let the user decide.

## Done when

The code does what was asked, the tests pass, `spec.md` is true again, and `ledger.md` says the
change happened.

Commit it. Do not push.
