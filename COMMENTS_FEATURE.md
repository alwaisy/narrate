# Comments Feature Usage Guide

## Overview

The comments feature automatically generates 1-3 authentic self-comments for your LinkedIn posts and appends them directly to the post `.md` file (same pattern as `[POSTER_DATA]`).

---

## Quick Start

### Using Gemini Command (Recommended)
```bash
/comment /path/to/post.md
```

Example:
```bash
/comment content/posts/2026-04-05_09-44-PM-PKT_distribution-is-the-only-moat/[PUBLISHED]-01_problem_angle.md
```

### Using CLI Directly
```bash
bash main.sh generate_comments /path/to/post.md
```

### Using Dashboard UI
1. Open any post in the dashboard
2. Click **"Generate Comments"** button in the header
3. Post path is copied to clipboard
4. Run `/comment <path>` in your terminal
5. Comments appear in the **Post Comments** panel below the poster preview

---

## How It Works

1. **Reads your post** — Detects the pillar (problem/decision/honest) from filename or content
2. **Loads context** — ICP, content pillars, identity rules, comment writing rules
3. **Determines count** — Randomly picks 1-3 comments (varies per session)
4. **Selects types** — Picks different comment types based on pillar:
   - Problem → question, personal_experience, validation
   - Decision → contrarian_addition, question, resource_drop
   - Honest → validation, personal_experience, contrarian_addition
5. **Generates comments** — Gemini writes authentic comments following COMMENT_RULES.md
6. **Appends to file** — Comments added as HTML comment blocks at the end

---

## Comment Output Format

Comments are appended to your post `.md` file like this:

```markdown
<!-- [COMMENT_01] type: "question" | text: "The distribution-first approach makes sense, but how do you validate the problem before building anything? Curious what others are doing here." -->

<!-- [COMMENT_02] type: "validation" | text: "This. The 60-day community building before launch is what most skip. I've seen two solo founders hit $3k MRR this exact way." -->

<!-- [COMMENT_03] type: "personal_experience" | text: "Learned this the hard way. Spent 4 months building a tool nobody asked for. Switched to posting about the problem first, got 200 signups before writing a single line." -->
```

---

## Comment Types

### 1. **Question** (Engagement Bait)
Asks a genuine question that extends the post's core idea.

> "The distribution-first approach makes sense, but how do you validate the problem before building anything? Curious what others are doing here."

### 2. **Validation** (Specific Detail)
Agrees with the post but adds one concrete detail or number.

> "This. The 60-day community building before launch is what most skip. I've seen two solo founders hit $3k MRR this exact way."

### 3. **Personal Experience** (Short Story)
Shares a related experience in 1-2 sentences. Uses "I".

> "Learned this the hard way. Spent 4 months building a tool nobody asked for. Switched to posting about the problem first, got 200 signups before writing a single line."

### 4. **Contrarian Addition** (Nuance)
Adds a layer that doesn't contradict but complicates the picture.

> "And what's wild is that distribution-first founders also have an easier time pricing. They already have trust built before the ask."

### 5. **Resource Drop** (Tool/Link)
Shares one specific resource that extends the post's value.

> "If anyone wants to see this in practice, look up how Levels.fyi started. They did exactly this — built an audience around the problem before the product."

---

## Writing Rules Applied

### What's Different from Post Writing
- ✅ **Uses "I" freely** — Comments are YOUR thoughts, first-person is expected
- ✅ **Shorter sentences** — 1-2 sentences per comment, max 3
- ✅ **More conversational** — Write like you're replying to a friend
- ✅ **Adds warmth** — "This." "Love this." "Spot on." are fine
- ✅ **Personal takes** — "I think" or "in my experience" sounds natural here

### What Stays the Same (Anti-AI Rules)
- ❌ **No banned words**: delve, harness, unlock, paradigm, leverage, seamless, robust, transformative, innovative, game-changer, elevate, streamline, empower, cutting-edge, scalable, visionary, disruptive, reimagine, holistic, synergy, foster, showcase, enhance
- ❌ **No banned patterns**: "In a world where...", "Stop doing X. Start doing Y.", "Here's the truth nobody tells you"
- ❌ **No em-dashes** — Periods or commas only
- ❌ **No robotic structure** — Don't start with "Great post!" followed by summary
- ❌ **No "As the author"** — Comment like a reader, never reference yourself as the post writer

### Brad Voice Human Touch
Comments include natural patterns like:
- "I would say" — Before sharing an opinion
- "I mean" — Once per comment max, only when rephrasing
- "Pretty" — As intensifier: "pretty wild," "pretty common"
- "A ton of" — Instead of "many" or "numerous"
- "Basically" — Before simplifying
- Start with And/But/So — Creates forward motion

---

## Files Created

1. **context/COMMENT_RULES.md** — Complete comment writing guidelines
2. **.gemini/commands/comment.toml** — Gemini command definition
3. **lib/generate_comments.sh** — Generation script
4. **main.sh** — Updated with `generate_comments` command

---

## Workflow Integration

### After Generating a Post
```bash
# 1. Generate the post normally
gemini go

# 2. Add comments to the post
/comment content/posts/2026-04-13_04-30-AM-PKT_your-post/01_problem_angle.md

# 3. Review comments in the file
cat content/posts/2026-04-13_04-30-AM-PKT_your-post/01_problem_angle.md

# 4. Edit if needed (comments are in HTML comment blocks)
```

### Batch Processing (Future Enhancement)
You could add a loop to process all posts in a session:
```bash
for post in content/posts/2026-04-13_*/0*.md; do
    /comment "$post"
done
```

---

## Configuration

### Adjust Comment Count
Edit `lib/generate_comments.sh`, line ~55:
```bash
# Change default or modify the randomization logic
COMMENT_COUNT=$(determine_comment_count)  # Currently: 1-3 randomized
```

### Change Comment Type Preferences
Edit `lib/generate_comments.sh`, lines ~72-85 to adjust which types map to which pillars.

### Modify Writing Style
Edit `context/COMMENT_RULES.md` to adjust:
- Banned words list
- Brad voice patterns
- Comment type definitions
- Character limits (currently 280)

---

## Quality Checklist

Before posting, verify:
- [ ] 1-3 comments generated (not always the same number)
- [ ] Each comment has a different type
- [ ] All comments under 280 characters
- [ ] No banned AI words or patterns
- [ ] No em-dashes
- [ ] Uses "I" naturally (not forced)
- [ ] Sounds like a real person, not a bot
- [ ] Relates to the post's actual content
- [ ] Aligned with the post's pillar
- [ ] Formatted correctly as HTML comments

---

## Troubleshooting

### "Post file not found" error
Make sure the path is correct and the file exists:
```bash
ls content/posts/
```

### Comments don't match pillar
The script detects pillar from:
1. Filename (contains "problem", "decision", or "honest")
2. POSTER_DATA block `pillar:` field
3. Falls back to "unknown"

### Same comment count every time
The script checks recent session reports to vary the count. Make sure `reports/` directory exists and contains session reports.

---

## Why 1-3 Comments?

- **1 comment**: Minimal engagement, looks natural for shorter posts
- **2 comments**: Sweet spot for most posts (default recommendation)
- **3 comments**: Maximum before it looks suspicious

Adding more than 3 comments from your own account looks artificial and can hurt credibility. The system varies the count automatically to avoid patterns.

---

## Next Steps (Future Enhancements)

Potential additions:
1. **Batch mode**: `/comment_all` to add comments to all posts in a session
2. **Comment history**: Track which comments were generated when
3. **A/B testing**: Generate multiple comment sets, pick the best
4. **Scheduled posting**: Auto-post comments at intervals after publishing
5. **Comment analytics**: Track which comment types get the most replies
