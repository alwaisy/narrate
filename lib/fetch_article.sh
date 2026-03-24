#!/bin/bash

# Article Scalpel: 3-Layer 100% Success Scraper
# Escalation: Clean -> Raw Spoof -> Jina Scalpel

source "$(dirname "$0")/../config.sh"

# Ensure template index is fresh
bash "$(dirname "$0")/build_index.sh"

URL=$1
SLUG=$(echo "$URL" | sed -E 's/https?:\/\/(www\.)?//; s/[^a-zA-Z0-9]/-/g' | cut -c1-50)
OUTPUT_FILE="$TEMP_DATA_DIR/article_${SLUG}.json"

log_step "Scalpel: Initiating 3-Layer Scraping for $URL..."

# --- Layer 1: Clean Attempt (Basic Curl) ---
log_step "Layer 1: Attempting Clean Fetch..."
CONTENT=$(curl -s -L "$URL")
WORD_COUNT=$(echo "$CONTENT" | sed -e 's/<[^>]*>//g' | wc -w)

# --- Layer 2: Raw Attempt (User-Agent Spoofing) ---
if [[ $WORD_COUNT -lt 200 ]] || [[ "$CONTENT" == *"Forbidden"* ]] || [[ "$CONTENT" == *"Cloudflare"* ]]; then
    log_step "Layer 1 Failed (Words: $WORD_COUNT). Escalating to Layer 2 (Raw Spoof)..."
    CONTENT=$(curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "$URL")
    # Clean HTML tags for word count check
    STRIPPED=$(echo "$CONTENT" | sed -e 's/<[^>]*>//g')
    WORD_COUNT=$(echo "$STRIPPED" | wc -w)
fi

# --- Layer 3: The Scalpel (Jina.ai Markdown Reader) ---
if [[ $WORD_COUNT -lt 200 ]] || [[ "$CONTENT" == *"Forbidden"* ]] || [[ "$CONTENT" == *"Cloudflare"* ]]; then
    log_step "Layer 2 Failed (Words: $WORD_COUNT). Escalating to Layer 3 (Jina Scalpel)..."
    CONTENT=$(curl -s -L "https://r.jina.ai/$URL")
    WORD_COUNT=$(echo "$CONTENT" | wc -w)
fi

# --- Final Integrity Check & Cleaning ---
if [[ $WORD_COUNT -lt 150 ]]; then
    log_step "CRITICAL ERROR: All 3 Layers failed to extract content from $URL."
    exit 1
fi

# Clean Markdown artifacts (citations, image links, etc.)
CLEAN_CONTENT=$(echo "$CONTENT" | sed -E 's/\[[0-9]+\]//g; s/!\[[^]]*\]\([^)]*\)//g; s/\[([^]]*)\]\([^)]*\)/\1/g')
WORD_COUNT=$(echo "$CLEAN_CONTENT" | wc -w)

# Save as Structured JSON for the Brain
jq -n \
    --arg title "$SLUG" \
    --arg url "$URL" \
    --arg content "$CLEAN_CONTENT" \
    --arg count "$WORD_COUNT" \
    '{title: $title, url: $url, word_count: $count, body: $content}' > "$OUTPUT_FILE"

log_step "SUCCESS: Article captured via 3-Layer Stack ($WORD_COUNT words) -> $OUTPUT_FILE"
echo "$OUTPUT_FILE"
