#!/bin/bash

# test/compare_scrapers.sh
# Head-to-head comparison: Jina Pro vs. Lynx vs. Pandoc

source "$(dirname "$0")/../config.sh"
source "$(dirname "$0")/../.env"

# Target URLs
URLS=(
    "https://www.producthunt.com/products/scraperai"
    "https://betalist.com/startups/venturelens"
    "https://www.uneed.best/tool/glancelytics"
    "https://microlaunch.net/p/hummingdeck"
    "https://peerlist.io/sourmango/project/sour-mango--ai-travel-companion"
    "https://dang.ai/tool/img2img-img-2-img-net"
    "https://dang.ai/tool/product-requirement-document-ai-writer-writemyprd"
)

log_step "Starting Multi-Scraper Stress Test..."

mkdir -p test/results

for URL in "${URLS[@]}"; do
    SLUG=$(echo "$URL" | sed -E 's/https?:\/\/(www\.)?//; s/[^a-zA-Z0-9]/-/g' | cut -c1-50)
    log_step "Target: $URL"

    # 1. Jina Pro (JSON + ReaderLM)
    log_step "[Jina Pro] Fetching..."
    curl -s -L \
        -H "Authorization: Bearer $JINA_API_KEY" \
        -H "Accept: application/json" \
        -H "X-Use-ReaderLM-v2: true" \
        "https://r.jina.ai/$URL" > "test/results/${SLUG}_jina.json"
    
    JINA_SIZE=$(stat -c%s "test/results/${SLUG}_jina.json" 2>/dev/null || echo 0)
    log_step "[Jina Pro] Done ($JINA_SIZE bytes)"

    # 2. Curl + Lynx (Pure Text)
    log_step "[Lynx] Fetching..."
    curl -s -L -A "Mozilla/5.0" "$URL" | lynx -stdin -dump -nolist > "test/results/${SLUG}_lynx.txt" 2>/dev/null
    LYNX_SIZE=$(stat -c%s "test/results/${SLUG}_lynx.txt" 2>/dev/null || echo 0)
    log_step "[Lynx] Done ($LYNX_SIZE bytes)"

    # 3. Curl + Pandoc (Markdown)
    log_step "[Pandoc] Fetching..."
    curl -s -L -A "Mozilla/5.0" "$URL" | pandoc -f html -t markdown > "test/results/${SLUG}_pandoc.md" 2>/dev/null
    PANDOC_SIZE=$(stat -c%s "test/results/${SLUG}_pandoc.md" 2>/dev/null || echo 0)
    log_step "[Pandoc] Done ($PANDOC_SIZE bytes)"

    log_step "---"
    sleep 2
done

log_step "Stress Test Complete. Results in test/results/"
