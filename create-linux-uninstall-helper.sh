#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'EOF'
Create a missing StarDefenders2D Linux uninstall helper.

Usage:
  sudo bash create-linux-uninstall-helper.sh /path/to/stardefenders-name-slot1000-admin-commands.txt
  sudo bash create-linux-uninstall-helper.sh stardefenders-name-slot1000

The script reads /etc/default/<service> when present. If that profile is
missing, it can infer the service name and repo directory from the generated
admin-commands file.
EOF
}

die() {
  echo "Error: $*" >&2
  exit 1
}

shell_quote() {
  printf '%q' "$1"
}

input="${1:-}"
[[ -n "${input}" ]] || { usage; exit 2; }
[[ "${input}" != "-h" && "${input}" != "--help" ]] || { usage; exit 0; }

SERVICE_NAME=""
APP_DIR=""
APP_USER=""
APP_GROUP=""

if [[ -f "${input}" ]]; then
  SERVICE_NAME="$(sed -n 's/^StarDefenders2D admin commands for //p' "${input}" | head -n 1)"
  if [[ -z "${SERVICE_NAME}" ]]; then
    SERVICE_NAME="$(basename "${input}")"
    SERVICE_NAME="${SERVICE_NAME%-admin-commands.txt}"
  fi
  APP_DIR="$(awk -F': ' '/^  Repo: / { print $2; exit }' "${input}")"
  APP_USER="$(awk -F': ' '/^  User: / { print $2; exit }' "${input}")"
else
  SERVICE_NAME="${input}"
fi

[[ -n "${SERVICE_NAME}" ]] || die "Could not infer service name."
[[ "${SERVICE_NAME}" =~ ^[A-Za-z0-9_.@-]+$ ]] || die "Unsafe service name: ${SERVICE_NAME}"

env_file="/etc/default/${SERVICE_NAME}"
if [[ -f "${env_file}" ]]; then
  # shellcheck disable=SC1090
  source "${env_file}"
fi

[[ -n "${APP_DIR:-}" ]] || die "Could not infer APP_DIR. Pass the generated admin-commands file instead of only the service name."
if [[ -z "${APP_USER:-}" ]]; then
  if [[ -d "${APP_DIR}" ]]; then
    APP_USER="$(stat -c '%U' "${APP_DIR}")"
  else
    APP_USER="root"
  fi
fi
if [[ -z "${APP_GROUP:-}" ]]; then
  APP_GROUP="$(id -gn "${APP_USER}" 2>/dev/null || echo "${APP_USER}")"
fi

install -d "${APP_DIR}"
path="${APP_DIR}/${SERVICE_NAME}-uninstall.sh"

cat > "${path}" <<EOF
#!/usr/bin/env bash
set -Eeuo pipefail

echo "This disables ${SERVICE_NAME} units and removes generated service files."
echo "It will not delete ${APP_DIR} or world data."
read -r -p "Continue? [y/N]: " answer
case "\${answer}" in
  y|Y|yes|YES) ;;
  *) echo "Cancelled."; exit 1 ;;
esac

systemctl disable --now "${SERVICE_NAME}.service" "${SERVICE_NAME}-update.timer" "${SERVICE_NAME}-backup.timer" "${SERVICE_NAME}-config-watch.path" 2>/dev/null || true
rm -f \\
  "/etc/systemd/system/${SERVICE_NAME}.service" \\
  "/etc/systemd/system/${SERVICE_NAME}-update.service" \\
  "/etc/systemd/system/${SERVICE_NAME}-update.timer" \\
  "/etc/systemd/system/${SERVICE_NAME}-backup.service" \\
  "/etc/systemd/system/${SERVICE_NAME}-backup.timer" \\
  "/etc/systemd/system/${SERVICE_NAME}-config-restart.service" \\
  "/etc/systemd/system/${SERVICE_NAME}-config-watch.path" \\
  "/usr/local/bin/${SERVICE_NAME}-run.sh" \\
  "/usr/local/bin/${SERVICE_NAME}-deploy.sh" \\
  "/usr/local/bin/${SERVICE_NAME}-backup.sh" \\
  "/usr/local/bin/${SERVICE_NAME}-config-restart.sh" \\
  "/etc/default/${SERVICE_NAME}" \\
  "/usr/local/bin/${SERVICE_NAME}-uninstall.sh" \\
  "${APP_DIR}/${SERVICE_NAME}-admin-commands.txt" \\
  "${APP_DIR}/${SERVICE_NAME}-uninstall.sh"
rm -f "/etc/letsencrypt/renewal-hooks/deploy/${SERVICE_NAME}-restart.sh" 2>/dev/null || true
if [[ -d "${APP_DIR}/installerbackup" ]]; then
  read -r -p "Delete installer backup folder ${APP_DIR}/installerbackup? [y/N]: " delete_backup
  case "\${delete_backup}" in
    y|Y|yes|YES)
      rm -rf "${APP_DIR}/installerbackup"
      echo "Deleted ${APP_DIR}/installerbackup."
      ;;
    *) echo "Kept ${APP_DIR}/installerbackup." ;;
  esac
fi
systemctl daemon-reload
echo "Removed generated units/scripts for ${SERVICE_NAME}. Repo and world data were left in place."
EOF

chown "${APP_USER}:${APP_GROUP}" "${path}" 2>/dev/null || true
chmod 755 "${path}"

cat <<EOF
Created uninstall helper:
  ${path}

Run it with:
  sudo $(shell_quote "${path}")
EOF
