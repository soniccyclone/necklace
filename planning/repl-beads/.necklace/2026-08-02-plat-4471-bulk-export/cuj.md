# CUJ document: PLAT-4471 bulk transaction export

Derived from `spec.md` in this directory. One CUJ per actor-outcome pair.

---

## CUJ-01: Operator sees export memory stop tracking tenant size

**Actor:** reporting platform operator
**Trigger:** an Enterprise tenant exports its full transaction history
**Journey:**
1. Worker begins producing the export for a tenant of any size.
2. Worker emits formatted rows incrementally rather than accumulating them.
3. Worker memory stays flat as row count grows.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `test_export_peak_memory_is_flat_across_sizes` | the same fake row source at 10k and 200k rows | peak traced memory at 200k is within 2x of peak at 10k, not 20x | REPL: peak is currently linear, 19.4 MB at 100k and 97.9 MB at 500k |
| `test_export_yields_before_consuming_all_rows` | a row source that raises on the 100th row | at least 50 rows have been emitted before the exception surfaces | REPL: current code joins at the end, so nothing is emitted before everything is read |
| `test_export_header_precedes_first_row` | two rows | the first emitted chunk is the header line | |

**Done when:** the three tests above pass. All must be red when created.

**Beads:** `repl-beads-68i` (epic), `repl-beads-68i.1`, `repl-beads-68i.2`

---

## CUJ-02: Customer requests an export and gets an identifier inside the gateway budget

**Actor:** Enterprise customer
**Trigger:** customer presses "Export All Transactions"
**Journey:**
1. Customer issues the export request.
2. System registers an export job and returns its identifier.
3. System returns before the gateway timeout regardless of tenant size.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `test_export_request_returns_job_id_immediately` | a tenant with 2.3M rows | the call returns a non-empty job id and does not read any rows | REPL: producing the body costs ~7s CPU at 2.3M rows, so it cannot happen in the request |
| `test_export_request_latency_independent_of_tenant_size` | tenants at 1k and 2.3M rows | the two request latencies differ by less than an order of magnitude | |

**Done when:** both tests above pass. Both must be red when created.

**Depends on:** CUJ-01

**Beads:** `repl-beads-o11`

---

## CUJ-03: Customer distinguishes running, ready, and failed

**Actor:** Enterprise customer
**Trigger:** customer checks on an export they requested
**Journey:**
1. Customer queries the export by its identifier.
2. System reports one of running, ready, or failed.
3. When failed, the system reports a reason.
4. When ready, the system provides the artifact.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `test_export_state_is_running_before_completion` | a job whose worker has not finished | state is `running` and no artifact is offered | |
| `test_export_state_is_ready_with_artifact` | a completed job | state is `ready` and the artifact is retrievable and complete | |
| `test_export_failure_reports_a_reason` | a job whose worker raised | state is `failed` and the reason is non-empty and not a stack trace | Ticket: support cannot currently tell a failure from a request that never happened |
| `test_unknown_job_id_is_not_reported_as_running` | an identifier that was never issued | the response distinguishes unknown from running | |

**Done when:** the four tests above pass. All must be red when created.

**Depends on:** CUJ-02

**Beads:** `repl-beads-31i` (epic), `repl-beads-31i.1`, `repl-beads-31i.2`

---

## CUJ-04: Support engineer answers a ticket without engineering

**Actor:** support engineer
**Trigger:** a customer reports that their export did nothing
**Journey:**
1. Support engineer looks up exports for the named tenant.
2. System lists that tenant's recent exports with their states and times.
3. Support engineer reads the state and answers the customer.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `test_exports_listable_by_tenant` | a tenant with one running and one failed export | both are returned, newest first, each with its state | Ticket comment: support has no way to answer these tickets today |
| `test_listing_includes_failure_reason` | a tenant with a failed export | the failure reason appears in the listing without a second lookup | |

**Done when:** both tests above pass. Both must be red when created.

**Depends on:** CUJ-03

**Beads:** `repl-beads-7cn`

---

## CUJ-05: Finance analyst retrieves an export without the dashboard

**Actor:** finance analyst
**Trigger:** monthly reconciliation
**Journey:**
1. Analyst requests an export for a tenant without operating the dashboard.
2. Analyst retrieves the finished artifact by the same identifier flow as a customer.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `test_export_requestable_without_dashboard_session` | a request carrying analyst credentials and no dashboard session | the job is registered and returns an identifier | |

**Done when:** the test above passes. It must be red when created.

**Depends on:** CUJ-03

**Blocked:** on the open judgment question in `spec.md`. Do not break this CUJ into beads until
someone decides whether Finance's path is in scope for PLAT-4471 or a follow-up ticket.

**Beads:** not created; CUJ-05 is blocked on the open scope question

---

<!--
Checks before finishing:

  Every actor-outcome pair in spec.md has a CUJ.       5 pairs, 5 CUJs.
  Every CUJ has at least one test row.                 yes, 12 tests total.
  Every "Done when" names tests and nothing else.      yes.
  Slices are vertical.                                 each goes end to end for one actor's outcome.
  Dependencies are sparse.                             4 edges, a chain plus one fan-out at CUJ-03.
-->
