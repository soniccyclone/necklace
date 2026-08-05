---
name: necklace-spec
description: Generate a high-level planning document for a ticket or subsystem, researching it first by exercising real code paths in a REPL rather than by reading source and reasoning. Stage 1 of the necklace pipeline. Use when asked to generate a planning document over a Jira ticket, a bug, or a subsystem about to be built. Produces spec.md and ledger.md.
---

# necklace-spec

Generate the high-level planning document for a ticket or a subsystem.

**Produces:** `.necklace/<YYYY-MM-DD>-<slug>/spec.md` and `ledger.md`.

**Most of your effort goes into the research below, not into writing.** A planning document written
from reading source is a guess with formatting. Exercise the code first.

## Two documents, different jobs

`spec.md` holds **active design only**. What we are doing and why, as it currently stands. When a
decision changes, the document changes; the old version does not stay behind in it.

`ledger.md` holds **everything else**: what was discussed, what was rejected and why, findings,
judgment calls and who made them. Open it before writing anything and append as you go, not at the
end. It keeps recording after implementation starts, including edits made directly to the code that
diverge from the plan.

Never let the planning document become a record of how it was written.

## Research by exercising the code

This is the part that makes the document worth anything. Do it before proposing an approach, not
after.

### Get the project loaded

Find how this codebase gets into a live process, and use that. Not a bare interpreter, and not a
mock.

- Python: `python` with the package importable, or `ipython`. Check for a `conftest.py`, a
  `shell.py`, or a management command that sets up context.
- Ruby: `rails console`, or `irb -r ./lib/<project>`.
- Elixir: `iex -S mix`. Clojure: `lein repl` or `clj` in the project.
- Node: `node --require ./index.js`, or `npx tsx` for TypeScript.
- Haskell: `cabal repl`. Scala: `sbt console`.

**Where the runtime cannot load and redefine code, the test runner is the REPL.** Go, Rust, C#, Java,
C++. Write a scratch test, run it, edit, re-run. `go test -run TestScratch`, `cargo test scratch`,
`dotnet test --filter`. The test harness reaches internals a scratch binary cannot: in-package Go
tests see unexported identifiers, Rust `#[cfg(test)]` sees private items, .NET test projects reach
`internal`.

**Do not install a REPL.** If the toolchain did not ship one and the project does not use one, that
absence tells you which mode you are in. Something marketed as a REPL that recompiles per snippet
gives none of the benefit and costs an install.

### Exercise the actual path

Call the real functions with real data shapes. The point is to find out what the system does, not to
confirm what you think it does.

- Start from the entry point the ticket names and follow it down.
- Use realistic inputs, including the size and shape that the ticket says is failing.
- Measure when the question is about cost: time it, trace memory, count queries.
- Push it until it breaks, and note where.
- When the behavior depends on state, set the state up and vary it.

**Reading source and reasoning about it is not this.** Source tells you what was intended. Running
tells you what happens. When the two disagree, the run is right, and that disagreement is usually
the most valuable thing you will find.

### Ask questions that have observable answers

Before each probe, state what result would prove you wrong. One line. A probe that cannot fail
proves nothing and will happily flatter whatever you already believed.

Then run it, and write down what actually came back, including the numbers.

### Keep going until the questions stop changing

Each answer raises the next question. That is the loop working. Stop when a round produces no new
questions, or after about three rounds.

### Resolve your own questions

A question that names a symbol, a file, a version, an API, or a config key is **factual**. Resolve it
yourself by reading or by running. Do not hand it to the user.

Only **judgment** questions reach the user: preference, priority, risk appetite, scope. Each one must
state why neither reading nor running settles it.

A well-worded question reads like progress, which is the trap. Check its shape, not how it feels.

### What survives

Scripts live in `repl/` inside the planning directory, committed. They are the answer to "why did we
decide this" six months later.

Findings go in the documents. A finding that informs a claim gets cited inline with its numbers. A
finding that informs a test earns a row in the CUJ document's `Informed by` column later.

A scratch test is not a test. It stays in `repl/` and never joins the suite.

## Then write the document

Use `spec.md` in this skill directory as the template. Roughly two pages.

What it contains: the problem with evidence, the actors it touches, what each actor must be able to
observe afterward, real constraints, and the chosen approach at strategy level.

What it does not: file paths, function names, type signatures, schemas, test names, task ordering.
Those are the next document's job. Rejected alternatives and answered questions belong in the ledger.

Expect to revise it while the user argues with it. Keep researching during that argument rather than
waiting; most objections are answerable by running something.

## Done when

The user is satisfied with the design. Then say the next step is `necklace-cuj`.
