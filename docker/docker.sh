#!/usr/bin/env bash

set -e

if (( $# < 1 )); then
    exit 0
fi

# Pre-pre-flight? 🤷
if [[ -n "$MSYSTEM" ]]; then
    echo "Seems like you are using an MSYS2-based system (such as Git Bash) which is not supported. Please use WSL instead.";
    exit 1
fi

script_file="docker/docker.sh"
if ! test -f "$script_file"; then
    echo "Please execute this script from the parent of the docker directory"
    echo "The command should be ./docker/docker.sh"
    exit 1
fi

env_file="docker/.env"
if ! test -f "$env_file"; then
    echo "$env_file file doesn't not exists. Create it from docker/.env.example. (customize if necessary)"
    exit 1
fi

# Load environment variables from .env
set -a
source docker/.env
set +a

launch_compose="docker compose"
if ! command -v ${launch_compose} &> /dev/null; then
    launch_compose="docker compose"
    if ! docker compose version &> /dev/null; then
        echo "The 'docker compose' command is not available. Please install or update Docker."
        exit 1
    fi
fi

# Ensure PROJECT variable is set
if [[ -z "${PROJECT}" ]]; then
    echo "The PROJECT environment variable is not set. Please set it before running the script."
    exit 1
fi

${launch_compose} --project-name="${PROJECT}" --project-directory=./docker "$@"