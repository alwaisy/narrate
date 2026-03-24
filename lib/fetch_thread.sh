#!/bin/bash

source "$(dirname "$0")/../config.sh"

PERMALINK=$1
FILENAME=$2

if [ -z "$PERMALINK" ] || [ -z "$FILENAME" ]; then
    log_step "Error: Missing arguments for fetch_thread."
    exit 1
fi

log_step "Deep Dive: Fetching full thread context from $PERMALINK..."

URL="https://www.reddit.com${PERMALINK}.json"
RAW_DATA=$(curl -s -L -A "LinkedInPostGenerator/1.0" "$URL")

# Calculate metrics for the report
TITLE=$(echo "$RAW_DATA" | jq -r '.[0].data.children[0].data.title')
COMMENT_COUNT=$(echo "$RAW_DATA" | jq '.[1].data.children | length')

log_step "SUCCESS: Thread title: '$TITLE' | Comments read: $COMMENT_COUNT"

echo "$RAW_DATA" > "$TEMP_DATA_DIR/$FILENAME"
