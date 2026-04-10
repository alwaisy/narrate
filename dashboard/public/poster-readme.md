Hey guys. So, I wanted to start this README off by saying something that I think a lot of you need to hear. You don't need to master every single new, hyped-up design tool just to post on LinkedIn. I know it feels like if you aren't using the absolute latest design SaaS, you're somehow falling behind. But that's an illusion.

You just need a solid, simple workflow to get your story out there.

That's exactly why I built post-card-gen.sh. I hate all the overhyping when it comes to social media tools. This is just a clean, zero-dependency, browser-based image generator for indie founders. It gives you a sleek, Monokai-themed code-editor aesthetic for your posts. No BS, no complex setups. Let's get into it.

🧠 How the System Actually Works

This tool is entirely static. It's just you, your browser, and a live preview.

You've got your sidebar controls on the left and the live canvas on the right. The canvas scales to fit your screen, but underneath, it's always a pixel-perfect 1080x1080 square. When you hit download, it snaps back to its native resolution, takes a snapshot using html2canvas, and drops a clean PNG right onto your machine.

🎨 The Meat and Potatoes (Features)

Here is a breakdown of what's inside and why it's there. My job is to give you a tool that actually helps you build, not just something that looks flashy.

The Strategy Pillars: You aren't just posting to post. You select a real angle—Problem, Decision, or Honest. This changes the colored badge and the fake filename (like problem-angle.md). It anchors your post to a real framework.

The Typography Engine: I put together a curated list of solid Google Fonts. You don't need a shallow understanding of 20 different font pairings; just pick the one that clicks with your brand (Modern, Editorial, Display, or Monospace) and master it.

The Hook / Headline: This is the core of it. It auto-resizes as you type, so you aren't wasting time messing with CSS. And here's a cool feature: highlight any text in the headline, and a popup lets you apply Monokai syntax-highlighting colors (Pink, Green, Purple, etc.) to specific words.

Descriptions (// Comments): These are dynamic. Add them, edit them, remove them. If you delete them all, your headline just auto-centers. It keeps the developer aesthetic going without being too loud.

The Footer: It displays your core framework (Problem → Solution → Product → Founder), your 𝕏 handle, and your domain. It watermarks your stuff nicely.

⚙️ Automating the Repetitive Stuff (URL Params)

My tip is that when you find yourself doing repetitive tasks over and over, that's when you bring in automation.

If you're integrating this with a CLI or a main application, you don't need to type this out manually every time. Let the app scaffold it out for you. You can launch this template and pre-load all the data instantly using URL Query Parameters.

The Parameters:

Parameter

Default

What it does

pillar

problem

Accepts problem, decision, or honest.

headline

(HTML string)

The main hook. Accepts raw text or HTML <span> tags for colors.

headlineFont

'Outfit', sans-serif

The exact CSS font-family string.

descriptionItems

(JSON Array)

Stringified JSON array of text lines (e.g., ["Line 1", "Line 2"]).

descriptionFont

'JetBrains Mono', monospace

Exact CSS font-family string for descriptions.

date

YYYY-MM-DD

Date string displayed in the top right.

How to plug it in:

Just construct a URL like this and the tool will do the heavy lifting:

index.html?pillar=honest&headline=My%20New%20Hook&headlineFont='Space Grotesk', sans-serif&descriptionItems=["First line of context.", "Second line of context."]&date=2026-04-10


(Make sure to encodeURIComponent() your values in production!)

💡 My Honest Advice for Using This

Stop treating every post like required homework. You don't have to have an opinion on every new piece of tech news. Use this generator to share your actual building process.

Go deep, keep it simple. The tool handles long descriptions, but social media users don't. Keep the // comments short. Let the actual post text do the heavy lifting.

Use the 2x Export: LinkedIn compresses images heavily. Always hit the Download 2x (2160 × 2160) button so your text stays perfectly crisp.

That's it, guys. Dive deep, focus on the fundamentals, and keep building.