---
name: necklace-spec
description: Write the high-level spec document for a ticket as the first stage of the necklace pipeline, using the two-sided altitude test and the self-answer loop. Use when starting necklace or Agentic REPL-Driven Development on a ticket, or when the user asks for the spec document specifically. Consumes a ticket; produces spec.md in a new planning directory.
---

# necklace-spec

Turn a ticket into a high-level spec document. This is stage 1 of 3.

**Consumes:** a ticket, issue, or feature request.
**Produces:** `.necklace/<YYYY-MM-DD>-<slug>/spec.md`, and opens `log.md`.

## First run in a repo

Invoke `necklace-lint` once, before writing anything. It checks whether `.necklace/` will be picked
up by the repo's test discovery or its scanners, and proposes the fixes. Do not skip this and do not
do it yourself.

## Set up the planning directory

```
.necklace/<YYYY-MM-DD>-<ticket-slug>/
├── spec.md
├── log.md
└── repl/
```

Date prefix plus a short slug from the ticket. Create `log.md` and start appending to it **now**, not
at the end. See "The working log" below.

## Altitude

This is the decision that makes or breaks the pipeline. Too vague and no CUJ can be derived. Too
detailed and it becomes the CUJ document.

Apply both questions to your own draft:

- **Could two competent engineers read this and implement it differently, and both be right?**
  Must be yes. A no means you have made implementation decisions that belong in the CUJ document.
- **Could two competent engineers read this and disagree about whether the ticket was satisfied?**
  Must be no. A yes means you have not said what better looks like.

Roughly two pages for a normal ticket. Length is a symptom; the two questions are the rule.

## What the document must contain

Use `spec.md` in this skill directory as the template.

- **The problem, with evidence.** What is broken or missing, and how you know.
- **The actors.** Every party the change touches: a human role, a calling service, an operator.
- **Actor-outcome pairs.** For each actor, what it must be able to observe after the change. This is
  the load-bearing section, because the CUJ document turns each pair into a journey and a test.
- **Real constraints.** Existing systems, data volumes, compatibility, deadlines. A constraint you
  cannot cite is a preference; file it under approach. State the constraint, put the reasoning in
  the log.
- **The chosen approach, at strategy level.** Name the strategy. Rejected alternatives go in the log,
  with why. Rejecting them is still required; printing them here is not.
- **Open judgment questions, and only the open ones.**

## What the document must not contain

- File paths, function names, or type signatures.
- Schema or data structure definitions.
- Library choices, unless a library choice *is* the decision under discussion.
- Test names.
- Task ordering or effort estimates.
- Factual questions. See below.
- Rejected alternatives or answered questions. Those are in the log.

## The self-answer loop

This is the part that matters most and the part most often skipped.

1. Draft the document.
2. Extract your own open questions into a list.
3. Classify each as **factual** or **judgment**.
   - Factual: answerable by reading code or by running something. A question naming a symbol, a file,
     a version, an API, or a config key is factual by pattern.
   - Judgment: preference, priority, or risk appetite.
4. **Resolve every factual question yourself.** Reading settles some. A REPL session settles the
   rest. Do not hand a factual question to the user.
5. Revise the document and return to step 2, because answers raise new questions.
6. Stop when the question set stops changing, or after three rounds.

A factual question left in the document is a defect. A judgment question must state why neither
reading nor running settles it.

A well-worded question reads like progress, which is the trap. Check the shape, not the feeling: if
it names a symbol, file, version, or API, resolve it.

## The REPL workflow

Reach for this while working through the document. It is not a phase and produces no required
artifact. Work in `repl/` inside the planning directory.

Prefer the highest rung the project supports:

1. **A real REPL with the project loaded.** Available when the runtime can load and redefine code in
   a live process: Lisps, Elixir, Python, Ruby, Node, Julia, R. `lein repl` in the project,
   `iex -S mix`, `python` with the package importable, `rails console`, `cabal repl`.
2. **The project's test runner, driven as a scratch pad.** Everywhere else. `cargo test`, `go test
   -run`, `dotnet test`, JUnit. The test runner is already wired into the build graph and reaches
   internals a scratch binary cannot: in-package Go tests, Rust `#[cfg(test)]`, `InternalsVisibleTo`.
3. **Shell scripts against the running system.** When the behavior only appears in a running service.

**Do not install a REPL to satisfy this.** If the toolchain did not ship one and the project does not
already use one, that absence means the language is on rung 2. Something marketed as a REPL that
recompiles per snippet is rung 2 wearing a costume.

**Scratch dependencies:** prefer the ecosystem's single-file mechanism so no manifest lands in the
repo. Python PEP 723 `# /// script` with `uv run`, Java JBang `//DEPS`, .NET `#:package`. Where none
exists, a manifest plus a gitignored environment is fine.

**A scratch test is not a test.** It never counts toward a CUJ's test table and never goes near the
red gate. Keep it in `repl/`.

**What survives:** the finding, not the script, in the document. The script stays on disk in `repl/`,
committed, because six months later it is the answer to why a decision was made.

## The working log

`log.md` is a **write-ahead record**. Append as decisions land, during the work, never composed at
the end. A log written at the end is worthless against the failure it exists to prevent, which is
losing reasoning that never reached the documents.

In: decisions and their reasons, rejected alternatives, judgment questions and the answers given,
REPL findings as they arrive.

Out: a turn-by-turn transcript. There is no completeness requirement. A log that must be complete is
a log nobody writes.

## Done when

`spec.md` passes both altitude questions, contains no factual questions, and every actor has at least
one outcome. Then say the next stage is `necklace-cuj`.
