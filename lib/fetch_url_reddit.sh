#!/bin/bash

# lib/fetch_url_reddit.sh
# Fetches a single Reddit thread by its full URL and saves it for Brain analysis.

source "$(dirname "$0")/../config.sh"

URL=$1

if [ -z "$URL" ]; then
    log_step "Error: No Reddit URL provided."
    echo "Usage: bash lib/fetch_url_reddit.sh <reddit_url>"
    exit 1
fi

# 1. Clean the URL: Remove query parameters and trailing slashes
CLEAN_URL=$(echo "$URL" | sed 's/\?.*//' | sed 's/\/$//')

# 2. Extract a slug for the filename (e.g., from .../comments/id/slug/)
SLUG=$(echo "$CLEAN_URL" | awk -F'/' '{print $NF}')
if [ -z "$SLUG" ]; then SLUG="manual_thread_$(date +%s)"; fi
FILENAME="surgical_${SLUG}.json"

# 3. Append .json for the Reddit API endpoint
JSON_URL="${CLEAN_URL}.json"

log_step "Surgical Fetch: Downloading thread context from $JSON_URL..."

# 4. Fetch the data
RAW_DATA=$(curl -s -L -A "LinkedInPostGenerator/1.0" "$JSON_URL")

# Check if we got valid JSON (looking for the kind of array Reddit returns)
IS_VALID=$(echo "$RAW_DATA" | jq -e '.[0].kind == "Listing"' 2>/dev/null)

if [ "$?" -ne 0 ]; then
    log_step "Error: Failed to fetch valid Reddit data. Check the URL or your connection."
    exit 1
fi

# 5. Extract metrics for the log
TITLE=$(echo "$RAW_DATA" | jq -r '.[0].data.children[0].data.title')
COMMENT_COUNT=$(echo "$RAW_DATA" | jq '.[1].data.children | length')

log_step "SUCCESS: Thread title: '$TITLE' | Comments: $COMMENT_COUNT"
log_step "Saving to $TEMP_DATA_DIR/$FILENAME"

echo "$RAW_DATA" > "$TEMP_DATA_DIR/$FILENAME"

# Output the filename for the next step in the pipeline
echo "$FILENAME"
