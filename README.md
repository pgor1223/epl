# 英超戰報 — Premier League 2026/27 繁體中文資訊站

純靜態網站（HTML + CSS + JavaScript），直接開啟 `index.html` 即可瀏覽。賽果、賽程、助攻榜及影片每小時自動更新。

**公開網址：** https://pgor1223.github.io/epl/ （版本庫 https://github.com/pgor1223/epl ）

## 頁面
| 頁面 | 檔案 | 內容 |
| --- | --- | --- |
| 主頁 | `index.html` | 頭條、焦點戰倒數、積分榜前五、賽果跑馬燈、3 篇新聞、4 條影片、最近 4 場賽果 |
| 新聞 | `news.html` | 全部文章，可按賽事／轉會／專題／聯賽篩選 |
| 影片 | `videos.html` | 全部 YouTube 影片，點擊即在站內播放 |
| 積分榜 | `table.html` | 20 隊完整排名、球差、近況 |
| 賽果賽程 | `results.html` | 按輪次分頁，顯示入球球員、球場、入場人數 |
| 數據 | `stats.html` | 射手榜、助攻榜、賽季統計 |

頂部導覽、頁尾與彈出視窗由 `js/app.js` 統一產生，六頁共用一套，改一次即全站生效。每頁以 `<body data-page="...">` 標明身份，只渲染該頁需要的區塊。

## 檔案結構
```
epl/
├─ index.html / news.html / videos.html
├─ table.html / results.html / stats.html
├─ css/style.css           樣式
├─ js/data.js              人手維護：球隊譯名、球場譯名、新聞
├─ js/live.js              自動產生：賽果、賽程、助攻榜、影片（請勿手動編輯）
├─ js/app.js               共用程式：導覽、頁尾、各區塊渲染與計算
└─ tools/
   ├─ update-epl.ps1       更新腳本（英超官方公開數據 + YouTube RSS → js/live.js）
   ├─ video-sources.json   影片來源頻道設定（可自行增減）
   ├─ videos-cache.json    影片快取（抓取失敗時沿用）
   ├─ results-cache.json   賽事細節快取
   ├─ run-hidden.vbs       排程工作用的隱藏視窗啟動器
   └─ update.log           更新記錄
```

## 自動更新
`.github/workflows/update.yml` 每小時在 GitHub 的伺服器執行 `tools/update-epl.ps1`，賽果或影片有變動時自動 commit `js/live.js`，毋須依賴本機電腦。亦可在 GitHub 的 **Actions → Update results → Run workflow** 手動觸發。

手動在本機執行：
```
powershell -NoProfile -ExecutionPolicy Bypass -File "tools\update-epl.ps1"
```
加上 `-Force` 會重新抓取所有已完成賽事的細節。

本機排程工作 `EPL-Site-Update` 已停用（避免與雲端版本衝突）。如需重新啟用：`Enable-ScheduledTask EPL-Site-Update`。

## 精選影片（YouTube）
- 影片來自 `tools/video-sources.json` 所列頻道的 RSS 訂閱來源，**毋須 API key**。
- 增減頻道：加入 `{ "channelId": "UC...", "label": "標籤", "max": 12 }`。頻道 ID 可在頻道網址 `/channel/UC...` 找到。
- 目前來源：袁文傑Andrew Yuen（文傑講波經，廣東話英超評論、轉會分析、賽後評論及直播）。
- 縮圖點擊後才載入播放器，頁面較快，亦避免未睇片就被追蹤；每個播放視窗都有「在 YouTube 開啟」連結。
- 標題結尾的主題標籤會自動清走。
- 注意：英超完整賽事精華受轉播權限制，YouTube 上沒有官方全場精華，本區為評論及分析影片。

## 人手維護的內容（js/data.js）
1. **新聞**：在 `NEWS` 最前面加入，第一篇即為主頁頭條。文字中可用 `{{ARS}}` 代入球隊譯名、`{{V:Anfield}}` 代入球場譯名，會隨港／台切換。
2. **新球隊／新球場**：日後升班馬如未在 `TEAMS` 或 `VENUES` 定義，頁面仍可正常顯示（以英文縮寫／英文球場名顯示），補上譯名即可。
3. **新賽季**：更新 `tools/update-epl.ps1` 內的 `$CompSeason`（英超官方賽季編號）及 `SEASON.label`。

更新新聞的流程：
```
git pull
```
改好 `js/data.js` 後：
```
git add -A && git commit -m "news" && git push
```
推送後約一分鐘公開網站便會更新。

## 備註
- 字型（Noto Sans TC、Barlow Condensed）由 Google Fonts 載入，離線時會退回系統字型。
- 球員姓名保留原文；球隊及球場譯名可在右上角切換港式／台式，選擇會記在瀏覽器。
- 所有開賽時間一律換算為香港時間（UTC+8）。
- 網址片段：`news.html#n3` 直接開啟第 4 篇文章，`results.html#f5` 直接開啟第 5 輪賽程。
