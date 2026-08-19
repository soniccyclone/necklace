#!/bin/sh
# Exercise the exact bd surface necklace touches, against one bd version.
# Emits one `RESULT <step> <exit> <first line of output>` line per step.
# Runs inside a container; do not run this on a machine you care about.
set -u
V="$1"

say() { printf 'RESULT\t%s\t%s\t%s\n' "$1" "$2" "$(printf '%s' "$3" | head -1 | cut -c1-90)"; }

run() { # run <step> <cmd...>
  step="$1"; shift
  out=$("$@" 2>&1); code=$?
  say "$step" "$code" "$out"
}

ilog=$(npm i -g --no-fund --no-audit "@beads/bd@$V" 2>&1) || { say install 1 "$(printf '%s' "$ilog" | grep -iE 'error|fail|404' | head -1)"; exit 0; }

rm -rf /work; mkdir -p /work; cd /work || exit 1
git init -q . 2>/dev/null
git config user.email p@r.obe; git config user.name probe

# 1. the gate: src/beads.js
run version   bd --version
ver_out=$(bd --version 2>&1)
if printf '%s' "$ver_out" | grep -qE '[0-9]+\.[0-9]+\.[0-9]+'; then
  say version-parseable 0 "$(printf '%s' "$ver_out" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
else
  say version-parseable 1 "no X.Y.Z in: $ver_out"
fi

run init      bd init
run where     bd where

# 2. the export config the gate warns about
run cfg-set-auto   bd config set export.auto true
run cfg-set-gitadd bd config set export.git-add true
got=$(bd config get export.auto 2>&1); code=$?
say cfg-get-auto "$code" "$got"
[ "$(printf '%s' "$got" | tr -d ' \r\n')" = "true" ] && say cfg-get-auto-is-true 0 true || say cfg-get-auto-is-true 1 "got:[$got]"
got2=$(bd config get export.git-add 2>&1); code=$?
say cfg-get-gitadd "$code" "$got2"
[ "$(printf '%s' "$got2" | tr -d ' \r\n')" = "true" ] && say cfg-get-gitadd-is-true 0 true || say cfg-get-gitadd-is-true 1 "got:[$got2]"

# 3. necklace-beads/SKILL.md
run prime     bd prime

id=$(bd create "CUJ-01 slice" -d "tests: a, b" -l cuj:CUJ-01 -p 1 -t task 2>&1)
say create $? "$id"
run list      bd list
run ready     bd ready

run export-o  bd export -o .beads/issues.jsonl
[ -s .beads/issues.jsonl ] && say export-file 0 "$(wc -c < .beads/issues.jsonl) bytes" || say export-file 1 "missing or empty"
