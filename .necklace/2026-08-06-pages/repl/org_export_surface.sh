#!/bin/sh
# REPL: what does org-publish actually emit, and does it survive our content?
# The skin hooks whatever this produces, and a docs site needs stable anchors.
#
# Falsification: if there are no stable ids, a skin has nothing to target and
# the approach needs a custom template rather than CSS.
#
# Emacs 30.2 locally. Run from this directory.

cd "$(dirname "$0")/orgprobe" || exit 1
rm -rf www ~/.org-timestamps 2>/dev/null
emacs --batch --load build.el 2>&1 | grep -i warning

echo
echo "ids and classes emitted:"
grep -oE 'id="[a-zA-Z0-9_-]+"|class="[a-zA-Z0-9 _-]+"' www/index.html | sort -u

# RESULTS, Emacs 30.2, org bundled:
#
# Hooks available: #content, #table-of-contents, #text-table-of-contents,
#   #postamble, .title .author .date .status .validation, .outline-2 and
#   .outline-text-2 per heading level, .org-src-container, pre.src.src-<lang>,
#   .org-left for table cells. Plenty to skin. Falsification did not fire.
#
# 1. Angle brackets are escaped. <actor> in an org file comes out as
#    &lt;actor&gt;, so the nine template placeholders are safe. This retires the
#    raw-HTML concern raised by the earlier Jekyll probe.
#
# 2. Heading anchors are UNSTABLE. Without CUSTOM_ID, org generates
#    id="org3daff1b" style hashes that differ on every export: two consecutive
#    builds of an unchanged file produced completely different ids. Any deep
#    link into the docs dies on the next deploy.
#    Fix verified: a :CUSTOM_ID: property yields id="install" and it is
#    identical across rebuilds.
#
# 3. Syntax highlighting needs htmlize, which is NOT bundled. Without it org
#    warns "Cannot fontify source block" and falls back to plain text. Our
#    content is mostly code blocks, so this is a real decision rather than a
#    nicety: install htmlize in the workflow, or accept unhighlighted code and
#    style pre.src ourselves.
