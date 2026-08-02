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
