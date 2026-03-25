#!/bin/bash

# lib/build_index.sh
# Creates a lightweight index of templates for fast scanning by the Brain.

source "$(dirname "$0")/../config.sh"

log_step "Starting Template Indexer..."

# Verify source file exists
if [ ! -f "$TEMPLATES_FILE" ]; then
    log_step "ERROR: Templates file not found at $TEMPLATES_FILE"
    exit 1
fi

# Use jq to extract only metadata needed for selection
# Strips 'structure', 'original_post_text', and 'link' to keep it lean
jq '[.[] | {
    id: .id, 
    name: .name, 
    funnel_stage: .metadata.funnel_stage, 
    content_category: .metadata.content_category, 
    hook_type: .metadata.hook_type, 
    tone: .metadata.tone, 
    ideal_for_niche: .metadata.ideal_for_niche
}]' "$TEMPLATES_FILE" > "$TEMPLATES_DIR/template_index.json"

if [ $? -eq 0 ]; then
    COUNT=$(jq 'length' "$TEMPLATES_DIR/template_index.json")
    log_step "SUCCESS: Indexed $COUNT templates at $TEMPLATES_DIR/template_index.json"
else
    log_step "ERROR: JQ failed to build the index."
    exit 1
fi
