# 基地日報網站改建工程：全站視覺美學與互動體驗終極優化施工計劃書

本計劃書旨在以最嚴格、專業的網頁設計與軟體工程標準，對「基地日報（Foundation Gazette）」網站進行全面性的視覺與功能升級。我們的終極目標是將其打造成一個**細節極致、極具精品感、且具備沉浸式模擬閱讀體驗**的現代數位雜誌網站。

本計畫共列出 **6 項核心施工任務**，涵蓋視覺修復、物理效果模擬、互動微動畫、編輯器體驗及行動端適應性。

---

## 🎯 任務清單與核心設計變更

> [!IMPORTANT]
> **本計畫的核心設計變更：**
> 1. **詳情彈窗主題自適應**：新聞詳情彈窗在 Light Mode 下將翻轉為象牙白紙質背景，徹底修復在 Light/Dark Mode 下均會出現的黑底黑字對比度缺陷。
> 2. **全站 SVG 物理油墨暈染濾鏡**：使用 SVG `feTurbulence` 和 `feDisplacementMap` 技術，實作高擬真的實體報紙油墨邊緣擴散效果，並套用於全站 Serif 文字上。
> 3. **行動端導航欄重構**：在手機版（<768px）下隱藏常態側邊欄，改為右上角毛玻璃效果的 Hamburger Menu 覆蓋層。

---

## 💡 開放設計裁量與建議

> [!NOTE]
> **全站 SVG 油墨 displacement 濾鏡效能考量：**
> 為了防範在低效能裝置上產生滾動卡頓，我將此物理濾鏡與側邊欄的「復古油墨濾鏡」開關相綁定。若偵測到卡頓，使用者只需關閉該功能即可恢復純 GPU 加速的標準向量渲染，安全且兼顧高視覺追求者。

---

## 🛠️ 具體修改指引 (Code Modifications)

### 任務 1：新聞詳情彈窗（News Detail Modal）視覺設計與自適應對比度優化

#### 1.1 前端結構層 [index.html](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/index.html)
* **修改位置 (行 668 附近)**：在 `#newsDetailModal` 的 `.modal-body` 內，於 `#newsModalImage` 與 `#newsModalExcerpt` 之間插入一個用於動態展示圖片說明的標籤 `#newsModalImageCaption`。
```html
<div id="newsModalImage" style="width: 100%; height: 300px; background-size: cover; background-position: center; border-radius: 8px; margin-bottom: 20px; display: none;"></div>
<!-- 新增：新聞圖片說明區 -->
<div id="newsModalImageCaption" style="font-family: 'Noto Serif TC', serif; font-size: 0.78rem; color: var(--mag-text-light); margin-top: -12px; margin-bottom: 20px; text-align: center; font-style: italic; display: none;"></div>
<div id="newsModalExcerpt" style="font-family: 'Noto Serif TC', serif; font-size: 0.95rem; line-height: 1.8; color: var(--mag-text-body); text-align: justify; white-space: pre-wrap;"></div>
```

#### 1.2 行為邏輯層 [app.js](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/app.js)
* **修改位置 (行 1695-1716 附近)**：更新 `syncNewsCards` 內的卡片點擊事件。取得編輯器內的「圖片說明 (imgCap)」，在點擊小卡展開彈窗時，寫入新宣告的 `#newsModalImageCaption` 節點中，若為空則隱藏。
```javascript
const modalImageCaption = document.getElementById('newsModalImageCaption');
// 在點擊小卡展開時寫入
if (imgUrl) {
    modalImage.style.backgroundImage = `url('${imgUrl}')`;
    modalImage.style.display = 'block';
    if (modalImageCaption) {
        if (imgCap) {
            modalImageCaption.textContent = imgCap;
            modalImageCaption.style.display = 'block';
        } else {
            modalImageCaption.style.display = 'none';
        }
    }
} else {
    modalImage.style.display = 'none';
    if (modalImageCaption) modalImageCaption.style.display = 'none';
}
```

#### 1.3 視覺樣式層 [style.css](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/style.css)
* **修改位置 (末尾追加)**：覆寫 `#newsDetailModal` 的內部樣式，使其底色改為 `var(--mag-bg)`。將彈窗內的標題、內文、子標題、金句等色彩全部綁定至主題色，以徹底解決文字對比度缺陷；並將關閉按鈕設計為帶有圓形半透明背景與 transition 的懸停光暈。
```css
/* ==========================================================================
   19. NEWS DETAIL MODAL THEME OVERRIDES (視覺監修與對比度優化)
   ========================================================================== */

#newsDetailModal .share-modal {
    background-color: var(--mag-bg) !important;
    border: 1px solid var(--mag-border) !important;
    box-shadow: 0 20px 50px var(--mag-shadow, rgba(0, 0, 0, 0.15)) !important;
}
#newsDetailModal .modal-header {
    border-bottom: 1px solid var(--mag-border) !important;
}
#newsDetailModal .modal-close-btn {
    color: var(--mag-text-light) !important;
    outline: none !important;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s, color 0.2s;
}
#newsDetailModal .modal-close-btn:hover {
    background-color: var(--mag-accent-light) !important;
    color: var(--mag-accent) !important;
}
#newsDetailModal .article-paragraph {
    color: var(--mag-text-body) !important;
}
#newsDetailModal .article-subtitle {
    color: var(--mag-text) !important;
    border-left: 3px solid var(--mag-accent) !important;
}
#newsDetailModal .article-slogan {
    color: var(--mag-accent) !important;
    border-left: 3px solid var(--mag-accent) !important;
    background-color: var(--mag-accent-light) !important;
}
@media (max-width: 768px) {
    #newsDetailModal #newsModalImage {
        height: 200px !important;
        margin-bottom: 14px !important;
    }
}
```

---

### 任務 2：全站沉浸式復古油墨與紙張纖維濾鏡（Analog Ink & Fiber Filter）

#### 2.1 前端結構層 [index.html](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/index.html)
* **修改位置 (body 底部)**：在 `<body>` 底層注入一組隱藏的 SVG 濾鏡定義，用於模擬實體油墨紙張渲染效果。
```html
<!-- Immersive Analog Ink Filter Definition -->
<svg style="position: absolute; width: 0; height: 0;" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="ink-bleed">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" result="displaced" />
      <feGaussianBlur in="displaced" stdDeviation="0.35" result="blurred" />
      <feMerge>
        <feMergeNode in="blurred" />
        <feMergeNode in="SourceGraphic" opacity="0.3" />
      </feMerge>
    </filter>
  </defs>
</svg>
```

#### 2.2 行為邏輯層 [app.js](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/app.js)
* **修改位置 (toggleInkFilter 監聽器附近)**：更新 `toggleInkFilter` 監聽器。開啟時，除了 `gazetteCard`，也要同時將 `.ink-filter` 類別切換至全站主容器 `#magazineMain`。
```javascript
if (toggleInkFilter) {
    toggleInkFilter.addEventListener('change', () => {
        if (isRestoring) return;
        const active = toggleInkFilter.checked;
        gazetteCard.classList.toggle('ink-filter', active);
        const magazineMain = document.getElementById('magazineMain');
        if (magazineMain) {
            magazineMain.classList.toggle('ink-filter', active);
        }
        autoSaveDraft();
    });
}
```

#### 2.3 視覺樣式層 [style.css](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/style.css)
* **修改位置 (末尾追加)**：在 `.ink-filter` 啟用時，將 SVG 濾鏡套用至主站的所有 Serif 文字（大標題、內文、引言段落等），並將主站內的圖片一併套用懷舊 Sepia/灰階濾鏡，達成高度統一的紙質印刷氛圍。
```css
/* 全站 Serif 文字油墨貼圖擴散 */
.ink-filter h1,
.ink-filter h2,
.ink-filter h3,
.ink-filter h4,
.ink-filter blockquote,
.ink-filter .article-paragraph,
.ink-filter .article-subtitle,
.ink-filter .article-slogan {
    filter: url(#ink-bleed) !important;
}

/* 主網頁所有圖片復古灰階對齊 */
.ink-filter .news-card-image,
.ink-filter .reading-body img,
.ink-filter #heroImage,
.ink-filter #newsModalImage {
    filter: grayscale(1) contrast(1.15) sepia(0.25) brightness(0.95) !important;
}
```

---

### 任務 3：主題切換平滑過渡（Smooth Theme Transition）

#### 3.1 視覺樣式層 [style.css](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/style.css)
* **修改位置 (末尾追加)**：為全站的雜誌長網頁容器、小卡、邊框與文字加上過渡動畫，避免 toggling 主題時畫面產生閃爍或瞬間生硬變色。
```css
.magazine,
.magazine *,
.sidebar,
.sidebar * {
    transition: background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
}
```

---

### 任務 4：精英級滾動錨點與導航追蹤（Scrollspy & Navigation Polish）

#### 4.1 前端結構層 [index.html](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/index.html)
* **修改位置 (toc-container 下方)**：在 Hero 區塊的底部，新增一個滑稽浮動的「向下滾動指示器」，提示讀者下方有正文。
```html
<div class="scroll-indicator" id="scrollIndicator">
    <a href="#articleSection">
        <span class="scroll-arrow">↓</span>
        <span class="scroll-text">SCROLL TO READ // 向下滾動閱讀</span>
    </a>
</div>
```

#### 4.2 視覺樣式層 [style.css](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/style.css)
* **修改位置 (末尾追加)**：為向下指示器設計精緻樣式與浮動動畫（keyframe bounce），並設計 Sidebar Link 被 highlit 激活時的狀態。
```css
/* 向下滾動指示器 */
.scroll-indicator {
    position: absolute;
    bottom: 25px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    z-index: 10;
}
.scroll-indicator a {
    text-decoration: none;
    color: var(--mag-text-light);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.15em;
    transition: color 0.3s;
}
.scroll-indicator a:hover {
    color: var(--mag-accent);
}
.scroll-arrow {
    font-size: 1.1rem;
    animation: indicator-bounce 1.6s infinite ease-in-out;
}
@keyframes indicator-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(6px); }
}

/* Sidebar Active Link Style */
.sidebar-link.active-section {
    background-color: var(--mag-accent-light) !important;
    color: var(--mag-accent) !important;
    font-weight: 700;
}
.sidebar-link.active-section .sidebar-link-icon {
    transform: scale(1.15);
}
```

#### 4.3 行為邏輯層 [app.js](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/app.js)
* **修改位置 (自訂 Scrollspy 函式)**：使用 `IntersectionObserver` 監聽大區塊滾動，動態高亮 Sidebar 中對應的日報或選單鏈結。
```javascript
function initScrollspy() {
    const sections = ['heroSection', 'articleSection', 'newsSection'];
    const navLink = document.getElementById('btnSidebarHome');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (navLink) navLink.classList.add('active-section');
            }
        });
    }, { threshold: 0.2 });
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
}
// 於 initializeApp 中調用 initScrollspy()
```

---

### 任務 5：編輯器抽屜折疊分組與自動存檔反饋（Editor UX Polish）

#### 5.1 前端結構層 [index.html](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/index.html)
* **修改位置 (editor-drawer 內)**：為右側滑出的編輯器 Drawer 添加分組折疊面板結構。將原先繁雜的輸入框按模組分組，使用帶有展開收合圖示的 Accordion Header 包裹。
```html
<div class="editor-accordion">
    <!-- 分組 1：期刊基礎資訊 -->
    <div class="accordion-item open">
        <div class="accordion-header">📰 期數與基本設定</div>
        <div class="accordion-content">
            <!-- 原期刊基礎欄位 -->
        </div>
    </div>
    <!-- 分組 2：美學星火專題 -->
    <div class="accordion-item">
        <div class="accordion-header">✨ 美學星火專題</div>
        <div class="accordion-content">
            <!-- 原星火欄位 -->
        </div>
    </div>
    <!-- 分組 3：時事動態 -->
    <div class="accordion-item">
        <div class="accordion-header">時事新聞編輯</div>
        <div class="accordion-content">
            <!-- 原新聞欄位容器 -->
        </div>
    </div>
</div>
<!-- 自動存檔提示浮動小標籤 -->
<div id="editorAutosaveToast" class="autosave-toast">💾 草稿已自動存檔</div>
```

#### 5.2 視覺樣式層 [style.css](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/style.css)
* **修改位置 (末尾追加)**：設計 Accordion 分組的折疊動畫、邊框樣式，並為自動存檔 Toast 設計淡入淡出及定位樣式。
```css
/* Accordion 折疊面板 */
.editor-accordion {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.accordion-item {
    border: 1px solid var(--ui-border);
    border-radius: 6px;
    background: var(--ui-input-bg);
    overflow: hidden;
}
.accordion-header {
    padding: 12px 16px;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--ui-text);
    background: #15151e;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
    transition: background 0.2s;
}
.accordion-header:hover {
    background: #1e1e28;
}
.accordion-header::after {
    content: '▼';
    font-size: 0.6rem;
    transition: transform 0.2s;
}
.accordion-item.open .accordion-header::after {
    transform: rotate(180deg);
}
.accordion-content {
    padding: 16px;
    display: none;
    border-top: 1px solid var(--ui-border);
}
.accordion-item.open .accordion-content {
    display: block;
}

/* 自動存檔 Toast */
.autosave-toast {
    position: fixed;
    bottom: 20px;
    right: 300px; /* 避開編輯面板 */
    background: rgba(8, 8, 12, 0.9);
    border: 1px solid var(--ui-accent);
    color: var(--ui-accent);
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.72rem;
    padding: 8px 16px;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
    transition: opacity 0.3s, transform 0.3s;
    z-index: 1010;
}
.autosave-toast.show {
    opacity: 1;
    transform: translateY(0);
}
```

#### 5.3 行為邏輯層 [app.js](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/app.js)
* **修改位置 (末尾追加與 autoSaveDraft 修改)**：
  1. 綁定 Accordion Header 的點擊事件，切換 `.open` 類別以控制內容收合。
  2. 修改 `autoSaveDraft`，在成功存入 localStorage 後，動態為 `#editorAutosaveToast` 加入 `.show` 類別，並於 1.5 秒後自動消失。
```javascript
// Accordion 點擊控制
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        item.classList.toggle('open');
    });
});

// 自動存檔 Toast 反饋
function showAutosaveToast() {
    const toast = document.getElementById('editorAutosaveToast');
    if (toast) {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 1500);
    }
}
// 請在 autoSaveDraft 內保存成功後加入調用：showAutosaveToast();
```

---

### 任務 6：行動裝置端佈局適應性優化（Mobile Responsive Polish）

#### 6.1 前端結構層 [index.html](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/index.html)
* **修改位置 (body 頂部)**：在頂部新增一個專為行動端設計的 Hamburger Menu 切換按鈕。
```html
<!-- Mobile Hamburger Button -->
<button class="mobile-menu-btn" id="btnMobileMenu" aria-label="選單">
    <span></span><span></span><span></span>
</button>
```

#### 6.2 視覺樣式層 [style.css](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/style.css)
* **修改位置 (末尾追加)**：在 `@media (max-width: 768px)` 中，將左側側邊欄預設隱藏，改為懸浮 Hamburger 觸發。點擊時，側邊欄會以高雅的毛玻璃覆蓋層（backdrop-filter）樣式滑出展示。
```css
/* Mobile menu button */
.mobile-menu-btn {
    display: none;
    position: fixed;
    top: 16px;
    right: 16px;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: var(--ui-sidebar-bg);
    border: 1px solid var(--ui-border);
    cursor: pointer;
    z-index: 990;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
}
.mobile-menu-btn span {
    display: block;
    width: 18px;
    height: 2px;
    background: var(--ui-text);
    transition: transform 0.3s, opacity 0.3s;
}

@media (max-width: 768px) {
    .mobile-menu-btn {
        display: flex;
    }
    /* 側邊欄改為滑出式覆蓋層 */
    .sidebar {
        position: fixed !important;
        left: -260px !important; /* 隱藏於左側 */
        top: 0;
        height: 100vh;
        width: 260px !important;
        z-index: 980;
        backdrop-filter: blur(12px) !important;
        background: rgba(17, 17, 22, 0.92) !important;
        box-shadow: 10px 0 30px rgba(0,0,0,0.5);
    }
    .sidebar.mobile-open {
        left: 0 !important;
    }
    .magazine {
        padding-left: 0 !important; /* 滿幅 */
    }
}
```

#### 6.3 行為邏輯層 [app.js](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/app.js)
* **修改位置 (末尾追加)**：綁定行動端 Hamburger Menu 點擊事件，切換側邊欄的 `.mobile-open` 類別。
```javascript
const btnMobileMenu = document.getElementById('btnMobileMenu');
const sidebarEl = document.getElementById('sidebar');
if (btnMobileMenu && sidebarEl) {
    btnMobileMenu.addEventListener('click', () => {
        sidebarEl.classList.toggle('mobile-open');
        btnMobileMenu.classList.toggle('open-active');
    });
}
```

---

## 🧪 驗證計畫 (Verification Plan)

### 自動化渲染測試 (Automated rendering test)
* 執行測試腳本，確保無頭模式編譯無任何 JS/CSS 錯誤：
  `powershell -ExecutionPolicy Bypass -File scratch/take_our_screenshots.ps1`

### 手動驗證指引 (Manual Verification)
1. **詳情彈窗對比度與主題測試**：
   * 點擊新聞小卡展開彈窗。
   * 切換 Light/Dark 主題，確認彈窗背景與文字對比度皆自適應調整，不出現黑底黑字。
   * 確認「圖片說明」字樣成功顯示在封面圖正下方。
2. **物理油墨與過渡特效測試**：
   * 在側邊欄勾選「復古油墨濾鏡」，檢視全站文字是否呈現舊報紙的微弱邊緣墨暈效果。
   * 切換 Dark Mode，驗證變色是否具備 0.4 秒流暢漸變。
3. **Scrollspy 與行動版重塑測試**：
   * 下拉滾動網頁，驗證箭頭指示器正常運作。
   * 將視窗縮窄至手機寬度，側邊欄應自動隱藏，右上角出現懸浮選單按鈕，點擊後側邊欄應流暢地以高透明毛玻璃覆蓋層滑出。
