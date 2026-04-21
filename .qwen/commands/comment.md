---
description: Generate 1-3 authentic self-comments for a LinkedIn post and append them to the .md file.
---

[ARGUMENT CHECK]
If {{args}} is empty or missing, STOP immediately and print:
  'Usage: /comment <path-to-post.md>'
  'Example: /comment content/posts/2026-04-13_04-30-AM-PKT_topic/01_problem_angle.md'
Do NOT proceed until a valid file path is provided.

Target Post: {{args}}

1. READ THE POST:
   - Load the Markdown file at the provided path.
   - Identify the core argument, pillar (problem/decision/honest), and tone.
   - Note the POSTER_DATA block if present.

2. LOAD CONTEXT:
   - Read 'context/awais-icp.md' — understand the Solo Founder and Curious Builder ICPs.
   - Read 'context/content-pillars.md' — align comment to the post's pillar.
   - Read 'context/identity_rules.md' — maintain voice consistency.
   - Read 'context/COMMENT_RULES.md' — master the comment generation rules.

3. DETERMINE COMMENT COUNT:
   - Randomly pick 1, 2, or 3 comments. Never use the same count as the last session.
   - Check recent session reports in 'reports/' for the last count used.
   - Log the chosen count.

4. SELECT COMMENT TYPES:
   - Pick 2-3 DIFFERENT types from: question, validation, personal_experience, contrarian_addition, resource_drop
   - Never duplicate types within the same post.
   - Align types with the pillar:
     * Pillar 1 (Problem) → question, personal_experience, validation
     * Pillar 2 (Decision) → contrarian_addition, question, resource_drop
     * Pillar 3 (Honest) → validation, personal_experience, contrarian_addition

5. GENERATE COMMENTS:
   - Write comments that sound like a real person on their phone.
   - Use "I" naturally — this is the ONLY place first-person is allowed.
   - Keep each comment to 1-3 sentences. Under 280 characters max.
   - Apply Brad voice touches sparing: "I would say," "pretty," "I mean" (once max).
   - NO banned AI words: delve, harness, unlock, paradigm, leverage, seamless, robust, transformative, innovative, game-changer, elevate, streamline, empower, cutting-edge, scalable, visionary, disruptive, reimagine, holistic, synergy, foster, showcase, enhance
   - NO banned patterns: "In a world where...", "Stop doing X. Start doing Y.", "Here's the truth nobody tells you"
   - NO em-dashes. Use periods or commas only.
   - NO "Great post!" openers. Start with the actual thought.
   - Each comment must relate to the post's actual content.

6. FORMAT AND APPEND:
   - Format each comment as:
     `<!-- [COMMENT_01] type: "question" | text: "The actual comment text here." -->`
   - Number sequentially: [COMMENT_01], [COMMENT_02], [COMMENT_03]
   - Append all comments at the very end of the post .md file.
   - Add one blank line before the first comment.

7. CONFIRMATION:
   - Show the generated comments in the console.
   - Confirm the file was updated.
   - Log: "Generated N comment(s) for [post-filename]: [type1], [type2], [type3]"

