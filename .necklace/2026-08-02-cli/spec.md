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

## Actor-outcome pairs

| Actor | Must be able to observe |
| --- | --- |
| Installer | The skills present in the correct directory for each agent they selected, after one command |
| Installer | Which agents were detected, which were selected, and exactly what was written |
| Installer | Whether beads is installed, initialized, and exporting, and what to run if not |
| Installer | Their agent picking the skills up, without them knowing any target's path convention |
| Reinstaller | Newer skills in place after rerunning the same command, with every replaced file named |
| Installer on Windows | The same result as on Linux or macOS, including when their beads came from npm |

## Constraints

- Four committed targets, each with its own path. All read `SKILL.md` with `name` and `description`
  frontmatter, and require the directory name to match `name`. Verified against vendor documentation.
- Beads is a hard requirement. `bd init` defaults auto-export off, and `export.auto` and
  `export.git-add` are separate keys that both default false.
- `fs.cp` reports nothing about what it did, under any option combination. Measured. The report has to
  be assembled by whatever drives the copy.
- Distribution is `npx github:soniccyclone/necklace`, which packs the repository rather than an npm
  release. `package.json` needs a `bin` entry and a `files` list including `skills/`. Updating means
  rerunning the same line, so there is no version metadata to compare against.
- Windows, macOS, and Linux. Beads installed from npm on Windows is `bd.cmd`, and Node has refused to
  spawn a `.cmd` without a shell since 18.20, so the probe needs one there. Windows also resolves PATH
  case-insensitively while Node's `env` object does not.
- Node 22 or newer. `import.meta.dirname` would allow 20.11, but Node 20 reached end of life in April
  2026 and the test runner only expands glob patterns itself from v21, which a Windows shell needs
  since `cmd.exe` does not expand them.
- No runtime dependencies. Measured as achievable: keypress events, argument parsing, and recursive
  copy are all in the standard library. Driving the CLI in tests needs a pseudo-terminal, which is a
  dev dependency and does not ship.
- Apache 2.0, and no `NOTICE` file. The licence makes one optional and necklace vendors nothing, so
  one would only oblige forks to carry an attribution nobody asked for.

## Approach

One command, `necklace init`, running four phases in order: check that the environment can actually
run the method, detect which agents the repo shows evidence of, confirm the selection with the user,
then write and report every path.

The environment check comes first so nobody picks targets and is then told beads is unusable. It
reports and stops; it never installs beads or initializes a repo, because doing so writes tracked
files and commits them, which is not a decision to make on someone's behalf as a side effect of
installing skills.

Detection ranks the selection list rather than gating it, so a target whose directory does not exist
yet stays reachable. The payload always wins: installed skills are necklace's, not user
configuration, so a rerun is also the update path. What that costs is a local edit, which is why
every written path is reported and why the skills live in a git repo where an unwanted overwrite
shows up in `git diff`.

The environment check is a gate rather than a warning, because installing skills that cannot run is
the failure mode the whole no-fallback rule exists to prevent.

## Open questions

None. The scope decisions this needed were settled in `.necklace/2026-07-30-skills/necklace-tool-plan.md`.

---

<!--
Altitude self-check:

  Could two competent engineers implement this differently and both be right?
    Yes. Nothing here fixes the module layout, the registry format, how the prompt is drawn, how
    conflicts are compared, or the output format.

  Could two competent engineers disagree about whether this was satisfied?
    No. The actor-outcome table says what has to be observable.
-->
