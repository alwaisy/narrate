#!/usr/bin/env bash
#
# main.sh — The Central Controller for the LinkedIn Post Generator
# Routes incoming commands from Gemini TOML files to the correct internal modules.
#
# Usage: bash main.sh <command> [arguments...]

# --- Strict Mode ---
set -euo pipefail

# --- Dynamic Script Resolution ---
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source global configuration
source "${SCRIPT_DIR}/config.sh"

#######################################
# Display help menu for the controller
#######################################
usage() {
    echo "Usage: bash main.sh <command> [args...]"
    echo ""
    echo "Available Commands:"
    echo "  scout          - Scout target subreddits for trending threads (reddit.sh)"
    echo "  fetch_reddit   - Fetch a specific Reddit URL (fetch_url_reddit.sh <url>)"
    echo "  fetch_article  - Fetch a specific web article (fetch_article.sh <url>)"
    echo "  build_index    - Rebuild the template index (build_index.sh)"
    echo "  get_template   - Print a template JSON by ID (get_template.sh <id>)"
    echo "  generate_comments - Generate 1-3 self-comments for a post (generate_comments.sh <post-path>)"
    echo "  reset          - Wipe all logs, drafts, posts, and temp data"
}

#######################################
# Command Router
#######################################
main() {
    local command="${1:-}"
    
    if [[ -z "$command" ]]; then
        usage
        exit 1
    fi
    
    shift # Remove the command from $@ so only arguments are passed down
    
    # --- The Switchboard ---
    case "$command" in
        scout)
            log_step "Routing: 'scout' -> lib/reddit.sh"
            bash "${SCRIPT_DIR}/lib/reddit.sh" "$@"
            ;;
            
        fetch_reddit)
            log_step "Routing: 'fetch_reddit' -> lib/fetch_url_reddit.sh"
            bash "${SCRIPT_DIR}/lib/fetch_url_reddit.sh" "$@"
            ;;
            
        fetch_article)
            log_step "Routing: 'fetch_article' -> lib/fetch_article.sh"
            bash "${SCRIPT_DIR}/lib/fetch_article.sh" "$@"
            ;;
            
        build_index)
            log_step "Routing: 'build_index' -> lib/build_index.sh"
            bash "${SCRIPT_DIR}/lib/build_index.sh" "$@"
            ;;
            
        get_template)
            bash "${SCRIPT_DIR}/lib/get_template.sh" "$@"
            ;;

        generate_comments)
            log_step "Routing: 'generate_comments' -> lib/generate_comments.sh"
            bash "${SCRIPT_DIR}/lib/generate_comments.sh" "$@"
            ;;

        reset)
            log_step "Routing: 'reset' -> Cleaning project directories..."
            rm -rf "${SCRIPT_DIR}/logs/"* \
                   "${SCRIPT_DIR}/content/temp/"* \
                   "${SCRIPT_DIR}/content/drafts/"* \
                   "${SCRIPT_DIR}/content/posts/"* \
                   "${SCRIPT_DIR}/reports/"*
            echo "[]" > "${SCRIPT_DIR}/content/processed_sources.json"
            log_step "Reset complete."
            ;;
            
        *)
            echo "ERROR: Unknown command: $command" >&2
            usage
            exit 1
            ;;
    esac
}

# --- Execution Guard ---
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
