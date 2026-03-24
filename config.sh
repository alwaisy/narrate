#!/bin/bash

# --- Configuration for LinkedIn Generator ---

PROJECT_ROOT=$(pwd)

# Timezone Setup (Pakistan Standard Time)
export TZ="Asia/Karachi"
CURRENT_TIME_PKT=$(date +"%Y-%m-%d_%I-%M-%p")

# Logging
LOG_FILE="$PROJECT_ROOT/logs/execution.log"
SESSION_LOG="$PROJECT_ROOT/logs/session_${CURRENT_TIME_PKT}.log"
PROCESSED_THREADS_LOG="$PROJECT_ROOT/content/processed_threads.json"

# High-Signal Subreddits (Refined for Problem-First Strategy)
SUBREDDITS=(
    "SaaS" 
    "indiehackers" 
    "startups" 
    "solopreneur" 
    "microsaas" 
    "buildinpublic" 
    "SelfHosted"
    "smallbusiness"    # High Problem Density
    "Sales"            # Pain/Decision Gold
    "roastmystartup"   # Brutal Honesty
    "Business_Ideas"   # Validation/Problem Gold
    "SomebodyMakeThis" # Literal Problem Lists
    "GrowthHacking"    # Distribution Angles
    "ProductManagement" # Roadmap Logic
    "sideproject"      # Product Discovery
    "digitalnomad"     # Lifestyle/Honest Reality
)

# Paths
TEMP_DATA_DIR="$PROJECT_ROOT/content/temp"
FINAL_POSTS_DIR="$PROJECT_ROOT/content/posts"
WORKING_DIR="$PROJECT_ROOT/working"
FOUNDATION_DIR="$PROJECT_ROOT/foundation"

# Core Rule Files
TEMPLATES_FILE="$WORKING_DIR/linkedin-templates.json"
ANTI_AI_RULES="$WORKING_DIR/anti_ai_writing_prompt.md"
MASTER_RULES="$WORKING_DIR/linkedin_master_writing_rules.md"

# Function for deep logging
log_step() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %I:%M:%S %p')] $message" | tee -a "$LOG_FILE" "$SESSION_LOG"
}
