#!/bin/sh
# REPL: does a site directory leak into the shipped package or the CI checks?
# necklace's own lint skill exists to catch exactly this class of thing, so the
# site must not become the first violation.
#
# Falsification: if `files` in package.json failed to exclude it, the tarball
# would grow and the site would ship to everyone running npx.

cd "$(git rev-parse --show-toplevel)" || exit 1
mkdir -p docs/assets
echo '<html>probe</html>' > docs/index.html
echo '<svg/>' > docs/assets/icon.svg

before=$(npm pack --silent 2>/dev/null && tar tzf ./*.tgz | wc -l; rm -f ./*.tgz)
echo "files in tarball with docs/ present: $before"
npm pack --silent >/dev/null 2>&1 && tar tzf ./*.tgz | grep -c '^package/docs/' ; rm -f ./*.tgz
echo "  ^ docs entries in tarball (0 = excluded)"

echo "does docs/ change target detection?"
node -e "import('./src/targets.js').then(m=>console.log('  detect:', m.detect(process.cwd())))"

rm -rf docs
