#!/usr/bin/env bash
#
# generate_comments.sh — Generate 1-3 self-comments for a LinkedIn post
# Reads a post file, loads context, and outputs comment blocks for Gemini to finalize.
#
# Usage: bash lib/generate_comments.sh <path-to-post.md>

# Source global configuration
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../config.sh"

#######################################
# Validate arguments
#######################################
if [[ $# -lt 1 ]]; then
    echo "ERROR: Missing post file path." >&2
    echo "Usage: bash lib/generate_comments.sh <path-to-post.md>" >&2
    exit 1
fi

POST_FILE="$1"

if [[ ! -f "$POST_FILE" ]]; then
    echo "ERROR: Post file not found: $POST_FILE" >&2
    exit 1
fi

#######################################
# Extract pillar from filename or content
#######################################
extract_pillar() {
    local file="$1"
    local basename
    basename=$(basename "$file")

    if echo "$basename" | grep -qi "problem"; then
        echo "problem"
    elif echo "$basename" | grep -qi "decision"; then
        echo "decision"
    elif echo "$basename" | grep -qi "honest"; then
        echo "honest"
    else
        # Fallback: try to detect from POSTER_DATA
        if grep -q "pillar:" "$file"; then
            grep "pillar:" "$file" | tail -1 | sed 's/.*pillar: "\([^"]*\)".*/\1/'
        else
            echo "unknown"
        fi
    fi
}

PILLAR=$(extract_pillar "$POST_FILE")

#######################################
# Determine comment count (1-3)
#######################################
determine_comment_count() {
    local last_count=2  # default

    # Check last session report for previous count
    if ls "$PROJECT_ROOT/reports/"*.md 1>/dev/null 2>&1; then
        local last_report
        last_report=$(ls -t "$PROJECT_ROOT/reports/"*.md 2>/dev/null | head -1)
        if [[ -f "$last_report" ]]; then
            local extracted
            extracted=$(grep -o "Generated [0-9]* comment" "$last_report" 2>/dev/null | grep -o "[0-9]" | tail -1)
            if [[ -n "$extracted" ]]; then
                last_count=$extracted
            fi
        fi
    fi

    # Pick a different count than last time
    local options=(1 2 3)
    for i in "${!options[@]}"; do
        if [[ "${options[$i]}" -eq "$last_count" ]]; then
            unset 'options[$i]'
        fi
    done

    # Random selection from remaining options
    local remaining=("${options[@]}")
    echo "${remaining[$RANDOM % ${#remaining[@]}]}"
}

COMMENT_COUNT=$(determine_comment_count)

#######################################
# Select comment types based on pillar
#######################################
select_comment_types() {
    local pillar="$1"
    local count="$2"

    local types=()

    case "$pillar" in
        problem)
            types=("question" "personal_experience" "validation")
            ;;
        decision)
            types=("contrarian_addition" "question" "resource_drop")
            ;;
        honest)
            types=("validation" "personal_experience" "contrarian_addition")
            ;;
        *)
            types=("question" "validation" "personal_experience")
            ;;
    esac

    # Return first N types (count)
    for ((i=0; i<count && i<${#types[@]}; i++)); do
        echo "${types[$i]}"
    done
}

COMMENT_TYPES=($(select_comment_types "$PILLAR" "$COMMENT_COUNT"))

#######################################
# Output context for Gemini
#######################################
echo "=== COMMENT GENERATION CONTEXT ==="
echo "Post file: $POST_FILE"
echo "Pillar: $PILLAR"
echo "Comment count: $COMMENT_COUNT"
echo "Comment types: ${COMMENT_TYPES[*]}"
echo ""
echo "=== CONTEXT FILES TO LOAD ==="
echo "1. context/awais-icp.md"
echo "2. context/content-pillars.md"
echo "3. context/identity_rules.md"
echo "4. context/COMMENT_RULES.md"
echo ""
echo "=== POST CONTENT (first 50 lines) ==="
head -50 "$POST_FILE"
echo ""
echo "=== INSTRUCTIONS FOR GEMINI ==="
echo "Generate $COMMENT_COUNT comment(s) following these rules:"
echo "- Types: ${COMMENT_TYPES[*]}"
echo "- Each comment: 1-3 sentences, under 280 characters"
echo "- Use 'I' naturally (first-person allowed in comments)"
echo "- NO banned AI words or patterns (see COMMENT_RULES.md)"
echo "- NO em-dashes"
echo "- Format: <!-- [COMMENT_XX] type: \"...\" | text: \"...\" -->"
echo ""
echo "Post pillar: $PILLAR"
for i in "${!COMMENT_TYPES[@]}"; do
    echo "Comment $((i+1)) type: ${COMMENT_TYPES[$i]}"
done
