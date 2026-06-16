#!/bin/bash

scan_file() {
        local file=$1
        if grep -q "rm -rf" "$file"; then
                echo "[WARN] $file _ Reason: Destructive command (rm -rf)"
        elif grep -q "mkfs" "$file"; then
                echo "[WARN] $file _ Reason: Destructive command (mkfs)"
        fi
        cmd=$(stat -c "%a" "$file")
        if [ "$cmd" = "777" ]; then
                echo "[WARN] $file _ Reason: Insecure permissions (777)"
                read -p "Fix permission: (yes/no)" answer
                if [ "$answer" = "yes" ]; then
                        chmod o-w "$file"
                        echo "The permission was changed successfully."
                fi
        fi
}
flag_file() {
        local file=$1
        if grep -Eq "(curl|wget).*\|.*(sh|bash)" "$file"; then
                echo "[WARN] $file _ Reason: Suspicious download (curl/wget piped to shell)"
        fi
}
find /home/joseph-mario/Desktop/Devops -type f -name "*.sh" | while read file; do
        scan_file "$file"
        flag
#!/bin/bash

scan_file() {
	local file=$1
	if grep -q "rm -rf" "$file"; then
		echo "[WARN] $file _ Reason: Destructive command (rm -rf)"
	elif grep -q "mkfs" "$file"; then
		echo "[WARN] $file _ Reason: Destructive command (mkfs)"
	fi
	cmd=$(stat -c "%a" "$file")
	if [ "$cmd" = "777" ]; then
		echo "[WARN] $file _ Reason: Insecure permissions (777)"
		read -p "Fix permission: (yes/no)" answer
		if [ "$answer" = "yes" ]; then
			chmod o-w
			echo "The permission was changed successfully."
		fi
	fi
}

flag_file() {
	local file=$1
	if grep -Eq "(curl|wget).*\|.*(sh|bash)" "$file"; then
		echo "[WARN] $file _ Reason: Suspicious download (curl/wget piped to shell)"
	fi
}
find /home/joseph-mario/Desktop/Devops -type f -name "*.sh" | while read file; do
	scan_file "$file"
	flag_file "$file"
done

 
