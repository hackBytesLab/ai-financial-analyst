#!/usr/bin/env bash

set -euo pipefail

trim() {
  local value="${1:-}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

escape_env_value() {
  local value="${1:-}"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '%s' "$value"
}

ensure_env_file() {
  local file_path="$1"
  if [[ ! -f "$file_path" ]]; then
    mkdir -p "$(dirname "$file_path")"
    touch "$file_path"
  fi
}

get_env_value() {
  local file_path="$1"
  local key="$2"
  if [[ ! -f "$file_path" ]]; then
    return 0
  fi

  local line
  line="$(grep -E "^${key}=" "$file_path" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    return 0
  fi

  line="${line#${key}=}"
  if [[ "$line" == \"*\" && "$line" == *\" ]]; then
    line="${line:1:${#line}-2}"
  fi
  printf '%s' "$line"
}

set_or_replace_env_key() {
  local file_path="$1"
  local key="$2"
  local raw_value="$3"
  local value
  value="$(escape_env_value "$raw_value")"

  ensure_env_file "$file_path"

  local temp_file
  temp_file="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { updated = 0 }
    $0 ~ ("^" key "=") {
      print key "=\"" value "\""
      updated = 1
      next
    }
    { print }
    END {
      if (updated == 0) {
        print key "=\"" value "\""
      }
    }
  ' "$file_path" > "$temp_file"
  mv "$temp_file" "$file_path"
}

append_csv_env_value_unique() {
  local file_path="$1"
  local key="$2"
  local value="$3"
  value="$(trim "$value")"
  if [[ -z "$value" ]]; then
    return 0
  fi

  local current
  current="$(get_env_value "$file_path" "$key")"
  local updated=""
  local exists="0"

  if [[ -n "$current" ]]; then
    IFS=',' read -r -a items <<< "$current"
    for item in "${items[@]}"; do
      item="$(trim "$item")"
      if [[ -z "$item" ]]; then
        continue
      fi
      if [[ "$item" == "$value" ]]; then
        exists="1"
      fi
      if [[ -z "$updated" ]]; then
        updated="$item"
      else
        updated="${updated},${item}"
      fi
    done
  fi

  if [[ "$exists" == "0" ]]; then
    if [[ -z "$updated" ]]; then
      updated="$value"
    else
      updated="${updated},${value}"
    fi
  fi

  set_or_replace_env_key "$file_path" "$key" "$updated"
}
