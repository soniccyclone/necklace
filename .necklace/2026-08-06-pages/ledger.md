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

**The reference implementation, read from source.** `soniccyclops-bot-collab/soniccyclops-blog` is
the pattern Nathan wants copied. Cloned and read rather than described:

- `org/` holds `.org` sources; `build-blog.el` is an `org-publish-project-alist` with the whole skin
  inlined as `:html-head` CSS; output goes to `./www`, which is gitignored.
- `.github/workflows/publish.yml` runs `purcell/setup-emacs@master` at 29.1, then
  `emacs --batch --load build-blog.el`, then `configure-pages` / `upload-pages-artifact` /
  `deploy-pages`.
- `configure-pages@v4` carries `enablement: true`, which turns Pages on without anyone clicking
  through settings. That matters here because our repo reports `has_pages: false`.
- `:auto-sitemap t` generates an index of pages for free.

**The org export surface, verified.** Nathan installed Emacs mid-session, so the earlier secondhand
reading was replaced with a real `org-publish` run. `repl/orgprobe/` holds the minimal project;
`repl/org_export_surface.sh` runs it and records the results. Emacs 30.2, org bundled.

Falsification was that there would be no stable hooks to skin. It did not fire: org emits `#content`,
`#table-of-contents`, `#postamble`, `.title`, `.author`, `.date`, `.outline-2` and `.outline-text-2`
per heading level, `.org-src-container`, `pre.src.src-<lang>`, and `.org-left` on table cells. More
than enough, and more than the reference repo's CSS uses.

Three findings the secondhand reading would have missed:

**Angle brackets are escaped.** `<actor>` in an org file exports as `&lt;actor&gt;`. The nine
template placeholders are safe, which retires the concern the Jekyll probe raised about raw HTML
eating them.

**Heading anchors are unstable, and this is the important one.** Without a `CUSTOM_ID`, org generates
hashes like `id="org3daff1b"`, and two consecutive builds of an unchanged file produced entirely
different ids. Every deep link into the docs would break on the next deploy. Verified fix: a
`:CUSTOM_ID:` property yields `id="install"`, identical across rebuilds. Any heading worth linking to
needs one, which is a content rule rather than a build setting.

**Syntax highlighting needs `htmlize`, which is not bundled.** Installed from MELPA and verified. The
workflow has to do the same. With `org-html-htmlize-output-type` set to `css` it emits classes rather
than inline styles, which is what lets the skin colour code in the same palette as everything else:
`org-comment`, `org-comment-delimiter`, `org-builtin`, `org-variable-name`, `org-string`,
`org-keyword`.

A first reading of that output said `sh` blocks were not fontified, because the only span-bearing
block was elisp. That was wrong, and the sample was the reason: `npx github:soniccyclone/necklace
init` is a bare command with nothing to highlight. Given real shell syntax, a variable and a
conditional, `sh` fontifies fully. The inference was corrected by writing a better sample rather than
by reasoning harder.

**Org injects about 200 lines of default CSS into every page**, including a
`pre.src-<lang>:before { content: ... }` rule for every language it has ever heard of. Setting
`org-html-head-include-default-style` to nil removes it: the probe page dropped to 1724 bytes with
zero `<style>` blocks. The skin should start from a clean slate rather than overriding defaults it
did not ask for.

**Skill docs are generated from the real files, via pandoc.** `#+INCLUDE ... src markdown` works but
renders raw markdown in a `<pre>`, and including the file as org instead double-parses `**bold**` into
nested `<b>` and leaves backticks literal. Neither is readable.

pandoc converts markdown to org properly, so the content flows through org's own exporter and picks
up the site CSS. It also emits a `:CUSTOM_ID:` per heading, which is what makes the anchor-stability
problem go away on exactly the pages that needed it most. Verified: heading anchors are byte-identical
across rebuilds. Example blocks still get churning hash ids, which does not matter because nothing
links to a `<pre>`.

No sudo here, so pandoc went to `~/.local/bin`. The workflow will need its own install step.

**Generating the pages found a shipping bug.** pandoc refused `skills/necklace/SKILL.md` with a YAML
parse error, and it was right: the description read `...on a ticket or subsystem: a planning
document...`, and an unquoted `: ` inside a plain scalar is invalid YAML. That is the orchestrator,
the primary entry point, and every one of the four targets parses that block to decide when the skill
fires. Five of six skills were fine; only that one was malformed.

Fixed by rewording rather than quoting, and CI now parses all six with a real YAML parser instead of
grepping for the key. The previous check only confirmed a `description:` line existed, which this bug
passed.

## Decisions

**The site is a cover, not documentation.** Its job is: understand what this is, decide if it is for
you, copy the install line, go to the repo. It deliberately does not mirror the README, because two
copies of install instructions drift and the wrong one is always the one someone found first.

**Org-mode source, Emacs publish, deploy from Actions.** Nathan's call. No framework: he does not
want one, nothing on the page needs interactivity, and HTMX is available if that ever changes. The
build is one batch Emacs invocation, which is a toolchain but not a *frontend* toolchain, and it
keeps the repo free of `node_modules` for something that ships no JavaScript.

**Nothing generated is committed.** The reference repo gitignores its output and uploads the artifact
straight from the runner. That removes the docs-folder question entirely: the earlier probe checking
whether `docs/` leaks into the tarball is now moot, since no site directory will be tracked at all.

## Open

Nothing yet.
