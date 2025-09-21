#!/usr/bin/env bash
set -Eeuo pipefail

MARKDOWN=0
OUT=""
ENSURE_EXEC=0
for arg in "$@"; do
  case "$arg" in
    -m|--markdown) MARKDOWN=1 ;;
    --out=*) OUT="${arg#*=}" ;;
    --ensure-exec) ENSURE_EXEC=1 ;;
  esac
done

# If requested, ensure this script is marked executable in Git (useful for POSIX clones/CI)
if [[ "$ENSURE_EXEC" -eq 1 ]]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git update-index --add --chmod=+x "$0" || true
  fi
fi

# If an output file is provided, mirror stdout/stderr to it
if [[ -n "$OUT" ]]; then
  # shellcheck disable=SC2094
  exec > >(tee "$OUT") 2>&1
fi

section() {
  if [[ "$MARKDOWN" -eq 1 ]]; then
    printf '\n## %s\n' "$1"
  else
    printf '\n\033[1;36m== %s ==\033[0m\n' "$1"
  fi
}

kv() {
  local k="$1"; shift || true
  local v="${1:-}"
  if [[ "$MARKDOWN" -eq 1 ]]; then
    printf '- **%s**: %s\n' "$k" "$v"
  else
    printf '\033[1;33m%-10s\033[0m %s\n' "$k:" "$v"
  fi
}

print_block() {
  if [[ "$MARKDOWN" -eq 1 ]]; then
    printf '\n```\n'; cat; printf '```\n'
  else
    cat
  fi
}

command_exists() { command -v "$1" >/dev/null 2>&1; }

# Node
section "Node"
if command_exists node; then
  kv version "$(node -v)"
  kv path    "$(command -v node)"
else
  kv error   "node not found"
fi

# npm
section "npm"
if command_exists npm; then
  kv version "$(npm -v)"
  kv path    "$(command -v npm)"
  section "npm globals"
  if npm -g ls --depth=0 >/dev/null 2>&1; then
    npm -g ls --depth=0 | print_block
  else
    echo "(npm -g ls not available in this npm version)" | print_block
  fi
  section "npm dirs"
  kv root    "$(npm root -g)"
  kv prefix  "$(npm prefix -g)"
  # npm bin -g may not exist on npm@11; derive sensibly
  __npm_bin=""
  if __npm_bin_out=$(npm bin -g 2>/dev/null || true); then
    __npm_bin="$__npm_bin_out"
  fi
  if [[ -z "${__npm_bin// /}" ]]; then
    __prefix="$(npm prefix -g)"
    if [[ "${OS:-}" == "Windows_NT" || -n "${MSYSTEM:-}" ]]; then
      __npm_bin="$__prefix"
    else
      __npm_bin="$__prefix/bin"
    fi
  fi
  kv bin     "$__npm_bin"
else
  kv error   "npm not found"
fi

# pnpm
section "pnpm"
if command_exists pnpm; then
  kv version "$(pnpm -v)"
  kv path    "$(command -v pnpm)"
  section "pnpm globals"
  pnpm -g ls --depth=0 | print_block || true
  section "pnpm dirs"
  kv root    "$(pnpm root -g)"
  kv bin     "$(pnpm bin -g)"
  kv store   "$(pnpm store path || true)"
else
  kv error   "pnpm not found"
fi

# npx / nx
section "npx / nx"
if command_exists npx; then
  kv npx     "$(command -v npx)"
  if [[ "$MARKDOWN" -eq 1 ]]; then
    printf '\n```\n'; npx nx --version || true; printf '```\n'
  else
    echo "Nx Version:"; npx nx --version || true
  fi
else
  kv error   "npx not found"
fi

# Environment
section "Environment"
kv SHELL   "${SHELL:-}"
if [[ "$MARKDOWN" -eq 1 ]]; then
  echo "\n- **PATH**:"; printf '\n'; printf '%s' "${PATH}" | tr ':' '\n' | sed '/^$/d' | sed 's/^/- /'
  if [[ -n "${PATHEXT:-}" ]]; then
    echo "\n- **PATHEXT**:"; printf '\n'; printf '%s' "${PATHEXT}" | tr ';' '\n' | sed '/^$/d' | sed 's/^/- /'
  fi
else
  echo "PATH:"; printf '%s' "${PATH}" | tr ':' '\n'
  if [[ -n "${PATHEXT:-}" ]]; then
    echo "PATHEXT:"; printf '%s' "${PATHEXT}" | tr ';' '\n'
  fi
fi

# Functional
section "Functional"
if command_exists npx; then
  npx nx graph --file=tmp/nx-graph.html --no-daemon || true
  if [[ "$MARKDOWN" -eq 1 ]]; then
    echo "Generated: tmp/nx-graph.html"
  fi
else
  echo "skip: npx not available"
fi

