#!/bin/sh
# Generate a docs page per skill from the real SKILL.md files.
#
# pandoc converts markdown to org, so the content flows through org's own
# exporter and picks up the site's CSS. It also emits :CUSTOM_ID: per heading,
# which is what keeps deep links stable across rebuilds.
#
# The YAML frontmatter is metadata to pandoc and gets dropped, so the
# description is pulled out separately and shown as the page's tagline.
set -e
cd "$(dirname "$0")"
ROOT=$(git rev-parse --show-toplevel)
PANDOC=${PANDOC:-$HOME/.local/bin/pandoc}

rm -rf gen && mkdir -p gen

for dir in "$ROOT"/skills/*/; do
  name=$(basename "$dir")
  src="$dir/SKILL.md"
  [ -f "$src" ] || continue

  # frontmatter description, unwrapped onto one line
  desc=$(awk '/^description: /{sub(/^description: /,""); print; exit}' "$src")

  "$PANDOC" -f markdown -t org --wrap=none "$src" > "gen/$name.org"

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
  echo "  generated skill-$name.org"
done
