# 基地日報網站改建工程：設計缺陷修正與快取阻礙消除（Phase 3）執行計畫書

本計劃書旨在解決近期由總編輯回報的 **3 個關鍵視覺與互動瑕疵**，並深入分析為什麼之前的修改沒有被正確驗證到的根本原因，以確保改建工程達到完美的精品級水準。

---

## 🎯 問題诊断與根本原因分析

1. **側邊欄展開後收不起來**：
   * **根本原因 A**：在 [style.css](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/style.css) 的 `.sidebar` 類別中定義了 `overflow: hidden`，這使得向右懸掛超出側邊欄主體（`right: -36px`）的收合/展開箭頭按鈕 `.sidebar-toggle` 被完全剪裁遮擋，導致桌上型電腦（Desktop）版無按鈕可按。
   * **根本原因 B**：在 [app.js](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/app.js) 的 `#btnSidebarArchive` ("典藏") 按鈕監聽中，點擊僅會 `classList.add('expanded')`，不具備雙向 Toggle 收合功能。

2. **封面圖（Hero Image）在特定寬度下出現裁切瑕疵**：
   * **根本原因**：`.hero-image` 使用了 `background-position: center`（垂直 50%）。像博爾赫斯（Borges）這類直式（Portrait）人物頭像，當螢幕寬度極寬、高度相對扁平（如 1920x1080 以上寬螢幕）時，圖片會放大填滿容器，導致頭部上方（额头、眼睛）與下巴被過度裁切，畫面上只留下一張「嘴巴與鼻子」，極為突兀。

3. **新聞模組（News Modal）文字顏色錯誤（黑底黑字）**：
   * **根本原因 A（快取阻礙）**：部署至 GitHub Pages 後，[index.html](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/index.html) 中對 CSS 和 JS 的載入參數仍為 `?v=20260606`。因為沒有更新快取清理版本號，導致使用者的瀏覽器仍載入舊版樣式（舊版中沒有 `#newsDetailModal` 的適配顏色，導致它套用舊的預設暗底色 `.share-modal` 配上段落黑字 `.article-paragraph`，造成黑底黑字無法閱讀）。
   * **根本原因 B（測試盲區）**：工程 Agent 雖然寫了自動截圖腳本 `scratch/take_news_modal_screenshot.ps1`，但 [app.js](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/app.js) 中**完全沒有實作**解析網址參數 `openNews=0` 來自動打開新聞彈窗的邏輯。結果截圖腳本截出來的依然是普通首頁，根本沒有檢查到彈窗內部文字，造成了「沒改到卻沒檢查出」的嚴重盲區。

---

## 🛠️ 具體修改指引 (Proposed Changes)

### 1. 樣式與排版調整 (CSS)

#### [MODIFY] [style.css](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/style.css)

* **修正側邊欄溢出控制**：
  將 `.sidebar` 的 `overflow: hidden` 改為 `overflow: visible`，讓桌上型電腦版的側邊欄箭頭切換按鈕正常顯示出來。
  *同時，為防止側邊欄在行動端（Mobile）未展開時在畫面邊緣露出按鈕，必須在行動端媒體查詢中隱藏此按鈕。*
* **修正封面圖裁剪焦點**：
  將 `.hero-image` 的 `background-position` 改為 `center 25%`（對焦至人臉眼睛高度）。在橫向寬螢幕上，裁剪時將保留臉部精華部位。

```diff
 .sidebar {
     position: fixed;
     left: 0;
     top: 0;
     width: var(--sidebar-width);
     height: 100vh;
     background: rgba(17, 17, 22, 0.95);
     backdrop-filter: blur(16px);
     -webkit-backdrop-filter: blur(16px);
     border-right: 1px solid var(--ui-border);
     display: flex;
     flex-direction: column;
     z-index: 500;
     transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
-    overflow: hidden;
+    overflow: visible;
     flex-shrink: 0;
 }
```

```diff
 .hero-image {
     position: absolute;
     top: 0;
     left: 0;
     width: 100%;
     height: 100%;
     background-size: cover;
-    background-position: center;
+    background-position: center 25%;
     background-repeat: no-repeat;
     transition: transform 8s ease-out, opacity 0.6s ease;
     transform: scale(1.02);
 }
```

```diff
  @media (max-width: 768px) {
      .mobile-menu-btn {
          display: flex;
      }
+     /* 行動端隱藏側邊欄箭頭切換按鈕，避免露在螢幕邊緣 */
+     .sidebar-toggle {
+         display: none !important;
+     }
      /* Mobile slide out sidebar overlay */
      .sidebar {
          position: fixed !important;
```

---

### 2. 交互邏輯調整 (JavaScript)

#### [MODIFY] [app.js](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/app.js)

* **修正典藏按鈕展開/收合行為**：
  在桌上型電腦視窗下，若側邊欄已經是展開狀態，點擊典藏按鈕應能雙向 Toggle 收合，而不僅僅是 `add`。
* **新增網址參數自動開啟新聞彈窗**：
  在 `initializeApp` 初始化最後，解析 URL 參數 `openNews=索引值`，自動模擬點擊對應的新聞卡片，以利截圖驗證腳本正常工作。

```diff
         const btnSidebarArchive = document.getElementById('btnSidebarArchive');
         if (btnSidebarArchive && sidebar && magazine) {
             btnSidebarArchive.addEventListener('click', (e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 if (window.innerWidth <= 768) {
                     if (!sidebar.classList.contains('mobile-open')) {
                         sidebar.classList.add('mobile-open');
                     }
                 } else {
-                    if (!sidebar.classList.contains('expanded')) {
-                        sidebar.classList.add('expanded');
-                        magazine.classList.add('sidebar-expanded');
-                    }
+                    sidebar.classList.toggle('expanded');
+                    magazine.classList.toggle('sidebar-expanded');
                 }
                 if (selectArchive) {
                     setTimeout(() => selectArchive.focus(), 100);
                 }
             });
         }
```

```diff
         // =====================================================================
         // INITIALIZATION — NEW MODULES
         // =====================================================================
         initThemeToggle();
         initScrollReveal();
         initReadingProgress();
         syncMagazineView();
         initAccordion();
         initMobileMenu();
         initScrollspy();
+
+        // 解析 URL 參數來自動開啟新聞彈窗 (輔助截圖與自動化驗證)
+        const urlParams = new URLSearchParams(window.location.search);
+        const openNewsIndex = urlParams.get('openNews');
+        if (openNewsIndex !== null) {
+            const card = document.getElementById(`newsCard${openNewsIndex}`);
+            if (card) {
+                setTimeout(() => card.click(), 300);
+            }
+        }
```

---

### 3. 快取消除調整 (HTML Cache Busting)

#### [MODIFY] [index.html](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/index.html)

* **更新版本號參數**：
  將所有引用 `style.css`、`app.js` 與 `archive_data.js` 的地方，其載入版本參數 `v=20260606` 統一更新為今日 `v=20260609`，解決 GitHub Pages 發布後的瀏覽器快取殘留問題。

```diff
-    <link rel="stylesheet" href="style.css?v=20260606">
+    <link rel="stylesheet" href="style.css?v=20260609">
```

```diff
     <!-- html2canvas Library -->
     <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
-    <script src="data/archive_data.js?v=20260606" defer></script>
-    <script src="app.js?v=20260606" defer></script>
+    <script src="data/archive_data.js?v=20260609" defer></script>
+    <script src="app.js?v=20260609" defer></script>
```

---

## 🧪 驗證計畫 (Verification Plan)

### 自動化測試與截圖對比

1. **執行新聞模組自動截圖驗證**：
   * 執行指令：
     `powershell -ExecutionPolicy Bypass -File scratch/take_news_modal_screenshot.ps1`
   * 檢查產出截圖：位於 `scratch/news_modal_test.png`。
   * **核對要點**：
     * 彈窗成功開啟，顯示「戰爭機器事變日公開十月發售」新聞內文。
     * 彈窗背景在淺色模式下為象牙白/米色（`#fdfcf9`），文字為深灰色（`#2c2c2c`），對比度清晰。
     * 點擊深色模式切換後，彈窗背景變為深色（`#111114`），文字自動對齊為淺灰色（`#d0cec8`），無黑底黑字現象。

2. **執行全站多模式自動截圖**：
   * 執行指令：
     `powershell -ExecutionPolicy Bypass -File scratch/take_our_screenshots.ps1`
   * 檢查產出的 `render_normal.png` 與 `render_read_mode_021.png`，確保側邊欄按鈕未跑版且側邊欄能夠自如縮放。

### 手動驗證流程

1. **側邊欄折疊測試**：
   * 展開側邊欄後，游標懸停在右側，點擊箭頭收合按鈕，確認側邊欄順暢縮回，且文字標籤與徽章無半溢出殘影。
   * 點擊「典藏」按鈕，確認側邊欄拉開；再次點擊「典藏」按鈕，確認側邊欄縮回。

2. **封面圖自適應測試**：
   * 在寬螢幕瀏覽器（大於 1200px）下拉寬視窗，確認博爾赫斯肖像的眼睛和臉部輪廓始終位於 Hero Block 上半部，沒有被裁切成「只看見嘴巴」的狀態。
