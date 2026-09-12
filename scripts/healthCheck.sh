#!/bin/bash
# smoke-test.sh - Quick deployment verification

set -e

BASE_URL="${1:-https://etudiant-04-web.development.atelier.ovh}"
TIMEOUT=10

echo "Running smoke tests against $BASE_URL"
# Test React Enpoints
echo -n "Health check... "
HEALTH=$(curl -sf --max-time $TIMEOUT "$BASE_URL/health" || echo "FAILED")
if echo "$HEALTH" | grep -q '"status":"healthy"'; then
    echo "PASS"
else
    echo "FAIL"
    echo "$HEALTH"
    exit 1
fi
