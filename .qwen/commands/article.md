---
description: Article Scalpel: One URL -> Master Execution.
---

Pre-flight: Verify {{url}} starts with 'http'.

1. RUN PLUMBING: Execute 'bash main.sh fetch_article {{url}}'.
2. LOAD PROTOCOL: Read ALL files in 'context/', specifically 'MASTER_EXECUTION_RULES.md' and 'awais-icp (1).md'.
3. RELEVANCE GATE: Check relevance against 'context/awais-icp (1).md'. If it's a meme, rant with no product, or unrelated industry, stop and explain why.
4. EXECUTE MASTER STEPS: Follow the 7-step granular workflow defined in 'MASTER_EXECUTION_RULES.md'.
   - Focus DEEP on the single story from this URL.
   - PIVOT: Change 'I' (the author) to 'They/The founder' in all posts.
5. MEMORY: Save final outputs and update 'content/processed_sources.json'.

Begin now using: {{url}}

