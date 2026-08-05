# necklace CLI: `necklace init`

The installer that puts the six skills into a repo.

## The problem

The skills exist as directories in this repository and there is no way to get them into anyone
else's. A coworker cannot use necklace today, which is the entire point of packaging it.

The manual alternative is telling someone to clone this repo and copy six directories into a path
that differs per agent: `.claude/skills/` for Claude Code, `.cursor/skills/` for Cursor,
`.github/skills/` for Copilot, `.opencode/skills/` for opencode. They also have to know that beads is
required, that it defaults to auto-export off, and that two separate config keys have to be set.

Every one of those is a step someone gets wrong once and then blames the tool for.

## Actors

- Installer: the person running the command in their repo
- Reinstaller: the same person, later, on a newer version
- Skill author: someone who has edited an installed skill for their project

## Actor-outcome pairs

| Actor | Must be able to observe |
| --- | --- |
| Installer | The skills present in the correct directory for each agent they selected, after one command |
| Installer | Which agents were detected, which were selected, and exactly what was written |
| Installer | Whether beads is installed, initialized, and exporting, and what to run if not |
| Installer | Their agent picking the skills up, without them knowing any target's path convention |
| Reinstaller | Newer skills in place, with any file they had edited reported rather than silently replaced |
| Skill author | Their edits still present after a reinstall they did not force |

## Constraints

- Four committed targets, each with its own path. All read `SKILL.md` with `name` and `description`
  frontmatter, and require the directory name to match `name`. Verified against vendor documentation.
- Beads is a hard requirement. `bd init` defaults auto-export off, and `export.auto` and
  `export.git-add` are separate keys that both default false.
- `fs.cp` cannot report what it skipped. With `force: false` it silently preserves existing files, and
  with `errorOnExist` it aborts on the first conflict. Measured. Any report of what was left alone
  must come from a pass that runs before the copy.
- Node 18 or newer. `util.parseArgs` landed in 18.3 and `fs.cp` in 16.7.
- No runtime dependencies. Measured as achievable: keypress events, argument parsing, and recursive
  copy are all in the standard library.

## Approach

One command, `necklace init`, running five phases in order: detect which agents the repo shows
evidence of, confirm the selection with the user, check that the environment can actually run the
method, compare intended writes against what is on disk, then write and report.

Detection ranks the selection list rather than gating it, so a target whose directory does not exist
yet stays reachable. Nothing is written before the user has seen what will be written and what will
be skipped.

The environment check is a gate rather than a warning, because installing skills that cannot run is
the failure mode the whole no-fallback rule exists to prevent.

## Open questions

None. The scope decisions this needed were settled in `planning/skills/necklace-tool-plan.md`.

---

<!--
Altitude self-check:

  Could two competent engineers implement this differently and both be right?
    Yes. Nothing here fixes the module layout, the registry format, how the prompt is drawn, how
    conflicts are compared, or the output format.

  Could two competent engineers disagree about whether this was satisfied?
    No. The actor-outcome table says what has to be observable.
-->
