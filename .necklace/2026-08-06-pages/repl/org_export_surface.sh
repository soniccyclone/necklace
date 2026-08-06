#!/bin/sh
# REPL: what CSS hooks does org-publish's HTML actually emit? The skin depends
# on them, and they are not documented anywhere as a contract.
#
# No emacs on this machine and installing one to answer this would be the
# "do not install a REPL" trap, so read a real published artifact instead:
# the live site built by the reference repo.
#
# Falsification: if the served HTML has no stable ids or classes, a skin has
# nothing to hook and the approach needs a template rather than CSS.

URL=https://soniccyclops-bot-collab.github.io/soniccyclops-blog/
echo "fetching $URL"
body=$(curl -sS --max-time 20 "$URL") || { echo "unreachable"; exit 1; }

echo "  bytes: $(printf '%s' "$body" | wc -c)"
echo
echo "ids and classes org emitted:"
printf '%s' "$body" | grep -oE 'id="[a-z0-9-]+"|class="[a-z0-9 _-]+"' | sort | uniq -c | sort -rn | head -20

# RESULT: the URL serves GitHub's 404 page (9114 bytes, id="suggestions",
# class="logo logo-img-2x"). The source repo is private, so Pages is not
# publicly served and the export surface cannot be read from the live site.
#
# Falling back to secondhand evidence: build-blog.el in that repo styles
# #content, #table-of-contents, #postamble, .org-src-container, pre and code.
# That CSS was written against real org output, so those hooks exist. Treat as
# unverified until our own CI builds once.
