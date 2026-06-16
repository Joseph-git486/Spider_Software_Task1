# vault_sweep — Audit Report

## Dangerous Patterns and Why

| Pattern | Reason |
|---|---|
| `rm -rf` | Recursively deletes files with no confirmation — can wipe the entire filesystem if misused |
| `mkfs` | Formats a disk partition — irreversible data destruction |
| `shutdown` / `reboot` | Unauthorized system shutdown disrupts services |
| `chmod 777` / world-writable | Any user on the system can modify or execute the file — major privilege escalation risk |
| `curl \| bash` / `wget \| sh` | Downloads and immediately executes arbitrary remote code without inspection |
| `/dev/tcp/`, `/dev/udp/`, `nc -e`, `bash -i` | Classic reverse shell patterns — give attackers remote shell access |
| Hardcoded API keys / secrets in `.js` / `.py` | Credentials leaked in source code can be harvested from the repo |
| High-entropy / Base64 strings (40+ chars) | Commonly used to obfuscate malicious payloads |

---

## Why Specific .env Lines Were Rejected

| Line Example | Rejection Reason |
|---|---|
| `KEY = value` | Space around `=` — not valid shell env syntax |
| `SERVER-NAME=x` | Hyphen in variable name — only `[A-Z0-9_]` allowed |
| `USER="admin"` | Value wrapped in quotes — unnecessary and non-standard |
| `export PATH=$PATH:/tmp` | `export` keyword rejected; also modifies the `PATH` system variable |
| `PASSWORD=secret123` | Key matches blocked list (`PASSWORD`, `SECRET`, `TOKEN`) |
| `TOKEN=abc` | Key matches blocked list |
| Lowercase keys | Keys must be uppercase `[A-Z_][A-Z0-9_]*` only |

**Valid lines kept:** `API_KEY=spider26`, `PORT=3000`, `_DEBUG=false`

---

## Technical Hurdles and Solutions

**1. Recursive scan including hidden files**  
`find` with `-name "*.sh"` doesn't match hidden files by default, but since hidden files don't typically have `.sh` extensions this wasn't an issue. For `.env` files, `find -name ".env*"` correctly picks up hidden env files like `.env`, `.env.example`, `.env.local`.

**2. Regex edge cases in env validation**  
The key challenge was distinguishing `KEY=` (valid empty value) from `KEY =` (invalid space). Used `^[A-Z_][A-Z0-9_]*=` anchored regex to ensure no spaces sneak in before `=`. Checked the key and value separately to handle each rejection rule cleanly.

**3. Counting valid vs invalid lines for the log**  
Empty lines and comment-only lines (`#`) are skipped without counting as invalid, since they aren't "wrong" — they're just non-variable lines. Only lines that look like they're trying to be env vars but fail the rules are counted as invalid.

**4. Log file permissions**  
The `logs/` directory is created with `chmod 700` immediately after `mkdir -p`, ensuring only the script owner can read or write the audit log.

**5. git blame integration**  
`git -C "$TARGET_DIR" rev-parse --is-inside-work-tree` guards the blame section so it fails gracefully if the directory isn't a git repo — no errors thrown in non-git environments.
