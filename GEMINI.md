# LinkedIn Post Generator (Brain-Powered CLI)

A Bash-driven content engine for the Media Analyst Scout identity. This system automates Reddit discovery and Gemini-powered drafting to create problem-first LinkedIn stories for solo founders and indie builders. It uses a strict human-like tone, banning common AI buzzwords and robotic structures.

## Build & Test

• Install dependencies: `sudo apt install jq curl`
• Run master workflow: `bash main.sh`
• Scouting only: `bash lib/reddit.sh`
• Deep thread fetch: `bash lib/fetch_thread.sh [permalink] [filename]`
• Initialize AI: `gemini init`
• Execute Brain: `gemini go`

## Project Layout

├─ context/ → Strategic mandates (ICP, Content Pillars, Identity, Master Rules)
├─ templates/ → Operational assets (Templates, Anti-AI rules, Writing guidelines)
├─ lib/ → Reddit API integration and data fetching bash scripts
├─ content/ → Multi-stage data pipeline
│  ├─ drafts/ → Unformatted AI "angles" (Problem, Decision, Honest)
│  └─ posts/ → Finalized, template-locked LinkedIn content
├─ reports/ → Architectural reasoning for every generated post
└─ logs/ → Traceability for Bash execution and AI sessions

## Architecture Overview

The system works as a modular data pipeline where Bash scripts handle data acquisition. The Gemini CLI serves as the analytical layer, known as the Brain. The architecture follows a strict Editorial Spine requiring content to flow from Problem to Solution, then Product, and finally Founder. This pivot ensures content stays useful to readers while building authority.

The pipeline fetches top threads from subreddits via `lib/reddit.sh` without API keys. It feeds raw JSON to Gemini, which follows the 7-step Master Execution Rules. These steps generate plain text drafts, select a structural template, perform an anti-AI scrub, and save final LinkedIn posts.

## Development Patterns & Constraints

### Coding Style
• Language: Bash scripts and Markdown prompts.
• Logic Isolation: Fetching logic in `lib/` must stay independent of AI prompting logic.
• Formatting: Use standard Bash variable naming (UPPER_CASE for globals) and standard indentation.
• Data Structures: Preserve the structure of `processed_sources.json` exactly. Changes break the pipeline.
• Configuration: All paths, target subreddits, and the TZ environment variable must stay in `config.sh`.

### Copywriting Constraints
• Tone: Natural, warm, and direct. Use specific numbers like $49 instead of words.
• Rhythm: Follow 1-3-1-3 pacing. Never exceed 3 sentences in a block. One empty line between ideas.
• Punctuation: No em-dashes. Use periods or commas.
• Editorial Spine: Lead with the pain. Follow the Problem, Solution, Product, Founder order.
• Identity: Write "They / The founder", never "I" except when mentioning your own product.
• Banned Vocabulary: Zero tolerance for AI buzzwords like delve, harness, unlock, or paradigm.
• Banned Patterns: Avoid setups like "In a world where..." or "Stop doing X. Start doing Y."

### Error Handling
• Thin Source Flag: If Reddit data is sparse, flag it as [THIN SOURCE] in the draft stage.
• Operational Check: The system must confirm draft files exist before moving to template selection.
• Template Safety: If a template fetch fails, the system picks the next closest ID and retries.

## Security

• Authentication: Public Reddit endpoints only. No authenticated API calls required.
• AI Identity: The engine acts as an Observer. It never claims to be the founder of a scouted product.
• Data Privacy: Drafts, configs, and logs stay on the local file system. Excluded from git via .gitignore.
• API Keys: JINA_API_KEY is loaded from .env for article fetching.

## Git Workflows

• Branching: Use feature or bugfix branches merging into main.
• Commits: Clear, short messages for script updates or prompt changes.
• PR Requirements: Verify pipeline stability before merging. Do not modify fetching logic without manual tests.

## Evidence Required for Every PR

• Script Testing: Verify `main.sh` completes the scouting phase without errors.
• Template Validation: New templates must match the schema in `linkedin-templates.json`.
• Proof Artifact: A sample post showing 1-3-1-3 rhythm and the correct Editorial Spine.
• Clean Scrub: Finalized output must contain no banned AI words or patterns.

## External Services

• Reddit API (JSON) - Public access for thread discovery.
• Gemini CLI - Local context for text transformation and strategic analysis.
• JINA_API_KEY - Used in `lib/fetch_article.sh` for web scraping.

## Gotchas

• jq Dependency: Essential for parsing Reddit's nested JSON. The pipeline fails without it.
• Rate Limiting: The 2-second sleep loop in `reddit.sh` prevents IP blocks from Reddit.
• Voice Drift: AI naturally drifts toward first-person. Explicitly force a pivot to "They" in drafts.
• Timezone: All logs and filenames use Pakistan Standard Time (Asia/Karachi) via `config.sh`.
• Session Memory: Do not commit `processed_sources.json`, but keep it locally for cool-down checks.

## Deployment

• Environment: Local Linux machine or WSL.
• Requirements: Gemini CLI must be installed and authenticated.
• Pipeline: The system runs locally; no cloud hosting or CI/CD deployments are configured.
