# LinkedIn Post Generator (Brain-Powered CLI)

A Bash-driven content engine designed for the "Indie Product Media Analyst" identity. This system automates Reddit discovery and Gemini-powered drafting to create problem-first LinkedIn stories specifically tailored for solo founders and indie builders. It strictly enforces a human-like tone, explicitly banning typical AI buzzwords and structural patterns.

## Build & Test

• Install dependencies: `sudo apt install jq curl`
• Run master workflow: `bash main.sh`
• Scouting only: `bash lib/reddit.sh`
• Deep thread fetch: `bash lib/fetch_thread.sh [permalink] [filename]`
• Initialize AI: `gemini init`
• Execute Brain: `gemini go`

## Project Layout

├─ context/ → Strategic mandates (ICP, Content Pillars, Identity, MASTER_EXECUTION_RULES)
├─ templates/ → Operational assets (Templates, Anti-AI rules, Writing guidelines)
├─ lib/ → Reddit API integration and data fetching bash scripts
├─ content/ → Multi-stage data pipeline
│  ├─ temp/ → Raw Reddit JSON snapshots
│  ├─ drafts/ → Unformatted AI "angles" (Problem, Decision, Honest)
│  └─ posts/ → Finalized, template-locked LinkedIn content
├─ reports/ → Architectural reasoning for every generated post
└─ logs/ → Traceability for Bash execution and AI sessions

## Architecture Overview

The system operates as a modular data pipeline where Bash scripts handle data acquisition and the Gemini CLI serves as the analytical layer (the "Brain"). The architecture enforces a strict "Editorial Spine" requiring content to flow through the sequence of Problem → Solution → Product → Founder. This problem-first pivot guarantees content remains useful to readers while establishing credibility. 

The pipeline fetches top threads from specified subreddits via `lib/reddit.sh` without requiring API keys, feeding raw JSON to Gemini. Gemini then follows the 7-step Master Execution Rules to generate plain text drafts, select a structural template, perform an anti-AI scrub, and save final LinkedIn posts.

## Development Patterns & Constraints

### Coding Style & Operations
• Logic Isolation: Fetching logic in `lib/` must remain independent of AI prompting logic.
• Bash Formatting: Use standard Bash variable naming (`UPPER_CASE` for globals) and standard indentation.
• Data Structures: Preserve the structure of `processed_sources.json` explicitly; schema drift breaks the pipeline.
• Configuration: All paths, target subreddits, and the `TZ` environment variable must be managed centrally within `config.sh`.

### Copywriting Constraints
• Tone: Natural, warm, conversational, and direct. Use specific numbers (e.g., $49) instead of words.
• Rhythm: Adhere to 1-3-1-3 pacing. Never exceed 3 sentences in a text block. One empty line between ideas.
• Punctuation: Em-dashes ("—") are strictly banned. Replace with periods or commas.
• Editorial Spine: Every post must follow the non-negotiable sequence: Problem → Solution → Product → Founder. Lead with the pain.
• Identity Lock: Write "They / The founder" — never "I" (except when referencing own product). Act as a Media Analyst Scout.
• Banned Vocabulary: Zero tolerance for AI buzzwords (e.g., delve, harness, unlock, paradigm, robust, seamless, synergy).
• Banned Expression Patterns: Avoid formulaic setups like "In a world where...", "Most people vs few who...", "Stop doing X. Start doing Y."

## Security

• Authentication: Public Reddit endpoints only. No authenticated API calls or tokens required.
• AI Identity Boundaries: The engine must act strictly as an "Observer" and never hallucinate or claim to be the founder of a scouted product.
• Data Privacy: All drafts, configurations, and sensitive logs are kept strictly within the local file system. Excluded from git via `.gitignore`.

## Git Workflows

• Branching strategy: standard feature branches (`feature/` or `bugfix/`) merging into `main`.
• Commit conventions: concise, descriptive commit messages outlining script updates or prompt adjustments.
• PR Requirements: ensure pipeline stability before merging; no fetching logic should be modified without manual verification.

## Evidence Required for Every PR

• Script Testing: Verify `main.sh` successfully completes the scouting phase without errors.
• Template Validation: Any new templates must perfectly match the existing schema in `linkedin-templates.json`.
• Proof Artifact: A sample generated post demonstrating the 1-3-1-3 rhythm and correct Editorial Spine.
• Clean Scrub: Evidence that finalized output contains absolutely no banned AI words or expression patterns.

## External Services

• Reddit API (JSON) - `https://www.reddit.com/r/.../new.json` - Used for thread discovery and full comment extraction.
• Gemini CLI - Local CLI context - Orchestrates text transformation and strategic analysis.

## Gotchas & Common Pitfalls

• `jq` Dependency: Crucial for parsing Reddit's nested JSON structure; pipeline fails immediately without it.
• Rate Limiting: The 2-second `sleep` loop in `reddit.sh` is a mandatory safeguard to prevent IP blocks from Reddit.
• Voice Drift: AI naturally drifts toward first-person "I". You must explicitly enforce a pivot to third-person "They" during the draft phase.
• Timezone Locks: All logs and filenames are pinned to Pakistan Standard Time (Asia/Karachi) via the `TZ` export in `config.sh`.
• Session Memory: Do not commit `content/processed_sources.json` to source control, but it must be preserved locally for cool-down checks.
• Short Content: If the Reddit story is shorter than the selected template, delete extra template sections (bullets/tiers). NEVER hallucinate new facts to fill space.
