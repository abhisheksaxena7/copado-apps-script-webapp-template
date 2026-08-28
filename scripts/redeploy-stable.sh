#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOYMENT_ID:?Set DEPLOYMENT_ID to the existing stable deployment.}"
: "${DEPLOY_DESCRIPTION:?Set DEPLOY_DESCRIPTION.}"

if [[ "$DEPLOYMENT_ID" == REPLACE_* || "$DEPLOYMENT_ID" == \<* ]]; then
  echo "Refusing to deploy with a placeholder deployment ID." >&2
  exit 1
fi

run_clasp() {
  if [[ -n "${CLASP_PROJECT_FILE:-}" ]]; then
    clasp -P "$CLASP_PROJECT_FILE" "$@"
  else
    clasp "$@"
  fi
}

deployments() {
  run_clasp deployments
}

previous_version="$(deployments | awk -v id="$DEPLOYMENT_ID" '$0 ~ id { for (i=1; i<=NF; i++) if ($i ~ /^@[0-9]+$/) { sub(/^@/, "", $i); print $i; exit } }')"
create_output="$(run_clasp create-version "$DEPLOY_DESCRIPTION")"
new_version="$(printf '%s\n' "$create_output" | awk 'match(tolower($0), /version [0-9]+/) { text=substr($0, RSTART, RLENGTH); sub(/[^0-9]*/, "", text); print text }' | tail -n 1)"

if [[ -z "$new_version" ]]; then
  echo "Could not parse the new Apps Script version." >&2
  exit 1
fi
if [[ -n "$previous_version" && "$new_version" -le "$previous_version" ]]; then
  echo "New version $new_version is not newer than live version $previous_version." >&2
  exit 1
fi

run_clasp redeploy "$DEPLOYMENT_ID" -V "$new_version" -d "$DEPLOY_DESCRIPTION"
EXPECTED_VERSION="@$new_version"
VERIFY_ATTEMPTS="${VERIFY_ATTEMPTS:-5}"
VERIFY_DELAY_SECONDS="${VERIFY_DELAY_SECONDS:-2}"
live_version=""
for ((attempt = 1; attempt <= VERIFY_ATTEMPTS; attempt++)); do
  live_version="$(deployments | awk -v id="$DEPLOYMENT_ID" '$0 ~ id { for (i=1; i<=NF; i++) if ($i ~ /^@[0-9]+$/) { print $i; exit } }')"
  [[ "$live_version" == "$EXPECTED_VERSION" ]] && break
  if [[ "$attempt" -lt "$VERIFY_ATTEMPTS" ]]; then
    echo "Deployment still reports ${live_version:-nothing}; retrying pointer verification ($attempt/$VERIFY_ATTEMPTS)."
    sleep "$VERIFY_DELAY_SECONDS"
  fi
done
if [[ "$live_version" != "$EXPECTED_VERSION" ]]; then
  echo "Stable deployment points to ${live_version:-nothing}; expected $EXPECTED_VERSION." >&2
  exit 1
fi
echo "Stable deployment advanced from @${previous_version:-none} to $EXPECTED_VERSION."
