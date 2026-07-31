# The `bd import` JSONL contract

Read from `gastownhall/beads` at commit `9fddc56` (2026-07-31), against released version 1.1.2
(2026-07-26), which is what `npm install -g @beads/bd` and `brew install beads` serve today.

Sources, if any of this needs re-checking: `cmd/bd/import.go` for the command and its help text,
`cmd/bd/import_shared.go` for parsing and upsert, `internal/types/types.go` for the record struct,
`internal/types/id_generator.go` for hierarchical IDs.

## The format

One JSON object per line. Blank lines are skipped.

**Only `title` is required.** Every other field is optional. Unknown fields are ignored, so a record
carrying extra keys imports fine.

Three line shapes are recognized and three are skipped:

| Line | Handling |
| --- | --- |
| An issue object | Imported as a bead. |
| `{"_schema":"beads-jsonl/1", ...}` | Header record, skipped. Optional. |
| `{"_type":"memory","key":...,"value":...}` | Imported as a `bd remember` memory. |
| `"status":"tombstone"` | Skipped. Legacy pre-0.50 deletion marker. |

A parse failure on any line aborts the whole import. There is no partial-line tolerance.

## Fields necklace uses

```json
{"id":"nk-a3f8","title":"Resolve snapshot by commit time","description":"...","issue_type":"task","priority":1,"status":"open","labels":["cuj:CUJ-03"],"dependencies":[{"issue_id":"nk-a3f8","depends_on_id":"nk-b201","type":"blocks"}],"created_at":"2026-07-31T12:00:00Z","updated_at":"2026-07-31T12:00:00Z"}
```

| Field | Notes |
| --- | --- |
| `title` | The only required field. |
| `id` | Optional to beads, mandatory for us, because dependency edges reference beads by id. |
| `description` | Long-form body. Up to 64MB per line is accepted. |
| `issue_type` | `bug`, `feature`, `task`, `epic`, `chore`. Defaults to `task`. |
| `priority` | Integer 0-4, 0 is critical. No default on import: an omitted priority reads as 0, meaning P0. **Always set it explicitly.** |
| `status` | `open`, `in_progress`, `blocked`, `deferred`, `closed`, `pinned`, `hooked`. Defaults to `open`. |
| `labels` | Array of plain strings. This is where `cuj:CUJ-NN` goes. |
| `dependencies` | Array of edge objects. See below. |
| `created_at`, `updated_at` | RFC3339. Filled by the importer when absent. `updated_at` is load-bearing on re-import, see below. |
| `design`, `notes`, `acceptance_criteria` | Additional content sections. |

## Dependency edges

```json
{"issue_id": "<this bead>", "depends_on_id": "<the blocker>", "type": "blocks"}
```

Three fields carry the edge: `issue_id`, `depends_on_id`, `type`. Timestamps on the edge object are
filled by the importer.

**The edge lives on the dependent bead, not the blocker.** A bead that must wait carries the edge
naming what it waits for. A CUJ document's `Depends on: CUJ-01` becomes an edge on every bead of the
later CUJ, pointing at the terminal bead of CUJ-01.

Edge types that affect `bd ready`: `blocks`, `parent-child`, `conditional-blocks`, `waits-for`.
Types that do not: `related`, `discovered-from`, and the knowledge-graph links. necklace uses
`blocks` and `parent-child` and nothing else.

**File order does not matter.** The importer topologically sorts rows itself and writes each bead
with its blocking edges in the same transaction, so a half-finished import never shows a blocked
bead as ready. Emit records in whatever order is convenient.

## Hierarchical IDs

`parent.N`, appended per level. `nk-a3f8` is the epic, `nk-a3f8.1` a task, `nk-a3f8.1.1` a sub-task.

**Maximum depth is 3.** The constant is `types.MaxHierarchyDepth` and the comment says it exists to
prevent over-decomposition. Breadth is unlimited and has been tested to 347 children.

Emit the dotted id *and* an explicit `parent-child` edge. Descendant queries walk parent-child edges
with the dotted-id shape only as a fallback, so a dotted id alone is a weaker link than the edge.

## Upsert semantics

Keyed on `id`. Duplicate ids within one file are chained in file order and the last row wins.

**A row only overwrites an existing bead when its `updated_at` is strictly newer.** This is the one
that will bite. Consequences:

- An older row is skipped and reported in `stale_skipped_ids`.
- An equal `updated_at` keeps every local column and reports `tie_kept_local_ids`. Labels, comments,
  and dependencies from the row still merge.
- `updated_at` has second granularity, so a tie can be two genuinely different updates.

So regenerating the JSONL after a CUJ document revision and re-importing is a **silent no-op** for
every bead whose `updated_at` did not advance. Stamp a fresh `updated_at` on regeneration. Read the
import's output rather than assuming it applied.

`--allow-stale` overrides the guard and is the right flag only when deliberately restoring an older
snapshot.

Re-running an identical import converges. Rows upsert, and labels, comments, and dependencies
deduplicate.

This behavior arrived in 1.0.5 (2026-05-28), so it is present in every 1.1.x release.

## Invocation

```
bd import <file>            # a specific file
bd import -                 # stdin
bd import                   # the configured import.path under .beads/, default issues.jsonl
bd import --dry-run         # report what would be imported, write nothing
bd import --json            # structured output: created and skipped ids
```

Redirecting stdin without `-` is an error rather than a silent import of the default file.

`--dry-run` is the pre-flight for §4 of the method document. Run it before the real import, since a
malformed record aborts the whole run and dry-run finds that for free.

A failed import exits nonzero with already-committed chunks durable. Re-running the same file is
safe.

## Version floor

**1.1.0 or newer.** That is the first stable release of the current line, npm and Homebrew both
serve 1.1.2, and everything the method depends on is present.

Hierarchical IDs and labels are old features and set no meaningful floor of their own. The
`updated_at` guard, which is the one behavior the beads skill has to reason about, landed in 1.0.5.
Pinning at 1.1.0 clears all of it without needing a per-feature bisect.
