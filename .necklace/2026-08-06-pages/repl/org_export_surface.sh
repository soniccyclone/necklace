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
# 3. Syntax highlighting needs htmlize, which is NOT bundled. Installed from
#    MELPA; the workflow must do the same. With org-html-htmlize-output-type
#    set to 'css it emits classes rather than inline styles, so the skin can
#    colour them: org-comment, org-comment-delimiter, org-builtin,
#    org-variable-name, org-string, org-keyword.
#
# 4. A first read said sh blocks were not fontified. Wrong: the sample was
#    `npx ... init`, a bare command with nothing to highlight. Given real shell
#    syntax, sh fontifies fully. Inference corrected by testing.
#
# 5. Org injects roughly 200 lines of default CSS into every page, including a
#    pre.src-<lang>:before content rule for every language it knows. Setting
#    org-html-head-include-default-style to nil removes it: the probe page went
#    to 1724 bytes with zero <style> blocks, so the skin starts from a clean
#    slate rather than fighting defaults.
