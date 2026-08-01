# necklace

Two documents thread through a task. Beads hang off the second one.

The methodology is Agentic REPL-Driven Development. The tool is distribution.

## 0. First principles

Everything downstream is derived from these, including all of the language-specific guidance. The
guidance is worked examples, not the rule. A language not named anywhere in this document is handled
by applying the principle directly, and an agent that understands why a rule exists will get an
unlisted language right where an agent pattern-matching a table will not.

### The code is the source of truth. The spec is not.

This is the load-bearing disagreement with every popular framework in this space, so it goes first.

Spec-driven frameworks treat the spec as source and the code as generated output, on the compiler
model: edit the `.proto`, regenerate, never touch the generated file. That model requires the
generator to be deterministic and faithful. An LLM is neither. Regenerating from the same spec
produces different code, the code diverges the moment anyone edits it, and editing it is the normal
case rather than the exceptional one.

So the spec is not a definition the code must conform to. It is **provenance**: a record of what was
intended, by whom, and why, at a point in time. It is worth keeping for exactly that, and it is worth
nothing as an authority.

What this generates, throughout:

- Tests close a CUJ, not spec conformance. §3 and §4.
- There is no artifact validator. §6 cut `necklace verify` for a shallow reason, that the agent can
  read test output itself. The real reason is here: a binary that checks code against a spec has
  encoded the belief that the spec outranks the code. It does not.
- The planning directory is a tool directory and is named like one. Provenance about the codebase is
  not a peer of `src/`.
- A stale spec is not a defect. Nobody reconciles it. The tests are the thing kept true.

### Committed surface is what pollutes. On-disk is free.

A repo is walked by tools that read *committed* files: Dependabot, Renovate, SBOM and license
scanners, code scanning, linguist. None of them read what git ignores.

So the two questions are separate and only one of them is interesting. Whether an artifact may exist
on disk is a question about speed and offline capability, and the answer is usually yes. Whether it
may be committed is a question about what other machines will act on, and the answer is no for
anything a tool is configured to consume.

A gitignored environment directory is fine and often preferable, because re-resolving dependencies on
every run is slow and fails outright in a network-restricted environment.

### Enforce by location, not by discipline.

A rule that depends on someone remembering it fails on the day everyone is tired. Where a property
can be made structural, make it structural. This is why scratch tests live somewhere the suite does
not scan rather than relying on an instruction to delete them.

### Prefer what the toolchain already blesses.

Where a language has an official or community-standard way to do a thing, that way is wired into the
build graph, the dependency resolution, and the toolchain, and it is maintained by people who ship
the language. A bespoke alternative re-derives all of that badly. This is why rung 2 is the test
runner and not a scratch binary, and why the answer to scratch dependencies is whatever single-file
mechanism the ecosystem has grown rather than a hand-rolled convention.

Corollary: **do not install a tool to satisfy a rule here.** If the toolchain did not ship it and the
project does not already use it, that absence is information about which rung you are on.

### Get the axis right, then the language answers itself.

Most language-specific questions in this method reduce to one property of the language, and naming
the property is more useful than listing the languages.

- Which REPL rung a language is on reduces to whether its runtime can load and redefine code in a
  live process. §5.
- Whether a planning directory pollutes a build reduces to whether the build tool discovers
  directories or is told about them explicitly.
- Whether scratch dependencies need a manifest reduces to whether the ecosystem has a single-file
  script format.

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

Which parts of this are validated on real tickets and which are untried proposals is recorded in
`necklace-ledger.md`, along with everything already ruled out.

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
  constraint you cannot cite is a preference, so file it under approach instead. State the
  constraint. The reasoning behind it goes in the log.
- **The chosen approach, at strategy level.** Name the strategy. The alternatives you rejected go in
  the log, with why. Rejecting them is still required. Printing them here is not.
- **Open judgment questions, and only the open ones.** Factual questions are illegal here and always
  were. An answered judgment question moves to the log along with its answer and who gave it. What
  remains is a blocking handoff to a human, which is why it stays in the document the human opens.

The last three carry a single rule: **the document holds what is still open, the log holds what is
settled.** These documents balloon because they are asked to be both the plan and the record of how
the plan was reached, and it is the second job that grows without bound. The log takes that job. See
§9 of the tool plan.

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

**The scratch test is not a test.** This is where the polarity below can collapse, so it gets a rule.
A scratch test is never counted toward a CUJ's test table and never allowed near the red gate. A
scratch test that quietly graduates into the suite is a green test nobody designed, which is
precisely the theater §4 exists to prevent.

Enforce that by location, not by discipline. Scratch work lives in the planning directory and the
planning directory is excluded from the project's test discovery, so the suite cannot pick it up
even when someone forgets. A rule that depends on remembering is a rule that fails on the day
everyone is tired.

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

**What survives into the documents.** The finding, not the script. When a finding informs a test,
record it in the `Informed by` column. When it informs a claim, cite it inline.

**What survives on disk.** The script, in the planning directory, checked in. Throwaway describes its
role in the documents, where only the finding belongs. It does not describe its value six months
later, when someone asks why a decision was made and the session that settled it is the answer.
Keeping it costs a few kilobytes and the build-isolation work in §8 of the tool plan.

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

**Skill files. No binary, no runtime, no code.**

```
skills/
├── spec/
│   ├── SKILL.md          # ticket -> spec doc. Carries §2, the self-answer loop, and §5.
│   └── spec.md           # the template
├── cuj/
│   ├── SKILL.md          # spec doc -> CUJ doc. Carries §3 and the mandatory test table.
│   └── cuj.md            # the template
├── beads/
│   └── SKILL.md          # CUJ doc -> JSONL -> one bd import, then the red gate in §4
└── lint/
    └── SKILL.md          # hygiene, not a pipeline stage. See §9 of the tool plan.
```

**Three of those are the pipeline.** Spec, CUJ, beads, in that order, matching the three mandatory
steps in §1. `lint` is not a fourth step and must never be invoked as one. It checks whether
necklace's own artifacts are polluting the repo that hosts them, which is a maintenance concern that
happens to be best expressed as a prompt.

It earns its place by the §0 argument. The set of static analysis tools that walk a repo grows, and a
list written today expires. An agent reading a description of the *problem* will recognize a scanner
that shipped after this document was written, so the capability grows on its own. Encoding that same
knowledge as a table in a binary would guarantee it goes stale, which is the general test §1 of the
tool plan applies to every proposed feature.

That is the MVP and possibly the whole thing. BMAD is markdown agent definitions with no binary.
OpenSpec's CLI only scaffolds and updates its own files. Neither validates user artifacts with
compiled code, and neither needs to.

There is no `repl` skill. The REPL workflow is behavior during `spec` and `cuj`, not a separate
invocation, so the instruction lives inside both of those.

There is no checker. Every check in §4 is something the agent already does, and §0 gives the deeper
reason: a binary that validates code against a spec has encoded the belief that the spec outranks the
code.

Distribution is a Claude Code plugin. `.cursor/commands/` and `.github/prompts/` stubs point at the
same three files, so a coworker installs one thing.

### Prior art, and what not to rebuild

Read this before writing any code. Most of what an orchestration layer would need already exists in
Steve Yegge's `gastownhall` org.

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

The templates and skill prompts are procedures, and agents parse them. One term per concept, used
the same way every time, so a reader and an agent resolve it identically. This applies to the
artifacts and not to design-doc prose.

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
