# 基地日報網站改建工程：行動端體驗與層級對齊（Phase 2）優化施工計劃書

本計劃書基於第一階段（Phase 1）優化完成後的代碼審查結果。雖然第一階段完成了 6 項核心任務且渲染測試通過，但在行動端（Mobile RWD）的使用體驗上，仍有 **2 個隱蔽但嚴重的層級與互動 Bug** 必須修正，以符合終極精品網頁的標準。

---

## 🎯 任務清單與核心設計變更

> [!IMPORTANT]
> **本計畫的核心設計變更：**
> 1. **修正行動端側邊欄無法關閉 Bug**：點擊側邊欄工具按鈕（編輯器、分享卡）時，行動端側邊欄選單必須自動收合，不能在背景持續打開。
> 2. **修正編輯器與側邊欄層級（z-index）衝突 Bug**：編輯器 Drawer 與其黑色半透明 Overlay 的層級在行動端必須高於側邊欄與懸浮漢堡按鈕，以確保編輯台完全覆蓋螢幕、順暢點擊，防止按鈕重疊或遮擋。

---

## 🛠️ 具體修改指引 (Code Modifications)

### 任務 1：行動端側邊欄工具按鈕點擊自動收合

#### 1.1 行為邏輯層 [app.js](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/app.js)
* **修改位置 (行 1930 附近的 `initMobileMenu` 函數)**：目前事件監聽僅綁定在 `.sidebar-link` 上，使得點擊「編輯器」或「分享卡」等 `.sidebar-tool-btn` 按鈕時，側邊欄覆蓋層不會收合，擋在畫面最前方。必須將 `.sidebar-tool-btn` 一併納入監聽範圍。
```diff
         function initMobileMenu() {
             const btnMobileMenu = document.getElementById('btnMobileMenu');
             const sidebarEl = document.getElementById('sidebar');
             if (btnMobileMenu && sidebarEl) {
                 btnMobileMenu.addEventListener('click', () => {
                     sidebarEl.classList.toggle('mobile-open');
                     btnMobileMenu.classList.toggle('open-active');
                 });
             }
             
-            // Close sidebar when clicking on a sidebar link in mobile view
-            document.querySelectorAll('.sidebar-link').forEach(link => {
+            // Close sidebar when clicking on any link or tool button in mobile view
+            document.querySelectorAll('.sidebar-link, .sidebar-tool-btn').forEach(link => {
                 link.addEventListener('click', () => {
                     if (sidebarEl) sidebarEl.classList.remove('mobile-open');
                     if (btnMobileMenu) btnMobileMenu.classList.remove('open-active');
                 });
             });
         }
```

---

### 任務 2：編輯器（Editor Drawer）行動端 z-index 層級提升

#### 2.1 視覺樣式層 [style.css](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/style.css)
* **修改位置 (行動端媒體查詢內，行 3490 附近)**：在 `@media (max-width: 768px)` 媒體查詢區段中，提升 `.editor-overlay` 與 `.editor-drawer` 的 `z-index`。
  * 行動端選單按鈕（`.mobile-menu-btn`）層級為 `990`。
  * 側邊欄覆蓋層（`.sidebar`）層級為 `980`。
  * 必須將行動端的 `.editor-overlay` 設為 `995`，將 `.editor-drawer` 設為 `996`，以保證開啟編輯器時能完全壓在側邊欄與懸浮按鈕上方，杜絕點擊干涉與穿透。
  * 同時將全站的 `.share-modal-overlay` 層級統一調升至 `1010`，保障彈窗位於最頂層。
```diff
 @media (max-width: 768px) {
     .mobile-menu-btn {
         display: flex;
     }
     /* Mobile slide out sidebar overlay */
     .sidebar {
         position: fixed !important;
         left: -260px !important;
         top: 0;
         height: 100vh;
         width: 260px !important;
         z-index: 980;
         backdrop-filter: blur(12px) !important;
         background: rgba(17, 17, 22, 0.92) !important;
         box-shadow: 10px 0 30px rgba(0,0,0,0.5);
         transition: left 0.35s ease-out !important; /* Smooth slide transition */
     }
     .sidebar.mobile-open {
         left: 0 !important;
     }
     .magazine {
         padding-left: 0 !important; /* full width */
     }
+
+    /* 提升編輯器在行動端的層級，覆蓋側邊欄與懸浮漢堡按鈕 */
+    .editor-overlay {
+        z-index: 995 !important;
+    }
+    .editor-drawer {
+        width: 100%;
+        right: -100%;
+        z-index: 996 !important;
+    }
 }
+
+/* 確保全站彈窗在最頂層 */
+.share-modal-overlay {
+    z-index: 1010 !important;
+}
```

---

## 🧪 驗證計畫 (Verification Plan)

### 自動化測試
* 重新執行無頭截圖測試，確認編輯器開啟時渲染正常：
  `powershell -ExecutionPolicy Bypass -File scratch/take_our_screenshots.ps1`

### 手動驗證流程
1. **行動端選單點擊自動關閉測試**：
   * 縮窄視窗模擬手機版，點擊右上角懸浮漢堡按鈕展開選單。
   * 在滑出的選單中點擊「編輯器」或「分享卡」。
   * **驗證**：側邊欄選單必須立即向左收合隱藏，且懸浮選單按鈕的 `×` 必須變回三條線。同時編輯器或分享卡彈窗開啟。
2. **行動端編輯面板層級覆蓋測試**：
   * 展開編輯面板（Editor Drawer）。
   * **驗證**：編輯面板應佔滿整個手機螢幕，且右上角的懸浮漢堡按鈕被編輯器完全覆蓋不可見，確保使用者不會在編輯時誤觸背景。
