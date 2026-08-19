# necklace refuses working installs of bd

## The problem

`necklace init` blocks on any bd below 1.1.0 with `bd <v> is below the 1.1.0 floor necklace
requires.` Nathan hit this at work against a bd that would have run necklace fine.

The floor is unsourced. `git log -S VERSION_FLOOR -- src/beads.js` returns one commit, and the
planning directory behind it names 1.1.0 only inside a test assertion. No probe from that cycle ever
ran a real bd.

Measured, in `node:22-slim` under podman, against every version npm still serves. The full necklace
bd surface — `--version`, `init`, `where`, `config set`/`get` on both export keys, `prime`, `create`
with a `cuj:` label, `list`, `ready`, `export -o` — behaves in four bands:

| bd range | result |
| --- | --- |
| 0.39.0 | all steps pass except `bd where`, which does not exist yet |
| 0.39.1 – 0.49.6 | every step passes |
| 0.50.1 – 0.50.3 | `config set` exits 0 but the value does not round-trip |
| 0.51.0 – 0.62.0 | Dolt-backed; `bd init` and `bd where` fail outright |
| 1.0.2 – 1.2.1 | every step passes |

Two consequences. The floor rejects 0.39.1–0.50.3 and 1.0.2–1.0.5, which all work. And the bands are
not monotonic in the version number — 0.49.6 works where 0.62.0 does not — so no single `>=` is
correct for every real version.

Running the real `checkBeads` with the floor stripped, the capability probes it already performs
block 0.39.0, 0.51.0 and 0.62.0, pass everything that works, and warn correctly on 0.50.3. They catch
every failure the sweep found. The floor detects nothing they do not.

A second defect surfaced by the same run: when `bd where` fails, necklace reports `beads is installed,
but this repo has no beads workspace` and tells the user to run `bd init`. On 0.39.0 the real cause is
`unknown command "where" for "bd"`; on 0.51.0 it is `Dolt server unreachable`. bd distinguishes all
three cases on stderr and necklace discards that in favour of a guess.

## Actors

- Someone running `necklace init` on a bd that works but is old
- Someone running `necklace init` on a bd that is genuinely unusable
- Someone maintaining necklace against future bd releases

## Actor-outcome pairs

| Actor | Must be able to observe |
| --- | --- |
| Working-but-old bd | `necklace init` completes and writes the skills, with no version complaint, on any bd that answers the commands necklace uses |
| Unusable bd | `necklace init` still refuses, and the reason it prints is bd's own reason, not a substituted guess |
| Unusable bd | The remediation matches the actual fault: upgrade bd when the command is missing, fix the workspace when the workspace is missing |
| Maintainer | Adding support for a new bd release requires no change to a version constant, because there is not one |
| Maintainer | The repository states which bd versions were measured, and against what surface, so the next person does not have to re-derive it |

## Constraints

- bd's stable surface is wider than assumed: `where`, `config get`, `prime`, `export -o` and labelled
  `create` all behave identically from 0.39.1 to 1.2.1. Anything narrower than that band is an
  invented restriction.
- `src/beads.js` depends on `bd config get <key>` trimming to exactly `true`. That contract holds
  across the whole measured range and stays a live dependency.
- 0.55.4, 0.63.3 and 1.0.5 cannot be installed from npm at all — their postinstall fetches a release
  asset that no longer exists. Out of necklace's reach, and out of its concern.
- necklace must not run `bd init` or `bd config set` on the user's behalf. That decision predates this
  work and does not change here.
- `--skip-beads-check` stays. Whatever the gate decides, the user can override it.

## Approach

Gate on capability, not on a version number. necklace already runs the commands it depends on; let
those runs be the whole test, and delete the version comparison rather than move it.

When a probe fails, report what bd said. bd's stderr already separates "that command does not exist"
from "no workspace here" from "the backend is unreachable", and each points at a different fix. Pass
it through rather than mapping every failure onto the one remediation necklace currently prints.

Record the measured range in the repository, with the probe that produced it, so the claim is
checkable rather than remembered.

## Open questions

| Question | Why it cannot be settled by reading or running |
| --- | --- |
| Drop the floor entirely, or lower it to 0.39.1 and keep the mechanism? | Both satisfy the evidence. Dropping it accepts that a future bd could break necklace with no version tripwire; keeping it accepts a number that is already wrong for 0.51.0–0.62.0. This is risk appetite, and it is Nathan's call. |
