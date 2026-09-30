#!/usr/bin/env bash
# Runs on the production server (piped over SSH by .github/workflows/deploy.yml).
#
# Rebuilds and restarts the stack with the exact compose project, files and
# env file it was already running with. Images are built before anything is
# restarted, so a failed build leaves the live site untouched; if the new
# containers then fail their health checks, the previous images are put back.
#
# Usage: deploy.sh <project_dir> <project_name> <compose_files> <env_file> <git_sha>
set -euo pipefail

# The script arrives on bash's stdin (ssh ... bash -s < deploy.sh), and
# docker compose commands like `exec` read stdin too — unwrapped, they swallow
# the rest of the script and bash exits 0 early, silently skipping the health
# check and rollback. Wrapping everything in main() makes bash parse the whole
# script before running any of it; compose also gets /dev/null as stdin.
main() {
  PROJECT_DIR="$1"
  PROJECT_NAME="$2"
  COMPOSE_FILES="$3"
  ENV_FILE="$4"
  GIT_SHA="$5"

  BUILT_SERVICES=(backend frontend admin-panel)

  cd "$PROJECT_DIR"

  compose_args=(-p "$PROJECT_NAME")
  IFS=',' read -ra files <<< "$COMPOSE_FILES"
  for f in "${files[@]}"; do
    [ -n "$f" ] && compose_args+=(-f "$f")
  done
  if [ -n "$ENV_FILE" ]; then
    IFS=',' read -ra env_files <<< "$ENV_FILE"
    for f in "${env_files[@]}"; do
      [ -n "$f" ] && compose_args+=(--env-file "$f")
    done
  fi
  compose() { docker compose "${compose_args[@]}" "$@" </dev/null; }

  # Remember the image each service is running right now, and tag it
  # :previous so pruning can't remove it — this is what a rollback restores.
  declare -A prev_image_id prev_image_name
  for svc in "${BUILT_SERVICES[@]}"; do
    cid="$(compose ps -q "$svc" || true)"
    [ -z "$cid" ] && continue
    prev_image_name[$svc]="$(docker inspect -f '{{.Config.Image}}' "$cid")"
    prev_image_id[$svc]="$(docker inspect -f '{{.Image}}' "$cid")"
    docker tag "${prev_image_id[$svc]}" "${prev_image_name[$svc]%%:*}:previous"
  done

  rollback() {
    echo "::error::Health checks failed — rolling back to the previous images"
    for svc in "${!prev_image_id[@]}"; do
      docker tag "${prev_image_id[$svc]}" "${prev_image_name[$svc]}"
    done
    compose up -d --no-build
  }

  echo "::group::docker compose build"
  compose build "${BUILT_SERVICES[@]}"
  echo "::endgroup::"

  echo "::group::docker compose up"
  compose up -d
  echo "::endgroup::"

  # The Caddyfile is bind-mounted, so an updated one isn't picked up by
  # `up -d`; reload it in place (a no-op if unchanged, and Caddy keeps the old
  # config if the new one is invalid).
  if ! compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile; then
    echo "::warning::Caddy reload failed; it is still running its previous config"
  fi

  check() { curl -fsS -o /dev/null --max-time 5 "$1"; }
  healthy=false
  for _ in $(seq 1 36); do
    if check http://127.0.0.1:3000/api/health \
      && check http://127.0.0.1:3001/ \
      && check http://127.0.0.1:3002/; then
      healthy=true
      break
    fi
    sleep 5
  done

  if [ "$healthy" != true ]; then
    echo "::group::Container logs"
    compose logs --tail=100 "${BUILT_SERVICES[@]}" || true
    echo "::endgroup::"
    rollback
    exit 1
  fi

  echo "$GIT_SHA" > .deployed-revision
  docker image prune -f >/dev/null
  compose ps
  echo "Deployed $GIT_SHA"
}

main "$@"
