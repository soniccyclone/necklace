# Ledger: necklace cover site

## REPL findings

**Pages is not configured.** `gh api repos/soniccyclone/necklace/pages` returns 404 and the repo
reports `has_pages: false`, `homepage: none`. So the deployment source is an open choice rather than
something to work around.

**Jekyll is safe by default.** `repl/jekyll_hazards.sh` searched every file a site would reuse for
Liquid delimiters. None. GitHub Pages runs Jekyll on anything without `.nojekyll`, and a stray `{{`
in a code block is a build failure, so this was worth checking before deciding whether to disable it.
Falsification was that the skills or README would contain Liquid; they do not, so `.nojekyll` would
be ceremony.

The same probe found **9 angle-bracket placeholders** across the two templates, `<CUJ-NN>`,
`<actor>`, and similar. Markdown renderers pass those through; raw HTML eats them as unknown tags.
That constrains how template content can be shown on the site.

**A site directory does not reach the package.** `repl/site_pollution.sh` created `docs/` with
content and packed: 17 files in the tarball, **0** of them under `docs/`. The `files` list in
`package.json` is explicit, so the exclusion is already correct. Detection also still returns
`['claude']`, so a new top-level directory does not confuse target detection. Falsification was that
`files` would fail to exclude it and the site would ship to everyone running npx.

**Five beads do not survive a favicon.** `repl/icon.svg` renders correctly at 128px: five lavender
pearls on a purple cord, centre largest, clearly legible. At 16px it is an indistinct purple smudge.
The falsification condition was stated before rendering and it fired.

`repl/icon-mark.svg` tests the fix: three beads, fewer and larger, same palette and geometry. It
reads at 32px and holds a recognisable cluster shape at 16px.

So the mark needs two variants from one design language, not one file used everywhere. This is the
kind of thing that ships broken because nobody looks at the 16px render.

**The renders are kept, not just the scripts.** `probe-16.png` is the evidence that five beads fail
at favicon size; `render.py` only says what was measured. Seven kilobytes for all five. This is now
a rule in `necklace-spec`: when a finding is visual, the artifact survives alongside the script,
because nobody re-runs a script to settle an argument.

## Decisions

**The site is a cover, not documentation.** Its job is: understand what this is, decide if it is for
you, copy the install line, go to the repo. It deliberately does not mirror the README, because two
copies of install instructions drift and the wrong one is always the one someone found first.

**One page, no build step.** Consistent with the package having no build step. A static site
generator would be a second toolchain to maintain for a single page.

## Open

Nothing yet.
