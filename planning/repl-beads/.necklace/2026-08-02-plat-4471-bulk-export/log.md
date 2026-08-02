# Working log: PLAT-4471

Appended as decisions land.

## Factual questions raised and resolved

**Does `export_csv` stream or buffer?** Buffers. It appends every formatted row to a list and joins
at the end, so nothing is emitted until everything is in memory. Read from `reporting/export.py`.

**Which limit binds first at 2.3M rows, the 30 second gateway timeout or the OOM kill?** Memory.
`repl/which_limit.py` measured 19.4 MB peak at 100k rows and 97.9 MB at 500k, linear, extrapolating
to roughly 450 MB at 2.3M for the response body alone. CPU at that size is roughly 7 seconds, well
inside 30. The falsification condition stated in the script was that wall time would cross 30
seconds before memory grew large; it did not, so buffering is confirmed as the primary cause. Note
the fake row source is cheap, so real database fetch time is additional and the timeout may still
bite once that is included. Memory is the one that is proven.

**Is the shelved pagination work still in a branch?** No branch carrying it was found. Treating the
comment as a lead that did not pan out rather than as reusable work.

## Judgment questions

**Does Finance's non-dashboard path belong in this ticket?** Unresolved, in `spec.md`. Volume is 3-4
requests a month with a working manual workaround, so it is a scope call for whoever owns the sprint.

## Decisions

**Decouple production from delivery.** Chosen because the 30 second gateway timeout is a hard ceiling
and the measured CPU cost at 2.3M rows leaves no room to also stream a database read inside it.

Rejected: **streaming the response synchronously.** It fixes memory but not the timeout, and it makes
the failure mode worse rather than better, because a client that disconnects mid-stream has received
a partial CSV that looks complete.

Rejected: **pagination in the UI.** This was the shelved approach from last quarter. It moves the
work onto the customer, does nothing for Finance, and leaves support with the same "did it work"
problem.

Rejected: **raising the gateway timeout.** Cited as a constraint rather than a preference; it is
enforced for every endpoint behind that gateway and this ticket does not have standing to change it.

**Export state is a first-class thing, not an inference.** Driven by the support engineer's comment
on the ticket. Three of the five actor-outcome pairs are about knowing what happened, not about the
data itself, which is the signal that state is the actual product here.

## REPL findings

`repl/buffering.py` — peak memory is linear in row count. Confirms the buffering read of the code
rather than assuming it from the source.

`repl/which_limit.py` — memory exhausts before the timeout at the sizes in question.

Both kept on disk. Neither is a test.

## Stage 2, CUJ document

**Slicing.** Five actor-outcome pairs became five CUJs, one each. No pair merged and none split.

**Dependency edges kept to four.** CUJ-02 depends on CUJ-01 because a job that registers without a
streaming producer still OOMs when the worker runs. CUJ-03 depends on CUJ-02 because there is no
state without a job. CUJ-04 and CUJ-05 both depend on CUJ-03 and on nothing else, which is the only
fan-out in the graph.

Rejected: making CUJ-04 depend on CUJ-03 *and* CUJ-02. Redundant, since the edge is transitive, and
a redundant edge narrows parallelism for nothing.

**CUJ-05 is blocked, not dropped.** The open judgment question in `spec.md` is a scope call. Writing
the CUJ costs nothing and deleting it would lose the analysis; breaking it into beads before the
scope call would create work nobody agreed to.

**Test count.** 12 tests across 5 CUJs. Three of the twelve carry `Informed by` provenance from the
REPL work; the rest follow from the requirement directly, which is the expected ratio.

## Stage 3, beads and the red gate

**Bead shape.** CUJ-01 and CUJ-03 became epics with two children each. CUJ-02 and CUJ-04 became flat
beads. Per-CUJ sizing, not policy. 8 beads for 4 CUJs.

**`blocks` edges are type-symmetric in beads.** `bd dep add <task> <epic>` fails with "tasks can only
block other tasks, not epics", and the mirror case fails with "epics can only block other epics, not
tasks". So a CUJ-level `Depends on` cannot be expressed as one edge when either end is an epic.

Resolved by expressing every CUJ dependency at the leaf: CUJ-02's bead depends on both CUJ-01
children, and both CUJ-03 children depend on CUJ-02's bead. Four document-level edges became six
bead-level edges.

**The first three edges failed silently** because the `bd dep add` output was redirected. `bd ready`
returned all 8 beads, which is what surfaced it. Reading the edges back from `bd list --json` is the
check that catches this; a create call that does not error is not evidence.

**Graph width.** `bd ready` returns 4 of 8 at the start: both CUJ-01 children and the two epics.
That is the wide result the method predicts, not a deep chain.

**Red gate.** 11 tests written, 11 failing, all on `ImportError` or `ModuleNotFoundError` for symbols
that do not exist yet: `export_rows`, `reporting.jobs`. No syntax errors. The one passing test is the
pre-existing seeded one. Output pasted into the conversation rather than asserted.

CUJ-05's single test was not written, because the CUJ is blocked on the open scope question.
