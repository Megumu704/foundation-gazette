# 基地日報 / Foundation Gazette 🖨️

歡迎來到**《基地日報》（Foundation Gazette）**的發行與開發工作區。本專案為一款精品級、具備紙媒鉛印美學與數為互動特性的數位日報。

---

## 🚨 核心規範與身份指引 (Crucial Identity & Workflow)

> [!IMPORTANT]
> **任何新進的 AI 協同開發/內容 Agent 在執行任何任務前，必須首先讀取位於根目錄的：**
> 👉 **[DANEEL_IDENTITY.md](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/DANEEL_IDENTITY.md)**

本專案採用**多智能體協作發行工作流**，包含：
1. **悶騷狸 (User)**：總編輯，品味決策者。
2. **丹尼爾 (Daneel - Agent)**：主控 AI / 產品總監 / 監修者。
3. **亞歷斯 (Alex - Subagent)**：首席研究員 / 專欄撰稿者。
4. **吉斯卡 (Giskard - Subagent)**：網頁工程師 / 前端排版官。

嚴禁單一 Prompt 一鍵生成內容。所有發佈工作必須嚴格遵循 **`DANEEL_IDENTITY.md`** 中的 **「六階段每日日報發行標準流程」**。

---

## 📂 工作區目錄結構 (Workspace Structure)

*   `data/`
    *   `draft.json`: 當前正在編輯或準備發布的日報草稿數據。
    *   `archive/`: 保存所有已發布日報的歷史 JSON 數據（格式如 `2026_06_10.json`）。
    *   `images/`: 儲存本地化後的真實插圖與宣傳海報，防止外鏈跨域 CORS 破圖。
    *   `archive_data.js`: 全站封存索引，由編譯腳本動態生成，使 Pages 靜態網站得以加載歷史期數。
*   `scripts/`
    *   `README.md`: 各自動化工具腳本的詳細說明。
    *   `start_server.ps1`: 本地開發 HTTP 伺服器（預設綁定 Port 8000）。
    *   `publish_and_shift.ps1`: Notion 回寫、圖片渲染、自動發佈與優先順位遞補發行指令。
    *   `build_archive_data.ps1`: 重建 `archive_data.js` 封存索引。
    *   `verify_and_download.py`: 外部圖片下載與本地相對路徑繫結工具。
    *   `ALEX_WRITING_GUIDE.md`: 撰稿子代理（Alex）寫作精進指南。
    *   `GISKARD_ENGINEERING_GUIDE.md`: 網頁與排版子代理（Giskard）前端渲染防禦指南。
*   `scratch/`
    *   `take_our_screenshots.ps1`: 普通首頁、編輯與閱讀模式的自動截圖腳本（使用 Port 8000）。
    *   `take_news_modal_screenshot.ps1`: 時事新聞詳情彈窗對比度驗證截圖腳本（使用 Port 8000）。
*   `index.html`: 日報網頁結構與歷史下拉選單（硬編碼）。
*   `style.css`: 核心設計系統與微觀油墨印刷質感樣式表。
*   `app.js`: 核心交互與數據載入邏輯。
*   `啟動本地伺服器.bat`: 供使用者在 Windows 下按兩下快速啟動 Port 8000 伺服器的批次檔。

---

## 🛠️ 快速啟動與開發

1.  **啟動本地伺服器**：
    *   在 Windows 檔案管理員中直接按兩下 `啟動本地伺服器.bat`，或在終端機中執行：
        ```powershell
        powershell -ExecutionPolicy Bypass -File scripts/start_server.ps1
        ```
    *   本地伺服器預設運行於：`http://localhost:8000`

2.  **執行排版與對比度測試**：
    *   全模態視圖截圖：
        ```powershell
        powershell -ExecutionPolicy Bypass -File scratch/take_our_screenshots.ps1
        ```
    *   新聞詳情彈窗截圖：
        ```powershell
        powershell -ExecutionPolicy Bypass -File scratch/take_news_modal_screenshot.ps1
        ```
    *   截圖將輸出至當前對話的腦部（Brain）路徑中，請務必開啟並雙向對比「預覽預覽」與「小卡導出圖」，嚴防黑底黑字與文字邊界裁切。
