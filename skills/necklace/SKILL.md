---
name: necklace
description: Run the full necklace pipeline on a ticket, producing a spec document, then a CUJ document, then a beads breakdown with a red gate. Use when the user asks to plan, spec out, design, or break down a ticket, feature, or bug using necklace or Agentic REPL-Driven Development. This is the entry point; it sequences necklace-spec, necklace-cuj, and necklace-beads.
---

# necklace

Three artifacts, in order. A run that produces all three has followed the method. A run that skips
one has not.

You are the sequencer. You do not write the documents yourself. Invoke each skill, confirm its
artifact landed, then move on.

## Before starting

Confirm beads works. Run `bd --version` and check the exit status.

If it exits nonzero, stop. Do not start the pipeline. Report that necklace requires a working `bd`
and that `necklace init` sets it up. Do not offer a workaround, and do not track the breakdown any
other way.

## The sequence

Run these in order. **The gate between stages is the artifact on disk, not what the previous stage
told you.** Check for the file before continuing. A stage that claims success without producing its
file has not succeeded.

1. **`necklace-spec`.** Produces `.necklace/<date>-<slug>/spec.md` and opens `log.md`.
   Gate: `spec.md` exists.
2. **`necklace-cuj`.** Reads `spec.md`, produces `cuj.md`.
   Gate: `cuj.md` exists and every CUJ in it has a test table with at least one row.
3. **`necklace-beads`.** Reads `cuj.md`, creates the beads, runs the red gate.
   Gate: the red gate output is in the conversation, showing tests that fail.

Between stages, say which stage finished and which is next. Do not run stage 2 or 3 without being
asked to continue if the user is reviewing.

## When a gate fails

Say what is missing and stop. Do not proceed to the next stage and do not write the missing artifact
yourself. The stage that owns an artifact is the stage that writes it.

If a stage produced its file but the file is thin, that is a signal to re-run that stage with more
context, not a signal to move on.

## Resuming

The planning directory is the state. If `.necklace/<date>-<slug>/` already exists, read what is there
and resume at the first missing artifact. Read `log.md` first: it holds decisions and answers from
earlier in the run that are not in the documents yet.

Do not start a new run directory for a ticket that already has one.

## What you do not do

- Do not write `spec.md`, `cuj.md`, or the beads yourself.
- Do not skip a stage because the ticket seems small. A ticket gets the full pipeline.
- Do not summarize a stage's output back into the next stage. Each stage reads the artifact.
