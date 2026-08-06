# necklace cover site

A GitHub Pages site for necklace, and the mark it uses.

## The problem

necklace has no address. The only way to find out what it is or how to install it is to open the
GitHub repo and read a README, which requires already having decided it might be worth reading.

That matters for the one thing this project is for. Handing a coworker a tool means giving them
something to look at first, and "clone my repo and read the markdown" is a worse pitch than a link.
The repo has no `homepage` set and `has_pages` is false, so there is nothing to link to.

There is also no mark. The package, the README, and any future site all present as text, so nothing
identifies necklace in a tab, a bookmark, or a list of repos.

## Actors

- Visitor: someone sent the link, deciding in under a minute whether this is for them
- Installer: the same person after they have decided, wanting the command
- Maintainer: Nathan, who has to keep the site true without it becoming a second job

## Actor-outcome pairs

| Actor | Must be able to observe |
| --- | --- |
| Visitor | What necklace does and what it costs them, without opening the repo |
| Visitor | That it requires beads, before they install anything |
| Visitor | A mark that identifies the project in a browser tab |
| Installer | The install command, copyable, correct, and matching the README |
| Maintainer | That the site cannot drift on anything but its own prose |
| Maintainer | That the site does not reach the published package or break CI |

## Constraints

- GitHub Pages is not configured. No deployment source exists yet, so one has to be chosen rather
  than inherited.
- Pages runs Jekyll on anything without `.nojekyll`. Verified that no file the site would reuse
  contains Liquid delimiters, so Jekyll is safe here; but the two templates hold nine angle-bracket
  placeholders that raw HTML would eat.
- A top-level site directory is already excluded from the package. Verified: 17 files in the tarball,
  none under `docs/`. Target detection is also unaffected.
- The install command exists in the README today. Two copies of it is the drift this has to avoid.
- The mark must work at favicon size. Measured: five beads render clearly at 128px and become an
  indistinct smudge at 16px, so one file cannot serve both purposes.
- Purple. Lavender pearls on a deeper purple cord.

## Approach

A single static page, no build step and no generator, matching the package's own no-build property.

It is a **cover, not documentation**. It answers what necklace is, what it requires, and how to
install it, then sends the reader to the repo. It does not restate the skills, the method, or the
workflow, because the README already does and a second copy is a second thing to be wrong.

The mark is one design language in two renderings: the full necklace where there is room, and a
reduced form for sizes where the full one stops resolving. Both ship as vectors so a single file
serves every display size in its class.

Deployment source and the exact reduction are implementation choices, deliberately left open here.

## Open questions

None.

---

<!--
Altitude self-check:

  Could two competent engineers implement this differently and both be right?
    Yes. Nothing here fixes the deployment source, the page structure, the copy, the typography,
    how the mark reduces, or how the install line stays in step with the README.

  Could two competent engineers disagree about whether this was satisfied?
    No. The actor-outcome table says what has to be observable, including the favicon and the
    no-drift and no-pollution requirements.
-->
