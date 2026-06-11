# Foundation Gazette Design System

> Category: Warm Editorial
> A dual-theme premium magazine aesthetic. The UI shell uses a modern dark glassmorphic container, while the core reading content flips between an ivory-white paper layout (Light Mode) and a charcoal carbon layout (Dark Mode).

## Visual Theme & Atmosphere
The interface combines a high-tech outer control shell (dark, semi-transparent, blurred) with a literary print-clipping reader core. The reading view mimics a physical newspaper clipping, prioritizing letterpress alignment, organic ink textures, and high readability.

## Color Palette & Roles

### 1. Light Mode (Default Paper Core)
*   **Paper Background (`--mag-bg`):** `#fdfcf9` (warm classic ivory white paper).
*   **Alternate Background (`--mag-bg-alt`):** `#f5f3ee` (slightly warmer secondary surface).
*   **Ink Black / Headers (`--mag-text`):** `#080808` (high-contrast printing ink black for displays, titles, and borders).
*   **Soft-Ink Gray / Body Text (`--mag-text-body`):** `#2c2c2c` (charcoal gray for body text to reduce eye strain).
*   **Accent Stamp Red (`--mag-accent`):** `#a6261b` (classic organic jujube stamp red / 棗朱紅) — used for highlights, quotes, and primary CTAs.
*   **Secondary Ink-Line Border (`--mag-border`):** `#e0ddd6` (muted wheat-colored border line).

### 2. Dark Mode (`[data-theme="dark"]` Carbon Core)
*   **Carbon Background (`--mag-bg`):** `#111114` (deep carbon-paper charcoal black).
*   **Alternate Background (`--mag-bg-alt`):** `#1a1a1e` (secondary carbon surface).
*   **Chalk White / Headers (`--mag-text`):** `#e8e6e1` (chalky white for high-contrast headers).
*   **Chalk Body Text (`--mag-text-body`):** `#d0cec8` (soft gray-white for paragraphs).
*   **High-Contrast Accent Red (`--mag-accent`):** `#d4483b` (brightened red to ensure accessibility and contrast safety on dark surfaces).
*   **Border line (`--mag-border`):** `#2a2a2e` (subtle dark border).

### 3. Outer UI Container Shell (Sidebar, Modals, Drawer)
*   **Background:** `#0d0d12` / `#111116` (deep dark theme).
*   **Border:** `#1e1e28` (cool metallic dark border).
*   **Text:** `#e2e2ec` / `#6b6b7e`.
*   **Accent Blue:** `#58a6ff` / `#79b8ff` (interface action blue).

## Typography Rules
*   **English Display & Accents:** `'Playfair Display', serif` — for the top masthead name (`.eng-title`), large numbers, big quotes, and citation credits.
*   **Chinese Titles & Subtitles:** `'Noto Serif TC', serif` — for main column titles (`.spark-title`), section subtitles, and article headings.
*   **Chinese Body Text Paragraphs (`.article-paragraph`):**
    *   Font: `'Noto Serif TC', serif`
    *   Color: `var(--mag-text-body)` (charcoal `#2c2c2c` in light mode, `#d0cec8` in dark mode)
    *   Line-Height: `1.95` (generous vertical spacing to prevent dense, exhausting blocks)
    *   Letter-Spacing: `0.02em` (subtle breathing room between characters)
    *   Indent: `text-indent: 2em;` by default. First paragraph of an article, or any paragraph directly following a subtitle (`.article-subtitle + .article-paragraph`), has **no indent** (`text-indent: 0;`).
*   **News Bulletins & Summaries:** `'Noto Sans TC', sans-serif` — providing clean, modern micro-reading in double-column grids.

## Component Stylings
*   **Slogan Cards:** Left-aligned callouts with a `3px solid var(--paper-accent)` border on the left and a translucent reddish background (`rgba(166, 38, 27, 0.02)`).
*   **Double-Line Borders:** Containers (e.g. share card outer container, top/bottom banners) must use double borders: `border: 3px double #1c1c1c` or `var(--paper-border)`.
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
*   **Inner Magazine Core:** Strictly flat (2D). No neumorphism, no Z-shadows. Simulates paper grain rather than depth.
*   **Outer UI Shell & Modals:** Uses modern glassmorphism and overlay blurs:
    *   Sidebar: `backdrop-filter: blur(16px)` with a dark transparent background.
    *   Share Modal Overlay: `backdrop-filter: blur(8px)` with `rgba(5, 5, 10, 0.85)`.
    *   Feedback Banner: `backdrop-filter: blur(12px)` with `rgba(20, 20, 28, 0.85)` and a red glow box-shadow.

## Do's and Don'ts
*   ✅ **Do** give headings ample top margins so that text sections don't run together.
*   ✅ **Do** use title-case for English labels and subtitle headers.
*   ❌ **Don't** hardcode the red accent color as `#a6261b` in dark mode; use `var(--mag-accent)` (which evaluates to `#d4483b` in dark mode for contrast accessibility).
*   ❌ **Don't** use AI-generated images directly unless official visuals are completely absent.
*   ❌ **Don't** leak internal messages or greetings (e.g. "Hi Editor...") into the public text nodes.
