#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"
SWEEP_SCRIPT="$SCRIPT_DIR/vault_sweep.sh"
TARGET_DIR="${1:-/home/joseph-mario/Desktop/Devops}"
ALERT_EMAIL="josephmario486@gmail.com"
TEMP_OUTPUT="/tmp/vault_sweep_output_$$.txt"

bash "$SWEEP_SCRIPT" "$TARGET_DIR" > "$TEMP_OUTPUT" 2>&1

if grep -q "\[WARN\]" "$TEMP_OUTPUT"; then
    echo "Threats detected in $TARGET_DIR"
    cat "$TEMP_OUTPUT"

    if command -v notify-send &>/dev/null; then
        notify-send "vault_sweep ALERT" "Dangerous scripts detected in $TARGET_DIR. Check vault__sweep.log for details."
    fi

    if command -v mail &>/dev/null; then
        mail -s "vault_sweep ALERT: Threats detected in $TARGET_DIR" "$ALERT_EMAIL" < "$TEMP_OUTPUT"
    fi
else
    echo "No threats detected in $TARGET_DIR"
fi

rm -f "$TEMP_OUTPUT"
