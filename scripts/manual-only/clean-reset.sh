#!/bin/bash

if [[ "${ALLOW_MANUAL_SCRIPT:-false}" != "true" ]]; then
  echo "Blocked: set ALLOW_MANUAL_SCRIPT=true to run scripts/manual-only/clean-reset.sh"
  exit 1
fi

echo "=== CLEAN RESET ==="
echo "Killing all rogue Node, Nodemon, and Next instances..."
pkill -9 -f "[n]ode"
pkill -9 -f "[n]odemon"
pkill -9 -f "[n]ext"
echo "All services killed. You may now boot isolated terminals safely."
