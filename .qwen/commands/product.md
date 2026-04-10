---
description: Product Review Mode: One platform URL -> 3 LinkedIn posts.
---

Pre-flight: Verify {{url}} starts with 'http'.

1. RUN PLUMBING: Execute 'bash lib/fetch_product.sh {{url}}'.
2. LOAD PROTOCOL: Read ALL files in 'context/', specifically 'MASTER_EXECUTION_RULES.md' and 'awais-icp.md'.
3. RELEVANCE GATE: Check relevance against 'context/awais-icp.md'. If it's not a product or related to indie hackers, stop and explain why.
4. EXECUTE MASTER STEPS: Follow the granular workflow defined in 'context/MASTER_EXECUTION_RULES.md'.
   - Focus DEEP on the product story from this URL.
   - PIVOT: Change 'I' (the maker) to 'They/The founder' in all posts.
5. MEMORY: Save final outputs and update 'content/processed_sources.json'.

Begin now using: {{url}}

