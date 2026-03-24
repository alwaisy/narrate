#!/bin/bash

source "$(dirname "$0")/../config.sh"

# Dynamically count the number of subreddits in the array
SUB_COUNT=${#SUBREDDITS[@]}

log_step "Step 1: Discovering LATEST threads across all $SUB_COUNT subreddits..."

# Get current timestamp for date filtering (Brain will use this)
CURRENT_TS=$(date +%s)
log_step "Current System Time: $(date)"

for subreddit in "${SUBREDDITS[@]}"; do
    log_step "Fetching r/$subreddit..."
    
    # Fetching only the newest single thread (Absolute Lean Mode)
    RESPONSE=$(curl -s -L -A "LinkedInPostGenerator/1.0" "https://www.reddit.com/r/$subreddit/new.json?limit=1")
    
    if [[ -z "$RESPONSE" ]]; then
        log_step "Error: No data from r/$subreddit."
    else
        echo "$RESPONSE" > "$TEMP_DATA_DIR/${subreddit}_new.json"
    fi
    sleep 2
done

log_step "Discovery Phase Complete. $SUB_COUNT threads total in $TEMP_DATA_DIR."
