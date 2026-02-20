#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"
ROOT_ENV_FILE="$ROOT_DIR/.env"
SERVER_ENV_FILE="$SERVER_DIR/.env"
LOG_DIR="$(mktemp -d -t ai-financial-share-XXXXXX)"
PIDS=()

source "$ROOT_DIR/scripts/lib_env.sh"

log() {
  local prefix="$1"
  shift
  printf '[%s] %s\n' "$prefix" "$*" >&2
}

require_cmd() {
  local command_name="$1"
  local hint="${2:-}"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    log "share" "Missing command: $command_name"
    if [[ -n "$hint" ]]; then
      log "share" "$hint"
    fi
    exit 1
  fi
}

cleanup() {
  local exit_code=$?
  log "share" "Stopping running processes..."

  for pid in "${PIDS[@]:-}"; do
    kill "$pid" >/dev/null 2>&1 || true
  done
  wait || true

  if (cd "$ROOT_DIR" && docker compose ps -q db >/dev/null 2>&1); then
    (cd "$ROOT_DIR" && docker compose stop db >/dev/null 2>&1) || true
  fi

  rm -rf "$LOG_DIR"

  if [[ "$exit_code" -ne 0 ]]; then
    log "share" "Exited with error (code: $exit_code)"
  fi
}

trap cleanup EXIT INT TERM

wait_for_db() {
  local retries=45
  local attempt
  for attempt in $(seq 1 "$retries"); do
    if (cd "$ROOT_DIR" && docker compose exec -T db pg_isready -U postgres -d ai_financial >/dev/null 2>&1); then
      log "db" "Database is ready"
      return 0
    fi
    sleep 1
  done
  log "db" "Database is not ready after ${retries}s"
  return 1
}

wait_for_http() {
  local name="$1"
  local url="$2"
  local retries="$3"
  local attempt
  for attempt in $(seq 1 "$retries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "$name" "Ready at $url"
      return 0
    fi
    sleep 1
  done
  log "$name" "Not ready after ${retries}s ($url)"
  return 1
}

start_service() {
  local name="$1"
  shift
  (
    "$@" 2>&1 | sed -u "s/^/[$name] /"
  ) &
  local pid=$!
  PIDS+=("$pid")
  log "share" "Started $name (pid: $pid)"
}

wait_for_tunnel_url() {
  local name="$1"
  local log_file="$2"
  local retries=30
  local attempt
  local url

  for attempt in $(seq 1 "$retries"); do
    url="$(grep -Eo 'https://[-a-z0-9]+\.trycloudflare\.com' "$log_file" | tail -n 1 || true)"
    if [[ -n "$url" ]]; then
      printf '%s' "$url"
      return 0
    fi
    sleep 1
  done

  log "$name" "Could not detect tunnel URL in ${retries}s"
  return 1
}

start_tunnel() {
  local name="$1"
  local local_url="$2"
  local log_file="$LOG_DIR/${name}.log"
  : > "$log_file"

  (
    cloudflared tunnel --url "$local_url" 2>&1 | tee -a "$log_file" | sed -u "s/^/[$name] /"
  ) &
  local pid=$!
  PIDS+=("$pid")
  log "share" "Started $name (pid: $pid)"

  wait_for_tunnel_url "$name" "$log_file"
}

main() {
  require_cmd docker "Please install Docker and ensure it is running."
  require_cmd npm "Please install Node.js and npm."
  require_cmd npx "Please install Node.js and npm."
  require_cmd cloudflared "Please install cloudflared first: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  require_cmd curl "Please install curl."
  if [[ ! -f "$SERVER_ENV_FILE" ]]; then
    log "share" "Missing $SERVER_ENV_FILE. Please create it from server/.env.example first."
    exit 1
  fi

  log "db" "Starting postgres container..."
  (cd "$ROOT_DIR" && docker compose up -d db)
  wait_for_db

  log "api" "Applying migrations with prisma migrate deploy..."
  (cd "$SERVER_DIR" && npx prisma migrate deploy 2>&1 | sed -u 's/^/[api] /')

  start_service "api" bash -lc "cd \"$SERVER_DIR\" && npm run dev"
  wait_for_http "api" "http://localhost:4000/api/health" 45

  start_service "web" bash -lc "cd \"$ROOT_DIR\" && npm run dev -- --host 0.0.0.0 --port 3000"
  wait_for_http "web" "http://localhost:3000" 45

  local api_tunnel_url
  local web_tunnel_url
  api_tunnel_url="$(start_tunnel "tunnel-api" "http://localhost:4000")"
  web_tunnel_url="$(start_tunnel "tunnel-web" "http://localhost:3000")"

  log "share" "Updating environment files..."
  set_or_replace_env_key "$ROOT_ENV_FILE" "VITE_API_BASE_URL" "$api_tunnel_url"
  append_csv_env_value_unique "$SERVER_ENV_FILE" "CORS_ORIGIN" "http://localhost:3000"
  append_csv_env_value_unique "$SERVER_ENV_FILE" "CORS_ORIGIN" "$web_tunnel_url"

  log "share" "Frontend URL: $web_tunnel_url"
  log "share" "Backend URL: $api_tunnel_url"
  log "share" "Backend health: ${api_tunnel_url}/api/health"
  log "share" "Updated: $ROOT_ENV_FILE (VITE_API_BASE_URL)"
  log "share" "Updated: $SERVER_ENV_FILE (CORS_ORIGIN)"
  log "share" "Share mode is running. Press Ctrl+C to stop all services."

  wait
}

main "$@"
