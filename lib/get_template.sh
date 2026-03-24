#!/bin/bash

# lib/get_template.sh
# Fetches the full structure of a single template by ID.

source "$(dirname "$0")/../config.sh"

ID="$1"

if [ -z "$ID" ]; then
    echo "Error: No Template ID provided."
    exit 1
fi

# Use jq to select the specific template object
jq --arg id "$ID" '.[] | select(.id == $id)' "$TEMPLATES_FILE"
