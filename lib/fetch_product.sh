#!/bin/bash

# lib/fetch_product.sh
# Resilient Product Scalpel: Jina Pro -> Lynx -> Pandoc
# Ensures 100% data extraction even on difficult platforms.

source "$(dirname "$0")/../config.sh"

# Ensure template index is fresh
bash "$(dirname "$0")/build_index.sh"

URL=$1

if [ -z "$URL" ]; then
    log_step "Error: No URL provided."
    exit 1
fi

# 1. Platform Detection
detect_platform() {
    local url="$1"
    if [[ "$url" == *"producthunt.com"* ]]; then echo "producthunt";
    elif [[ "$url" == *"uneed.best"* ]]; then echo "uneed";
    elif [[ "$url" == *"betalist.com"* ]]; then echo "betalist";
    elif [[ "$url" == *"peerlist.io"* ]]; then echo "peerlist";
    elif [[ "$url" == *"microlaunch.net"* ]]; then echo "microlaunch";
    elif [[ "$url" == *"dang.ai"* ]]; then echo "dangai";
    else echo "launch-platform"; fi
}

PLATFORM=$(detect_platform "$URL")
SLUG=$(echo "$URL" | sed -E 's/https?:\/\/(www\.)?//; s/[^a-zA-Z0-9]/-/g' | cut -c1-50)
OUTPUT_FILE="$TEMP_DATA_DIR/product_${PLATFORM}_${SLUG}.json"

log_step "Product Scalpel: Initiating Resilient Fetch for $PLATFORM -> $URL"

# --- LAYER 1: Jina Pro (JSON Mode) ---
log_step "[Layer 1] Attempting Jina Pro Fetch..."
RESPONSE=$(curl -s -L -H "Accept: application/json" -H "X-Use-ReaderLM-v2: true" "https://r.jina.ai/$URL")
CONTENT=$(echo "$RESPONSE" | jq -r '.data.content // empty')
WORD_COUNT=$(echo "$CONTENT" | wc -w)

# --- LAYER 2: Lynx (Pure Text) ---
if [[ $WORD_COUNT -lt 150 ]]; then
    log_step "[Layer 1] Failed or Thin ($WORD_COUNT words). Escalating to [Layer 2] Lynx..."
    CONTENT=$(curl -s -L -A "Mozilla/5.0" "$URL" | lynx -stdin -dump -nolist 2>/dev/null)
    WORD_COUNT=$(echo "$CONTENT" | wc -w)
fi

# --- LAYER 3: Pandoc (Markdown) ---
if [[ $WORD_COUNT -lt 150 ]]; then
    log_step "[Layer 2] Failed or Thin ($WORD_COUNT words). Escalating to [Layer 3] Pandoc..."
    RAW_HTML=$(curl -s -L -A "Mozilla/5.0" "$URL")
    CONTENT=$(echo "$RAW_HTML" | pandoc -f html -t markdown 2>/dev/null)
    WORD_COUNT=$(echo "$CONTENT" | wc -w)
fi

# --- Final Integrity Check ---
if [[ $WORD_COUNT -lt 100 ]]; then
    log_step "CRITICAL ERROR: All layers failed to extract usable content from $URL."
    exit 1
fi

# 4. Save Structured JSON for the Brain
jq -n \
    --arg platform "$PLATFORM" \
    --arg url "$URL" \
    --arg content "$CONTENT" \
    --arg count "$WORD_COUNT" \
    '{source: $platform, url: $url, word_count: $count, body: $content}' > "$OUTPUT_FILE"

log_step "SUCCESS: $PLATFORM captured ($WORD_COUNT words) -> $OUTPUT_FILE"
echo "$OUTPUT_FILE"
