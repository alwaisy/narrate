---
description: The Master Content Engine: Scout -> Master Execution.
---

1. RUN PLUMBING: Execute 'bash main.sh scout' to scout the subreddits.
2. PATTERN MATCH: Identify 3 related threads. Filter: Last 7 days, NOT in processed list.
3. LOAD PROTOCOL: Read ALL files in 'context/', specifically 'MASTER_EXECUTION_RULES.md'.
4. EXECUTE MASTER STEPS: Follow the 8-step granular workflow defined in 'MASTER_EXECUTION_RULES.md'.
   - Steps 1-7: Generate 3 posts with POSTER_DATA blocks.
   - Step 8: Auto-generate 1-3 comments per post and append to each .md file.
5. MEMORY: Save final outputs and update 'content/processed_sources.json'.

