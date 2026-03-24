#!/bin/bash

source "$(dirname "$0")/../config.sh"

log_step "Step 1: Discovering the LATEST SINGLE thread across ${#SUBREDDITS[@]} subreddits..."

for subreddit in "${SUBREDDITS[@]}"; do
    log_step "Fetching 1 from r/$subreddit..."
    # Absolute Lean: limit=1
    RESPONSE=$(curl -s -L -A "LinkedInPostGenerator/1.0" "https://www.reddit.com/r/$subreddit/new.json?limit=1")
    
    if [[ -z "$RESPONSE" ]]; then
        log_step "Error: No data from r/$subreddit."
    else
        COUNT=$(echo "$RESPONSE" | jq '.data.children | length')
        log_step "Success: Fetched the newest thread in r/$subreddit."
        echo "$RESPONSE" > "$TEMP_DATA_DIR/${subreddit}_new.json"
    fi
    sleep 2
done

log_step "Discovery Phase Complete. 11 threads total in $TEMP_DATA_DIR."
