# CUJ document: necklace cover site

Derived from `spec.md` in this directory. One CUJ per actor-outcome pair.

A working version of every visual decision already exists in `repl/splash/`, arrived at by building
and looking. These slices move it into place and make it deploy; they do not re-litigate it.

---

## CUJ-01: Visitor reaches a page that says what necklace is

**Actor:** visitor
**Trigger:** follows a link to the site
**Journey:**
1. Visitor loads the splash page.
2. Page states what necklace is, what it requires, and how to install it.
3. Visitor decides whether to keep reading, without opening the repo.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `splash builds from org` | the site source | `index.html` exists after a build and is non-empty | |
| `splash names beads as a requirement` | built `index.html` | the rendered text mentions beads before the reader would run anything | |
| `install command matches the README` | built `index.html` and `README.md` | the `npx` line on the page is byte-identical to the one in the README | spec: two copies of the install line is the drift this has to avoid |
| `no org default stylesheet` | built `index.html` | the page carries exactly one `<style>` block, ours | REPL: org injects ~200 lines of its own CSS unless told not to |

**Done when:** the four tests above pass. All must be red when created.

**Beads:** `necklace-lr3`

---

## CUJ-02: Visitor recognises the project in a browser tab

**Actor:** visitor
**Trigger:** the page loads, or sits in a bookmark bar
**Journey:**
1. Browser requests the favicon.
2. The reduced mark is served, and stays legible at 16px.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `every page declares the favicon` | all built pages | each has a `<link rel="icon">` and the referenced file exists in the output | |
| `the reduced mark is the favicon` | built output | the favicon is the three-bead mark, not the five-bead one | REPL: five beads render clearly at 128px and become an indistinct smudge at 16px |
| `both marks ship as vectors` | built output | both `.svg` files are present and non-empty | |

**Done when:** the three tests above pass. All must be red when created.

**Beads:** `necklace-73f`

---

## CUJ-03: Reader follows a deep link into the documentation and lands on the section

**Actor:** reader
**Trigger:** opens a link someone sent them, or a bookmark, after the site has been rebuilt
**Journey:**
1. Reader follows a URL carrying a fragment.
2. The page loads and the fragment resolves to the section it named.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `heading anchors survive a rebuild` | build twice, unchanged sources | every `<h2>`/`<h3>` id is identical between the two builds | REPL: without stable ids, two builds of an unchanged file produced entirely different anchors |
| `heading anchors are readable` | built skill pages | ids are slugs of their heading text, not generated hashes | REPL: pandoc emits `:CUSTOM_ID:` per heading |
| `every internal link resolves` | all built pages | every `href` beginning `./` names a file that exists in the output | the Documentation link 404'd during the REPL because its target did not exist yet |

**Done when:** the three tests above pass. All must be red when created.

**Beads:** `necklace-6zs`

---

## CUJ-04: Reader sees the skill file the agent actually loads

**Actor:** reader
**Trigger:** opens a skill page from the documentation index
**Journey:**
1. Reader opens the page for one skill.
2. The page shows that skill's real content, rendered.
3. The content cannot disagree with the installed skill, because it is the installed skill.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `a page exists per skill` | `skills/` and the built output | one page per skill directory, no more and no fewer | |
| `skill content comes from the real file` | a sentinel string added to a `SKILL.md`, then a rebuild | the sentinel appears in that skill's page | the whole point is that these cannot drift |
| `skill content is rendered, not raw` | built skill pages | headings and bold appear as markup, with no literal `##` or `**` in the body | REPL: org's own include renders raw markdown, and including it as org double-parses bold |
| `frontmatter is not shown as content` | built skill pages | the `name:` and `description:` block does not appear as body text or a table | REPL: pandoc renders the delimiter block as a table when it is not stripped |
| `a skill with a lenient-YAML description still builds` | a skill whose description contains an unquoted colon | the build succeeds | REPL: a skill shipping today is invalid strict YAML and loads fine in Claude Code |

**Done when:** the five tests above pass. All must be red when created.

**Beads:** `necklace-a9q`

---

## CUJ-05: Maintainer publishes by pushing, and the build fails loudly when it cannot

**Actor:** maintainer
**Trigger:** pushes to the default branch
**Journey:**
1. The workflow installs Emacs, htmlize, and the markdown converter.
2. It builds the site and uploads it to Pages.
3. A failure at any step fails the run rather than deploying a broken or partial site.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `the build runs from a clean checkout` | a fresh clone, no local Emacs packages | the build completes and produces every expected page | htmlize is not bundled with Emacs and had to be installed from MELPA |
| `a broken include fails the build` | an include pointing at a missing file | the build exits nonzero and names the file | REPL: a wrong parent-directory count produced exactly this, and it failed loudly |
| `nothing generated is committed` | the repo after a build | the output directory and the converted org files are ignored by git | spec: nothing built is committed |

**Done when:** the three tests above pass. All must be red when created.

**Depends on:** CUJ-01

**Beads:** `necklace-uc1`

---

## CUJ-06: Maintainer changes a skill and the site follows without being touched

**Actor:** maintainer
**Trigger:** edits a `SKILL.md` and pushes
**Journey:**
1. Maintainer edits the skill only.
2. The next deploy regenerates that skill's page from the edited file.
3. No page in the site had to be updated by hand.

**Tests to create:**

| Test | Input | Assertion | Informed by |
| --- | --- | --- | --- |
| `adding a skill adds a page` | a new directory under `skills/` | a page for it appears without any site file being edited | six pages generated from a loop over `skills/*/`, so this should hold by construction |
| `the docs index lists every skill` | `skills/` and the built index | every skill has a link from the index, and every link resolves | the index is the one hand-written page and therefore the one that can drift |

**Done when:** both tests above pass. Both must be red when created.

**Depends on:** CUJ-04

**Beads:** `necklace-vgn`

---

<!--
Checks before finishing:

  Every actor-outcome pair in spec.md has a CUJ here.   6 pairs, 6 CUJs.
  Every CUJ has at least one test row.                  yes, 20 tests.
  Every "Done when" names tests and nothing else.       yes.
  Slices are vertical.                                  each is one actor observing one outcome.
  Dependencies are sparse.                              two edges.
  Every Beads line names beads.                         yes: all six broken down and closed.

  The visual decisions are settled in repl/splash/ and are not re-opened here. What these slices
  test is that the result keeps working, not that it looks the way it looks.
-->
