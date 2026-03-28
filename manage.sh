#!/bin/bash

# LinkedIn Post Manager TUI
# Uses fzf for selection and filename prefixes for status.

PROJECT_ROOT=$(pwd)
POSTS_DIR="$PROJECT_ROOT/content/posts"

# Status Prefixes
STATUS_DRAFT="[DRAFT]"
STATUS_READY="[READY]"
STATUS_PUBLISHED="[PUBLISHED]"
STATUS_SKIPPED="[SKIPPED]"

# Function to copy content to clipboard
copy_to_clipboard() {
    local file="$1"
    if [[ -f "$file" ]]; then
        cat "$file" | xclip -selection clipboard
        echo "Copied to clipboard!"
        sleep 1
    fi
}

# Function to edit file
edit_file() {
    local file="$1"
    ${EDITOR:-vim} "$file"
}

# Function to change status
change_status() {
    local file="$1"
    local new_status="$2"
    local dir=$(dirname "$file")
    local filename=$(basename "$file")

    # Remove any existing status prefix (e.g., [READY], [DRAFT], [PUBLISHED], [SKIPPED])
    local clean_name=$(echo "$filename" | sed -E 's/^\[(DRAFT|READY|PUBLISHED|SKIPPED)\]-//')
    
    # Also handle [skipped]- pattern from previous versions
    clean_name=$(echo "$clean_name" | sed -E 's/^\[skipped\]-//')

    local new_filename="${new_status}-${clean_name}"
    mv "$file" "$dir/$new_filename"
    echo "Moved to $new_status"
    sleep 0.5
}

# Main Loop
while true; do
    # 1. Select Topic (Using eza for icons)
    TOPIC=$(eza --icons -1 "$POSTS_DIR" | fzf --ansi --prompt="Select Topic: " --header="[ESC to Quit]" --height=40% --layout=reverse)
    
    if [[ -z "$TOPIC" ]]; then
        exit 0
    fi

    # Clean the topic name (remove icons if fzf didn't strip them)
    TOPIC_CLEAN=$(echo "$TOPIC" | sed 's/^[[:space:]]*[^[:space:]]*[[:space:]]*//')
    # If eza is configured differently, we might need to adjust. 
    # Let's try to find the folder regardless.
    if [ ! -d "$POSTS_DIR/$TOPIC" ]; then
        TOPIC_PATH="$POSTS_DIR/$TOPIC_CLEAN"
    else
        TOPIC_PATH="$POSTS_DIR/$TOPIC"
    fi

    while true; do
        # 2. Select Post (Using batcat for highlighted previews)
        POST=$(ls -1 "$TOPIC_PATH" | fzf --prompt="Select Post ($TOPIC): " \
            --header="[TAB to change Topic | ESC for Topics]" \
            --preview "batcat --color=always --style=plain '$TOPIC_PATH/{}'" \
            --preview-window=right:60%:wrap \
            --height=60% --layout=reverse)

        if [[ -z "$POST" ]]; then
            break
        fi

        POST_PATH="$TOPIC_PATH/$POST"

        # 3. Action Menu
        ACTION=$(echo -e "Copy to Clipboard\nEdit\nMark as READY\nMark as PUBLISHED\nMark as SKIPPED\nMark as DRAFT\nBack" | \
            fzf --prompt="Action for $POST: " --height=40% --layout=reverse)

        case "$ACTION" in
            "Copy to Clipboard")
                copy_to_clipboard "$POST_PATH"
                ;;
            "Edit")
                edit_file "$POST_PATH"
                ;;
            "Mark as READY")
                change_status "$POST_PATH" "$STATUS_READY"
                break # Refresh list
                ;;
            "Mark as PUBLISHED")
                change_status "$POST_PATH" "$STATUS_PUBLISHED"
                break # Refresh list
                ;;
            "Mark as SKIPPED")
                change_status "$POST_PATH" "$STATUS_SKIPPED"
                break # Refresh list
                ;;
            "Mark as DRAFT")
                change_status "$POST_PATH" "$STATUS_DRAFT"
                break # Refresh list
                ;;
            "Back")
                continue
                ;;
            *)
                continue
                ;;
        esac
    done
done
