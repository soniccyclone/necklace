---
name: necklace-cuj
description: Generate a CUJ style technical design document from a necklace planning document, one vertical slice per outcome, each naming the tests that close it. Stage 2 of the necklace pipeline. Use after spec.md exists, or when asked to generate a CUJ document from a planning document. Consumes spec.md; produces cuj.md.
---

# necklace-cuj

Generate the CUJ technical design document from the planning document.

**Consumes:** `.necklace/<date>-<slug>/spec.md`.
**Produces:** `cuj.md` in the same directory.

If `spec.md` does not exist, stop and run `necklace-spec` first.

## One CUJ per outcome

The planning document says who the change touches and what each of them must be able to observe.
Each of those becomes one CUJ: an actor, a trigger, a journey, an observable outcome.

Slice **vertically**, all the way through the system for one outcome. Not by layer, not as phases.
Layered work makes each task inherit context from the task before it.

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

**Done when:** the test above passes. It must be red when created.

**Depends on:** CUJ-01
```

## The test table is mandatory

Every CUJ names at least one test, its input, and its assertion.

- **Test**: the name it will have in the repo. Read an existing test file first and match that
  convention.
- **Input**: what makes this the interesting case. Not "a valid request".
- **Assertion**: one observable claim.
- **Informed by**: optional. Fill it when REPL work produced the finding behind the test. Most rows
  will be empty, which is correct.

**`Done when` names tests and nothing else.**

## CUJs blocked on an open question

`spec.md` may carry an unresolved judgment question. Write the CUJ that depends on it anyway, and add
a `**Blocked:**` line naming the question.

Do not drop it, which loses the analysis, and do not let `necklace-beads` break it into beads, which
creates work nobody has agreed to. It stays written and unbroken until someone answers.

## The Beads line means three different things

- **Bead IDs**: broken down, check `bd` for status.
- **`none - done directly in <ref>`**: finished without beads, by `necklace-tweak`. Nobody should
  pick it up.
- **Left empty**: not broken down yet. This is the only state that means there is work waiting.

Never leave it empty for work that is already done. An empty line is a standing invitation for the
next agent to start something that finished months ago.

## Dependencies

`Depends on: CUJ-NN` only when one slice genuinely cannot start before another. Not because two CUJs
touch the same code.

## Keep researching

The same REPL work from stage 1 applies here, and stage 2 is where the specific questions show up:
what does this function actually return, what shape is that data, what happens at the boundary. Load
the project and find out rather than assuming.

Resolve factual questions yourself. Keep appending to `ledger.md`, and **commit as you go, never
push**, same as stage 1.

## After the breakdown

Once `necklace-beads` has run, record each CUJ's bead IDs here.

## Later increments

When `spec.md` changes after a feature has shipped and the change is big enough to need new beads,
generate a new document beside this one: `cuj-2.md`, `cuj-3.md`. Do not overwrite an existing CUJ
document. It records what its beads were cut from, and that link is the reason the beads carry
`cuj:` labels.

## Done when

Every outcome has a CUJ and every CUJ has a test table. Then say the next step is `necklace-beads`.
