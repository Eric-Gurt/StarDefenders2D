#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_VERSION="1.0.10"
DEFAULT_REPO_URL="https://github.com/Eric-Gurt/StarDefenders2D.git"
DEFAULT_BRANCH="main"
DEFAULT_SERVICE_NAME="stardefenders"
DEFAULT_APP_USER="stardefenders"
DEFAULT_LAUNCH_COMMAND="node index.js"
DEFAULT_UPDATE_INTERVAL="5min"
DEFAULT_BACKUP_INTERVAL="2d"
DEFAULT_NODE_VERSION="lts/*"
DEFAULT_WORLD_SLOT="0"
DEFAULT_BACKUP_RETENTION_DAYS="30"

APP_USER=""
APP_GROUP=""
APP_HOME=""
APP_DIR=""
REPO_URL=""
REPO_BRANCH=""
SERVICE_NAME=""
LAUNCH_COMMAND=""
WORLD_SLOT=""
FILE_SUFFIX=""
INSTALL_NODE_MODE="nvm"
NVM_VERSION=""
NODE_ENV_VALUE="production"
UPDATE_ENABLED=""
UPDATE_INTERVAL=""
BACKUP_INTERVAL=""
CONFIG_WATCH_ENABLED=""
WATCH_SERVER_CONFIG=""
WATCH_SSLCONFIG=""
SERVER_CONFIG_SOURCE=""
SSLCONFIG_SOURCE=""
SSLCONFIG_MODE=""
SSL_CERT_PATH=""
SSL_KEY_PATH=""
SSL_ONLINE_PATH=""
SSL_CLOUDFLARE=""
SSL_FIX_PERMISSIONS=""
SSL_PERMISSION_PROMPTED="no"
LETSENCRYPT_DOMAIN=""
LETSENCRYPT_EMAIL=""
LETSENCRYPT_STAGING=""
LETSENCRYPT_OPEN_HTTP=""
RUN_INITIAL_UPDATE=""
BACKUP_RETENTION_DAYS=""
EXPECTED_PORT=""
OPEN_FIREWALL=""
INSTALL_CERT_RENEWAL_HOOK=""
WRITE_UNINSTALL_HELPER=""
DRY_RUN="no"
ASSUME_DEFAULTS="no"
CONFIG_FILE=""
EXISTING_CHECKOUT_ONLY=""
EXISTING_NON_GIT_ACTION=""

die() {
  echo "Error: $*" >&2
  exit 1
}

usage() {
  cat <<EOF
StarDefenders2D Linux installer ${SCRIPT_VERSION}

Usage:
  sudo bash install-linux.sh
  sudo bash install-linux.sh --existing-checkout
  sudo bash install-linux.sh --dry-run
  sudo bash install-linux.sh --config ./install.env --yes
  bash install-linux.sh --help
  bash install-linux.sh --version

This is an interactive installer for systemd-based Linux servers. It can
install missing git/curl/wget dependencies, install Node.js through nvm,
clone/update the repository, install npm production dependencies, create a
crash-restarting game service, enable GitHub auto-updates, configure
sslconfig.json certificate/key paths, or install Let's Encrypt and write
sslconfig.json from the issued certificate paths, verify service user access,
and create world-slot-aware file watchers for graceful restarts.

Options:
  --config FILE        Load shell-style installer defaults before prompting.
  --yes                Use loaded/default answers without prompting.
  --dry-run            Print the resulting plan without changing the system.
  --existing-checkout  Reconfigure services around an existing Git checkout;
                       skip the initial clone/checkout/reset step.
EOF
}

parse_args() {
  while (( $# > 0 )); do
    case "$1" in
      -h|--help)
        usage
        exit 0
        ;;
      --version)
        echo "${SCRIPT_VERSION}"
        exit 0
        ;;
      --dry-run)
        DRY_RUN="yes"
        shift
        ;;
      --existing-checkout|--reuse-existing|--service-only)
        EXISTING_CHECKOUT_ONLY="yes"
        shift
        ;;
      -y|--yes|--non-interactive|--noninteractive)
        ASSUME_DEFAULTS="yes"
        shift
        ;;
      --config)
        [[ $# -ge 2 ]] || die "--config requires a file path."
        CONFIG_FILE="$2"
        shift 2
        ;;
      *)
        die "Unknown argument: $1"
        ;;
    esac
  done

  if [[ -n "${CONFIG_FILE}" ]]; then
    [[ -f "${CONFIG_FILE}" ]] || die "Config file not found: ${CONFIG_FILE}"
    # shellcheck disable=SC1090
    source "${CONFIG_FILE}"
  fi
}

info() {
  printf '\n==> %s\n' "$*"
}

warn() {
  printf 'Warning: %s\n' "$*" >&2
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    die "Run this installer as root, for example: sudo bash install-linux.sh"
  fi
}

require_systemd() {
  command_exists systemctl || die "systemctl was not found. This installer currently requires systemd."
}

prompt_text() {
  local prompt="$1"
  local default_value="$2"
  local result

  if [[ "${ASSUME_DEFAULTS}" == "yes" ]]; then
    printf '%s' "${default_value}"
    return 0
  fi

  if [[ -n "${default_value}" ]]; then
    read -r -p "${prompt} [${default_value}]: " result
    printf '%s' "${result:-$default_value}"
  else
    read -r -p "${prompt}: " result
    printf '%s' "$result"
  fi
}

prompt_yes_no() {
  local prompt="$1"
  local default_value="$2"
  local suffix
  local result

  case "${default_value}" in
    y|Y|yes|YES|true|TRUE|1) suffix="Y/n" ;;
    n|N|no|NO|false|FALSE|0) suffix="y/N" ;;
    *) suffix="y/n" ;;
  esac

  if [[ "${ASSUME_DEFAULTS}" == "yes" ]]; then
    case "${default_value}" in
      y|Y|yes|YES|true|TRUE|1) return 0 ;;
      n|N|no|NO|false|FALSE|0) return 1 ;;
      *) die "Cannot answer yes/no prompt without a default: ${prompt}" ;;
    esac
  fi

  while true; do
    read -r -p "${prompt} [${suffix}]: " result
    result="${result:-$default_value}"
    case "${result}" in
      y|Y|yes|YES|true|TRUE|1) return 0 ;;
      n|N|no|NO|false|FALSE|0) return 1 ;;
      *) echo "Please answer yes or no." ;;
    esac
  done
}

prompt_choice() {
  local prompt="$1"
  local default_value="$2"
  shift 2
  local choices=("$@")
  local result
  local choice

  if [[ "${ASSUME_DEFAULTS}" == "yes" ]]; then
    printf '%s' "${default_value}"
    return 0
  fi

  while true; do
    read -r -p "${prompt} (${choices[*]}) [${default_value}]: " result
    result="${result:-$default_value}"
    for choice in "${choices[@]}"; do
      if [[ "${result}" == "${choice}" ]]; then
        printf '%s' "${result}"
        return 0
      fi
    done
    echo "Choose one of: ${choices[*]}"
  done
}

is_nonnegative_integer() {
  [[ "$1" =~ ^[0-9]+$ ]]
}

detect_package_manager() {
  if command_exists apt-get; then
    echo "apt"
  elif command_exists dnf; then
    echo "dnf"
  elif command_exists yum; then
    echo "yum"
  elif command_exists pacman; then
    echo "pacman"
  elif command_exists zypper; then
    echo "zypper"
  else
    echo "unknown"
  fi
}

package_installed() {
  local manager="$1"
  local package_name="$2"

  case "${manager}" in
    apt)
      dpkg-query -W -f='${Status}' "${package_name}" 2>/dev/null | grep -q 'install ok installed'
      ;;
    dnf|yum|zypper)
      rpm -q "${package_name}" >/dev/null 2>&1
      ;;
    pacman)
      pacman -Qi "${package_name}" >/dev/null 2>&1
      ;;
    *)
      return 1
      ;;
  esac
}

append_package_if_missing() {
  local manager="$1"
  local output_array_name="$2"
  local package_name="$3"
  local -n output_array="${output_array_name}"

  if package_installed "${manager}" "${package_name}"; then
    return 0
  fi

  output_array+=("${package_name}")
}

install_packages() {
  local manager="$1"
  shift
  local packages=("$@")

  if (( ${#packages[@]} == 0 )); then
    return 0
  fi

  info "Installing missing system package(s): ${packages[*]}"

  case "${manager}" in
    apt)
      if ! DEBIAN_FRONTEND=noninteractive apt-get update; then
        warn "apt-get update failed. This is often caused by an unrelated broken apt repository or PPA."
        warn "The installer will try apt-get install using the existing package cache."
        warn "If install fails, inspect broken apt sources with: sudo grep -R \"Release file\\|ondrej\\|ppa\" /etc/apt/sources.list /etc/apt/sources.list.d 2>/dev/null"
      fi
      if ! DEBIAN_FRONTEND=noninteractive apt-get install -y "${packages[@]}"; then
        die "Unable to install required package(s): ${packages[*]}. Fix apt repositories, install them manually, then rerun this installer."
      fi
      ;;
    dnf)
      dnf install -y "${packages[@]}"
      ;;
    yum)
      yum install -y "${packages[@]}"
      ;;
    pacman)
      pacman -Sy --noconfirm --needed "${packages[@]}"
      ;;
    zypper)
      zypper --non-interactive install "${packages[@]}"
      ;;
    *)
      die "No supported package manager found. Install these manually, then rerun: ${packages[*]}"
      ;;
  esac
}

ensure_base_packages() {
  local manager
  local packages=()

  manager="$(detect_package_manager)"
  info "Detected package manager: ${manager}"

  if ! command_exists git; then
    append_package_if_missing "${manager}" packages "git"
  fi
  if ! command_exists curl && ! command_exists wget; then
    append_package_if_missing "${manager}" packages "curl"
  fi

  case "${manager}" in
    apt)
      command_exists getent || append_package_if_missing "${manager}" packages "passwd"
      append_package_if_missing "${manager}" packages "ca-certificates"
      ;;
    dnf|yum)
      append_package_if_missing "${manager}" packages "ca-certificates"
      ;;
    pacman)
      append_package_if_missing "${manager}" packages "ca-certificates"
      ;;
    zypper)
      append_package_if_missing "${manager}" packages "ca-certificates"
      ;;
  esac

  install_packages "${manager}" "${packages[@]}"
  command_exists git || die "git is still unavailable after dependency installation."
  command_exists curl || command_exists wget || die "curl or wget is required to install nvm. Install one manually, then rerun this installer."
}

ensure_certbot_available() {
  local manager
  local packages=()

  if command_exists certbot; then
    return 0
  fi

  manager="$(detect_package_manager)"
  append_package_if_missing "${manager}" packages "certbot"
  install_packages "${manager}" "${packages[@]}"
  command_exists certbot || die "certbot is still unavailable after installation. Install certbot manually, then rerun this installer."
}

shell_quote() {
  printf '%q' "$1"
}

write_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"
  printf '%s=' "${key}" >> "${file}"
  shell_quote "${value}" >> "${file}"
  printf '\n' >> "${file}"
}

run_as_app() {
  runuser -u "${APP_USER}" -- "$@"
}

run_app_shell() {
  local command="$1"
  runuser -u "${APP_USER}" -- bash -lc "${command}"
}

ensure_app_user() {
  if getent passwd "${APP_USER}" >/dev/null; then
    APP_HOME="$(getent passwd "${APP_USER}" | cut -d: -f6)"
    APP_GROUP="$(id -gn "${APP_USER}")"
    info "Using existing user ${APP_USER} (${APP_HOME})"
    return 0
  fi

  info "Creating system user ${APP_USER}"
  useradd --system --create-home --shell /bin/bash "${APP_USER}"
  APP_HOME="$(getent passwd "${APP_USER}" | cut -d: -f6)"
  APP_GROUP="$(id -gn "${APP_USER}")"
}

prepare_existing_non_git_directory() {
  local backup_dir
  local entry_count
  local project_markers=0

  [[ -d "${APP_DIR}" ]] || return 0
  [[ ! -d "${APP_DIR}/.git" ]] || return 0

  entry_count="$(find "${APP_DIR}" -mindepth 1 -maxdepth 1 | wc -l)"
  if [[ -e "${APP_DIR}/index.js" || -e "${APP_DIR}/package.json" || -d "${APP_DIR}/game" ]]; then
    project_markers=1
  fi

  if (( entry_count == 0 )); then
    info "Using existing empty directory ${APP_DIR}"
    return 0
  fi

  if [[ "${EXISTING_NON_GIT_ACTION}" == "init" ]]; then
    EXISTING_NON_GIT_ACTION="git"
  elif [[ "${EXISTING_NON_GIT_ACTION}" == "backup" ]]; then
    EXISTING_NON_GIT_ACTION="startfresh"
  fi

  if [[ "${EXISTING_NON_GIT_ACTION}" == "git" ]]; then
    backup_existing_directory_for_in_place_install
    initialize_git_metadata_for_existing_directory
    return 0
  fi

  if [[ "${EXISTING_NON_GIT_ACTION}" == "plain" ]]; then
    backup_existing_directory_for_in_place_install
    info "Using existing non-Git directory ${APP_DIR} without configuring repository metadata"
    chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"
    return 0
  fi

  if [[ "${EXISTING_NON_GIT_ACTION}" == "abort" ]]; then
    die "Choose an empty directory, an existing Git checkout, plain-directory reuse, or Git initialization."
  fi

  if (( project_markers == 0 )); then
    warn "${APP_DIR} exists but is not a Git checkout. It does not look like a StarDefenders2D repo."
    warn "This commonly happens when the installer itself was uploaded into the intended install directory."
  else
    warn "${APP_DIR} exists and contains project-looking files, but it is not a Git checkout."
  fi

  if [[ "${EXISTING_NON_GIT_ACTION}" != "startfresh" ]]; then
    if ! prompt_yes_no "Back up current contents and clone StarDefenders2D into this directory" "y"; then
      die "Choose an empty directory or an existing Git checkout, then rerun the installer."
    fi
  fi

  backup_dir="${APP_DIR}.preinstall.$(date -u +%Y%m%dT%H%M%SZ)"
  info "Moving current contents to ${backup_dir}"
  mkdir -p "${backup_dir}"
  find "${APP_DIR}" -mindepth 1 -maxdepth 1 -exec mv -t "${backup_dir}" {} +
  chown -R "${APP_USER}:${APP_GROUP}" "${backup_dir}" "${APP_DIR}"
}

backup_existing_directory_for_in_place_install() {
  local backup_root="${APP_DIR}/installerbackup"
  local backup_dir

  [[ -d "${APP_DIR}" ]] || return 0

  backup_dir="${backup_root}/$(date -u +%Y%m%dT%H%M%SZ)"
  info "Backing up existing directory contents to ${backup_dir}"
  mkdir -p "${backup_dir}"

  if find "${APP_DIR}" -mindepth 1 -maxdepth 1 ! -name installerbackup -exec cp -a -t "${backup_dir}" {} +; then
    chown -R "${APP_USER}:${APP_GROUP}" "${backup_root}"
  else
    die "Failed to create installer backup at ${backup_dir}"
  fi
}

initialize_git_metadata_for_existing_directory() {
  local target_ref="origin/${REPO_BRANCH}"
  local ignored_pathspecs=(
    ":(exclude)backups/**"
    ":(exclude)installerbackup/**"
    ":(exclude)node_modules/**"
    ":(exclude)node_modules_win10/**"
    ":(exclude)server_config*.js"
    ":(exclude)sslconfig.json"
    ":(exclude)superuser_pass*.txt"
    ":(exclude)presets/*.json"
    ":(exclude)presets_users/**"
    ":(exclude)moderation_data*.v"
    ":(exclude)star_defenders_snapshot*.v"
    ":(exclude)star_defenders_snapshot*.raw.v"
    ":(exclude)chunks*/**"
  )

  [[ -d "${APP_DIR}" ]] || die "Cannot initialize Git metadata because ${APP_DIR} does not exist."
  [[ ! -d "${APP_DIR}/.git" ]] || return 0

  info "Initializing Git metadata in existing directory ${APP_DIR}"
  chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"
  run_as_app git -C "${APP_DIR}" init
  add_local_git_excludes_for_server_runtime
  run_as_app git -C "${APP_DIR}" check-ref-format --branch "${REPO_BRANCH}" >/dev/null
  if run_as_app git -C "${APP_DIR}" remote get-url origin >/dev/null 2>&1; then
    run_as_app git -C "${APP_DIR}" remote set-url origin "${REPO_URL}"
  else
    run_as_app git -C "${APP_DIR}" remote add origin "${REPO_URL}"
  fi
  run_as_app git -C "${APP_DIR}" fetch --prune origin
  run_as_app git -C "${APP_DIR}" rev-parse --verify "${target_ref}^{commit}" >/dev/null
  run_as_app git -C "${APP_DIR}" symbolic-ref HEAD "refs/heads/${REPO_BRANCH}"
  run_as_app git -C "${APP_DIR}" reset --mixed "${target_ref}"
  run_as_app git -C "${APP_DIR}" branch --set-upstream-to="${target_ref}" "${REPO_BRANCH}" >/dev/null 2>&1 || true

  if ! run_as_app git -C "${APP_DIR}" diff --quiet -- . "${ignored_pathspecs[@]}"; then
    warn "${APP_DIR} now has Git metadata, but repository source files differ from ${target_ref}."
    warn "The installer will not overwrite those files in in-place initialization mode."
    run_as_app git -C "${APP_DIR}" diff --name-status -- . "${ignored_pathspecs[@]}" || true
    die "Review source file changes above, or choose plain/startfresh mode when rerunning the installer."
  fi

  info "Existing directory is now a Git checkout tracking ${target_ref}"
}

add_local_git_excludes_for_server_runtime() {
  local exclude_file="${APP_DIR}/.git/info/exclude"
  local pattern
  local patterns=(
    "backups/"
    "installerbackup/"
    "node_modules/"
    "node_modules_win10/"
    "server_config*.js"
    "sslconfig.json"
    "superuser_pass*.txt"
    "presets/*.json"
    "presets_users/"
    "moderation_data*.v"
    "star_defenders_snapshot*.v"
    "star_defenders_snapshot*.raw.v"
    "chunks*/"
  )

  if [[ ! -e "${exclude_file}" ]]; then
    install -o "${APP_USER}" -g "${APP_GROUP}" -m 644 /dev/null "${exclude_file}" 2>/dev/null || touch "${exclude_file}"
  fi
  chown "${APP_USER}:${APP_GROUP}" "${exclude_file}"
  for pattern in "${patterns[@]}"; do
    if ! grep -qxF "${pattern}" "${exclude_file}" 2>/dev/null; then
      printf '%s\n' "${pattern}" >> "${exclude_file}"
    fi
  done
  chown "${APP_USER}:${APP_GROUP}" "${exclude_file}"
}

install_nvm_and_node() {
  local nvm_dir="${APP_HOME}/.nvm"
  local install_url="https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh"
  local fetch_command

  if [[ ! -s "${nvm_dir}/nvm.sh" ]]; then
    info "Installing nvm for ${APP_USER}"
    if command_exists curl; then
      fetch_command="curl -fsSL $(shell_quote "${install_url}")"
    elif command_exists wget; then
      fetch_command="wget -qO- $(shell_quote "${install_url}")"
    else
      die "curl or wget is required to install nvm."
    fi
    run_app_shell "${fetch_command} | PROFILE=/dev/null bash"
  else
    info "Found existing nvm at ${nvm_dir}"
  fi

  info "Installing/activating Node.js ${NVM_VERSION} via nvm"
  run_app_shell "export NVM_DIR=$(shell_quote "${nvm_dir}"); . \"\$NVM_DIR/nvm.sh\"; nvm install $(shell_quote "${NVM_VERSION}"); nvm alias default $(shell_quote "${NVM_VERSION}"); node --version; npm --version"
}

prompt_configuration() {
  local sudo_user="${SUDO_USER:-}"
  local detected_user="${sudo_user:-$DEFAULT_APP_USER}"
  local current_dir
  current_dir="$(pwd -P)"

  cat <<EOF
StarDefenders2D Linux installer ${SCRIPT_VERSION}

This installer can:
- install missing git/curl/wget dependencies,
- clone or reuse a StarDefenders2D checkout,
- install npm production dependencies,
- create a crash-restarting systemd game service,
- create an optional GitHub auto-update timer,
- create/copy sslconfig.json, or install Let's Encrypt and write sslconfig.json,
- create optional world-slot-aware file watchers for graceful restarts.

EOF

  APP_USER="$(prompt_text "Linux user that should own and run the server" "${detected_user}")"

  echo
  echo "World slot controls the default port, service name, and slot-specific files:"
  echo "  0    -> port 3000, server_config.js, moderation_data.v, star_defenders_snapshot.v"
  echo "  1    -> port 3001, server_config1.js, moderation_data1.v, star_defenders_snapshot1.v"
  echo "  1000 -> port 4000, server_config1000.js, moderation_data1000.v, star_defenders_snapshot1000.v"
  WORLD_SLOT="$(prompt_text "World slot number" "${WORLD_SLOT:-$DEFAULT_WORLD_SLOT}")"
  is_nonnegative_integer "${WORLD_SLOT}" || die "World slot must be a non-negative integer."
  if [[ "${WORLD_SLOT}" == "0" ]]; then
    FILE_SUFFIX=""
  else
    FILE_SUFFIX="${WORLD_SLOT}"
  fi

  local default_service_name="${DEFAULT_SERVICE_NAME}-${APP_USER}-slot${WORLD_SLOT}"
  SERVICE_NAME="$(prompt_text "systemd service name prefix (slot-specific)" "${SERVICE_NAME:-$default_service_name}")"
  if [[ -f "/etc/default/${SERVICE_NAME}" ]]; then
    if prompt_yes_no "Existing /etc/default/${SERVICE_NAME} found. Reuse it as defaults" "y"; then
      local selected_service_name="${SERVICE_NAME}"
      # shellcheck disable=SC1090
      source "/etc/default/${SERVICE_NAME}"
      SERVICE_NAME="${selected_service_name}"
      echo "Loaded previous installer profile from /etc/default/${SERVICE_NAME}."
      is_nonnegative_integer "${WORLD_SLOT}" || die "Loaded WORLD_SLOT is not a non-negative integer: ${WORLD_SLOT}"
      if [[ "${WORLD_SLOT}" == "0" ]]; then
        FILE_SUFFIX=""
      else
        FILE_SUFFIX="${WORLD_SLOT}"
      fi
    fi
  fi

  local default_dir
  local app_home_guess
  app_home_guess="$(getent passwd "${APP_USER}" 2>/dev/null | cut -d: -f6 || true)"
  app_home_guess="${app_home_guess:-/home/${APP_USER}}"
  default_dir="${APP_DIR:-${app_home_guess}/StarDefenders2D}"
  case "${current_dir}" in
    "${app_home_guess}"/*)
      default_dir="${current_dir}"
      ;;
  esac
  echo "Install/repo directory is where the StarDefenders2D repository will live."
  echo "If you uploaded this installer into the intended server directory, press Enter here."
  APP_DIR="$(prompt_text "Install/repo directory" "${default_dir}")"
  if [[ "${APP_DIR}" != "/" ]]; then
    APP_DIR="${APP_DIR%/}"
  fi

  if [[ -d "${APP_DIR}" && ! -d "${APP_DIR}/.git" ]] &&
     [[ -e "${APP_DIR}/index.js" || -e "${APP_DIR}/package.json" || -d "${APP_DIR}/game" ]]; then
    echo
    echo "${APP_DIR} contains StarDefenders2D-looking files, but it is not configured as a Git checkout."
    echo "  git     Keep files in place, initialize Git metadata, fetch origin, and verify tracked files match the selected branch."
    echo "  plain   Keep files in place without Git metadata; GitHub auto-updates will be disabled."
    echo "  startfresh"
    echo "          Move current contents to a timestamped backup directory, then clone a fresh checkout."
    echo "  abort   Stop before changing this directory."
    if [[ "${EXISTING_NON_GIT_ACTION:-}" == "init" ]]; then
      EXISTING_NON_GIT_ACTION="git"
    elif [[ "${EXISTING_NON_GIT_ACTION:-}" == "backup" ]]; then
      EXISTING_NON_GIT_ACTION="startfresh"
    fi
    EXISTING_NON_GIT_ACTION="$(prompt_choice "Existing non-Git directory action" "${EXISTING_NON_GIT_ACTION:-git}" "git" "plain" "startfresh" "abort")"
  fi

  local existing_checkout_default="n"
  if [[ -d "${APP_DIR}/.git" ]]; then
    existing_checkout_default="y"
  fi
  if [[ "${EXISTING_NON_GIT_ACTION}" == "git" || "${EXISTING_NON_GIT_ACTION}" == "plain" ]]; then
    EXISTING_CHECKOUT_ONLY="no"
  else
    if prompt_yes_no "Use existing checkout as-is and skip initial clone/reset" "${EXISTING_CHECKOUT_ONLY:-$existing_checkout_default}"; then
      EXISTING_CHECKOUT_ONLY="yes"
    else
      EXISTING_CHECKOUT_ONLY="no"
    fi
  fi

  if [[ "${EXISTING_NON_GIT_ACTION}" == "plain" ]]; then
    REPO_URL="${REPO_URL:-$DEFAULT_REPO_URL}"
    REPO_BRANCH="${REPO_BRANCH:-$DEFAULT_BRANCH}"
  else
    REPO_URL="$(prompt_text "Git repository URL" "${REPO_URL:-$DEFAULT_REPO_URL}")"
    REPO_BRANCH="$(prompt_text "Git branch to deploy" "${REPO_BRANCH:-$DEFAULT_BRANCH}")"
  fi
  if [[ "${EXISTING_CHECKOUT_ONLY}" == "yes" ]]; then
    warn "Initial setup will not reset ${APP_DIR}; future auto-updates still reset to origin/${REPO_BRANCH}."
  elif [[ "${EXISTING_NON_GIT_ACTION}" == "git" ]]; then
    warn "Initial setup will preserve ${APP_DIR} files while adding Git metadata; future auto-updates reset to origin/${REPO_BRANCH}."
  elif [[ "${EXISTING_NON_GIT_ACTION}" == "plain" ]]; then
    warn "Initial setup will preserve ${APP_DIR} as a plain directory without Git metadata."
  fi

  echo
  echo "Node.js will be installed and launched through nvm for ${APP_USER}."
  echo "The installer will not install nodejs/npm from Ubuntu or other OS package repositories."
  INSTALL_NODE_MODE="nvm"
  NVM_VERSION="$(prompt_text "nvm Node.js version" "${NVM_VERSION:-$DEFAULT_NODE_VERSION}")"

  local default_launch_command="${LAUNCH_COMMAND:-$DEFAULT_LAUNCH_COMMAND}"
  if [[ -z "${LAUNCH_COMMAND}" && "${WORLD_SLOT}" != "0" ]]; then
    default_launch_command="${DEFAULT_LAUNCH_COMMAND} world_slot=${WORLD_SLOT}"
  fi
  LAUNCH_COMMAND="$(prompt_text "Launch command, run from the repo directory" "${default_launch_command}")"
  if [[ "${LAUNCH_COMMAND}" =~ world_slot=([0-9]+) ]]; then
    if [[ "${BASH_REMATCH[1]}" != "${WORLD_SLOT}" ]]; then
      warn "Launch command contains world_slot=${BASH_REMATCH[1]}, but installer world slot is ${WORLD_SLOT}."
      prompt_yes_no "Continue with this mismatch" "n" || die "Rerun with matching world slot and launch command."
    fi
  elif [[ "${WORLD_SLOT}" != "0" ]]; then
    warn "Launch command did not contain world_slot=${WORLD_SLOT}; appending it."
    LAUNCH_COMMAND="${LAUNCH_COMMAND} world_slot=${WORLD_SLOT}"
  fi
  NODE_ENV_VALUE="$(prompt_text "NODE_ENV" "${NODE_ENV_VALUE}")"

  EXPECTED_PORT="$(prompt_text "Expected public TCP port for health checks/firewall" "${EXPECTED_PORT:-$(( 3000 + WORLD_SLOT ))}")"
  is_nonnegative_integer "${EXPECTED_PORT}" || die "Expected port must be a non-negative integer."
  if prompt_yes_no "Open TCP port ${EXPECTED_PORT} with ufw if ufw is installed" "${OPEN_FIREWALL:-n}"; then
    OPEN_FIREWALL="yes"
  else
    OPEN_FIREWALL="no"
  fi

  if [[ "${EXISTING_NON_GIT_ACTION}" == "plain" ]]; then
    UPDATE_ENABLED="no"
    UPDATE_INTERVAL="${UPDATE_INTERVAL:-$DEFAULT_UPDATE_INTERVAL}"
    warn "Automatic GitHub updates disabled because ${APP_DIR} will remain a plain non-Git directory."
  else
    if prompt_yes_no "Enable automatic GitHub updates" "${UPDATE_ENABLED:-y}"; then
      UPDATE_ENABLED="yes"
      UPDATE_INTERVAL="$(prompt_text "Update interval for systemd timer" "${UPDATE_INTERVAL:-$DEFAULT_UPDATE_INTERVAL}")"
    else
      UPDATE_ENABLED="no"
      UPDATE_INTERVAL="${DEFAULT_UPDATE_INTERVAL}"
    fi
  fi

  if prompt_yes_no "Watch files for graceful restarts" "${CONFIG_WATCH_ENABLED:-y}"; then
    CONFIG_WATCH_ENABLED="yes"
    echo "Select files to watch for this service instance."
    echo "Slot-specific defaults for world_slot=${WORLD_SLOT}:"
    echo "  server config: ${APP_DIR}/server_config${FILE_SUFFIX}.js"
    echo "  SSL config:    ${APP_DIR}/sslconfig.json"
    echo "Note: moderation_data${FILE_SUFFIX}.v and star_defenders_snapshot${FILE_SUFFIX}.v are written by the game server and are not watchable restart triggers."
    if prompt_yes_no "Watch server_config${FILE_SUFFIX}.js" "${WATCH_SERVER_CONFIG:-y}"; then WATCH_SERVER_CONFIG="yes"; else WATCH_SERVER_CONFIG="no"; fi
    if prompt_yes_no "Watch sslconfig.json" "${WATCH_SSLCONFIG:-y}"; then WATCH_SSLCONFIG="yes"; else WATCH_SSLCONFIG="no"; fi
  else
    CONFIG_WATCH_ENABLED="no"
    WATCH_SERVER_CONFIG="no"
    WATCH_SSLCONFIG="no"
  fi

  SERVER_CONFIG_SOURCE="$(prompt_text "Optional local path to install as server_config${FILE_SUFFIX}.js (blank to skip)" "")"

  echo
  echo "SSL configuration:"
  echo "  skip      Leave sslconfig.json unchanged; optionally verify existing cert/key permissions."
  echo "  copy      Copy an existing sslconfig.json from this Linux server."
  echo "  create    Prompt for certificate/key paths and write sslconfig.json."
  echo "  letsencrypt"
  echo "            Install certbot, request a certificate, and write sslconfig.json."
  echo "            Expected JSON keys are: certpath, keypath, optional onlinepath, optional cloudflare."
  if [[ "${SSLCONFIG_MODE:-}" == "generate" ]]; then
    SSLCONFIG_MODE="create"
  fi
  SSLCONFIG_MODE="$(prompt_choice "sslconfig.json mode" "${SSLCONFIG_MODE:-skip}" "skip" "copy" "create" "letsencrypt")"
  if [[ "${SSLCONFIG_MODE}" == "copy" ]]; then
    SSLCONFIG_SOURCE="$(prompt_text "Path on this server to copy as sslconfig.json" "")"
  elif [[ "${SSLCONFIG_MODE}" == "create" ]]; then
    echo "For Let's Encrypt, certpath is usually cert.pem and keypath is usually privkey.pem."
    SSL_CERT_PATH="$(prompt_text "Certificate path for sslconfig.certpath" "/etc/letsencrypt/live/example.com/cert.pem")"
    SSL_KEY_PATH="$(prompt_text "Private key path for sslconfig.keypath" "/etc/letsencrypt/live/example.com/privkey.pem")"
    SSL_ONLINE_PATH="$(prompt_text "Optional online count output path for sslconfig.onlinepath (blank to skip)" "")"
    if prompt_yes_no "Enable sslconfig.cloudflare" "${SSL_CLOUDFLARE:-n}"; then
      SSL_CLOUDFLARE="true"
    else
      SSL_CLOUDFLARE="false"
    fi
  elif [[ "${SSLCONFIG_MODE}" == "letsencrypt" ]]; then
    echo
    echo "Let's Encrypt prerequisites before you continue:"
    echo "  1. You own a DNS name such as game.example.com."
    echo "  2. Its A/AAAA DNS record points to this server's public IP."
    echo "  3. TCP port 80 reaches this server during certificate issuance."
    echo "  4. Your VPS/provider firewall allows port 80 and the game port ${EXPECTED_PORT}."
    echo "  5. If using Cloudflare, use DNS-only or temporarily disable proxying until the cert is issued."
    prompt_yes_no "I confirm these Let's Encrypt prerequisites are ready" "n" || die "Prepare DNS/firewall first, then rerun the installer."
    LETSENCRYPT_DOMAIN="$(prompt_text "DNS name for this game server certificate" "${LETSENCRYPT_DOMAIN:-}")"
    [[ -n "${LETSENCRYPT_DOMAIN}" ]] || die "Let's Encrypt mode requires a DNS name."
    LETSENCRYPT_EMAIL="$(prompt_text "Email for Let's Encrypt expiry/security notices" "${LETSENCRYPT_EMAIL:-}")"
    [[ -n "${LETSENCRYPT_EMAIL}" ]] || die "Let's Encrypt mode requires an email address."
    if prompt_yes_no "Use Let's Encrypt staging/test certificates first" "${LETSENCRYPT_STAGING:-n}"; then
      LETSENCRYPT_STAGING="yes"
    else
      LETSENCRYPT_STAGING="no"
    fi
    if prompt_yes_no "Open TCP port 80 with ufw if ufw is installed" "${LETSENCRYPT_OPEN_HTTP:-y}"; then
      LETSENCRYPT_OPEN_HTTP="yes"
    else
      LETSENCRYPT_OPEN_HTTP="no"
    fi
    SSL_CERT_PATH="/etc/letsencrypt/live/${LETSENCRYPT_DOMAIN}/cert.pem"
    SSL_KEY_PATH="/etc/letsencrypt/live/${LETSENCRYPT_DOMAIN}/privkey.pem"
    SSL_ONLINE_PATH="$(prompt_text "Optional online count output path for sslconfig.onlinepath (blank to skip)" "")"
    if prompt_yes_no "Enable sslconfig.cloudflare" "${SSL_CLOUDFLARE:-n}"; then
      SSL_CLOUDFLARE="true"
    else
      SSL_CLOUDFLARE="false"
    fi
  fi

  if [[ "${SSLCONFIG_MODE}" != "skip" ]]; then
    SSL_PERMISSION_PROMPTED="yes"
    if prompt_yes_no "Verify and fix SSL file permissions for ${APP_USER}" "${SSL_FIX_PERMISSIONS:-y}"; then
      SSL_FIX_PERMISSIONS="yes"
    else
      SSL_FIX_PERMISSIONS="no"
    fi
  elif [[ -f "${APP_DIR}/sslconfig.json" ]]; then
    echo
    echo "Existing ${APP_DIR}/sslconfig.json found."
    echo "The installer can leave the file unchanged while checking that ${APP_USER} can read its certificate and key paths."
    SSL_PERMISSION_PROMPTED="yes"
    if prompt_yes_no "Verify and fix SSL file permissions for existing sslconfig.json" "${SSL_FIX_PERMISSIONS:-y}"; then
      SSL_FIX_PERMISSIONS="yes"
    else
      SSL_FIX_PERMISSIONS="no"
    fi
  else
    SSL_FIX_PERMISSIONS="no"
  fi

  BACKUP_INTERVAL="$(prompt_text "Periodic world backup interval for systemd timer" "${BACKUP_INTERVAL:-$DEFAULT_BACKUP_INTERVAL}")"
  [[ -n "${BACKUP_INTERVAL}" ]] || die "Backup interval cannot be blank."
  BACKUP_RETENTION_DAYS="$(prompt_text "Delete managed backups older than this many days" "${BACKUP_RETENTION_DAYS:-$DEFAULT_BACKUP_RETENTION_DAYS}")"
  is_nonnegative_integer "${BACKUP_RETENTION_DAYS}" || die "Backup retention must be a non-negative integer."

  if [[ "${SSLCONFIG_MODE}" == "letsencrypt" ]]; then
    if prompt_yes_no "Install a Let's Encrypt renewal hook to restart this service after certificate renewal" "${INSTALL_CERT_RENEWAL_HOOK:-y}"; then
      INSTALL_CERT_RENEWAL_HOOK="yes"
    else
      INSTALL_CERT_RENEWAL_HOOK="no"
    fi
  elif [[ "${SSLCONFIG_MODE}" != "skip" ]] && [[ -d /etc/letsencrypt || -e /usr/bin/certbot || -e /snap/bin/certbot ]]; then
    if prompt_yes_no "Install a Let's Encrypt renewal hook to restart this service after certificate renewal" "${INSTALL_CERT_RENEWAL_HOOK:-y}"; then
      INSTALL_CERT_RENEWAL_HOOK="yes"
    else
      INSTALL_CERT_RENEWAL_HOOK="no"
    fi
  else
    INSTALL_CERT_RENEWAL_HOOK="no"
  fi

  if prompt_yes_no "Write an uninstall helper for this service" "${WRITE_UNINSTALL_HELPER:-y}"; then
    WRITE_UNINSTALL_HELPER="yes"
  else
    WRITE_UNINSTALL_HELPER="no"
  fi

  if prompt_yes_no "Start/restart the game service after installing units" "${RUN_INITIAL_UPDATE:-y}"; then
    RUN_INITIAL_UPDATE="yes"
  else
    RUN_INITIAL_UPDATE="no"
  fi

  [[ "${SERVICE_NAME}" =~ ^[A-Za-z0-9_.@-]+$ ]] || die "Service name must only contain letters, numbers, dot, underscore, @, or dash."
  [[ "${APP_DIR}" == /* ]] || die "Install/repo directory must be an absolute path."
  [[ "${APP_USER}" =~ ^[A-Za-z_][A-Za-z0-9_-]*[$]?$ ]] || die "Linux user name is not valid: ${APP_USER}"
  if [[ "${SSLCONFIG_MODE}" == "copy" && -z "${SSLCONFIG_SOURCE}" ]]; then
    die "sslconfig.json copy mode requires a source path."
  fi
  if [[ "${SSLCONFIG_MODE}" == "create" ]]; then
    [[ "${SSL_CERT_PATH}" == /* ]] || die "SSL certificate path must be absolute."
    [[ "${SSL_KEY_PATH}" == /* ]] || die "SSL key path must be absolute."
    [[ -z "${SSL_ONLINE_PATH}" || "${SSL_ONLINE_PATH}" == /* ]] || die "SSL onlinepath must be blank or absolute."
  fi
  if [[ "${SSLCONFIG_MODE}" == "letsencrypt" ]]; then
    [[ "${LETSENCRYPT_DOMAIN}" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*[A-Za-z0-9]$ ]] || die "Let's Encrypt domain is not valid: ${LETSENCRYPT_DOMAIN}"
    [[ "${LETSENCRYPT_EMAIL}" == *@*.* ]] || die "Let's Encrypt email does not look valid: ${LETSENCRYPT_EMAIL}"
    [[ -z "${SSL_ONLINE_PATH}" || "${SSL_ONLINE_PATH}" == /* ]] || die "SSL onlinepath must be blank or absolute."
  fi
  if [[ "${CONFIG_WATCH_ENABLED}" == "yes" &&
        "${WATCH_SERVER_CONFIG}" != "yes" &&
        "${WATCH_SSLCONFIG}" != "yes" ]]; then
    die "File watcher was enabled, but no files were selected to watch."
  fi
  if [[ "${current_dir}" == "${APP_DIR}" ]]; then
    warn "Installing into the current directory."
  else
    warn "Installer is running from ${current_dir}, but the repo will be installed to ${APP_DIR}."
  fi
  if [[ "${EXISTING_CHECKOUT_ONLY}" == "yes" ]]; then
    [[ -d "${APP_DIR}/.git" ]] || die "Existing-checkout mode requires ${APP_DIR} to be a Git checkout."
  fi
  if [[ "${EXISTING_NON_GIT_ACTION}" == "abort" ]]; then
    die "Installation cancelled because ${APP_DIR} is not configured as a Git checkout."
  fi
  if systemctl list-unit-files "${SERVICE_NAME}.service" --no-legend --no-pager 2>/dev/null | grep -q "^${SERVICE_NAME}[.]service"; then
    warn "${SERVICE_NAME}.service already exists."
    systemctl show "${SERVICE_NAME}.service" -p FragmentPath -p User -p ExecStart -p ActiveState --no-pager 2>/dev/null || true
    prompt_yes_no "Overwrite/reconfigure existing ${SERVICE_NAME}.service" "n" || die "Choose a different systemd service name and rerun the installer."
  fi
  if command_exists ss && ss -ltn "sport = :${EXPECTED_PORT}" 2>/dev/null | grep -q LISTEN; then
    warn "Port ${EXPECTED_PORT} is already listening."
    ss -ltnp "sport = :${EXPECTED_PORT}" 2>/dev/null || true
    prompt_yes_no "Continue anyway" "n" || die "Choose a different world slot, port, or stop the existing listener."
  fi
  if grep -Rqs "^WORLD_SLOT=${WORLD_SLOT}$" /etc/default/stardefenders* 2>/dev/null; then
    warn "Another StarDefenders service profile appears to use WORLD_SLOT=${WORLD_SLOT}:"
    grep -Rsl "^WORLD_SLOT=${WORLD_SLOT}$" /etc/default/stardefenders* 2>/dev/null || true
    prompt_yes_no "Continue with duplicate world slot" "n" || die "Choose a different world slot or service profile."
  fi

  cat <<EOF

Configuration summary:
  User: ${APP_USER}
  Directory: ${APP_DIR}
  Repo: ${REPO_URL}
  Branch: ${REPO_BRANCH}
  Existing checkout only: ${EXISTING_CHECKOUT_ONLY}
  Existing non-Git action: ${EXISTING_NON_GIT_ACTION:-<none>}
  Service: ${SERVICE_NAME}.service
  Launch: ${LAUNCH_COMMAND}
  World slot: ${WORLD_SLOT}
  Slot file suffix: ${FILE_SUFFIX:-<none>}
  Node runtime: nvm (${NVM_VERSION})
  Auto-update: ${UPDATE_ENABLED} (${UPDATE_INTERVAL})
  Config watch: ${CONFIG_WATCH_ENABLED}
  Watched files: server_config=${WATCH_SERVER_CONFIG}, sslconfig=${WATCH_SSLCONFIG}
  SSL config mode: ${SSLCONFIG_MODE}
  Let's Encrypt domain: ${LETSENCRYPT_DOMAIN:-<none>}
  Expected port: ${EXPECTED_PORT}
  Open firewall: ${OPEN_FIREWALL}
  Backup retention: ${BACKUP_RETENTION_DAYS} day(s)
  Backup interval: ${BACKUP_INTERVAL}
  Cert renewal hook: ${INSTALL_CERT_RENEWAL_HOOK}
  Uninstall helper: ${WRITE_UNINSTALL_HELPER}
  Dry run: ${DRY_RUN}

EOF

  prompt_yes_no "Proceed with installation" "y" || die "Installation cancelled."
}

prepare_checkout() {
  ensure_app_user
  install -d -o "${APP_USER}" -g "${APP_GROUP}" "$(dirname "${APP_DIR}")"

  if [[ "${EXISTING_CHECKOUT_ONLY}" == "yes" ]]; then
    [[ -d "${APP_DIR}" ]] || die "Existing-checkout mode requires ${APP_DIR} to exist."
    [[ -d "${APP_DIR}/.git" ]] || die "Existing-checkout mode requires ${APP_DIR} to be a Git checkout."
    info "Using existing Git checkout at ${APP_DIR} without initial reset"
    chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"
    run_as_app git -C "${APP_DIR}" rev-parse --is-inside-work-tree >/dev/null
    if ! run_as_app git -C "${APP_DIR}" remote get-url origin >/dev/null 2>&1; then
      die "Existing-checkout mode requires a Git remote named origin for auto-updates."
    fi
    return 0
  fi

  prepare_existing_non_git_directory

  if [[ -d "${APP_DIR}/.git" ]]; then
    info "Using existing Git checkout at ${APP_DIR}"
    chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"
    run_as_app git -C "${APP_DIR}" fetch --prune origin
    run_as_app git -C "${APP_DIR}" checkout "${REPO_BRANCH}"
    run_as_app git -C "${APP_DIR}" reset --hard "origin/${REPO_BRANCH}"
    return 0
  fi

  if [[ -e "${APP_DIR}" && ! -d "${APP_DIR}" ]]; then
    die "${APP_DIR} exists but is not a directory. Move it aside or choose another install directory."
  fi
  if [[ -d "${APP_DIR}" ]] && [[ "$(find "${APP_DIR}" -mindepth 1 -maxdepth 1 | wc -l)" != "0" ]]; then
    die "${APP_DIR} is not empty after preparation. Move it aside or choose another install directory."
  fi

  info "Cloning ${REPO_URL} (${REPO_BRANCH}) to ${APP_DIR}"
  run_as_app git clone --branch "${REPO_BRANCH}" "${REPO_URL}" "${APP_DIR}"
}

install_optional_config_file() {
  local source_path="$1"
  local target_name="$2"

  if [[ -z "${source_path}" ]]; then
    return 0
  fi
  [[ -f "${source_path}" ]] || die "Config source does not exist: ${source_path}"

  install -d -o "${APP_USER}" -g "${APP_GROUP}" "${APP_DIR}/backups/config"
  if [[ -f "${APP_DIR}/${target_name}" ]]; then
    cp -a "${APP_DIR}/${target_name}" "${APP_DIR}/backups/config/${target_name}.$(date -u +%Y%m%dT%H%M%SZ).bak"
    chown "${APP_USER}:${APP_GROUP}" "${APP_DIR}/backups/config/"*
  fi
  install -o "${APP_USER}" -g "${APP_GROUP}" -m 600 "${source_path}" "${APP_DIR}/${target_name}"
}

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  printf '%s' "${value}"
}

backup_existing_config() {
  local target_name="$1"

  install -d -o "${APP_USER}" -g "${APP_GROUP}" "${APP_DIR}/backups/config"
  if [[ -f "${APP_DIR}/${target_name}" ]]; then
    cp -a "${APP_DIR}/${target_name}" "${APP_DIR}/backups/config/${target_name}.$(date -u +%Y%m%dT%H%M%SZ).bak"
    chown "${APP_USER}:${APP_GROUP}" "${APP_DIR}/backups/config/"*
  fi
}

write_generated_sslconfig() {
  local tmp_file

  [[ "${SSLCONFIG_MODE}" == "create" || "${SSLCONFIG_MODE}" == "letsencrypt" ]] || return 0

  info "Writing generated sslconfig.json"
  backup_existing_config "sslconfig.json"
  tmp_file="$(mktemp)"
  {
    printf '{\n'
    printf '  "certpath": "%s",\n' "$(json_escape "${SSL_CERT_PATH}")"
    printf '  "keypath": "%s"' "$(json_escape "${SSL_KEY_PATH}")"
    if [[ -n "${SSL_ONLINE_PATH}" ]]; then
      printf ',\n  "onlinepath": "%s"' "$(json_escape "${SSL_ONLINE_PATH}")"
    fi
    if [[ "${SSL_CLOUDFLARE}" == "true" ]]; then
      printf ',\n  "cloudflare": true'
    fi
    printf '\n}\n'
  } > "${tmp_file}"
  install -o "${APP_USER}" -g "${APP_GROUP}" -m 600 "${tmp_file}" "${APP_DIR}/sslconfig.json"
  rm -f "${tmp_file}"
}

install_letsencrypt_certificate() {
  local certbot_args=()

  [[ "${SSLCONFIG_MODE}" == "letsencrypt" ]] || return 0

  ensure_certbot_available

  if [[ "${LETSENCRYPT_OPEN_HTTP}" == "yes" ]]; then
    if command_exists ufw; then
      info "Allowing 80/tcp through ufw for Let's Encrypt HTTP validation"
      ufw allow 80/tcp
    else
      warn "ufw is not installed; skipping firewall rule for 80/tcp."
    fi
  fi

  if command_exists ss && ss -ltn "sport = :80" 2>/dev/null | grep -q LISTEN; then
    warn "TCP port 80 is already listening. certbot standalone validation needs this port."
    ss -ltnp "sport = :80" 2>/dev/null || true
    die "Stop the process using port 80 or use an existing certificate with sslconfig.json copy/create mode."
  fi

  info "Requesting Let's Encrypt certificate for ${LETSENCRYPT_DOMAIN}"
  certbot_args=(
    certonly
    --standalone
    --non-interactive
    --agree-tos
    --email "${LETSENCRYPT_EMAIL}"
    -d "${LETSENCRYPT_DOMAIN}"
  )
  if [[ "${LETSENCRYPT_STAGING}" == "yes" ]]; then
    certbot_args+=(--staging)
    warn "Using Let's Encrypt staging. Browsers will not trust staging certificates."
  fi
  certbot "${certbot_args[@]}"

  [[ -f "${SSL_CERT_PATH}" ]] || die "Expected certificate was not created: ${SSL_CERT_PATH}"
  [[ -f "${SSL_KEY_PATH}" ]] || die "Expected private key was not created: ${SSL_KEY_PATH}"
  write_generated_sslconfig
}

grant_user_dir_execute_acl() {
  local dir="$1"

  while [[ -n "${dir}" && "${dir}" != "/" ]]; do
    setfacl -m "u:${APP_USER}:x" "${dir}" 2>/dev/null || return 1
    dir="$(dirname "${dir}")"
  done
}

grant_group_dir_execute() {
  local dir="$1"

  while [[ -n "${dir}" && "${dir}" != "/" ]]; do
    case "${dir}" in
      /etc|/home|/var|/usr|/opt|/srv)
        break
        ;;
    esac
    chgrp "${APP_GROUP}" "${dir}" 2>/dev/null || true
    chmod g+x "${dir}" 2>/dev/null || true
    dir="$(dirname "${dir}")"
  done
}

grant_user_file_read() {
  local path="$1"
  local resolved

  [[ -e "${path}" ]] || die "SSL path does not exist: ${path}"
  resolved="$(readlink -f "${path}")"
  [[ -f "${resolved}" ]] || die "SSL path is not a regular file after resolving symlinks: ${path}"

  if command_exists setfacl; then
    grant_user_dir_execute_acl "$(dirname "${resolved}")" || die "Failed to grant directory ACLs for ${resolved}"
    setfacl -m "u:${APP_USER}:r" "${resolved}" || die "Failed to grant read ACL for ${resolved}"
    if [[ "${resolved}" != "${path}" && -L "${path}" ]]; then
      grant_user_dir_execute_acl "$(dirname "${path}")" || die "Failed to grant directory ACLs for ${path}"
    fi
  else
    warn "setfacl not found; using group ownership/chmod fallback for ${resolved}."
    chgrp "${APP_GROUP}" "${resolved}"
    chmod g+r,o-rwx "${resolved}"
    grant_group_dir_execute "$(dirname "${resolved}")"
    if [[ "${resolved}" != "${path}" ]]; then
      grant_group_dir_execute "$(dirname "${path}")"
    fi
  fi

  run_as_app test -r "${path}" || die "${APP_USER} still cannot read ${path}"
}

ensure_onlinepath_access() {
  local path="$1"
  local dir

  [[ -n "${path}" ]] || return 0
  dir="$(dirname "${path}")"
  install -d -o "${APP_USER}" -g "${APP_GROUP}" "${dir}"
  if [[ -e "${path}" ]]; then
    chown "${APP_USER}:${APP_GROUP}" "${path}"
    chmod 664 "${path}"
  fi
  run_as_app test -w "${dir}" || die "${APP_USER} cannot write onlinepath directory: ${dir}"
}

verify_or_fix_ssl_permissions_from_file() {
  local sslconfig_path="${APP_DIR}/sslconfig.json"
  local cert_path
  local key_path
  local online_path
  local prefix

  [[ "${SSL_FIX_PERMISSIONS}" == "yes" ]] || return 0
  [[ -f "${sslconfig_path}" ]] || die "Cannot verify SSL permissions because sslconfig.json was not found."

  info "Verifying sslconfig.json paths and service-user permissions"
  prefix="$(node_prefix_for_app_shell)"
  cert_path="$(run_app_shell "${prefix}node -e \"const fs=require('fs'); const c=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (!c.certpath) process.exit(2); console.log(c.certpath);\" $(shell_quote "${sslconfig_path}")")" || die "sslconfig.json is missing certpath or is invalid JSON."
  key_path="$(run_app_shell "${prefix}node -e \"const fs=require('fs'); const c=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (!c.keypath) process.exit(2); console.log(c.keypath);\" $(shell_quote "${sslconfig_path}")")" || die "sslconfig.json is missing keypath or is invalid JSON."
  online_path="$(run_app_shell "${prefix}node -e \"const fs=require('fs'); const c=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (c.onlinepath) console.log(c.onlinepath);\" $(shell_quote "${sslconfig_path}")")" || die "sslconfig.json onlinepath could not be parsed."

  grant_user_file_read "${cert_path}"
  grant_user_file_read "${key_path}"
  ensure_onlinepath_access "${online_path}"
}

offer_existing_ssl_permission_check_after_checkout() {
  if [[ "${SSLCONFIG_MODE}" != "skip" ]]; then
    return 0
  fi
  if [[ "${SSL_FIX_PERMISSIONS}" == "yes" ]]; then
    return 0
  fi
  if [[ "${SSL_PERMISSION_PROMPTED}" == "yes" ]]; then
    return 0
  fi
  if [[ ! -f "${APP_DIR}/sslconfig.json" ]]; then
    return 0
  fi

  echo
  echo "Existing ${APP_DIR}/sslconfig.json found after checkout preparation."
  echo "The installer can leave the file unchanged while checking that ${APP_USER} can read its certificate and key paths."
  SSL_PERMISSION_PROMPTED="yes"
  if prompt_yes_no "Verify and fix SSL file permissions for existing sslconfig.json" "y"; then
    SSL_FIX_PERMISSIONS="yes"
  fi
}

purge_old_managed_backups() {
  local dir
  local days="${BACKUP_RETENTION_DAYS:-30}"
  [[ "${days}" =~ ^[0-9]+$ ]] || days=30
  for dir in "${APP_DIR}/backups/update" "${APP_DIR}/backups/pre-update" "${APP_DIR}/backups/periodic" "${APP_DIR}/backups/config"; do
    if [[ -d "${dir}" ]]; then
      find "${dir}" -mindepth 1 -mtime "+${days}" -exec rm -rf {} +
    fi
  done
}

node_prefix_for_app_shell() {
  printf 'export NVM_DIR=%q; . "$NVM_DIR/nvm.sh"; nvm use --silent %q; ' "${APP_HOME}/.nvm" "${NVM_VERSION}"
}

install_node_runtime() {
  install_nvm_and_node
}

install_npm_dependencies() {
  local prefix
  prefix="$(node_prefix_for_app_shell)"

  info "Installing production npm dependencies"
  run_app_shell "cd $(shell_quote "${APP_DIR}"); ${prefix}npm install --omit=dev --no-audit --no-fund"
}

write_environment_file() {
  local env_file="/etc/default/${SERVICE_NAME}"
  info "Writing ${env_file}"
  : > "${env_file}"
  chown "root:${APP_GROUP}" "${env_file}"
  chmod 640 "${env_file}"
  write_env_var "${env_file}" "APP_USER" "${APP_USER}"
  write_env_var "${env_file}" "APP_GROUP" "${APP_GROUP}"
  write_env_var "${env_file}" "APP_HOME" "${APP_HOME}"
  write_env_var "${env_file}" "APP_DIR" "${APP_DIR}"
  write_env_var "${env_file}" "REPO_URL" "${REPO_URL}"
  write_env_var "${env_file}" "REPO_BRANCH" "${REPO_BRANCH}"
  write_env_var "${env_file}" "EXISTING_CHECKOUT_ONLY" "${EXISTING_CHECKOUT_ONLY}"
  write_env_var "${env_file}" "EXISTING_NON_GIT_ACTION" "${EXISTING_NON_GIT_ACTION}"
  write_env_var "${env_file}" "SERVICE_NAME" "${SERVICE_NAME}"
  write_env_var "${env_file}" "LAUNCH_COMMAND" "${LAUNCH_COMMAND}"
  write_env_var "${env_file}" "WORLD_SLOT" "${WORLD_SLOT}"
  write_env_var "${env_file}" "FILE_SUFFIX" "${FILE_SUFFIX}"
  write_env_var "${env_file}" "NODE_ENV" "${NODE_ENV_VALUE}"
  write_env_var "${env_file}" "INSTALL_NODE_MODE" "${INSTALL_NODE_MODE}"
  write_env_var "${env_file}" "NVM_VERSION" "${NVM_VERSION}"
  write_env_var "${env_file}" "UPDATE_ENABLED" "${UPDATE_ENABLED}"
  write_env_var "${env_file}" "UPDATE_INTERVAL" "${UPDATE_INTERVAL}"
  write_env_var "${env_file}" "CONFIG_WATCH_ENABLED" "${CONFIG_WATCH_ENABLED}"
  write_env_var "${env_file}" "WATCH_SERVER_CONFIG" "${WATCH_SERVER_CONFIG}"
  write_env_var "${env_file}" "WATCH_SSLCONFIG" "${WATCH_SSLCONFIG}"
  write_env_var "${env_file}" "EXPECTED_PORT" "${EXPECTED_PORT}"
  write_env_var "${env_file}" "BACKUP_INTERVAL" "${BACKUP_INTERVAL}"
  write_env_var "${env_file}" "BACKUP_RETENTION_DAYS" "${BACKUP_RETENTION_DAYS}"
  write_env_var "${env_file}" "OPEN_FIREWALL" "${OPEN_FIREWALL}"
  write_env_var "${env_file}" "SSLCONFIG_MODE" "${SSLCONFIG_MODE}"
  write_env_var "${env_file}" "SSL_CERT_PATH" "${SSL_CERT_PATH}"
  write_env_var "${env_file}" "SSL_KEY_PATH" "${SSL_KEY_PATH}"
  write_env_var "${env_file}" "SSL_ONLINE_PATH" "${SSL_ONLINE_PATH}"
  write_env_var "${env_file}" "SSL_CLOUDFLARE" "${SSL_CLOUDFLARE}"
  write_env_var "${env_file}" "SSL_FIX_PERMISSIONS" "${SSL_FIX_PERMISSIONS}"
  write_env_var "${env_file}" "LETSENCRYPT_DOMAIN" "${LETSENCRYPT_DOMAIN}"
  write_env_var "${env_file}" "LETSENCRYPT_EMAIL" "${LETSENCRYPT_EMAIL}"
  write_env_var "${env_file}" "LETSENCRYPT_STAGING" "${LETSENCRYPT_STAGING}"
  write_env_var "${env_file}" "LETSENCRYPT_OPEN_HTTP" "${LETSENCRYPT_OPEN_HTTP}"
  write_env_var "${env_file}" "INSTALL_CERT_RENEWAL_HOOK" "${INSTALL_CERT_RENEWAL_HOOK}"
  write_env_var "${env_file}" "WRITE_UNINSTALL_HELPER" "${WRITE_UNINSTALL_HELPER}"
  write_env_var "${env_file}" "RUN_INITIAL_UPDATE" "${RUN_INITIAL_UPDATE}"
}

write_run_script() {
  local path="/usr/local/bin/${SERVICE_NAME}-run.sh"
  info "Writing ${path}"
  cat > "${path}" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail

source "__ENV_FILE__"
cd "${APP_DIR}"
export NODE_ENV

export NVM_DIR="${APP_HOME}/.nvm"
if [[ ! -s "${NVM_DIR}/nvm.sh" ]]; then
  echo "nvm.sh not found at ${NVM_DIR}/nvm.sh" >&2
  exit 1
fi
. "${NVM_DIR}/nvm.sh"
nvm use --silent "${NVM_VERSION}"

exec bash -c "exec ${LAUNCH_COMMAND}"
EOF
  sed -i "s#__ENV_FILE__#/etc/default/${SERVICE_NAME}#g" "${path}"
  chmod 755 "${path}"
}

write_deploy_script() {
  local path="/usr/local/bin/${SERVICE_NAME}-deploy.sh"
  info "Writing ${path}"
  cat > "${path}" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail

source "__ENV_FILE__"
LOCK_FILE="/run/lock/${SERVICE_NAME}-deploy.lock"
SUPPRESS_FILE="/run/${SERVICE_NAME}-config-restart.suppress_until"

log() {
  printf '[%s] %s\n' "$(date -Is)" "$*"
}

run_as_app() {
  runuser -u "${APP_USER}" -- "$@"
}

run_app_shell() {
  runuser -u "${APP_USER}" -- bash -lc "$1"
}

node_prefix() {
  printf 'export NVM_DIR=%q; . "$NVM_DIR/nvm.sh"; nvm use --silent %q; ' "${APP_HOME}/.nvm" "${NVM_VERSION}"
}

purge_old_backups() {
  local dir
  local days="${BACKUP_RETENTION_DAYS:-30}"
  [[ "${days}" =~ ^[0-9]+$ ]] || days=30
  for dir in "${APP_DIR}/backups/update" "${APP_DIR}/backups/pre-update" "${APP_DIR}/backups/periodic" "${APP_DIR}/backups/config"; do
    if [[ -d "${dir}" ]]; then
      find "${dir}" -mindepth 1 -mtime "+${days}" -exec rm -rf {} +
    fi
  done
}

exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  log "Another deploy/config restart is already running; exiting."
  exit 0
fi

cd "${APP_DIR}"

if [[ "${EXISTING_NON_GIT_ACTION:-}" == "plain" || ! -d "${APP_DIR}/.git" ]]; then
  log "${APP_DIR} is not configured as a Git checkout; GitHub auto-update is unavailable for this installation."
  exit 0
fi

log "Fetching ${REPO_URL} ${REPO_BRANCH}..."
run_as_app git fetch --prune origin

current_rev="$(run_as_app git rev-parse HEAD)"
target_rev="$(run_as_app git rev-parse "origin/${REPO_BRANCH}")"

if [[ "${current_rev}" == "${target_rev}" ]]; then
  if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
    log "Already up to date at ${current_rev}; no restart needed."
  else
    log "Already up to date at ${current_rev}; starting inactive service."
    systemctl start "${SERVICE_NAME}.service"
  fi
  exit 0
fi

log "Update available: ${current_rev} -> ${target_rev}"
log "Stopping ${SERVICE_NAME}.service gracefully..."
systemctl stop "${SERVICE_NAME}.service"

log "Backing up world snapshot/chunks before update..."
"/usr/local/bin/${SERVICE_NAME}-backup.sh" update --service-already-stopped
purge_old_backups

log "Resetting checkout to origin/${REPO_BRANCH}..."
run_as_app git reset --hard "origin/${REPO_BRANCH}"

prefix="$(node_prefix)"
run_app_shell "cd $(printf '%q' "${APP_DIR}"); ${prefix}npm install --omit=dev --no-audit --no-fund"

log "Starting ${SERVICE_NAME}.service..."
systemctl start "${SERVICE_NAME}.service"
log "Deploy complete at $(run_as_app git rev-parse --short HEAD)."
EOF
  sed -i "s#__ENV_FILE__#/etc/default/${SERVICE_NAME}#g" "${path}"
  chmod 755 "${path}"
}

write_backup_script() {
  local path="/usr/local/bin/${SERVICE_NAME}-backup.sh"
  info "Writing ${path}"
  cat > "${path}" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail

source "__ENV_FILE__"

MODE="${1:-periodic}"
SERVICE_ALREADY_STOPPED="no"
if [[ "${2:-}" == "--service-already-stopped" ]]; then
  SERVICE_ALREADY_STOPPED="yes"
fi

case "${MODE}" in
  update|periodic) ;;
  *) echo "Usage: $0 [update|periodic] [--service-already-stopped]" >&2; exit 2 ;;
esac

LOCK_FILE="/run/lock/${SERVICE_NAME}-deploy.lock"
BACKUP_ROOT="${APP_DIR}/backups/${MODE}"

log() {
  printf '[%s] %s\n' "$(date -Is)" "$*"
}

run_as_app() {
  runuser -u "${APP_USER}" -- "$@"
}

purge_old_backups() {
  local dir
  local days="${BACKUP_RETENTION_DAYS:-30}"
  [[ "${days}" =~ ^[0-9]+$ ]] || days=30
  for dir in "${APP_DIR}/backups/update" "${APP_DIR}/backups/pre-update" "${APP_DIR}/backups/periodic" "${APP_DIR}/backups/config"; do
    if [[ -d "${dir}" ]]; then
      find "${dir}" -mindepth 1 -mtime "+${days}" -exec rm -rf {} +
    fi
  done
}

copy_file() {
  local source="$1"
  local target="$2"
  cp -a --reflink=auto "${source}" "${target}" 2>/dev/null || cp -a "${source}" "${target}"
}

make_backup() {
  local timestamp
  local backup_dir
  local copied="no"
  local snapshot
  local chunks_dir

  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  backup_dir="${BACKUP_ROOT}/${timestamp}"
  install -d -o "${APP_USER}" -g "${APP_GROUP}" "${backup_dir}"

  shopt -s nullglob
  for snapshot in \
    "${APP_DIR}"/star_defenders_snapshot"${FILE_SUFFIX}".v \
    "${APP_DIR}"/star_defenders_snapshot"${FILE_SUFFIX}".raw.v
  do
    if [[ -f "${snapshot}" ]]; then
      log "Backing up $(basename "${snapshot}")"
      copy_file "${snapshot}" "${backup_dir}/$(basename "${snapshot}")"
      copied="yes"
    fi
  done

  chunks_dir="${APP_DIR}/chunks${FILE_SUFFIX}"
  if [[ -d "${chunks_dir}" ]]; then
    log "Backing up $(basename "${chunks_dir}")/"
    cp -a "${chunks_dir}" "${backup_dir}/$(basename "${chunks_dir}")"
    copied="yes"
  fi

  if [[ "${copied}" != "yes" ]]; then
    rmdir "${backup_dir}" 2>/dev/null || true
    log "No snapshot or chunks folder found for world slot ${WORLD_SLOT}; no backup was created."
    return 0
  fi

  chown -R "${APP_USER}:${APP_GROUP}" "${backup_dir}"
  if [[ "${MODE}" == "periodic" ]]; then
    find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d ! -name "${timestamp}" -exec rm -rf {} +
  fi
  purge_old_backups
  log "Backup complete: ${backup_dir}"
}

if [[ "${SERVICE_ALREADY_STOPPED}" == "yes" ]]; then
  make_backup
  exit 0
fi

exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  log "Deploy/update lock is busy; skipping backup."
  exit 0
fi

was_active="no"
if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
  was_active="yes"
  log "Stopping ${SERVICE_NAME}.service for consistent backup..."
  systemctl stop "${SERVICE_NAME}.service"
fi

restart_if_needed() {
  if [[ "${was_active}" == "yes" ]]; then
    log "Starting ${SERVICE_NAME}.service after backup..."
    systemctl start "${SERVICE_NAME}.service"
  fi
}
trap restart_if_needed EXIT

make_backup
EOF
  sed -i "s#__ENV_FILE__#/etc/default/${SERVICE_NAME}#g" "${path}"
  chmod 755 "${path}"
}

write_config_restart_script() {
  local path="/usr/local/bin/${SERVICE_NAME}-config-restart.sh"
  info "Writing ${path}"
  cat > "${path}" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail

source "__ENV_FILE__"
LOCK_FILE="/run/lock/${SERVICE_NAME}-deploy.lock"
SUPPRESS_FILE="/run/${SERVICE_NAME}-config-restart.suppress_until"

log() {
  printf '[%s] %s\n' "$(date -Is)" "$*"
}

exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  log "Deploy/update lock is busy; skipping config-triggered restart."
  exit 0
fi

now="$(date +%s)"
if [[ -f "${SUPPRESS_FILE}" ]]; then
  suppress_until="$(cat "${SUPPRESS_FILE}" 2>/dev/null || echo 0)"
  if [[ "${suppress_until}" =~ ^[0-9]+$ && "${now}" -lt "${suppress_until}" ]]; then
    log "Recent self-triggered restart is still settling; skipping duplicate file-watch event."
    exit 0
  fi
fi

echo "$(( now + 45 ))" > "${SUPPRESS_FILE}"
log "Watched slot file changed; gracefully restarting ${SERVICE_NAME}.service..."
systemctl restart "${SERVICE_NAME}.service"
log "Config-triggered restart complete."
EOF
  sed -i "s#__ENV_FILE__#/etc/default/${SERVICE_NAME}#g" "${path}"
  chmod 755 "${path}"
}

write_systemd_units() {
  info "Writing systemd units"

  cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=StarDefenders2D (${SERVICE_NAME})
After=network.target
ConditionPathIsDirectory=${APP_DIR}

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}
WorkingDirectory=${APP_DIR}
EnvironmentFile=/etc/default/${SERVICE_NAME}
ExecStart=/usr/local/bin/${SERVICE_NAME}-run.sh
KillSignal=SIGTERM
TimeoutStopSec=300
Restart=always
RestartPreventExitStatus=200
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

  cat > "/etc/systemd/system/${SERVICE_NAME}-update.service" <<EOF
[Unit]
Description=Update StarDefenders2D (${SERVICE_NAME}) from GitHub
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
TimeoutStartSec=900
ExecStart=/usr/local/bin/${SERVICE_NAME}-deploy.sh
EOF

  cat > "/etc/systemd/system/${SERVICE_NAME}-update.timer" <<EOF
[Unit]
Description=Run StarDefenders2D (${SERVICE_NAME}) update timer

[Timer]
OnBootSec=2min
OnUnitActiveSec=${UPDATE_INTERVAL}
Persistent=true

[Install]
WantedBy=timers.target
EOF

  cat > "/etc/systemd/system/${SERVICE_NAME}-backup.service" <<EOF
[Unit]
Description=Back up StarDefenders2D (${SERVICE_NAME}) world snapshot and chunks
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
TimeoutStartSec=900
ExecStart=/usr/local/bin/${SERVICE_NAME}-backup.sh periodic
EOF

  cat > "/etc/systemd/system/${SERVICE_NAME}-backup.timer" <<EOF
[Unit]
Description=Run StarDefenders2D (${SERVICE_NAME}) periodic world backup timer

[Timer]
OnBootSec=10min
OnUnitActiveSec=${BACKUP_INTERVAL}
Persistent=true

[Install]
WantedBy=timers.target
EOF

  cat > "/etc/systemd/system/${SERVICE_NAME}-config-restart.service" <<EOF
[Unit]
Description=Gracefully restart StarDefenders2D (${SERVICE_NAME}) after config changes
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
TimeoutStartSec=360
ExecStart=/usr/local/bin/${SERVICE_NAME}-config-restart.sh
EOF

  cat > "/etc/systemd/system/${SERVICE_NAME}-config-watch.path" <<EOF
[Unit]
Description=Watch StarDefenders2D (${SERVICE_NAME}) config files

[Path]
EOF
  if [[ "${WATCH_SERVER_CONFIG}" == "yes" ]]; then
    printf 'PathChanged=%s/server_config%s.js\n' "${APP_DIR}" "${FILE_SUFFIX}" >> "/etc/systemd/system/${SERVICE_NAME}-config-watch.path"
  fi
  if [[ "${WATCH_SSLCONFIG}" == "yes" ]]; then
    printf 'PathChanged=%s/sslconfig.json\n' "${APP_DIR}" >> "/etc/systemd/system/${SERVICE_NAME}-config-watch.path"
  fi
  cat >> "/etc/systemd/system/${SERVICE_NAME}-config-watch.path" <<EOF
Unit=${SERVICE_NAME}-config-restart.service

[Install]
WantedBy=multi-user.target
EOF
}

enable_units() {
  info "Reloading systemd"
  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}.service"
  systemctl enable --now "${SERVICE_NAME}-backup.timer"

  if [[ "${UPDATE_ENABLED}" == "yes" ]]; then
    systemctl enable --now "${SERVICE_NAME}-update.timer"
  else
    systemctl disable --now "${SERVICE_NAME}-update.timer" 2>/dev/null || true
  fi

  systemctl disable --now "${SERVICE_NAME}-config-watch.path" 2>/dev/null || true
}

enable_config_watch_unit() {
  if [[ "${CONFIG_WATCH_ENABLED}" != "yes" ]]; then
    systemctl disable --now "${SERVICE_NAME}-config-watch.path" 2>/dev/null || true
    return 0
  fi

  info "Enabling ${SERVICE_NAME}-config-watch.path"
  systemctl enable --now "${SERVICE_NAME}-config-watch.path"
}

configure_firewall() {
  if [[ "${OPEN_FIREWALL}" != "yes" ]]; then
    return 0
  fi
  if ! command_exists ufw; then
    warn "ufw is not installed; skipping firewall rule for ${EXPECTED_PORT}/tcp."
    return 0
  fi
  info "Allowing ${EXPECTED_PORT}/tcp through ufw"
  ufw allow "${EXPECTED_PORT}/tcp"
}

write_cert_renewal_hook() {
  local hook_dir="/etc/letsencrypt/renewal-hooks/deploy"
  local hook_path="${hook_dir}/${SERVICE_NAME}-restart.sh"

  [[ "${INSTALL_CERT_RENEWAL_HOOK}" == "yes" ]] || return 0
  install -d "${hook_dir}"
  cat > "${hook_path}" <<EOF
#!/usr/bin/env bash
set -Eeuo pipefail
systemctl restart ${SERVICE_NAME}.service
EOF
  chmod 755 "${hook_path}"
}

write_uninstall_helper() {
  local path="${APP_DIR}/${SERVICE_NAME}-uninstall.sh"
  [[ "${WRITE_UNINSTALL_HELPER}" == "yes" ]] || return 0
  install -d -o "${APP_USER}" -g "${APP_GROUP}" "${APP_DIR}"
  info "Writing ${path}"
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
rm -f \
  "/etc/systemd/system/${SERVICE_NAME}.service" \
  "/etc/systemd/system/${SERVICE_NAME}-update.service" \
  "/etc/systemd/system/${SERVICE_NAME}-update.timer" \
  "/etc/systemd/system/${SERVICE_NAME}-backup.service" \
  "/etc/systemd/system/${SERVICE_NAME}-backup.timer" \
  "/etc/systemd/system/${SERVICE_NAME}-config-restart.service" \
  "/etc/systemd/system/${SERVICE_NAME}-config-watch.path" \
  "/usr/local/bin/${SERVICE_NAME}-run.sh" \
  "/usr/local/bin/${SERVICE_NAME}-deploy.sh" \
  "/usr/local/bin/${SERVICE_NAME}-backup.sh" \
  "/usr/local/bin/${SERVICE_NAME}-config-restart.sh" \
  "/etc/default/${SERVICE_NAME}" \
  "/usr/local/bin/${SERVICE_NAME}-uninstall.sh" \
  "${APP_DIR}/${SERVICE_NAME}-admin-commands.txt" \
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
  chown "${APP_USER}:${APP_GROUP}" "${path}"
  chmod 755 "${path}"
}

write_admin_commands_file() {
  local path="${APP_DIR}/${SERVICE_NAME}-admin-commands.txt"
  info "Writing ${path}"
  install -d -o "${APP_USER}" -g "${APP_GROUP}" "${APP_DIR}"
  cat > "${path}" <<EOF
StarDefenders2D admin commands for ${SERVICE_NAME}
Generated by install-linux.sh ${SCRIPT_VERSION}

Service identity
  Service: ${SERVICE_NAME}.service
  Repo: ${APP_DIR}
  User: ${APP_USER}
  World slot: ${WORLD_SLOT}
  Expected port: ${EXPECTED_PORT}

Status and logs
  systemctl status ${SERVICE_NAME}.service
  journalctl -u ${SERVICE_NAME}.service -f
  systemctl status ${SERVICE_NAME}-update.timer
  systemctl status ${SERVICE_NAME}-backup.timer
  systemctl status ${SERVICE_NAME}-config-watch.path

Start, stop, restart
  systemctl start ${SERVICE_NAME}.service
  systemctl stop ${SERVICE_NAME}.service
  systemctl restart ${SERVICE_NAME}.service

Auto-update
  Disable: systemctl disable --now ${SERVICE_NAME}-update.timer
  Re-enable: systemctl enable --now ${SERVICE_NAME}-update.timer
  Run once now: systemctl start ${SERVICE_NAME}-update.service
  Approved during install: ${UPDATE_ENABLED}

Periodic world backups
  Disable: systemctl disable --now ${SERVICE_NAME}-backup.timer
  Re-enable: systemctl enable --now ${SERVICE_NAME}-backup.timer
  Run once now: systemctl start ${SERVICE_NAME}-backup.service
  Interval: ${BACKUP_INTERVAL}
  Backup folders:
    ${APP_DIR}/backups/update
    ${APP_DIR}/backups/periodic
    ${APP_DIR}/installerbackup (created before git/plain in-place setup)
  Retention: older than ${BACKUP_RETENTION_DAYS} day(s) are purged.
  Periodic backups keep only the newest periodic copy by default.

Config file watcher
  Disable: systemctl disable --now ${SERVICE_NAME}-config-watch.path
  Re-enable: systemctl enable --now ${SERVICE_NAME}-config-watch.path
  Trigger restart once: systemctl start ${SERVICE_NAME}-config-restart.service
  Approved during install: ${CONFIG_WATCH_ENABLED}
  Watched server_config${FILE_SUFFIX}.js: ${WATCH_SERVER_CONFIG}
  Watched sslconfig.json: ${WATCH_SSLCONFIG}

Firewall rule opened by installer
  Approved during install: ${OPEN_FIREWALL}
  If ufw is used, disable manually only if this port is no longer needed:
    ufw delete allow ${EXPECTED_PORT}/tcp
  Re-enable:
    ufw allow ${EXPECTED_PORT}/tcp

Let's Encrypt renewal hook
  Approved during install: ${INSTALL_CERT_RENEWAL_HOOK}
  Disable:
    rm -f /etc/letsencrypt/renewal-hooks/deploy/${SERVICE_NAME}-restart.sh
  Re-enable:
    rerun install-linux.sh for this service and approve the renewal hook.

Generated uninstall helper
  ${APP_DIR}/${SERVICE_NAME}-uninstall.sh

Full uninstall for this service only
  sudo ${APP_DIR}/${SERVICE_NAME}-uninstall.sh
EOF
  chown "${APP_USER}:${APP_GROUP}" "${path}"
  chmod 640 "${path}"
}

verify_service_health() {
  local i
  local listen_output
  local journal_output
  [[ "${RUN_INITIAL_UPDATE}" == "yes" ]] || return 0

  info "Verifying ${SERVICE_NAME}.service health"
  for i in $(seq 1 30); do
    if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
      break
    fi
    sleep 1
  done
  systemctl is-active --quiet "${SERVICE_NAME}.service" || die "${SERVICE_NAME}.service did not become active."

  if command_exists ss; then
    for i in $(seq 1 30); do
      if ss -ltn "sport = :${EXPECTED_PORT}" 2>/dev/null | grep -q LISTEN; then
        info "Port ${EXPECTED_PORT} is listening."
        return 0
      fi
      sleep 1
    done
    warn "${SERVICE_NAME}.service is active, but port ${EXPECTED_PORT} was not observed listening."
    warn "If server_config${FILE_SUFFIX}.js overrides static port, rerun with the correct expected port."
    listen_output="$(ss -ltnp 2>/dev/null || true)"
    if [[ -n "${listen_output}" ]]; then
      echo "Listening TCP sockets:"
      echo "${listen_output}"
    fi
    journal_output="$(journalctl -u "${SERVICE_NAME}.service" -n 80 --no-pager 2>/dev/null || true)"
    if [[ -n "${journal_output}" ]]; then
      echo "Recent ${SERVICE_NAME}.service logs:"
      echo "${journal_output}"
    fi
    warn "Also check provider-level firewall/security-group rules. ufw only controls the server OS firewall."
  fi
}

start_or_update_service() {
  if [[ "${RUN_INITIAL_UPDATE}" == "yes" ]]; then
    info "Starting/restarting ${SERVICE_NAME}.service to apply this installation"
    systemctl restart "${SERVICE_NAME}.service"
  else
    info "Initial service start skipped by request."
    info "Start it later with: systemctl start ${SERVICE_NAME}.service"
  fi
}

print_summary() {
  cat <<EOF

Installation complete.

Useful commands:
  systemctl status ${SERVICE_NAME}.service
  journalctl -u ${SERVICE_NAME}.service -f
  systemctl status ${SERVICE_NAME}-update.timer
  systemctl status ${SERVICE_NAME}-backup.timer
  systemctl start ${SERVICE_NAME}-update.service
  systemctl start ${SERVICE_NAME}-backup.service
  systemctl status ${SERVICE_NAME}-config-watch.path

Generated files:
  /etc/default/${SERVICE_NAME}
  /usr/local/bin/${SERVICE_NAME}-run.sh
  /usr/local/bin/${SERVICE_NAME}-deploy.sh
  /usr/local/bin/${SERVICE_NAME}-backup.sh
  /usr/local/bin/${SERVICE_NAME}-config-restart.sh
  /etc/systemd/system/${SERVICE_NAME}.service
  /etc/systemd/system/${SERVICE_NAME}-update.service
  /etc/systemd/system/${SERVICE_NAME}-update.timer
  /etc/systemd/system/${SERVICE_NAME}-backup.service
  /etc/systemd/system/${SERVICE_NAME}-backup.timer
  /etc/systemd/system/${SERVICE_NAME}-config-restart.service
  /etc/systemd/system/${SERVICE_NAME}-config-watch.path
  ${APP_DIR}/${SERVICE_NAME}-admin-commands.txt
  ${APP_DIR}/${SERVICE_NAME}-uninstall.sh (if enabled)
  /etc/letsencrypt/renewal-hooks/deploy/${SERVICE_NAME}-restart.sh (if enabled)

EOF
}

main() {
  parse_args "$@"
  if [[ "${DRY_RUN}" != "yes" ]]; then
    require_root
  fi
  require_systemd
  prompt_configuration
  if [[ "${DRY_RUN}" == "yes" ]]; then
    info "Dry run complete. No system changes were made."
    exit 0
  fi
  ensure_base_packages
  prepare_checkout
  install_node_runtime
  offer_existing_ssl_permission_check_after_checkout
  install_optional_config_file "${SERVER_CONFIG_SOURCE}" "server_config${FILE_SUFFIX}.js"
  if [[ "${SSLCONFIG_MODE}" == "copy" ]]; then
    install_optional_config_file "${SSLCONFIG_SOURCE}" "sslconfig.json"
  elif [[ "${SSLCONFIG_MODE}" == "create" ]]; then
    write_generated_sslconfig
  elif [[ "${SSLCONFIG_MODE}" == "letsencrypt" ]]; then
    install_letsencrypt_certificate
  fi
  verify_or_fix_ssl_permissions_from_file
  chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"
  install_npm_dependencies
  purge_old_managed_backups
  write_environment_file
  write_run_script
  write_backup_script
  write_deploy_script
  write_config_restart_script
  write_systemd_units
  write_cert_renewal_hook
  write_uninstall_helper
  write_admin_commands_file
  enable_units
  configure_firewall
  start_or_update_service
  verify_service_health
  enable_config_watch_unit
  print_summary
}

main "$@"
