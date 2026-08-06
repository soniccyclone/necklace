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
- No frontend framework. HTMX is acceptable if something genuinely needs interactivity; nothing here
  does. This is Nathan's constraint and it matches the package's own no-build-step property.
- Emacs org-mode is the source format, published with `org-publish`. This is a deliberate choice, not
  an incidental one: the site being rendered org is part of what it says about the project.
- Org generates unstable heading anchors. Measured: two builds of an unchanged file produced entirely
  different ids, so any heading worth linking to needs an explicit stable id. Deep links into
  documentation are the point of having documentation pages.
- Syntax highlighting is not free. Measured: org falls back to plain text without `htmlize`, which
  Emacs does not bundle, and this site is mostly code blocks.

## Approach

**Org files, published by Emacs, deployed from Actions.** Source lives as `.org`, a batch Emacs run
turns it into HTML, and the result is uploaded straight to Pages. No framework, no generator, no
node_modules, and nothing to keep in sync with a theme someone else maintains.

The skin is CSS in the publish configuration, hooking the ids and classes org's exporter already
emits. Purple, against org's default structure rather than fighting it.

A splash page plus documentation pages, all org. It is a **cover with docs**, not a mirror of the
repo: it says what necklace is, what it requires, and how to install it, then goes deeper on the
method for anyone who wants it. The install command is the one thing that must not drift from the
README, and that is a constraint on how the two are kept, not a reason to omit it.

The mark is one design language in two renderings: the full necklace where there is room, and a
reduced form for sizes where the full one stops resolving. Both ship as vectors.

Nothing built is committed. The output directory is generated on every deploy, so there is no
generated HTML in the repo to go stale or to review.

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
