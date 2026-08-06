# CUJ document: <Ticket title>

Derived from `spec.md` in this directory. One CUJ per actor-outcome pair.

---

## CUJ-01: <Actor does the thing and observes the outcome>

**Actor:** <the actor from spec.md>
**Trigger:** <what starts this journey>
**Journey:**
1. <Actor does something. Active voice, name the actor, one instruction per line.>
2. <System responds observably.>

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `<TestName>` | <the specific state that makes this the interesting case> | <the one observable claim that must hold> | <REPL finding, or leave empty> |

**Done when:** the tests above pass. All must be red when created.

**Depends on:** <CUJ-NN, or delete this line>

**Blocked:** <the unresolved judgment question in spec.md this waits on. Delete this line if none.
While present, necklace-beads leaves this CUJ alone.>

**Beads:** <one of three. Bead IDs, once necklace-beads has broken this down. Or
`none - done directly in <ref>` when the work was finished without beads, which is what
necklace-tweak writes. Or left as-is, meaning not broken down yet.>

---

## CUJ-02: <...>

**Actor:**
**Trigger:**
**Journey:**
1.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `<TestName>` |  |  |  |

**Done when:** the tests above pass. All must be red when created.

**Beads:**

---

<!--
Checks before finishing:

  Every actor-outcome pair in spec.md has a CUJ here.
  Every CUJ has at least one test row with a real input and a real assertion.
  Every "Done when" names tests and nothing else.
  Slices are vertical. If this reads as phases or layers, re-slice.
  Dependencies are sparse.

  "Input" is not "a valid request". Say what makes it the interesting case.
  "Informed by" is optional. A test needs an input and an assertion, not provenance.
-->
