# 基地日報 自動化工具說明書 (Scripts documentation)

本資料夾存放《基地日報》（Foundation Gazette）所有自動化生成、同步、發布、渲染與維護的指令程式與工具腳本。

---

## 📡 核心自動化服務 (Core Automation Services)

### 1. `sync_notion_gazette.ps1` (選題與草稿自動生成)
*   **用途**：每日背景自動化排程的起點。
*   **工作流程**：
    1. 查詢 Notion 資料庫，自動挑選當前優先順位最高（優先順位數值最小）且未歸檔的主專題。
    2. 檢查時事新聞選題是否足夠。若不足，啟動 **Gemini AI 自動防呆寫稿** 抓取並撰寫最新的動漫/遊戲時事新聞。
    3. 將日報主專欄與新聞編譯為 `data/draft.json` 本地草稿。
    4. 將生成的長文章反向寫入 Notion 對應主選題卡片的「頁面內頁 (Page Body)」，以便編輯人員在 Notion 中進行微調與審核。
    5. 發送 Telegram 訊息通知總編輯草稿已就緒。

### 2. `publish_and_shift.ps1` (發布、渲染與排程遞補)
*   **用途**：當選題經由 Notion 審核並標記為「確認發布」時觸發。
*   **工作流程**：
    1. 自動抓取 Notion 內頁中經過總編輯修改的最新文字，回寫覆蓋本地 `draft.json`。
    2. 啟動本地開發伺服器 (`start_server.ps1`)，並呼叫 Edge 瀏覽器無頭模式 (`generate_card.ps1`) 渲染生成直向分享卡 `test_output_share_card.png`。
    3. 將生成的分享卡與日報大綱發布至 Telegram 頻道（及 Discord 頻道）。
    4. 將已發布卡片在 Notion 中的狀態變更為「已歸檔」，清空優先順位，並填入當天「歸檔日期」。
    5. 重建資料庫 fallback 索引，並將所有未歸檔的選題優先順位自動向前遞補（`-1`）。
    6. 將所有本地異動（包含新的 JSON 封存與 JS 索引）自動提交並推送 (`git push`) 到 GitHub master 分支，完成 Pages 線上發布。

### 3. `start_server.ps1` (本地網頁伺服器)
*   **用途**：啟動一個本地 HTTP 伺服器（預設 Port 8080）以供 Headless Edge 載入網頁進行分享卡渲染。
*   **特性**：會自動檢測 Port 8080 是否已被佔用，防止重複啟動造成衝突。

### 4. `build_archive_data.ps1` (封存索引動態重構)
*   **用途**：遍歷 `data/archive/` 底下所有的歷史日報 JSON 封存檔，將其重新打包輸出為靜態 JS 檔案 `data/archive_data.js`。
*   **特性**：使 GitHub Pages 靜態網站能夠在沒有實體資料庫的情況下，讀取並渲染所有歷史期數的報紙。

---

## 🛠️ 資產維護與強固工具 (Asset Maintenance & Verification)

### 5. `verify_and_download.py` (圖片本地化下載器)
*   **用途**：解析 `data/draft.json`，自動下載所有外部圖片連結（如 Gematsu/ANN/Wiki 圖片）至本地 `data/images/`。
*   **特性**：
    * 採用 Python 開發，支援設定自訂 User-Agent 迴避網站阻擋（如 Wikipedia 403 阻擋）。
    * 下載完成後自動更新 `draft.json` 中的路徑為本地相對路徑，防止網頁加載時因 CORS 阻擋導致圖片破圖（顯示 `NO SIGNAL`）。

### 6. `prune_images.ps1` (冗餘圖片清理工具)
*   **用途**：比對本地 `data/draft.json` 與所有歷史歸檔 JSON，列出所有被引用的圖片檔名。
*   **工作流程**：自動掃描 `data/images/` 目錄，將所有未被任何日報引用的冗餘圖片檔案，搬移至 `backups/pruned_images/` 備份資料夾中，確保 Git 倉庫的輕量化。

### 7. `extract_reported.py` (歷史已報導主題提取)
*   **用途**：掃描所有存檔以整理出所有報導過的主題清單，輸出至 `data/reported_topics.json`。
*   **用途**：提供給 AI 選題生成器作為排除名單，防範未來產生重複題材的新聞。

### 8. `sync_history_to_notion.py` (Notion 歷史卡片重建)
*   **用途**：當 Notion 資料庫因故被清空或需要重建時，讀取本地所有歷史存檔，反向在 Notion 中建立對應的已歸檔卡片，恢復歷史記錄狀態。

---

## 📸 視覺與排版檢測工具 (Layout & Rendering Verification)

### 9. `generate_card.ps1` (分享卡手動渲染)
*   **用途**：手動呼叫 Edge Headless 瀏覽器加載本地伺服器，對目前的 `draft.json` 渲染輸出直向分享卡圖片 `test_output_share_card.png`。

### 10. `take_screenshots.ps1` (版面截圖比對)
*   **用途**：自動擷取目前日報在「閱讀模式 (Read Mode)」與「編輯模式 (Edit Mode)」下的高解析度畫面。
*   **輸出**：保存至腦部（Brain）資料夾中，供 Agent 進行視覺版面（如標題字距、欄位均分、文字換行）的比對與稽核。

### 11. `get_image_info.ps1` (圖片尺寸快檢)
*   **用途**：快速讀取並在主控台輸出 `data/images/` 下所有圖片的寬度與高度解析度。
