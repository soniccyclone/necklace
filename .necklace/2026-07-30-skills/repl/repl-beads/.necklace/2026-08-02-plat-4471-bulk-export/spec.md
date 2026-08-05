# PLAT-4471: Bulk transaction export fails for large tenants

Jira: PLAT-4471. Reporting API.

## The problem

Enterprise customers cannot export their transaction history, and the failure is silent.

Evidence:

- 14 open support tickets from 9 accounts this month.
- The largest tenant, roughly 2.3M transactions, cannot export at all. Accounts under roughly 50k
  succeed.
- Reporting workers are OOM-killed at the times customers report failures.
- The API gateway enforces a hard 30 second timeout in front of the endpoint.
- `export_csv` accumulates every formatted row in a list and joins it before returning anything.
  Measured, peak memory grows linearly with row count: 19.4 MB at 100k rows and 97.9 MB at 500k,
  which extrapolates to roughly 450 MB at 2.3M rows for the response body alone, before any database
  driver overhead. The same measurement puts CPU at roughly 7 seconds at that size, so memory
  exhausts before the gateway timeout does.

The failure is silent because the endpoint returns nothing distinguishable from a request that was
never made. Support cannot tell a customer whether their export is running, finished, or dead.

## Actors

- Enterprise customer
- Support engineer
- Finance analyst
- Reporting platform operator

## Actor-outcome pairs

| Actor | Must be able to observe |
| --- | --- |
| Enterprise customer | Their complete transaction history, obtainable at any tenant size including 2.3M rows |
| Enterprise customer | The current state of their export: running, ready, or failed, with a reason when it failed |
| Support engineer | The state of a named customer's export, without asking engineering or running a query |
| Finance analyst | The same export data retrieved without operating the dashboard |
| Reporting platform operator | Export load that no longer scales worker memory with tenant size |

## Constraints

- The API gateway enforces a 30 second timeout on this endpoint. Any response that must be produced
  synchronously fits inside that budget or it does not exist.
- The largest current tenant holds roughly 2.3M transactions. This is the size the design must
  survive, not an upper bound to design past.
- Export currently buffers the entire result set in worker memory. Peak scales linearly with row
  count, measured above.
- Finance currently issues 3 to 4 manual requests a month, so their path has a real but low volume.

## Approach

Decouple producing the export from delivering it. The customer's request registers an export job and
returns immediately with an identifier. A worker produces the artifact incrementally, without holding
the full result set, and stores it. The customer retrieves the finished artifact separately.

Export state becomes a first-class, queryable thing rather than an inference from whether a response
arrived. That is what gives the customer, support, and finance the same answer to "what happened to
this export".

Rejected alternatives and the reasoning behind the constraints above are in `log.md`.

## Open questions

| Question | Why it cannot be settled by reading or running |
| --- | --- |
| Does Finance's non-dashboard path belong in this ticket, or a follow-up? Their volume is 3-4 requests a month and they have a working manual workaround, so this is a scope and priority call rather than a technical one. | Neither reading the code nor measuring anything establishes whether the team wants this ticket to grow. It depends on what else is in the sprint. |

---

<!--
Altitude self-check:

  Could two competent engineers implement this differently and both be right?
    Yes. Nothing here fixes the queue technology, the storage target, the artifact format, the
    polling versus notification choice, or where state lives.

  Could two competent engineers disagree about whether the ticket was satisfied?
    No. The actor-outcome table says what each party must be able to observe.
-->
