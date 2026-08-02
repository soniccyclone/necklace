---
name: necklace-cuj
description: Turn a necklace spec document into a CUJ technical implementation document, one vertical slice per actor-outcome pair, each carrying a mandatory table of the tests to create. Stage 2 of the necklace pipeline. Use after necklace-spec has produced spec.md, or when the user asks for the CUJ document. Consumes spec.md; produces cuj.md.
---

# necklace-cuj

Turn the spec document into vertical slices, each carrying the instruction for producing its test.
This is stage 2 of 3.

**Consumes:** `.necklace/<date>-<slug>/spec.md`.
**Produces:** `cuj.md` in the same directory.

If `spec.md` does not exist, stop. Run `necklace-spec` first. Do not write the spec document
yourself and do not work from the ticket directly.

## One CUJ per actor-outcome pair

The spec document establishes the actors and what each must observe. Each pair becomes one CUJ: an
actor, a trigger, a journey, and an observable outcome.

Slice **vertically**. A CUJ goes all the way through the system for one actor's outcome. Do not slice
by layer, and do not produce a phased roadmap. Layer-organized work makes each task depend on context
from the tasks before it, and context cost grows superlinearly. Independent slices take small fixed
packets.

If the CUJs start provoking argument, that is a signal the spec document left an actor or an outcome
undecided. Go back one step rather than negotiating here.

## The shape

Use `cuj.md` in this skill directory as the template.

```markdown
## CUJ-03: Operator restores a workspace from a snapshot

**Actor:** on-call operator
**Trigger:** workspace corruption detected by the health check
**Journey:**
1. Operator runs `foo restore --at <timestamp>`
2. System resolves the nearest snapshot at or before the timestamp

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `TestRestore_PicksNearestPriorSnapshot` | three snapshots, one written out of filename order | resolves to the 14:02 snapshot, not the lexically-last one | REPL: snapshots sort by commit time, filename order lies |

**Done when:** both tests above pass. Both must be red when created.

**Depends on:** CUJ-01
```

## Rules for the table

**The test table is mandatory.** Every CUJ names at least one test, its input, and its assertion. A
CUJ with no test table is not finished.

- **Test** is the name the test will have in the repo. Use the project's naming convention.
- **Input** is the specific state or data the test sets up. Not "a valid request"; say what makes it
  the interesting case.
- **Assertion** is what must hold. One observable claim.
- **Informed by** is optional. Fill it when a REPL session produced the finding behind the test.
  Leave it empty when the test follows from the requirement directly. A test does not need REPL
  provenance to be valid; it needs an input and an assertion.

**`Done when` names tests and nothing else.** A test is the only thing that closes a CUJ. Not a
review, not a demo, not a manual check.

## Journey steps

Active voice, name the actor, one instruction per line. These are procedures and an agent will parse
them.

## Dependencies

`Depends on: CUJ-NN` when one slice genuinely cannot start before another. Be sparing. Every
dependency you add narrows what can be worked in parallel, and a graph that runs deep instead of wide
is the failure this method exists to avoid.

Do not add a dependency merely because one CUJ touches code another CUJ also touches.

## The REPL workflow

Same as stage 1. Reach for it whenever a question about the system is factual. Work in `repl/` inside
the planning directory. Prefer a real REPL with the project loaded; where the runtime cannot load and
redefine code, use the project's test runner as a scratch pad. Do not install a REPL.

Resolve factual questions yourself. Only judgment questions reach the user.

A scratch test is not a test. It stays in `repl/` and never enters the table above.

## The working log

Keep appending to `log.md` as you go: why a CUJ was sliced the way it was, alternatives rejected,
REPL findings, judgment calls and who made them.

## After the breakdown

Once `necklace-beads` has run, come back and record each CUJ's bead IDs in this document. That
backlink is what lets someone reading the repo later connect a bead to the reason it exists. The
beads carry `cuj:CUJ-NN` labels pointing the other way.

## Done when

Every actor-outcome pair from `spec.md` has a CUJ, every CUJ has a test table with at least one row,
and every `Done when` names only tests. Then say the next stage is `necklace-beads`.
