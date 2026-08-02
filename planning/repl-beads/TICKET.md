# PLAT-4471

**Type:** Bug
**Priority:** P2
**Component:** Reporting API
**Reporter:** dana.okafor (Support Engineering)
**Assignee:** unassigned
**Sprint:** backlog

## Summary

Bulk transaction export fails for large tenants

## Description

Enterprise customers are reporting that the "Export All Transactions" button in the reporting
dashboard does nothing. Support has 14 open tickets about this from 9 different accounts this month.
Our largest tenant (Northwind, roughly 2.3M transactions) cannot export at all. Accounts under about
50k transactions seem fine.

Ops says the reporting workers get OOM-killed around the times customers report the failures, and the
API gateway has a hard 30 second timeout in front of that endpoint. Not sure which one is actually
biting first.

Two other things came up while triaging this:

- Customers get no error message. The button just does nothing, so support cannot tell whether the
  request failed or the customer never clicked it.
- Finance asked separately whether there is a way to pull this data for monthly reconciliation
  without a human going through the dashboard. They are currently asking us to run queries by hand,
  which is 3-4 requests a month.

## Acceptance criteria

- Enterprise customers can export their full transaction history.

## Comments

**pri.raghavan** (2 days ago):
We looked at doing pagination in the UI last quarter and shelved it. Worth checking whether that
work is still in a branch somewhere before starting from scratch.

**dana.okafor** (1 day ago):
Whatever we do here, please make sure support can tell the difference between "still working" and
"broken". Right now I have no way to answer these tickets.
