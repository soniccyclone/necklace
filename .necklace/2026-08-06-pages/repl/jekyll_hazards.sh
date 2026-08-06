#!/bin/sh
# REPL: GitHub Pages runs Jekyll by default, which processes Liquid. Any {{ or
# {% in content the site renders is a build error or silent mangling, and our
# docs are mostly code blocks and angle-bracket placeholders.
#
# Falsification: if none of the material a site would reuse contains Liquid
# delimiters, Jekyll is safe by default and .nojekyll is unnecessary ceremony.

cd "$(git rev-parse --show-toplevel)" || exit 1

echo "Liquid delimiters ({{ or {%) in reusable material:"
found=0
for f in README.md skills/*/SKILL.md skills/*/*.md; do
  n=$(grep -c '{{\|{%' "$f" 2>/dev/null) || n=0
  if [ "${n:-0}" -gt 0 ]; then printf "  %-42s %s\n" "$f" "$n"; found=1; fi
done
[ "$found" -eq 0 ] && echo "  none"

echo
echo "Angle-bracket placeholders (Jekyll passes these; raw HTML would eat them):"
for f in skills/necklace-cuj/cuj.md skills/necklace-spec/spec.md; do
  printf "  %-42s %s\n" "$f" "$(grep -c '<[A-Za-z-]*>' "$f")"
done
