# necklace

Two documents thread through a task. Beads hang off the second one.

The methodology is Agentic REPL-Driven Development. The tool is distribution.

## 1. What the method requires

Three steps are mandatory. Everything else is optional tooling.

1. **Generate a high-level spec document.** Section 2 defines the altitude concretely.
2. **Generate a CUJ technical implementation document.** Each CUJ carries instructions for turning
   itself into a verifiable test.
3. **Task-breakdown the CUJ document into beads.**

That is the core. A run that produces those three artifacts, in that order, has followed the
method. A run that skips one has not.

The REPL workflow is not a fourth step. It is a tool the agent reaches for while it works through
either document with you. Section 5 covers it.

### Provenance

Read this before treating anything below as a requirement. This document mixes practice that
already works with proposals that have never been tried. Two of the proposals survived long enough
in earlier drafts to get mistaken for decisions, so the split is now explicit.

**From Nathan's working practice. Validated on real tickets.**

- The three mandatory steps in this section.
- Both documents, called design docs, in that order.
- CUJ vertical slices in the second document.
- Turning each CUJ into a verifiable test.
- Beads breakdown from the CUJ document.
- Asserting that the tests exist and trace back to the CUJs.
- A REPL-like workflow as the tool for answering the agent's own questions.
- The agent researching aggressively rather than accumulating questions.

**Proposals. Mine, untried, cut them freely.**

- The two-sided altitude test in §2.
- Actor-outcome pairs as a required section.
- The "must not contain" list and the two-page length guide.
- "Fails for the right reason" as part of the red gate.
- The three-round cap on the self-answer loop.
- The falsification-condition discipline in §5.
- The ten-term dictionary in §7.
- The four trial-run counts in §9.
- The rung-2-is-the-test-runner rule in §5, and the live-code-loading test for which rung a language
  sits on. Nathan's observation, my reasoning, neither tried. The "do not install a REPL" rule comes
  from him having used the C# and Rust ones.

**Already cut. Do not re-propose.**

- A `necklace verify` binary, and any implementation language for it. The agent runs the test suite
  and reads the output.
- A `Touches` field on each CUJ, and the serialization check built on it.
- Critic agents, agent supervision, worktrees, fleets, and phase state machines.
- Graduated ceremony for small tickets. A ticket gets the full two documents.
- Bead shape as a configuration choice. It is per-CUJ sizing, not policy. See §4.

Nothing is left in a fourth category. Every claim below is either validated practice or a labeled
proposal.

## 2. What "high level" means

The altitude of the first document decides whether the rest of the pipeline works. Too vague and
you cannot derive CUJs from it. Too detailed and it becomes the second document, and you have
collapsed the pipeline into one doc with a fold in the middle.

### The two-sided test

Apply both questions. The altitude is right when both answers come out correct.

- **Could two competent engineers read this and implement it differently, and both be right?**
  The answer must be yes. A no means the document has made implementation decisions that belong in
  the CUJ doc.
- **Could two competent engineers read this and disagree about whether the ticket was satisfied?**
  The answer must be no. A yes means the document has not said what "better" looks like.

Both questions take one read to answer. An agent can apply them to its own draft.

### What the document must contain

- **The problem, with evidence.** What is broken or missing, and how you know.
- **The actors.** Every party the change touches. A human role, a calling service, or an operator.
- **Actor-outcome pairs.** For each actor, what that actor must be able to observe after the
  change. This is the load-bearing section. See below.
- **Real constraints.** Existing systems, data volumes, compatibility requirements, deadlines. A
  constraint you cannot cite is a preference, so file it under approach instead.
- **The chosen approach, at strategy level.** Name the strategy. Name the alternatives you rejected
  and why.
- **Open questions, classified.** Mark each one factual or judgment. Factual means answerable by
  reading or by running something. Judgment means preference, priority, or risk appetite. Only
  judgment questions may reach the user.

### What the document must not contain

- File paths, function names, or type signatures.
- Schema or data structure definitions.
- Library choices. The exception is a library choice that *is* the decision under discussion.
- Test names.
- Task ordering or effort estimates.

### Length

A Jira ticket should produce roughly two pages. A longer document has usually drifted into the
second document. Length is a symptom and not the rule. The two-sided test is the rule.

### Why the actor-outcome pairs matter

A CUJ is an actor, a trigger, a journey, and an observable outcome. The first document establishes
the actors and the outcomes. The second document turns each pair into a journey and a test.

That relationship explains something useful. If the first document names the actors and states what
each one must observe, the CUJ document mostly falls out of it. A CUJ document that provokes an
argument usually means the first document left an actor or an outcome undecided. Treat a contentious
CUJ doc as a signal to go back one step.

## 3. The CUJ document

Vertical slices, one per actor-outcome pair. Each CUJ carries the instruction for producing its
test.

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
| `TestRestore_SurfacesConflictSet` | a divergent branch pair | exits 2 and prints all four conflicting cells | REPL: Dolt returns a conflict set, not an error |

**Done when:** both tests above pass. Both must be red when created.

**Depends on:** CUJ-01
```

The test table is mandatory. Every CUJ names at least one test, its input, and its assertion.

The `Informed by` column is optional. Fill it when REPL work produced the finding behind a test.
Leave it empty when the test follows from the requirement directly. A test does not need REPL
provenance to be valid. It needs an input and an assertion.

`Done when` names tests and nothing else. A test is the only thing that closes a CUJ.

Note the `Journey` steps. They use active voice, they name the actor, and they carry one instruction
per line. Section 7 makes that deliberate.

## 4. Beads breakdown and the red gate

`bd import` reads JSONL from a file or stdin with upsert semantics. Generate one file and import it
once. Forty `bd create` calls give you forty chances to drift and no way to review the graph before
it lands.

Validate the graph before import:

- The graph is a DAG.
- Every CUJ has at least one bead.
- Every `Depends on` in the document appears as an edge.
- Every bead carries a `cuj:CUJ-NN` label.
- Every bead inherits the test names from its CUJ.

Bead shape is per-CUJ sizing, not a setting. A small CUJ becomes one bead. A large one becomes an
epic with children, which beads supports natively through hierarchical IDs like `bd-a3f8.1.1`.
Nothing in the method reads the shape, because the `cuj:` label carries traceability either way.

Then run the red gate, after import and before implementation:

- Every named test exists in the repo.
- Every named test **fails** for the right reason. A missing symbol or a failed assertion counts. A
  syntax error in the test itself does not.
- Every bead traces to a CUJ. Every CUJ traces to at least one red test.

The agent runs the suite and reads the failures. It then pastes the failing output into the
conversation rather than asserting that the tests are red. A test that was green the moment someone
wrote it is the most likely way this method degrades into theater, and the output is the only thing
that rules that out.

The red gate is also the natural end of the design phases. Red tests across every CUJ mean the
specification is complete and executable. Implementation becomes a mechanical march, and agents are
good at those.

## 5. The REPL workflow, as a tool

The agent reaches for this while working through either document with you. It is not a phase and it
produces no mandated artifact.

**The instruction is behavioral, not prescriptive.** Tell the agent to engage in a REPL-like
workflow, in whatever form suits the project it is currently in. Do not specify a directory, a file
format, or a naming convention.

### The escalation ladder

Prefer the highest rung the project supports. Drop to the next one only when the rung above does
not work.

**Rung 1. A real REPL, loaded with the project.** Load the project into it so the agent calls the
actual functions. `lein repl` inside the project, `iex -S mix`, `python` with the package importable,
`rails console`, `cabal repl`, `node` with the module required. A bare REPL is a calculator. A REPL
with the project loaded is an instrument.

**Rung 2. The project's test runner, driven as a scratch pad.** For every language where rung 1 is
not real. `cargo test`, `go test -run`, `dotnet test`, JUnit, pytest when the import graph fights a
bare interpreter. The agent writes a throwaway test, runs it, edits, re-runs. A scratch `main` or
`go run` is the same rung and is fine when it is genuinely simpler, but the test runner is the better
default. See below.

**Rung 3. Shell scripts against the running system.** The final escape hatch. Bash or PowerShell
that curls the webapp. Use this when the behavior only appears in a running service, or when the
language offers neither of the rungs above.

### Which rung a language is actually on

Not "does a REPL exist for this language". The question is whether the runtime can load and redefine
code in a live process.

Where it can, rung 1 is real and nearly free: Lisps, Smalltalk, Erlang and Elixir, Python, Ruby,
Node, Julia, R. The image is already a running program and the REPL is the front door to it.

Where it cannot, the thing marketed as a REPL is a snippet compiler that restarts per expression. It
holds no state, so it delivers none of rung 1's benefit while charging an install and a per-snippet
compile. C# Interactive and `dotnet-script`, `evcxr` for Rust, and the various C++ interpreters are
all rung 2 wearing a rung 1 costume. Java's `jshell` is the honest edge case, since the JDK ships it
and it works, but pointing it at a real Gradle or Maven classpath is enough friction that the test
runner usually wins anyway.

**Do not install a REPL to satisfy this ladder.** If the toolchain did not already ship one and the
project does not already use one, that absence is the signal that the language is on rung 2. Take
the signal. An agent that spends twenty minutes installing a third-party interpreter has converted a
cheap question into an expensive one, which inverts the entire point of §5.

### Why the test runner is the right rung 2

Two reasons, and the second is the load-bearing one.

It is the blessed scripting layer. Rigid compiled languages tend to grow one place where you are
allowed to write loose exploratory code against real objects, and it is the test target. The
maintainers built it, the community standardized on it, and it is already wired into the build
graph, the dependency resolution, and the toolchain. A scratch binary re-derives all of that badly.

It reaches internals a scratch `main` cannot. A scratch `main` links against your public API and
sees exactly what an outside consumer sees. An in-package Go test reads unexported identifiers, a
Rust `#[cfg(test)]` module sees private items, and .NET test projects reach `internal` through
`InternalsVisibleTo`. Most factual questions worth a REPL session are about internal behavior, so
the harness that cannot see internals cannot answer them.

**The scratch test is not a test.** This is where the polarity in §5 can collapse, so it gets a rule.
A test written to answer a question is throwaway and gets deleted when the question is answered. It
is never committed, never counted toward a CUJ's test table, and never allowed near the red gate.
What survives is the finding, in the `Informed by` column. A scratch test that quietly graduates into
the suite is a green test nobody designed, which is precisely the theater §4 exists to prevent.

### Why the ladder is ordered this way

Cost per iteration, not taste.

A REPL holds state between expressions. The agent builds understanding incrementally and never
re-runs setup. A test run starts from zero every time, so every question pays the full build and
startup cost again. A curl script starts from zero and also needs the service running and seeded
first.

That is why rung 2 is one rung down and not a tie. The test runner is the cheapest harness available
to a language that cannot hold state, and it is still more expensive per question than a language
that can.

Each rung down multiplies the cost of answering one question. That is the whole reason to prefer the
top of the ladder. It is also why "just write a script" is a worse default than it looks.

**What the agent uses it for.** The agent has open questions. Some are factual. Rather than handing
those to you, the agent pokes at the problem until it knows the answer. It then writes the answer
into the document as evidence for a claim.

**The rule that governs it.** Only judgment questions reach the user. A question that names a
symbol, a file, a version, or an API is factual by pattern, and the agent resolves it itself.

### The self-answer loop

This is the step you currently hand-drive on every ticket, and it is the main thing worth
automating. Everything else in the method is already one prompt.

1. The agent drafts the document.
2. The agent extracts its own open questions into the Open questions table.
3. The agent classifies each question as factual or judgment.
4. The agent resolves every factual question. Reading settles some. A REPL session settles the
   rest.
5. The agent revises the document and returns to step 2, because answers raise new questions.
6. The loop ends when the question set stops changing, or after three rounds.

A factual question is illegal in a document that reaches `awaiting-human`. A judgment question
must state why neither reading nor running settles it.

The loop is what converts a generic design into a specific one. A distracted human running it by
hand degrades the output silently, which is the argument for making it a skill.

**What survives into the documents.** The finding, not the script. A REPL session is throwaway work
by design. When a finding informs a test, record it in the `Informed by` column. When it informs a
claim, cite it inline. Neither requires keeping the script.

**One optional discipline.** A REPL script that cannot fail proves nothing. Stating what result
would contradict the claim costs one line, and it stops the agent from writing something that
flatters the design. That discipline is mine and not the tradition's, so cut it if it does not bite.
Nobody at a Clojure REPL declares a falsification condition before poking.

### The polarity that matters

A REPL script and a test are opposites. Keep them apart.

| | REPL script | Test |
| --- | --- | --- |
| Runs against | the world as it is | the system as it will be |
| Purpose | discovery | validation |
| Correct result now | **passes**, because it confirms something true | **fails**, because the code does not exist yet |
| Lifetime | throwaway | permanent, defines done |

A REPL script that exits 0 tells you the approach is viable. A test that exits 0 before you write
anything tells you the test is worthless.

Carin Meier marks the transition between them. *"We have been experimenting in the REPL, but now
that we have a feel for where we are going it is time to write some tests."* She does not paste REPL
forms into `deftest`. She abstracts the pattern. Her example data becomes the test input, and the
behavior she found becomes the expected output. See https://howistart.org/posts/clojure/1/

## 6. Scope of the tool

**Three skill files. No binary, no runtime, no code.**

```
skills/
├── spec/
│   ├── SKILL.md          # ticket -> spec doc. Carries §2, the self-answer loop, and §5.
│   └── spec.md           # the template
├── cuj/
│   ├── SKILL.md          # spec doc -> CUJ doc. Carries §3 and the mandatory test table.
│   └── cuj.md            # the template
└── beads/
    └── SKILL.md          # CUJ doc -> JSONL -> one bd import, then the red gate in §4
```

That is the MVP and possibly the whole thing. BMAD is markdown agent definitions with no binary.
OpenSpec's CLI only scaffolds and updates its own files. Neither validates user artifacts with
compiled code, and neither needs to.

There is no `repl` skill. The REPL workflow is behavior during `spec` and `cuj`, not a separate
invocation, so the instruction lives inside both of those.

There is no checker. An earlier draft proposed `necklace verify` to validate the graph and run the
red gate. The justification was that a prompt cannot self-certify the red gate, which is false. The
agent runs the test suite and reads the output. Every check in §4 is something the agent already
does, so a binary would only restate the instruction in another language.

Distribution is a Claude Code plugin. `.cursor/commands/` and `.github/prompts/` stubs point at the
same three files, so a coworker installs one thing.

### Prior art, and what not to rebuild

Read this before writing any code. An earlier draft of this plan reinvented roughly 60% of what
already exists in Steve Yegge's `gastownhall` org.

| Project | What it already does |
| --- | --- |
| `gastown` | Multi-agent workspace manager. Supervises agents across Claude, Codex, Copilot, Gemini, Cursor, and Kiro. Git-worktree isolation per agent, three-tier watchdogs for stall recovery, a scheduler with a rate-limit capacity governor, and a bisecting merge queue. Its formula and molecule system is a TOML workflow engine with checkpoint recovery. |
| `gascity` | That infrastructure extracted into an orchestration-builder SDK. Build on this if orchestration ever becomes the goal. |
| `gt-toolkit` (third-party, `Xexr/gt-toolkit`) | Ships `spec-workflow`, `plan-workflow`, and `beads-workflow`. Multi-LLM scope analysis in an Opus, GPT, and Gemini matrix. Parallel codebase analysis. A phased implementation roadmap. Then a beads hierarchy of epics and tasks with acceptance criteria. |

**Try `gt-toolkit` before building necklace.** It covers this pipeline shape already, and one
afternoon on a throwaway project settles whether necklace needs to exist. Nathan is content to
adopt rather than author, and telling a coworker to install an existing tool beats maintaining a
new one.

**The one measurable disagreement.** `gt-toolkit` produces a phased implementation roadmap. A phase
is a layer, so its graph runs deep. CUJ slicing runs wide. Check it directly: run `gt-toolkit` on a
real feature and count how many beads `bd ready` returns at the start. A wide result means the
objection was over-weighted from a README, and adopting is correct. A deep result means necklace has
a reason to exist.

**A caveat on that disagreement.** A phased roadmap may be correct at Gas Town's scale. Thirty
agents cutting vertical slices through shared layers is a merge-conflict machine, and horizontal
phasing serializes exactly the contention that would otherwise thrash the merge queue. At five
agents that cost never appears and the wide graph is free. If that is the real explanation, Gas Town
is not wrong. It is tuned for a scale most people do not operate at.

**One improvement worth stealing regardless.** If critics ever get added, run them across different
models rather than as same-model personas. Independent models fail independently. Keep it to two or
three in one round, not `gt-toolkit`'s full matrix, which is an unlimited-budget luxury.

These stay out of scope: agent supervision, worktrees, fleets, phase state machines, and critic
rosters. The platform decides whether to use subagents. Gas Town owns orchestration and does it
properly for anyone who needs 20-30 agents.

## 7. Controlled vocabulary for the artifacts

The templates and skill prompts are procedures, and agents parse them. That makes ASD-STE100
directly applicable to the artifacts, but not to design-doc prose. Apply it below the line.

Ten terms, one meaning each. The templates use nothing else for these concepts:

| Term | Meaning | Not |
| --- | --- | --- |
| spec doc | the high-level document from §2 | proposal, PRD, brief, design doc |
| CUJ doc | the technical document from §3 | plan, tasks, roadmap, design doc |
| CUJ | one vertical slice: actor, trigger, journey, outcome | story, use case, epic, slice |
| actor-outcome pair | one actor and what it must observe after the change | requirement, acceptance criterion |
| REPL workflow | poking at the problem empirically, in whatever form the project supports | probe, spike, investigation |
| REPL finding | what a REPL session established | result, observation, insight |
| test | a permanent assertion about the system being built | check, spec, validation, assertion |
| red / green | a test that fails / passes | broken, working, passing |
| bead | one unit of work in `bd` | issue, ticket, task, card |
| red gate | the §4 check that tests exist and fail | pre-flight, validation step |

The `Not` column carries weight, and this document proves it. The word "probe" was an invented
synonym. It displaced "REPL" across forty-one occurrences of an earlier draft before anyone noticed,
and it cost the methodology its connection to the tradition it comes from. A term that drifts takes
its lineage with it.

## 8. Why this is worth writing down

**It moves error detection to the cheapest point.** A REPL session that catches a wrong assumption
costs a couple thousand tokens. The same assumption caught mid-implementation costs orders of
magnitude more, because rework re-reads context you already paid for. That matters to anyone without
an unlimited budget, which is nearly everyone.

**Vertical CUJ slices win even without parallelism.** A layer-organized plan makes each task depend
on context from the tasks before it. Context accumulates and cost grows superlinearly. Independent
slices take small fixed packets instead. This holds whether the platform runs them concurrently or
sequentially. `bd list --json` after a run will tell you which one has been happening.

## 9. The trial run

The method has been hand-rolled successfully on vibes. The templates in `templates/` make it
structured for the first time. Nothing needs to be built to try it.

Take one real ticket. Fill `spec.md`, apply the altitude self-check honestly, fill `cuj.md`, then
break down to beads by hand. The only cost over the usual approach is looking things up.

**Measure against the method's predictions, not against your past self.** There is no baseline for
the hand-rolled version, so a comparison would be vibes against vibes across different tickets.
These four counts need no control group, because the method predicts a specific value for each one.

| Count | Prediction | What a high number means |
| --- | --- | --- |
| Questions that reached you which you answered by pointing at code | near zero | the self-answer loop is weak |
| Rounds of argument on the CUJ doc | near zero | the spec doc left an actor or outcome undecided |
| Tests you rewrote after the fact | near zero | the CUJ test table is the wrong shape |
| Beads that blocked on something absent from the graph | zero | `Depends on` missed a real ordering |

The first count is the one this whole method exists to drive to zero.

## 10. Open

1. Does the two-sided altitude test in §2 match your judgment? The trial run answers this.
2. Are actor-outcome pairs the right required section? Or do you write the spec doc some other way
   and let the CUJs emerge less directly? The trial run answers this too.
3. How many self-answer rounds does a document actually need? §5 caps it at three, which is a guess.
   Count the rounds on the trial run.

All three are answered by running the method, not by deciding anything first.
