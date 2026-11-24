#!/usr/bin/env bash
# preToolUse: deny a short list of dangerous or contract-breaking actions.
# Silence = "no opinion", so the normal permission flow carries on.
# Any crash here DENIES the tool call (preToolUse is fail-closed), so keep it small.
set -euo pipefail

input=$(cat)
tool=$(jq -r '.toolName' <<<"$input")
args=$(jq -r '.toolArgs // ""' <<<"$input")   # a JSON *string*, not an object

deny() {
  jq -cn --arg r "$1" '{permissionDecision:"deny", permissionDecisionReason:$r}'
  exit 0
}

case "$tool" in
  bash)
    # toolArgs arrives as a JSON string: decode it from the *payload*, not from $args.
    cmd=$(jq -r '.toolArgs | (fromjson? // .) | .command // ""' <<<"$input")
    case "$cmd" in
      *"git push"*--force*|*"git push"*" -f"*)
        deny "Force-push needs a human. Push normally or ask the user." ;;
      *"--no-verify"*)
        deny "Do not skip git hooks. Fix what the hook reports instead." ;;
      *"rm -rf"*|*"rm -fr"*)
        deny "Recursive delete needs a human. Name the files to remove." ;;
      *"build/transcripts/"*">"*|*">"*"build/transcripts/"*)
        deny "Transcripts are generated. Run: cd build && npm run transcripts" ;;
    esac
    ;;
  edit|create)
    # Argument field names per tool are not documented, so match the raw string.
    case "$args" in
      *build/transcripts/*)
        deny "Transcripts are generated, never hand-edited. Change build/src, then npm run transcripts." ;;
    esac
    ;;
esac
exit 0
