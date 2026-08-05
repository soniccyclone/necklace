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

**Beads:** <filled in by necklace-beads after breakdown>

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
