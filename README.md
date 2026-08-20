# necklace

[![CI](https://github.com/soniccyclone/necklace/actions/workflows/ci.yml/badge.svg)](https://github.com/soniccyclone/necklace/actions/workflows/ci.yml)

Agentic REPL-Driven Development, as installable skills.

Two documents thread through a ticket. Beads hang off the second one.

1. A planning document, researched by exercising real code paths rather than by reading source and
   reasoning about it.
2. A CUJ technical design document, one vertical slice per outcome, each naming the tests that close
   it.
3. A beads breakdown, worked to completion.

The code is the source of truth. The documents are provenance: a record of what was intended and why,
kept because someone will ask in six months. They are not a definition the code answers to, and a
stale one is not a defect.

## Install

```
npx github:soniccyclone/necklace init
```

Not on npm yet, so the GitHub form is the install. It always fetches the current `main`.

`init` detects which agents your repo uses, asks which to install for, and writes the skills. Rerun
it to update: it always writes the current skills, so there is no separate update command.

```
necklace init --agent claude --agent cursor   # skip the prompt
necklace init --global                        # install for every repo
```

## Requirements

- **Node 22 or newer.**
- **[beads](https://github.com/gastownhall/beads), installed and initialized in your repo.** necklace
  checks and tells you what to run; it never installs or initializes on your behalf, because `bd init`
  writes tracked files and commits them and that is your call.

  There is no minimum bd version. necklace runs the bd commands it depends on and accepts whatever
  answers them, which every bd from 0.39.1 to 1.2.1 does apart from the Dolt-backed 0.51.0-0.62.0
  line. The measurement and the script behind it are in `.necklace/2026-08-19-beads-floor/`.

```
brew install beads          # or: npm i -g @beads/bd
bd init                     # in your repo
bd config set export.auto true
bd config set export.git-add true
```

The two export settings both default to off and both are needed. Without them the bead graph lives
only in your local database, so a bead ID written into a design document resolves to nothing for
anyone reading the repo on GitHub or reviewing a pull request.

### If you do not want beads pushing

beads runs its own session-close protocol, separate from necklace. By default it is conservative and
will not commit, sync, or push without being told to. If you have opted into maintainer behaviour:

```
git config --get beads.role      # "maintainer" means push is on the table
git config --unset beads.role    # back to conservative
```

necklace does not change this either way. It commits its own planning directory as it works and
leaves beads to whatever you have configured, because a tool that quietly overrides another tool's
settings is worse than one that tells you where the switch is.

## Supported agents

| Agent | Skills land in |
| --- | --- |
| Claude Code | `.claude/skills/` |
| Cursor | `.cursor/skills/` |
| GitHub Copilot | `.github/skills/` |
| opencode | `.opencode/skills/` |

Each gets its own native path rather than being routed through another vendor's compatibility
directory.

## The skills

| Skill | What it does |
| --- | --- |
| `necklace` | runs the whole pipeline |
| `necklace-spec` | ticket to planning document, researched in a REPL first |
| `necklace-cuj` | planning document to CUJ technical design document |
| `necklace-beads` | CUJ document to beads, worked to completion |
| `necklace-tweak` | post-implementation edits, brought back into the documents |
| `necklace-lint` | checks whether necklace's own files are polluting your repo |

## Using it

Say what you want. The skills are invoked, not ambient.

```
let's plan this out with necklace, here's the ticket
```

Then argue with the planning document. That step is where the time goes, and the agent should be
running code to answer its own questions while you do, not asking you things it could find out.

When you are happy with it, ask for the CUJ document, then the beads breakdown. After you have run
the feature yourself and want changes, `necklace-tweak` makes them and brings the documents back in
line with what the code now does.

It is a loop. Edit the planning document, generate a new CUJ document beside the old one, break that
into beads, come back.

## What it writes

```
.necklace/2026-08-02-plat-4471-bulk-export/
├── spec.md      # active design only
├── ledger.md    # discussion, rejected options, what changed after implementation
├── cuj.md       # vertical slices and the tests that close them
└── repl/        # the scripts that answered the questions, kept
```

Committed on purpose. When someone asks why a decision was made, an answer that lives in a chat
transcript is not an answer.

`spec.md` holds what is currently true. Everything else goes in `ledger.md`, which is why the
planning document stays about two pages instead of growing into a record of its own drafting.

## The site

[soniccyclone.github.io/necklace](https://soniccyclone.github.io/necklace/) is built from `site/org/`
by Emacs and published on push. The skill pages are generated from the real `SKILL.md` files, so they
cannot drift from the installed skills.

```
sh site/build.sh          # build to site/www
npm run test:site         # build, then assert it holds together
```

Pages has to be switched on once by hand, under **Settings → Pages → Source: GitHub Actions**. A
workflow cannot do it: creating a Pages site needs repo-admin rights and the default `GITHUB_TOKEN`
does not have them.

## Development

```
npm ci
npm test          # 18 tests
npm run test:pty  # 10 more, driving the real binary through a pseudo-terminal
```

The package ships with zero runtime dependencies. node-pty is a dev dependency and never reaches
anyone installing it.

## License

Apache License 2.0. See [LICENSE](LICENSE).
