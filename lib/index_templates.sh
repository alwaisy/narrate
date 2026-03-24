#!/bin/bash

# Import configuration
source "$(dirname "$0")/../config.sh"

echo "Creating lightweight template index..."

# Strip 'structure', 'original_post_text', and 'link' to keep it lean
jq '[.[] | {id: .id, name: .name, description: .description, metadata: .metadata}]' "$TEMPLATES_FILE" > "$WORKING_DIR/template_index.json"

echo "Index created at $WORKING_DIR/template_index.json"
