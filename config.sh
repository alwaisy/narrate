#!/bin/bash

# --- Configuration for LinkedIn Generator ---

PROJECT_ROOT=$(pwd)

# Timezone Setup (Pakistan Standard Time)
export TZ="Asia/Karachi"
CURRENT_TIME_PKT=$(date +"%Y-%m-%d_%I-%M-%p")

# Logging
LOG_FILE="$PROJECT_ROOT/logs/execution.log"
SESSION_LOG="$PROJECT_ROOT/logs/session_${CURRENT_TIME_PKT}.log"
PROCESSED_SOURCES_LOG="$PROJECT_ROOT/content/processed_sources.json"

# API Keys (Loaded from .env)
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
    export JINA_API_KEY
fi

# High-Signal Subreddits (Refined & Expanded)
SUBREDDITS=(
    "SaaS" 
    "indiehackers" 
    "startups" 
    "solopreneur" 
    "microsaas" 
    "buildinpublic" 
    "SelfHosted"
    "smallbusiness"
    "Sales"
    "roastmystartup"
    "Business_Ideas"
    "SomebodyMakeThis"
    "GrowthHacking"
    "ProductManagement"
    "sideproject"      # Original
    "sideprojects"     # New variation
    "Startup_Ideas"    # New
    "Marketing"
    "Business"
    "AppDevelopment"
    "digitalnomad"
)

# Paths
TEMP_DATA_DIR="$PROJECT_ROOT/content/temp"
FINAL_POSTS_DIR="$PROJECT_ROOT/content/posts"
TEMPLATES_DIR="$PROJECT_ROOT/templates"
CONTEXT_DIR="$PROJECT_ROOT/context"

# Core Rule Files
TEMPLATES_FILE="$TEMPLATES_DIR/linkedin-templates.json"
ANTI_AI_RULES="$TEMPLATES_DIR/anti_ai_writing_prompt.md"
MASTER_RULES="$TEMPLATES_DIR/linkedin_master_writing_rules.md"

# Function for deep logging
log_step() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %I:%M:%S %p')] $message" | tee -a "$LOG_FILE" "$SESSION_LOG"
}
