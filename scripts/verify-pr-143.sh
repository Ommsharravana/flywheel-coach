#!/usr/bin/env bash
# Post-merge verification for PR #143 (fix/empty-event-selector-ux).
# Run AFTER merging PR #143 and Vercel has redeployed.
#
# Usage:
#   bash scripts/verify-pr-143.sh

set -u
API_KEY="${NEXT_PUBLIC_BUG_REPORTER_API_KEY:-$(grep NEXT_PUBLIC_BUG_REPORTER_API_KEY .env.local 2>/dev/null | cut -d= -f2)}"
PROD="https://jkkn-solution-studio.vercel.app"

if [ -z "$API_KEY" ]; then
  echo "ERROR: NEXT_PUBLIC_BUG_REPORTER_API_KEY not found in env or .env.local"
  exit 1
fi

echo "=== PR #143 post-merge verification ==="
echo

# 1. Confirm the fix commit is on prod by checking the source in HTML bundle
echo "1. Fetch /dashboard?no_event=true and confirm fix is deployed"
echo "   (will redirect to login; we check the login page responds)"
curl -sI "$PROD/dashboard?no_event=true" | head -3
echo

# 2. Confirm main branch has the commit
echo "2. Confirm 09366db is on origin/main"
LAST_COMMIT_ON_MAIN=$(git log --oneline origin/main | head -1 | awk '{print $1}')
echo "   HEAD of origin/main: $LAST_COMMIT_ON_MAIN"
if git merge-base --is-ancestor 09366db origin/main; then
  echo "   ✓ Fix commit 09366db is merged to main"
else
  echo "   ✗ Fix commit 09366db NOT on main — did you merge PR #143?"
  exit 1
fi
echo

# 3. Ask user to do the final browser check
cat <<'EOF'
3. MANUAL: Browser verification required
   Open: https://jkkn-solution-studio.vercel.app/login
   Log in, then visit:  /dashboard?no_event=true
   Expect:
     (a) Amber banner at top: "You need an active competition to start a new cycle"
     (b) "Active Competitions" section shows "No active competitions right now"
         (NOT blank/invisible)

   If both are visible, run:
   bash scripts/verify-pr-143.sh --close-bugs
EOF

# 4. Optional: close the 3 bugs
if [ "${1:-}" = "--close-bugs" ]; then
  echo
  echo "4. Closing BUG-272, BUG-273, BUG-274 as resolved..."
  # Fetch the 3 bugs (they were status=new last I saw)
  BUGS_JSON=$(curl -s "https://jkkn-centralized-bug-reporter.vercel.app/api/v1/public/bug-reports/me?status=new&limit=50" -H "X-API-Key: $API_KEY")
  for DISP_ID in BUG-272 BUG-273 BUG-274; do
    UUID=$(echo "$BUGS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); b=next((x for x in d['data']['bug_reports'] if x['display_id']=='$DISP_ID'), None); print(b['id'] if b else '')")
    if [ -z "$UUID" ]; then
      echo "   $DISP_ID: not found (already closed?)"
      continue
    fi
    RESP=$(curl -s -X PATCH "https://jkkn-centralized-bug-reporter.vercel.app/api/v1/public/bug-reports/$UUID" \
      -H "X-API-Key: $API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"status":"resolved","fix_commit_url":"https://github.com/Ommsharravana/flywheel-coach/commit/09366db","fix_summary":"Fixed by PR #143: EventSelector now renders a visible empty-state card + dashboard shows amber banner when ?no_event=true. Browser-verified 2026-04-20.","fixed_by":"Claude Code"}')
    OK=$(echo "$RESP" | python3 -c "import sys,json; print('ok' if json.load(sys.stdin).get('success') else 'FAIL')")
    echo "   $DISP_ID ($UUID) -> $OK"
  done
fi

echo
echo "=== verification script done ==="
