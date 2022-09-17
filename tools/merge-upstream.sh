#!/bin/bash -e

origin="origin"
branch=$(git rev-parse --abbrev-ref HEAD)
upstream_url=$(git remote get-url "upstream")
echo "upstream url: $upstream_url"
latest_merged_commit=$(cat upstream_commit.txt 2> /dev/null || echo "unknown")
echo "latest merged commit: $latest_merged_commit"
latest_upstream_commit=($(git ls-remote -h $upstream_url | grep "refs/heads/$branch" || true))
latest_upstream_commit=${latest_upstream_commit[0]}
echo "upstream commit: $latest_upstream_commit"


DIRECT_RESTORE=false
if [ ! -z "$(git status --porcelain)" ]; then
  echo "The LOCAL git repo is not clean! Restoring renamed files (if any)..."
  DIRECT_RESTORE=true
fi

if [ "$latest_merged_commit" != "$latest_upstream_commit" ]; then
  echo "There's an upstream commit which has not been merged..."
  if [ "$DIRECT_RESTORE" == false ]; then
    echo "Moving collection files out"
    if [ ! -f collections.json.oll ]; then
      mv collections.json collections.json.oll
    fi
    if [ -f collections.json ] && [ -f collections-original.json ]; then
      echo "collections.json should not exist at this point! Aborting..." && exit 1
    fi
    if [ -f collections-original.json ]; then
      mv collections-original.json collections.json
    fi
    if [ ! -f collections.md.oll ]; then
      mv collections.md collections.md.oll
    fi
    if [ -f collections.md ] && [ -f collections-original.md ]; then
      echo "collections.md should not exist together with collections-original.md at this point! Aborting..." && exit 1
    fi
    if [ -f collections-original.md ]; then
      mv collections-original.md collections.md
    fi
    git add collections.json.oll collections.md.oll
    git commit -a -c "Commit of rename before merge"
    git pull upstream master
    echo "$latest_upstream_commit" > upstream_commit.txt
  else
    echo "Skipped merging upstream commits due to unclean local repo!"
  fi
fi

echo "Moving collection files back (if any are left behind)"
if [ ! -f collections-original.json ] && [ -f collections.json ]; then
  mv collections.json collections-original.json
else
  echo "Can't restore collections-original.json"
fi
if [ -f collections.json.oll ] && [ ! -f collections.json ]; then
  mv collections.json.oll collections.json
else
  echo "Can't restore collections.json"
fi
if [ ! -f collections-original.md ] && [ -f collections.md ]; then
  mv collections.md collections-original.md
else
  echo "Can't restore collections-original.md"
fi
if [ -f collections.md.oll ] && [ ! -f collections.md ]; then
  mv collections.md.oll collections.md
else
  echo "Can't restore collections.md"
fi
if [ "$DIRECT_RESTORE" == false ]; then
  echo "Completed merging in the upstream repository!"
else
  echo "Completed restoring renamed files!"
fi
git status
