#!/bin/bash

TARGET_DIR="${1:-/home/joseph-mario/Desktop/Devops}"
LOG_DIR="$(dirname "$0")/logs"
LOG_FILE="$LOG_DIR/vault__sweep.log"

mkdir -p "$LOG_DIR"
chmod 700 "$LOG_DIR"

log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

scan_file() {
    local file=$1
    if grep -q "rm -rf" "$file"; then
        echo "[WARN] $file _ Reason: Destructive command (rm -rf)"
        log "WARN" "$file contains rm -rf"
    elif grep -q "mkfs" "$file"; then
        echo "[WARN] $file _ Reason: Destructive command (mkfs)"
        log "WARN" "$file contains mkfs"
    fi
    cmd=$(stat -c "%a" "$file")
    if [ "$cmd" = "777" ]; then
        echo "[WARN] $file _ Reason: Insecure permissions (777)"
        log "WARN" "$file contains chmod 777"
        read -p "Fix permission: (yes/no)" answer
        if [ "$answer" = "yes" ]; then
            chmod o-w "$file"
            echo "The permission was changed successfully."
            log "FIX" "$file removed world write permission"
        fi
    fi
}

flag_file() {
    local file=$1
    if grep -Eq "(curl|wget).*\|.*(sh|bash)" "$file"; then
        echo "[WARN] $file _ Reason: Suspicious download (curl/wget piped to shell)"
        log "WARN" "$file contains suspicious download (curl/wget piped to shell)"
    fi
}

find "$TARGET_DIR" -type f -name "*.sh" | while read file; do
    scan_file "$file"
    flag_file "$file"
done

BLOCKED_KEYS="PASSWORD|SECRET|TOKEN|PATH"
SYSTEM_VARS="PATH|HOME|USER|SHELL|LANG|PWD|TERM|LOGNAME"

is_valid_env_line() {
    local line="$1"

    if [[ -z "$line" || "$line" =~ ^[[:space:]]*$ ]]; then
        return 1
    fi

    if [[ "$line" =~ ^export ]]; then
        return 1
    fi

    if ! [[ "$line" =~ ^[A-Z_][A-Z0-9_]*=[^[:space:]].* || "$line" =~ ^[A-Z_][A-Z0-9_]*=$ ]]; then
        return 1
    fi

    local key="${line%%=*}"

    if ! [[ "$key" =~ ^[A-Z_][A-Z0-9_]*$ ]]; then
        return 1
    fi

    if echo "$key" | grep -Eq "^($BLOCKED_KEYS)$"; then
        return 1
    fi

    if echo "$key" | grep -Eq "^($SYSTEM_VARS)$"; then
        return 1
    fi

    local value="${line#*=}"
    if [[ "$value" =~ ^\" || "$value" =~ ^\' ]]; then
        return 1
    fi

    return 0
}

sanitize_env_file() {
    local env_file="$1"
    local sanitized_file="${env_file}.sanitized"
    local valid_count=0
    local invalid_count=0
    local rejected_keys=()

    > "$sanitized_file"

    while IFS= read -r line || [[ -n "$line" ]]; do
        if is_valid_env_line "$line"; then
            echo "$line" >> "$sanitized_file"
            ((valid_count++))
        else
            if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*$ ]]; then
                ((invalid_count++))
                local key="${line%%=*}"
                rejected_keys+=("$key=${line#*=}")
            fi
        fi
    done < "$env_file"

    log "INFO" "$env_file Valid: $valid_count, Invalid: $invalid_count"

    if [ ${#rejected_keys[@]} -gt 0 ]; then
        local rejected_str
        rejected_str=$(IFS=", "; echo "${rejected_keys[*]}")
        log "SKIP" "$env_file Rejected: $rejected_str"
    fi

    echo "[INFO] Sanitized: $env_file → $sanitized_file (Valid: $valid_count, Invalid: $invalid_count)"
}

find "$TARGET_DIR" -type f -name ".env*" | while read env_file; do
    sanitize_env_file "$env_file"
done

SECRET_PATTERN='(api_?key|apikey|secret|token|password|auth)[[:space:]]*[=:][[:space:]]*["'"'"'][A-Za-z0-9_\-]{8,}["'"'"']'

find "$TARGET_DIR" -type f \( -name "*.js" -o -name "*.py" \) | while read src_file; do
    grep -inE "$SECRET_PATTERN" "$src_file" | while IFS=: read lineno match; do
        echo "[WARN] $src_file:$lineno $match"
        log "WARN" "$src_file:$lineno hardcoded secret detected: $match"
    done
done

BASE64_PATTERN='[A-Za-z0-9+/]{40,}={0,2}'

find "$TARGET_DIR" -type f \( -name "*.sh" -o -name "*.js" -o -name "*.py" \) | while read src_file; do
    grep -nE "$BASE64_PATTERN" "$src_file" | while IFS=: read lineno match; do
        echo "[WARN] $src_file:$lineno Possible Base64/high-entropy string detected"
        log "WARN" "$src_file:$lineno possible Base64 payload"
    done
done

find "$TARGET_DIR" -type f -name "*.sh" | while read file; do
    if grep -qE "/dev/tcp/|/dev/udp/|nc -e|bash -i|sh -i" "$file"; then
        echo "[WARN] $file _ Reason: Possible reverse shell pattern detected"
        log "WARN" "$file contains reverse shell pattern"
    fi
done

find "$TARGET_DIR" -type f -executable ! -name "*.sh" | while read bin_file; do
    echo "[WARN] $bin_file _ Reason: Unexpected executable outside standard bin directories"
    log "WARN" "$bin_file unexpected executable"
done

if git -C "$TARGET_DIR" rev-parse --is-inside-work-tree &>/dev/null; then
    find "$TARGET_DIR" -type f -name "*.sh" | while read file; do
        if grep -qE "rm -rf|mkfs|shutdown|reboot|/dev/tcp/" "$file"; then
            author=$(git -C "$TARGET_DIR" log --follow -1 --format="%an <%ae>" -- "$file" 2>/dev/null)
            if [ -n "$author" ]; then
                echo "[INFO] $file last committed by: $author"
                log "INFO" "$file flagged — last committed by: $author"
            fi
        fi
    done
fi

echo ""
echo "Sweep complete. Log saved to: $LOG_FILE"
