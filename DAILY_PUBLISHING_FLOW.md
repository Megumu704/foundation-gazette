# 基地日報每日發行標準作業流程 (DAILY PUBLISHING FLOW & CHECKLIST)

> [!IMPORTANT]
> **本文件為開發與發行 Agent 的強制執行規範。**
> 每次開始製作新的一期日報前，您**必須**先在您的 `task.md` 中複製並套用以下檢查清單，並嚴格依序執行，不得跳過任何步驟。

---

## 📋 發行前工作清單 (Pre-Flight Checklist)

### 🟩 第一階段：選題對齊與 Notion 驗證
* [ ] **確認身份**：閱讀根目錄下的 [DANEEL_IDENTITY.md](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/DANEEL_IDENTITY.md)，確認您目前扮演的角色（如主控代理「丹尼爾」）。
* [ ] **讀取 Notion 資料庫**：
  * 執行 Notion 查詢，或查閱 Notion 專題資料庫中**當前優先順位最高（優先順位為 1）**的待發行選題。
  * **嚴禁憑空捏造選題**，若 Notion 中無主題或有疑問，必須先向總編輯（悶騷狸）確認。
* [ ] **核對發刊日期**：確認今天欲發行的日期字串（格式如 `2026.06.11`），避免日期重疊或覆蓋錯誤。

### 🟦 第二階段：亞歷斯 (Alex) 內容撰寫與真實性防範
* [ ] **啟動 Alex 撰稿**：調用子代理 `Alex` 或以 Alex 的撰稿指南（[ALEX_WRITING_GUIDE.md](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/scripts/ALEX_WRITING_GUIDE.md)）起草內容。
* [ ] **真實性稽核**：
  * 主專題創作者生平與時間必須完全真實。
  * 守護者格言必須能在網路上查到原文出處，嚴禁 AI 拼湊。
  * 時事新聞必須限制在**發刊日前 7 天內**，且至少有兩個真實來源（拒絕過期新聞與虛構內容）。
* [ ] **防劇透與對話隔離**：
  * 檢查內容是否透露經典作品的關鍵結局或劇情反轉。
  * 檢查 `intro`、`content` 與新聞摘要中，是否不小心夾雜了對總編輯的留言（如「總編好，這是我寫的...」）。

### 🟨 第三階段：吉斯卡 (Giskard) 視覺排版與配圖本地化
* [ ] **真實圖片檢索（拒絕 AI 佔位符）**：
  * 優先尋找官方宣傳圖、實機截圖或歷史照片，下載至本地 `data/images/`，並以相對路徑綁定。
  * 只有在網路上完全無任何真實影像時，才允許調用 AI 生成工具（`generate_image`）繪製具有高度契合藝術風格的插畫，且需在說明中標註為「（示意圖）」。
* [ ] **更新前端下拉選單**：
  * 手動修改 [index.html](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/index.html) 的 `#selectArchive` 下拉選單，硬編碼新增當期 option（置於 draft 之下）。
* [ ] **重新編譯封存資料**：
  * 將當前草稿存檔至 `data/archive/` 目錄下（格式如 `YYYY_MM_DD.json`）。
  * 執行 `scripts/build_archive_data.ps1`，重新生成前端索引 [data/archive_data.js](file:///c:/Users/Hubert/.gemini/antigravity/scratch/foundation-gazette/data/archive_data.js)。

### 🟧 第四階段：本地渲染與視覺 QA 驗證
* [ ] **啟動 Port 8000 本地伺服器**：
  * 執行 `scripts/start_server.ps1` 啟動本地測試伺服器。
* [ ] **生成驗證截圖**：
  * 執行 `scratch/take_our_screenshots.ps1` 擷取普通、閱讀與編輯模式截圖。
  * 執行 `scratch/take_news_modal_screenshot.ps1` 擷取時事新聞詳情彈窗截圖。
* [ ] **像素級人工比對**：
  * 檢查封面圖是否加載正確（是否發生破圖或 fallback 回退為 Unsplash 花卉圖）。
  * 檢查時事詳情彈窗文字顏色（是否發生黑底黑字或對比度不足的現象）。
  * 檢查側邊欄按鈕是否能正常展開與折疊。

### 🟥 第五階段：Notion 同步與正式發佈
* [ ] **回寫 Notion 內頁**：將文章內容回寫至 Notion 卡片內頁，供總編輯隨時微調。
* [ ] **Telegram 通知預覽**：發送分享小卡與導讀Teaser至總編 Telegram，靜待最終審核。
* [ ] **反向拉取與正式發布**：
  * 當總編輯在 Notion 中標記為「確認發佈」後，拉取 Notion 最新文字覆蓋本地。
  * 重新渲染小卡，執行 Git Commit 並 Push 至遠端 GitHub Pages，發布完成。
