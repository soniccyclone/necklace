# <Ticket title>

<Ticket reference, if there is one.>

## The problem

<What is broken or missing, and how you know. Cite the evidence: an error rate, a support thread, a
failing scenario, a measurement. A problem statement with no evidence is a preference.>

## Actors

<Every party this change touches. A human role, a calling service, an operator, a scheduled job.
Name them; do not describe them yet.>

- <actor>
- <actor>

## Actor-outcome pairs

<For each actor, what that actor must be able to observe after the change. Observable means someone
could check it. This section is load-bearing: each pair becomes a CUJ in the next document.>

| Actor | Must be able to observe |
| --- | --- |
| <actor> | <what they can see, do, or verify that they could not before> |
| <actor> | <...> |

## Constraints

<Existing systems, data volumes, compatibility requirements, deadlines. Cite each one. A constraint
you cannot cite is a preference and belongs under Approach instead. State the constraint here; the
reasoning behind it goes in ledger.md.>

- <constraint>

## Approach

<The strategy, named, at strategy level. No file paths, no function names, no schemas, no library
choices unless the library choice is the decision itself.>

<Rejected alternatives go in ledger.md, not here.>

## Open questions

<Judgment questions only, and only unresolved ones. Each must state why neither reading nor running
settles it. Factual questions are not permitted in this document: resolve them yourself.>

<Delete this section if there are none.>

| Question | Why it cannot be settled by reading or running |
| --- | --- |
| <question> | <reason> |

---

<!--
Altitude self-check before finishing. Both answers must come out right:

  Could two competent engineers read this and implement it differently, and both be right?
    Must be YES. A no means implementation decisions leaked in from the CUJ document.

  Could two competent engineers read this and disagree about whether the ticket was satisfied?
    Must be NO. A yes means this has not said what better looks like.
-->
