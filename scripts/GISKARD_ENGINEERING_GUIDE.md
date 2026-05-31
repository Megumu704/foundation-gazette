# Giskard (視覺與前端排版子智能體) 精進技能指南

本指南旨在為公報的排版與前端架構執行官 **吉斯卡 (Giskard)** 提供系統化的前端渲染、樣式優化與自動化測試技能，協助其在未來的版面設計中輸出最高水準、零瑕疵的渲染效果。

---

## 🎨 1. 像素級排版與 CSS 優化原則
吉斯卡在進行介面樣式微調時，需特別注意以實體報紙的美學出發，同時克服螢幕渲染的缺點：
*   **字型渲染抗鋸齒 (Anti-aliasing)**：
    *   內文段落採用 `color: #2c2c2c;`（炭灰墨色）搭配大行高（`line-height: 1.95`）與微字距（`letter-spacing: 0.02em`），將尖銳的螢幕宋體邊角轉化為柔和的鉛印暈染質感。
*   **極致邊界對齊 (Justify Text)**：
    *   在卡片引言或雙欄排版中，為實現文字像實體剪報般平整對齊，應全面採用：
        ```css
        text-align: justify;
        text-justify: inter-character;
        ```
*   **不對稱變形與印章微觀效果**：
    *   製作手工標籤或印章時，避免完美的幾何形狀。應利用微小的旋轉（如 `transform: rotate(-1deg)`）與縱向拉伸（如 `transform: scale(0.9, 1.35)`）來營造木刻印章受力不均的溫潤觸感。

---

## 📸 2. `html2canvas` 導出層防禦與補償機制
網頁預覽（顯示層）和 Canvas 導出（導出層）經常因渲染引擎差異產生字體溢出或錯位。吉斯卡必須精通以下防禦手段：
*   **整數像素限制**：避免在 Layout 的寬高、Padding 與 Margin 使用小數點（如 `15.5px`）。小數像素會導致 Canvas 繪圖引擎進行二次抗鋸齒計算，進而引發文字邊界模糊或容器寬度計算錯誤。
*   **非等比縮放補償 (`onclone`)**：
    *   `html2canvas` 在高解析度導出（`scale > 1`）時無法正確處理 `transform: scale(x, y)`（x 不等於 y）的文字。
    *   **對策**：利用 `onclone` 鉤子，在 Canvas 渲染用的克隆 DOM 中移除 `scale` 縮放，改以微調的 `font-size` 和 `padding` 進行視覺等價補償。例如：
        ```javascript
        html2canvas(element, {
            onclone: (clonedDoc) => {
                const target = clonedDoc.querySelector('.stamp-label');
                target.style.transform = 'rotate(-1deg)'; // 移除 scale 分量，保留旋轉
                target.style.fontSize = '0.58rem';       // 手動微調字型大小補償
            }
        });
        ```

---

## 📡 3. 離線防禦與 CORS 安全防護
吉斯卡必須保證網頁在最惡劣的環境下（例如使用者在沒有網路的環境下雙擊 index.html 本地開啟）依然能維持版面不崩潰：
*   **CORS 阻礙處理**：
    *   載入外鏈圖片時，必須設定 `onerror` 處理程序，自動切換至備用的本地預載圖片或離線佔位符。
*   **離線佔位符設計**：
    *   圖片載入失敗時，展示具有呼吸起動畫的 `.image-error-placeholder`，並確保佔位符使用羊皮紙底色（`background-color: #f3edd8;`）以契合報紙調性。

---

## 🧪 4. 自動化無頭測試 (Headless Verification)
吉斯卡應隨時利用無頭瀏覽器對修改後的排版進行快速回歸測試：
1.  **URL Query 參數導航**：在 `app.js` 中預留 URL 測試鉤子（如 `?openShare=true&downloadShare=true`），方便測試腳本自動導向至分享卡生成流程。
2.  **自動化截圖對比**：
    *   在每次重大排版修改後，執行 [take_screenshots.ps1](file:///C:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/scripts/take_screenshots.ps1)，將 Read Mode 和 Edit Mode 截圖匯出至 brain 目錄，對比有無元件重疊、邊界溢出或字體被阻斷的情況。
