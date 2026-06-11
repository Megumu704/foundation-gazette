# Open Design 整合與使用指南 (Open Design Integration & Usage Guide)

> [!NOTE]
> 本文件記錄了 **Open Design** 在《基地日報》工作區中的具體應用方式、實用指令，以及「有所為、有所不為」的防呆規範，以避免後續 AI 代理或人工維護時遺失記憶。

---

## 📡 系統狀態與連線設定 (System Connection)

*   **本地守護進程 (Local Daemon):** 運行於 `http://127.0.0.1:6582` (Port 6582)。
*   **MCP 伺服器配置:** 已登錄於 `~/.gemini/antigravity/mcp_config.json`，代號為 `open-design`。
*   **CLI 執行檔路徑:**
    *   Node 執行檔: `C:\Users\Hubert\.gemini\antigravity\node-v24\node-v24.16.0-win-x64\node.exe`
    *   CLI 腳本: `C:\Users\Hubert\open-design\apps\daemon\dist\cli.js`
    *   **推薦呼叫命令格式 (PowerShell):**
        ```powershell
        $env:OD_DAEMON_URL="http://127.0.0.1:6582"; & "C:\Users\Hubert\.gemini\antigravity\node-v24\node-v24.16.0-win-x64\node.exe" "C:\Users\Hubert\open-design\apps\daemon\dist\cli.js" <子命令>
        ```

---

## 🛠️ 實用功能與執行指令 (Useful Features & Commands)

在發行與維護《基地日報》的過程中，我們**僅在必要時**調用以下 Open Design 功能，絕不盲目濫用：

### 1. 📸 輔助 AI 圖像生成 (AI Image Generation)
當主專欄或金句卡片完全找不到真實的官方圖片或歷史照片，且已獲得總編輯同意使用 AI 示意圖時（符合 [DANEEL_IDENTITY.md](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/DANEEL_IDENTITY.md) 中的「最後手段」例外條款）：
*   **指令範例 (以雙色調極簡鋼筆速寫風為例):**
    ```powershell
    $env:OD_DAEMON_URL="http://127.0.0.1:6582"; & "C:\Users\Hubert\.gemini\antigravity\node-v24\node-v24.16.0-win-x64\node.exe" "C:\Users\Hubert\open-design\apps\daemon\dist\cli.js" media generate --surface image --model stability.sd3-5-medium --prompt "A minimalist two-tone ink sketch of a retro futuristic terminal, ink-bleed line art on ivory white paper background, Jujube stamp red highlights"
    ```
*   **注意事項:** 生成的圖片必須下載並快取至本地 `data/images/`，並在 JSON 資料庫中改用**相對路徑**引用。

### 2. 📝 視覺風格契約對齊 (Design System Alignment)
我們已將《基地日報》的排版風格與色彩規範收錄在根目錄的 [DESIGN.md](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/DESIGN.md) 中。
*   **如何運用:** 當我們需要讓 AI 代理設計新的前端卡片或微調樣式時，應將 [DESIGN.md](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/DESIGN.md) 直接注入系統 prompt。
*   如果想檢視 Open Design 預置的優秀設計系統（例如 `warm-editorial` 或 `kami`）作為排版靈感，可執行：
    ```powershell
    $env:OD_DAEMON_URL="http://127.0.0.1:6582"; & "C:\Users\Hubert\.gemini\antigravity\node-v24\node-v24.16.0-win-x64\node.exe" "C:\Users\Hubert\open-design\apps\daemon\dist\cli.js" tools design-systems read --path C:\Users\Hubert\open-design\design-systems\warm-editorial\DESIGN.md
    ```

### 3. 🧩 插件檢索 (Plugin Catalog Lookup)
若需要尋找適合網頁版面微調、版規檢查或圖片格式轉換的內置工具：
*   **指令範例:**
    ```powershell
    $env:OD_DAEMON_URL="http://127.0.0.1:6582"; & "C:\Users\Hubert\.gemini\antigravity\node-v24\node-v24.16.0-win-x64\node.exe" "C:\Users\Hubert\open-design\apps\daemon\dist\cli.js" plugin list
    ```

---

## 🚫 避免使用的功能 (Do NOT Force-Use)

為了保持日報專案的輕量與穩定，請**避免**強行使用以下 Open Design 的複雜機制：

1.  **強行專案遷移 (`od projects create`):**
    *   《基地日報》目前是一個乾淨、單純的靜態 HTML/JS/CSS 網頁（[index.html](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/index.html)）。我們**不需要**將其轉化為 Open Design 的複雜 SQLite 專案結構，亦不需引入其多頁面管理功能。保持現有架構即可。
2.  **簡報與影片動態模式 (Decks / PPTX / HyperFrames):**
    *   日報主要是直向分享卡片與網頁閱讀，不需生成 PPTX 投影片或 animated MP4。請勿在發行流程中強行介入這些模式。
3.  **發布至外部 Plugin 倉庫 (`od plugin publish-repo`):**
    *   我們的職責是發行日報，並非開發 Open Design 生態圈的第三方外掛。

---

## 📋 視覺 QA 自動化補充驗證
在本地渲染（Port 8000）時，我們的截圖驗證腳本 [scratch/take_our_screenshots.ps1](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/scratch/take_our_screenshots.ps1) 會進行無頭 Chrome 的擷取。若在 Canvas 導出時發現文字縮放異常（例如 html2canvas 的 transform scale 衝突），應參考 [foundation-gazette-standards/SKILL.md](file:///C:/Users/Hubert/.gemini/config/plugins/science/skills/foundation_gazette_standards/SKILL.md) 中記錄的 `onclone` 鉤子覆寫降級方案進行處理。
