# Foundation Gazette Design System

> Category: Warm Editorial
> A premium, literary paper-clipping aesthetic. Warm ivory-white paper canvas, high-contrast ink-black headers, jujube stamp red accents, and soft-ink serif typography optimized for long-form screen reading.

## Visual Theme & Atmosphere
The design evokes a "curated, tangible newspaper clipping from a forgotten archive." It combines traditional letterpress aesthetics with modern digital readability. Generous breathing room, asymmetric grid alignments, and subtle analog textures form the core feeling.

## Color Palette & Roles
*   **Paper Background (`--paper-bg`):** `#fdfcf9` (warm classic ivory white paper).
*   **Ink Black / Headers (`--paper-text`):** `#080808` (high-contrast printing ink black for displays, titles, and borders).
*   **Soft-Ink Gray / Body Text:** `#2c2c2c` (softened charcoal gray used for Chinese body paragraphs to reduce screen-glare eye strain).
*   **Accent Red (`--paper-accent`):** `#a6261b` (classic organic jujube stamp red / 棗朱紅) — used sparingly for tag banners, focus outlines, and key citations.
*   **Warm Ink-Line Border (`--paper-border-light`):** `#c7baa1` (muted golden-wheat border line for secondary grid borders).
*   **No-Signal Background:** `#f3edd8` (warm parchment color for offline placeholders).

## Typography Rules
*   **English Display & Accents:** `'Playfair Display', serif` — for the top masthead name (`.eng-title`), large numbers, big quotes, and citation credits.
*   **Chinese Titles & Long-form Text:** `'Noto Serif TC', serif` — for main column titles (`.spark-title`), section subtitles, and body text.
*   **Chinese Body Text Paragraphs (`.article-paragraph`):**
    *   Font: `'Noto Serif TC', serif`
    *   Color: `#2c2c2c` (Soft-Ink Gray)
    *   Line-Height: `1.95` (generous vertical spacing to prevent dense, exhausting blocks)
    *   Letter-Spacing: `0.02em` (subtle breathing room between characters)
*   **News Bulletins & Summaries (`.news-summary`):** `'Noto Sans TC', sans-serif` — providing clean, modern micro-reading in double-column grids.

## Component Stylings
*   **Slogan Cards:** Left-aligned callouts with a `3px solid #a6261b` border on the left and a translucent reddish background (`rgba(166, 38, 27, 0.02)`).
*   **Double-Line Borders:** Standard containers (e.g. share card outer container) must use a double-border styling: `border: 3px double #1c1c1c` or `#080808`.
*   **Hand-Stamp Badges (Tag Labels):**
    *   Handcrafted imperfection: Must rotate slightly (between `-1deg` and `0.8deg`).
    *   Stamp texture: Background `rgba(166, 38, 27, 0.04)`.
    *   Letterpress compression: Apply `transform: scale(0.9, 1.35)` to stretch text vertically, mimicking rubber stamp pressure.
*   **No-Signal Placeholders:** Display `📡 NO SIGNAL` inside a `#f3edd8` container with a gentle breathing pulse animation.

## Layout Principles
*   **Single-Column Deep-Read:** The main feature article must use a single-column layout centered on the viewport, with a maximum width of `680px`.
*   **Asymmetric News Grid:** News updates must be presented in a side-by-side two-column grid to create a lively, asymmetrical flow.
*   **Block Isolation (Page Break Defense):** Apply `break-inside: avoid` on paragraphs, subtitles, and callout cards to prevent ugly splitting across columns or screenshot crops.

## Depth & Elevation
*   **Strictly Flat (2D):** No modern neumorphism, glassmorphism, or heavy digital drop shadows.
*   **Texture Over Shadow:** Use the noise overlay (`.paper-texture` with a high-translucency gradient of `rgba(255, 255, 255, 0.96)`) to simulate paper grain rather than giving elements Z-index elevation.

## Do's and Don'ts
*   ✅ **Do** give headings ample top margins so that text sections don't run together.
*   ✅ **Do** use title-case for English labels and subtitle headers.
*   ❌ **Don't** use pure dead black (`#000000`) for body text; keep it to `#2c2c2c`.
*   ❌ **Don't** use AI-generated images directly unless official visuals are completely absent and the image is explicitly labeled as a "schematic illustration" (示意圖).
*   ❌ **Don't** leak internal messages or greetings (e.g. "Hi Editor...") into the public text nodes.

## Responsive Guidelines
*   **Desktop (>= 1024px):** Single-column layout maxed at 680px for columns, news grid displayed side-by-side.
*   **Mobile (< 640px):** Single-column stack for all elements, margins and paddings reduced by 30%.
