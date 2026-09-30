#!/usr/bin/env bash
# Runs on the production server (piped over SSH by .github/workflows/deploy.yml).
#
# Finds where the stack is actually running by reading the labels Docker
# Compose stamps on its containers, and prints them as GitHub step outputs.
# Deploying with the same directory, project name and compose files is what
# keeps the existing volumes, .env and overrides in use.
#
# Usage: locate.sh [expected_dir]
set -euo pipefail

EXPECTED_DIR="${1:-}"
ANCHOR=peptide-backend

for cmd in docker rsync curl; do
  if ! command -v "$cmd" >/dev/null; then
    echo "::error::'$cmd' is not installed on the server (apt install $cmd)" >&2
    exit 1
  fi
done

label() {
  docker inspect "$ANCHOR" --format "{{ index .Config.Labels \"$1\" }}" 2>/dev/null || true
}

if ! docker inspect "$ANCHOR" >/dev/null 2>&1; then
  echo "::error::Container '$ANCHOR' not found — the workflow only updates an existing deployment" >&2
  exit 1
fi

project_dir="$(label com.docker.compose.project.working_dir)"
project_name="$(label com.docker.compose.project)"
compose_files="$(label com.docker.compose.project.config_files)"
env_file="$(label com.docker.compose.project.environment_file)"

if [ -z "$project_dir" ] || [ -z "$project_name" ]; then
  echo "::error::'$ANCHOR' has no Docker Compose labels; can't tell where the stack was deployed from" >&2
  exit 1
fi

if [ -n "$EXPECTED_DIR" ] && [ "${EXPECTED_DIR%/}" != "${project_dir%/}" ]; then
  echo "::error::DEPLOY_PATH is '$EXPECTED_DIR' but the running stack was started from '$project_dir'" >&2
  exit 1
fi

if [ ! -f "$project_dir/docker-compose.yml" ]; then
  echo "::error::$project_dir/docker-compose.yml not found on the server" >&2
  exit 1
fi

# The production secrets (JWT, wallets, gateway keys) live only in the env
# file on the server; refuse to deploy if it's gone rather than silently
# falling back to the compose defaults.
if [ -z "$env_file" ]; then
  env_file_check="$project_dir/.env"
else
  env_file_check="${env_file%%,*}"
fi
if [ ! -f "$env_file_check" ]; then
  echo "::error::Env file $env_file_check not found on the server" >&2
  exit 1
fi

echo "Deploying into $project_dir (compose project '$project_name')" >&2
echo "Compose files: $compose_files" >&2
echo "Env file: ${env_file:-$project_dir/.env (default)}" >&2

echo "project_dir=$project_dir"
echo "project_name=$project_name"
echo "compose_files=$compose_files"
echo "env_file=$env_file"
