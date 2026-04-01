# LinkedIn Post Generator (Brain-Powered CLI)

A Bash-driven content engine for the Media Analyst Scout identity. This system automates Reddit discovery and Gemini-powered drafting to create problem-first LinkedIn stories for solo founders and indie builders. It uses a strict human-like tone, banning common AI buzzwords and robotic structures.

## Build & Test

### Core Engine
• Install dependencies: `sudo apt install jq curl`
• Run master workflow: `bash main.sh scout`
• Fetch specific Reddit thread: `bash main.sh fetch_reddit <url>`
• Fetch specific web article: `bash main.sh fetch_article <url>`
• Get a post template by ID: `bash main.sh get_template <id>`
• Reset all generated content and logs: `bash main.sh reset`

### Dashboard
• Install dependencies: `cd dashboard && npm install`
• Start server: `node dashboard/server.js` or `bash start_dashboard.sh`

## Project Layout

├─ main.sh → The central controller script that routes all commands.
├─ config.sh → Global configuration for paths, subreddits, and TZ.
├─ context/ → Strategic mandates (ICP, Content Pillars, Identity, Master Rules).
├─ templates/ → Operational assets (Post structures, Anti-AI rules).
├─ lib/ → Standalone Bash scripts for data fetching (Reddit, web).
├─ content/ → Multi-stage data pipeline for posts.
│  ├─ drafts/ → Raw, unformatted AI "angles" (Problem, Decision, Honest).
│  └─ posts/ → Finalized, template-locked LinkedIn content.
├─ dashboard/ → A simple Express.js server for viewing content.
├─ reports/ → Architectural reasoning and logs for every generated post.
└─ logs/ → Traceability for Bash execution and AI sessions.

## Architecture Overview

The system is a modular data pipeline where Bash scripts handle data acquisition and the Gemini CLI serves as the analytical layer (The Brain). The architecture follows a strict "Problem → Solution → Product → Founder" Editorial Spine to ensure content is valuable to the reader.

The primary workflow (`main.sh scout`) uses `lib/reddit.sh` to find promising threads on specified subreddits. This raw data is passed to the AI, which follows the `context/MASTER_EXECUTION_RULES.md` to select sources, fetch full content, generate three distinct post angles (Problem, Decision, Honest), select a formatting template, apply an anti-AI filter, and save the final Markdown files to the `content/posts/` directory.

## Development Patterns & Constraints

### Coding Style
• Language: Bash for all core logic, JavaScript (Node.js/Express) for the dashboard.
• Naming: Use `UPPER_CASE` for global environment variables in Bash. Follow standard JS conventions in the dashboard.
• Logic Isolation: Data fetching logic in `lib/` is independent of AI prompting logic.
• Configuration: All core engine paths and target subreddits are centralized in `config.sh`.
• Data Structures: The JSON structure of `processed_sources.json` and `templates/linkedin-templates.json` is rigid and must be preserved.

### Copywriting Constraints
• Tone: Natural, warm, direct. Use specific numbers (e.g., $49) instead of words.
• Rhythm: Follow a 1-3-1-3 sentence pacing. Never exceed 3 sentences in a paragraph block. Use one empty line between ideas.
• Punctuation: No em-dashes ("—"). Use periods or commas instead.
• Identity: Write from a third-person observer perspective ("They / The founder"), not first-person ("I").
• Banned Vocabulary: Zero tolerance for AI buzzwords (e.g., delve, harness, unlock, leverage, seamless). See `templates/anti_ai_writing_prompt.md`.
• Banned Patterns: Avoid clichés like "In a world where..." or "Stop doing X. Start doing Y."

### Error Handling
• Thin Source Flag: If Reddit data is sparse, the AI must flag the draft with `[THIN SOURCE]`.
• File Check: The system must confirm draft files exist before moving to template selection.

## Security

• Authentication: Core engine uses public Reddit endpoints only; no API keys required for basic scouting.
• API Keys: `JINA_API_KEY` is loaded from a `.env` file for the `fetch_article` command.
• Data Privacy: All generated content, logs, and reports are stored locally and are excluded from version control via `.gitignore`.
• AI Identity: The engine acts as an Observer. It never claims to be the founder of a scouted product.

## Git Workflows

• Branching strategy: Use `feature/*` or `bugfix/*` branches, merging into `main`.
• Commit conventions: Use clear, short messages for script updates or prompt changes.
• PR requirements: Verify pipeline stability before merging. Do not modify fetching logic without manual tests.

## Evidence Required for Every PR

A pull request is reviewable when it includes:

• Script Testing: `bash main.sh scout` completes the scouting phase without errors.
• Template Validation: New templates match the schema in `templates/linkedin-templates.json`.
• Proof Artifact: A sample post showing the 1-3-1-3 rhythm and correct Editorial Spine.
• Clean Scrub: Finalized output contains no banned AI words or patterns.
• No drop in test coverage (if applicable).
• Documentation updated if core logic changed.

## External Services

• Reddit API (JSON) - `N/A` - Public access for thread discovery.
• Gemini CLI - `N/A` - Local context for text transformation and strategic analysis.
• Jina AI - `JINA_API_KEY` - Used in `lib/fetch_article.sh` for web scraping.

## Gotchas & Common Pitfalls

• **jq Dependency:** The entire pipeline relies on `jq` for parsing Reddit's nested JSON. The system will fail without it.
• **Rate Limiting:** A 2-second `sleep` is used in `lib/reddit.sh` to prevent being rate-limited by Reddit.
• **AI Voice Drift:** The AI naturally drifts toward first-person ("I"). Prompts must explicitly force a pivot to the third-person "They" observer frame.
• **Timezone:** All logs and filenames are standardized to Pakistan Standard Time (Asia/Karachi), which is set in `config.sh`.
• **Session Memory:** `content/processed_sources.json` is used for cool-down checks to avoid re-processing the same content. It should not be committed.

## Deployment

• Environment: Local Linux machine or a compatible environment like WSL.
• Requirements: Gemini CLI must be installed and authenticated. Bash, `jq`, and `curl` must be available. Node.js and npm are needed for the dashboard.
• Pipeline: The system is designed for local execution. No cloud hosting or CI/CD deployments are configured.
