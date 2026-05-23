#!/usr/bin/env bash
set -euo pipefail

ORG="${ORG:-APPNEURAL-OSs}"
VISIBILITY="${VISIBILITY:-private}"
REMOTE_NAME="${REMOTE_NAME:-origin}"
SLEEP_SECONDS="${SLEEP_SECONDS:-2}"
MIN_RATE_REMAINING="${MIN_RATE_REMAINING:-25}"
DRY_RUN=1
INCLUDE_UNINITIALIZED=0
COMMIT_CHANGES=0
COMMIT_MESSAGE="${COMMIT_MESSAGE:-chore: sync OS repository}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'USAGE'
Push all local *OS repositories to a GitHub org with descriptions and topics.

Usage:
  ./push-all-os-repos.sh [options]

Options:
  --execute                 Actually create/update/push. Default is dry-run.
  --org ORG                 GitHub org/user owner. Default: APPNEURAL-OSs.
  --visibility private|public|internal
                            Visibility for newly created repos. Default: private.
  --include-uninitialized   git init local *OS folders that do not have .git.
  --commit-changes          git add -A and commit dirty repos before pushing.
  --commit-message MESSAGE  Commit message for --commit-changes.
  --sleep SECONDS           Pause between repos. Default: 2.
  --remote NAME             Remote name to create/update. Default: origin.
  -h, --help                Show this help.

Environment overrides:
  ORG, VISIBILITY, REMOTE_NAME, SLEEP_SECONDS, MIN_RATE_REMAINING, COMMIT_MESSAGE

Examples:
  ./push-all-os-repos.sh
  ./push-all-os-repos.sh --execute --visibility private
  ./push-all-os-repos.sh --execute --include-uninitialized --commit-changes
USAGE
}

log() {
  printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf 'DRY-RUN:'
    printf ' %q' "$@"
    printf '\n'
    return 0
  fi
  "$@"
}

normalize_topic() {
  local raw="$1"
  raw="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]')"
  raw="$(printf '%s' "$raw" | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g')"
  printf '%s' "${raw:0:50}"
}

package_field() {
  local dir="$1"
  local field="$2"
  [[ -f "$dir/package.json" ]] || return 0
  node -e '
    const fs = require("fs");
    const [file, field] = process.argv.slice(1);
    try {
      const json = JSON.parse(fs.readFileSync(file, "utf8"));
      const value = json[field];
      if (Array.isArray(value)) console.log(value.join(","));
      else if (typeof value === "string") console.log(value);
    } catch {}
  ' "$dir/package.json" "$field"
}

readme_description() {
  local dir="$1"
  local readme=""
  for candidate in "$dir"/README.md "$dir"/README; do
    if [[ -f "$candidate" ]]; then
      readme="$candidate"
      break
    fi
  done
  [[ -n "$readme" ]] || return 0
  awk '
    BEGIN { in_text = 0 }
    /^#/ { next }
    NF {
      print
      exit
    }
  ' "$readme"
}

repo_description() {
  local dir="$1"
  local name="$2"
  local description
  description="$(package_field "$dir" description)"
  if [[ -z "$description" ]]; then
    description="$(readme_description "$dir")"
  fi
  if [[ -z "$description" ]]; then
    description="$name: APPNEURAL operating-system module."
  fi
  printf '%s' "${description:0:350}"
}

repo_topics() {
  local dir="$1"
  local name="$2"
  local domain="${name%OS}"
  local raw_keywords
  local topics=()
  local seen="|"

  add_topic() {
    local topic
    topic="$(normalize_topic "$1")"
    [[ -n "$topic" ]] || return 0
    [[ "${#topic}" -gt 50 ]] && topic="${topic:0:50}"
    if [[ "$seen" != *"|$topic|"* ]]; then
      topics+=("$topic")
      seen+="$topic|"
    fi
  }

  add_topic appneural
  add_topic appneurox
  add_topic os
  add_topic operating-system
  add_topic typescript
  add_topic "$name"
  add_topic "$domain"

  raw_keywords="$(package_field "$dir" keywords || true)"
  if [[ -n "$raw_keywords" ]]; then
    IFS=',' read -ra kws <<< "$raw_keywords"
    for kw in "${kws[@]}"; do
      add_topic "$kw"
    done
  fi

  printf '%s\n' "${topics[@]:0:20}" | paste -sd, -
}

rate_limit_sleep() {
  local remaining reset now sleep_for
  if ! remaining="$(gh api rate_limit --jq '.resources.core.remaining' 2>/dev/null)"; then
    return 0
  fi
  reset="$(gh api rate_limit --jq '.resources.core.reset' 2>/dev/null || printf '0')"
  if [[ "$remaining" =~ ^[0-9]+$ ]] && (( remaining <= MIN_RATE_REMAINING )); then
    now="$(date +%s)"
    sleep_for=$(( reset - now + 5 ))
    (( sleep_for < 5 )) && sleep_for=5
    log "GitHub API remaining=$remaining; sleeping ${sleep_for}s until reset buffer clears"
    sleep "$sleep_for"
  fi
}

gh_retry() {
  local attempts=0
  local max_attempts=6
  local delay=10
  local output status

  while true; do
    rate_limit_sleep
    attempts=$((attempts + 1))
    set +e
    output="$("$@" 2>&1)"
    status=$?
    set -e
    if [[ "$status" -eq 0 ]]; then
      [[ -n "$output" ]] && printf '%s\n' "$output"
      return 0
    fi
    if [[ "$output" =~ [Rr]ate\ limit|secondary\ rate\ limit|abuse\ detection ]] && (( attempts < max_attempts )); then
      log "GitHub throttled command; retrying in ${delay}s: $*"
      sleep "$delay"
      delay=$((delay * 2))
      continue
    fi
    printf '%s\n' "$output" >&2
    return "$status"
  done
}

repo_exists() {
  local full_name="$1"
  gh_retry gh repo view "$full_name" --json name --jq .name >/dev/null 2>&1
}

ensure_repo() {
  local dir="$1"
  local repo="$2"
  local full_name="$ORG/$repo"
  local description="$3"
  local topics="$4"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "Would ensure repository: $full_name"
    run gh repo create "$full_name" "--$VISIBILITY" --description "$description"
    run gh repo edit "$full_name" --description "$description" --add-topic "$topics"
    if git -C "$dir" remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
      run git -C "$dir" remote set-url "$REMOTE_NAME" "https://github.com/$full_name.git"
    else
      run git -C "$dir" remote add "$REMOTE_NAME" "https://github.com/$full_name.git"
    fi
    return 0
  fi

  if repo_exists "$full_name"; then
    log "Repository exists: $full_name"
  else
    log "Creating repository: $full_name"
    run gh_retry gh repo create "$full_name" "--$VISIBILITY" --description "$description"
  fi

  log "Updating description/topics: $full_name"
  run gh_retry gh repo edit "$full_name" --description "$description" --add-topic "$topics"

  if git -C "$dir" remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
    run git -C "$dir" remote set-url "$REMOTE_NAME" "https://github.com/$full_name.git"
  else
    run git -C "$dir" remote add "$REMOTE_NAME" "https://github.com/$full_name.git"
  fi
}

ensure_local_git() {
  local dir="$1"
  if [[ -d "$dir/.git" ]]; then
    return 0
  fi
  if [[ "$INCLUDE_UNINITIALIZED" -eq 0 ]]; then
    log "Skipping uninitialized folder: $(basename "$dir")"
    return 1
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "Would initialize local git repository: $(basename "$dir")"
    run git -C "$dir" init -b main
    run git -C "$dir" add -A
    run git -C "$dir" commit -m "chore: initial OS repository"
    return 2
  fi

  log "Initializing local git repository: $(basename "$dir")"
  run git -C "$dir" init -b main
  run git -C "$dir" add -A
  if [[ "$DRY_RUN" -eq 1 ]]; then
    run git -C "$dir" commit -m "chore: initial OS repository"
  elif ! git -C "$dir" diff --cached --quiet; then
    git -C "$dir" commit -m "chore: initial OS repository"
  fi
}

commit_if_requested() {
  local dir="$1"
  [[ "$COMMIT_CHANGES" -eq 1 ]] || return 0

  run git -C "$dir" add -A
  if [[ "$DRY_RUN" -eq 1 ]]; then
    run git -C "$dir" commit -m "$COMMIT_MESSAGE"
    return 0
  fi
  if ! git -C "$dir" diff --cached --quiet; then
    git -C "$dir" commit -m "$COMMIT_MESSAGE"
  fi
}

push_repo() {
  local dir="$1"
  local branch
  branch="$(git -C "$dir" branch --show-current)"
  if [[ -z "$branch" ]]; then
    log "Skipping detached HEAD repo: $(basename "$dir")"
    return 0
  fi

  commit_if_requested "$dir"

  if [[ "$DRY_RUN" -eq 0 ]] && ! git -C "$dir" diff --quiet; then
    log "Warning: $(basename "$dir") has uncommitted changes; use --commit-changes to include them"
  fi

  log "Pushing $(basename "$dir") branch $branch"
  run git -C "$dir" push -u "$REMOTE_NAME" "$branch"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute) DRY_RUN=0; shift ;;
    --org) ORG="$2"; shift 2 ;;
    --visibility) VISIBILITY="$2"; shift 2 ;;
    --include-uninitialized) INCLUDE_UNINITIALIZED=1; shift ;;
    --commit-changes) COMMIT_CHANGES=1; shift ;;
    --commit-message) COMMIT_MESSAGE="$2"; shift 2 ;;
    --sleep) SLEEP_SECONDS="$2"; shift 2 ;;
    --remote) REMOTE_NAME="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1" ;;
  esac
done

case "$VISIBILITY" in
  private|public|internal) ;;
  *) die "--visibility must be private, public, or internal" ;;
esac

command -v git >/dev/null || die "git is required"
command -v gh >/dev/null || die "GitHub CLI (gh) is required"
command -v node >/dev/null || die "node is required for package.json metadata"

if [[ "$DRY_RUN" -eq 0 ]]; then
  gh auth status >/dev/null || die "Run gh auth login before executing"
else
  log "Dry run only. Add --execute to create/update/push repositories."
fi

shopt -s nullglob
repos=("$ROOT_DIR"/*OS)
[[ "${#repos[@]}" -gt 0 ]] || die "No *OS directories found under $ROOT_DIR"

for dir in "${repos[@]}"; do
  [[ -d "$dir" ]] || continue
  repo="$(basename "$dir")"
  description="$(repo_description "$dir" "$repo")"
  topics="$(repo_topics "$dir" "$repo")"

  log "Processing $repo"
  init_state=0
  ensure_local_git "$dir" || init_state=$?
  [[ "$init_state" -eq 1 ]] && continue
  ensure_repo "$dir" "$repo" "$description" "$topics"
  [[ "$init_state" -eq 2 ]] && continue
  push_repo "$dir"
  sleep "$SLEEP_SECONDS"
done

log "Done."
