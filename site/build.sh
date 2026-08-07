#!/bin/sh
# Build the cover site.
#
# Generates a page per skill from the real SKILL.md files, then publishes
# everything with org-publish. Fails loudly rather than deploying a partial
# site: a missing include or a failed conversion stops the run.
set -e
cd "$(dirname "$0")"
ROOT=$(cd .. && pwd)

PANDOC=${PANDOC:-pandoc}
command -v "$PANDOC" >/dev/null 2>&1 || PANDOC="$HOME/.local/bin/pandoc"
command -v "$PANDOC" >/dev/null 2>&1 || {
  echo "build: pandoc not found. It converts SKILL.md to org so the docs cannot drift." >&2
  exit 1
}

# Every skill page org is generated. Clear them all first: a stale one left by
# a deleted skill points at a gen/ file that no longer exists, and org fails
# the whole build on the missing include.
rm -rf gen www
rm -f org/skill-*.org
mkdir -p gen

# One page per skill, generated. Nothing here is written by hand, so a new
# skill gets a page without any site file being edited.
for dir in "$ROOT"/skills/*/; do
  name=$(basename "$dir")
  src="$dir/SKILL.md"
  [ -f "$src" ] || continue

  # The frontmatter is stripped rather than parsed. It is YAML-shaped but the
  # agents that read these files parse it leniently, so a strict parser would
  # reject skills that work. The description is lifted out by line instead.
  desc=$(awk '/^description: /{sub(/^description: /,""); print; exit}' "$src")

  sed '1{/^---$/!q}; 1,/^---$/d' "$src" \
    | "$PANDOC" -f markdown -t org --wrap=none > "gen/$name.org"

  cat > "org/skill-$name.org" <<PAGE
#+TITLE: $name
#+OPTIONS: toc:nil num:nil author:nil date:nil

#+BEGIN_EXPORT html
<div class="hero compact"><h1>$name</h1></div>
#+END_EXPORT

#+BEGIN_QUOTE
$desc
#+END_QUOTE

#+INCLUDE: "../gen/$name.org" :minlevel 2

#+BEGIN_EXPORT html
<footer><a href="./docs.html">Documentation</a> · <a href="./index.html">Home</a> ·
<a href="https://github.com/soniccyclone/necklace/blob/main/skills/$name/SKILL.md">Source file</a></footer>
#+END_EXPORT
PAGE
done

# org caches publish timestamps globally and will skip files it thinks are
# unchanged, which hides edits to the skin because that lives in build.el.
rm -rf "$HOME/.org-timestamps"

emacs --batch --load build.el 2>&1 | tee /tmp/necklace-site-build.log
if grep -qiE "^(Error|Debugger entered)" /tmp/necklace-site-build.log; then
  echo "build: emacs reported an error above; refusing to publish a partial site" >&2
  exit 1
fi

test -f www/index.html || { echo "build: no index.html produced" >&2; exit 1; }
echo "build: $(find www -name '*.html' | wc -l) pages"
