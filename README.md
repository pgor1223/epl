# 英超戰報 — Premier League 2026/27 繁體中文資訊站

純靜態網站（HTML + CSS + JavaScript），直接開啟 `index.html` 即可瀏覽。賽果、賽程與助攻榜由排程腳本每小時自動更新。

## 內容
- **最新消息**：頭條 + 新聞卡片，點擊可閱讀全文
- **積分榜**：由賽果自動計算（勝／和／負／入球／失球／球差／積分／近況）
- **賽果與賽程**：按輪次分頁，顯示入球球員、球場、入場人數；時間一律換算為香港時間
- **球員數據**：射手榜（自動統計）、助攻榜、賽季小數據
- **譯名切換**：右上角可切換「港式」與「台式」球隊／球場譯名

## 檔案結構
```
epl/
├─ index.html              頁面結構
├─ css/style.css           樣式
├─ js/data.js              人手維護：球隊譯名、球場譯名、新聞
├─ js/live.js              自動產生：賽果、賽程、助攻榜（請勿手動編輯）
├─ js/app.js               渲染邏輯（積分榜、射手榜計算、倒數、切換）
└─ tools/
   ├─ update-epl.ps1       更新腳本（抓取英超官方公開數據 → 寫入 js/live.js）
   ├─ run-hidden.vbs       排程工作用的隱藏視窗啟動器
   ├─ results-cache.json   已抓取的賽事細節快取
   └─ update.log           更新記錄
```

## 自動更新
Windows 工作排程器已登記工作 **EPL-Site-Update**：
- 登入 Windows 時執行一次，之後每小時執行一次（需有網絡），透過 run-hidden.vbs 在背景執行，不會彈出視窗
- 每次執行只抓取新完成的賽事及 48 小時內的賽事細節，其餘讀取快取
- 記錄寫在 `tools/update.log`

手動立即更新：
```
powershell -NoProfile -ExecutionPolicy Bypass -File "tools\update-epl.ps1"
```
加上 `-Force` 會重新抓取所有已完成賽事的細節。

查看／停用排程：開啟「工作排程器」找 `EPL-Site-Update`，或在 PowerShell 執行
`Get-ScheduledTask EPL-Site-Update`、`Disable-ScheduledTask EPL-Site-Update`。

## 人手維護的內容（js/data.js）
1. **新聞**：在 `NEWS` 最前面加入，第一篇即為頭條。文字中可用 `{{ARS}}` 代入球隊譯名、`{{V:Anfield}}` 代入球場譯名。
2. **新球隊／新球場**：日後升班馬如未在 `TEAMS` 或 `VENUES` 定義，頁面仍可正常顯示（以英文縮寫／英文球場名顯示），補上譯名即可。
3. **新賽季**：更新 `tools/update-epl.ps1` 內的 `$CompSeason`（英超官方賽季編號）及 `SEASON.label`。

## 備註
- 字型（Noto Sans TC、Barlow Condensed）由 Google Fonts 載入，離線時會退回系統字型。
- 球員姓名保留原文。
- 「焦點戰」由腳本判定：六強互戰或打吡會標記為 featured。
