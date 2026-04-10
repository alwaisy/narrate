# LinkedIn Post Generator (Brain-Powered CLI)

A Bash-driven content engine that automates Reddit thread discovery and Gemini-powered drafting to produce problem-first LinkedIn posts for solo founders and indie builders. The system follows a strict Editorial Spine (Problem, Solution, Product, Founder) and enforces human-like tone by banning AI buzzwords and robotic structures.

## Build & Test

• Install system deps: `sudo apt install jq curl lynx pandoc`
• Install dashboard deps: `cd dashboard && bun install`
• Run master workflow: `bash main.sh scout`
• Fetch specific Reddit thread: `bash main.sh fetch_reddit <url>`
• Fetch web article: `bash main.sh fetch_article <url>`
• Fetch product page: `bash lib/fetch_product.sh <url>`
• Rebuild template index: `bash main.sh build_index`
• Get template by ID: `bash main.sh get_template <id>`
• Reset all data: `bash main.sh reset`
• Start dashboard: `bash start_dashboard.sh` (runs on localhost:6842)
• Launch TUI manager: `bash manage.sh`
• Execute Brain pipeline: `gemini go`
• Run post-quality audit: `gemini review <post-path>`
• Initialize AI context: `gemini init`

## Project Layout

```
├─ .gemini/commands/ → TOML command definitions for Gemini CLI (go, review, reddit, article, product, text, reset, init)
├─ .commands/ → Kilo CLI command definitions
├─ context/ → Strategic mandates (ICP, content pillars, identity rules, master execution rules)
├─ templates/ → LinkedIn post templates JSON, anti-AI rules, template metadata index
├─ lib/ → Bash scripts for data acquisition (reddit, fetch_thread, fetch_article, fetch_product, build_index, get_template)
├─ content/ → Multi-stage data pipeline
│  ├─ temp/ → Raw JSON from Reddit/article fetches
│  ├─ drafts/ → Unformatted AI angles (Problem, Decision, Honest)
│  └─ posts/ → Finalized, template-locked LinkedIn content
├─ dashboard/ → Hono (Node.js) web UI for managing posts
│  ├─ server.js → REST API (topics, posts, status, archive, clipboard)
│  └─ public/ → Frontend assets
├─ reports/ → Session reports with reasoning for every generated post
├─ logs/ → Execution and session logs
├─ main.sh → Central command router (scout, fetch_reddit, fetch_article, build_index, get_template, reset)
├─ config.sh → All paths, subreddits (20 targets), timezone, logging functions
├─ manage.sh → fzf-based TUI for browsing, editing, and status-tagging posts
└─ start_dashboard.sh → Boots the Hono dashboard on localhost:6842
```

## Architecture Overview

The system is a modular data pipeline where Bash scripts handle all data acquisition from public Reddit endpoints and web articles. The Gemini CLI serves as the analytical layer (the "Brain") that follows a 7-step Master Execution Protocol defined in `context/MASTER_EXECUTION_RULES.md`.

The pipeline flow: `reddit.sh` fetches the newest thread from each of 20 subreddits with a 2-second rate-limit sleep between calls. Raw JSON lands in `content/temp/`. Gemini selects 3 high-signal threads, runs `fetch_thread.sh` for deep comment extraction, then generates 3 plain-text drafts (problem angle, decision angle, honest angle) per thread, 9 posts total per session. Each draft is matched to a structural template from `templates/linkedin-templates.json` using metadata (funnel stage, tone, hook type). A cool-down mechanism reads the last 10 session reports to avoid template repetition. Final posts are saved as `.md` files in `content/posts/` with status-prefixed filenames.

The dashboard (`dashboard/server.js`) provides a web UI on port 6842 with 6 REST endpoints for browsing topics, editing post content, toggling status (DRAFT/READY/PUBLISHED/SKIPPED), and archiving topics. The TUI manager (`manage.sh`) offers the same workflow via fzf with batcat previews and xclip clipboard support.

## Development Patterns & Constraints

### Coding Style
• Bash: `set -euo pipefail` in main.sh, UPPER_CASE for globals, lowercase for locals, 4-space indentation
• JavaScript (ESM): Hono framework with pino structured logging, camelCase variables, PascalCase for classes, 2-space indentation
• All Bash scripts source `config.sh` for shared variables and logging functions
• JSON data files validated with `jq`; `processed_sources.json` structure must be preserved exactly
• Configuration: All paths, subreddits, and TZ stay in `config.sh`; API keys in `.env`
• Dashboard: ESM with CommonJS-style requires where possible; no TypeScript

### Naming Conventions
• Bash variables: UPPER_CASE for globals, lowercase for locals
• JavaScript: camelCase for variables/functions, PascalCase for classes
• File names: kebab-case for scripts and assets, snake_case for data files
• Directories: lowercase, hyphenated for clarity
• Post filenames: `[STATUS]-name.md` (e.g., `[DRAFT]-problem-angle.md`)

### Error Handling
• Bash: `set -euo pipefail` to fail fast on errors
• JavaScript: try-catch blocks for async operations; errors logged with pino
• Validation: Check required fields in JSON structures before processing
• Thin source flag: If Reddit data is sparse, flag as `[THIN SOURCE]` in drafts
• Operational gate: System confirms draft files exist before template selection (Step 3 hard stop)
• Template safety: If `get_template.sh` fails, pick next closest ID and retry
• Fetch escalation: `fetch_article.sh` uses 3 layers (clean curl, user-agent spoof, Jina.ai). `fetch_product.sh` uses Jina Pro, Lynx, Pandoc. Both fail if word count drops below 100-150

### Copywriting Constraints
• Tone: Natural, warm, direct. Use specific numbers ($49) not words
• Rhythm: 1-3-1-3 pacing. Never exceed 3 sentences per block. One empty line between ideas
• Punctuation: No em-dashes. Use periods or commas
• Editorial Spine: Problem, Solution, Product, Founder order is non-negotiable
• Identity: Write "They / The founder", never "I" (except for your own product, Fewwords)
• Banned vocabulary: delve, harness, unlock, paradigm, leverage, seamless, robust, transformative, innovative, game-changer, elevate, streamline, empower, cutting-edge, scalable, visionary, disruptive, reimagine, holistic, synergy, foster, showcase, enhance
• Banned patterns: "In a world where...", "Stop doing X. Start doing Y.", "Here's the truth nobody tells you"

## Security

• Public Reddit JSON endpoints only. No authenticated API calls for thread discovery
• JINA_API_KEY loaded from `.env` for article/product scraping via Jina.ai
• Engine acts as Observer/Media Analyst. Never claims to be the founder of scouted products
• Drafts, configs, logs, and `.env` excluded from git via `.gitignore`
• `processed_sources.json` stays local, never committed

## Git Workflows

• Branching: Feature or bugfix branches merging into main
• Commits: Clear, short messages for script updates or prompt changes
• PR requirements: Verify `bash main.sh scout` completes without errors before merging
• Protected files: Do not modify fetching logic without manual tests against live Reddit endpoints

## Evidence Required for Every PR

• Pipeline test: `bash main.sh scout` completes the scouting phase without errors
• Template validation: New templates match the schema in `linkedin-templates.json` (id, name, structure, metadata with funnel_stage, content_category, hook_type, tone)
• Proof artifact: A sample post showing 1-3-1-3 rhythm and correct Editorial Spine
• Clean scrub: Finalized output contains no banned AI words or patterns
• Dashboard check: `node dashboard/server.js` starts without errors if server code changed

## External Services

• Reddit JSON API - `N/A` - Public access for thread discovery and comment extraction
• Gemini CLI - `N/A` - Local AI context for text transformation and strategic analysis
• Jina.ai Reader (`r.jina.ai/`) - `JINA_API_KEY` - Web scraping fallback for articles and product pages
• xclip - `N/A` - Clipboard operations in TUI manager and dashboard

## Gotchas

• jq dependency: Essential for parsing Reddit nested JSON and building template index. Pipeline fails without it
• Rate limiting: The 2-second sleep in `reddit.sh` prevents Reddit IP blocks. Do not reduce
• Voice drift: AI naturally drifts toward first-person. Explicitly force "They" in drafts
• Timezone: All logs and filenames use Pakistan Standard Time (Asia/Karachi) via `config.sh`
• Session memory: `processed_sources.json` enables cool-down (avoids repeating templates across sessions). Keep local, never commit
• Template index: `build_index.sh` runs automatically before scout/fetch. If it fails, the Brain has no template metadata
• Dashboard port: Configurable via command-line argument. Usage: `bash start_dashboard.sh 6005` (defaults to 6842)
• Lynx/Pandoc: Required by `fetch_product.sh` Layer 2/3 fallbacks. Install separately if product scraping fails

## Deployment

• Environment: Local Linux machine or WSL
• Requirements: Gemini CLI installed and authenticated, jq, curl, lynx, pandoc
• Dashboard: `bash start_dashboard.sh` boots Hono on localhost:6842
• Pipeline: Fully local. No cloud hosting or CI/CD configured
