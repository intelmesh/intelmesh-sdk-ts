#!/usr/bin/env bash
# Compute npm dist-tag and prerelease flag from a git tag name.
#
# Reads (env):
#   GITHUB_REF_NAME  git tag name, e.g. "v1.2.3" or "v1.2.3-beta.1"
#   GITHUB_OUTPUT    path to GitHub Actions step output file
#
# Writes to $GITHUB_OUTPUT:
#   version          semver without leading "v"
#   disttag          npm dist-tag ("latest" for stable, suffix prefix otherwise)
#   is_prerelease    "true" for any tag with a "-" suffix, else "false"

set -euo pipefail

tag="${GITHUB_REF_NAME:?GITHUB_REF_NAME is required}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"

version="${tag#v}"

if [[ "$version" == *-* ]]; then
  suffix="${version#*-}"
  disttag="${suffix%%.*}"
  is_prerelease=true
else
  disttag="latest"
  is_prerelease=false
fi

{
  echo "version=$version"
  echo "disttag=$disttag"
  echo "is_prerelease=$is_prerelease"
} >> "$GITHUB_OUTPUT"

echo "Resolved: tag=$tag version=$version disttag=$disttag prerelease=$is_prerelease"
