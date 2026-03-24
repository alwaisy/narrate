# LinkedIn Post Generator (Brain-Powered CLI)

A "Brain + Bash" content engine. 

## 1. How to Run It

Run the master script:
```bash
bash main.sh
```

## 2. What the Engine Does (The Workflow)

### Phase 1: Discovery (`lib/reddit.sh`)
- Fetches top 10 "hot" threads from your 10 niche subreddits.
- Saves raw metadata for Brain analysis.
- **Log:** `logs/session_YYYY-MM-DD.log` shows exactly which subreddits were hit.

### Phase 2: Selection (The Brain Step)
- I (Gemini) scan all thread titles.
- I pick the 3 highest-signal threads based on your **Content Strategy**.
- **Log:** I record my reasoning for choosing each thread.

### Phase 3: Deep Fetch (`lib/fetch_thread.sh`)
- Pulls full body text and top comments for the selected 3.
- **Log:** Records the exact number of comments processed per thread.

### Phase 4: Draft & Polish (The Brain Step)
- **Step 1: Drafting.** I map the thread to a specific template in `product/linkedin-templates.json`.
- **Step 2: Polishing.** I re-read your **LinkedIn Ghostwriter OS** and **Viral Post Guide**. I then rewrite the post to ensure:
    - No "AI-isms" (leverage, delve, etc.).
    - One idea per line.
    - Hook lands in the first 2 lines.

## 3. The Output (9 Posts Total)

The engine generates **3 threads × 3 angles each = 9 total LinkedIn posts.**

- **Angle A:** Problem-First (Pillar 1)
- **Angle B:** Decision Breakdown (Pillar 2)
- **Angle C:** Honest/Personal Side (Pillar 3)

### Output Location:
`content/posts/YYYY-MM-DD_[Topic_Name]/`
- `01_problem_angle.md`
- `02_decision_angle.md`
- `03_honest_angle.md`

## 4. Reporting
A final session report is saved in `reports/`. 
It includes:
- Source Reddit URLs.
- Comment counts read.
- Brain reasoning for template selection.
- Mapping of Thread -> 3 Drafts.
