<#
  ==========================================================
  英超戰報 — 自動更新腳本（update-epl.ps1）
  ----------------------------------------------------------
  從英超官方公開數據抓取賽果、賽程、助攻榜，寫入 js/live.js。
  人手維護的內容（球隊譯名、球場譯名、新聞）仍在 js/data.js，不會被改動。

  手動執行：
    powershell -NoProfile -ExecutionPolicy Bypass -File "tools\update-epl.ps1"
  參數：
    -Force   重新抓取所有已完成賽事的細節（平時只抓新賽事及 48 小時內的賽事）
  ==========================================================
#>
param(
  [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot),
  [int]$CompSeason = 841,          # 2026/27 賽季的官方編號
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$toolsDir  = $PSScriptRoot
$logFile   = Join-Path $toolsDir 'update.log'
$cacheFile = Join-Path $toolsDir 'results-cache.json'
$outFile   = Join-Path (Join-Path $SiteRoot 'js') 'live.js'
$api       = 'https://footballapi.pulselive.com/football'
$headers   = @{
  'Origin'     = 'https://www.premierleague.com'
  'Referer'    = 'https://www.premierleague.com/'
  'User-Agent' = 'Mozilla/5.0 (EPL fan site updater)'
}
# 首頁「焦點戰」：六強互戰或打吡
$bigSix  = @('ARS', 'CHE', 'LIV', 'MCI', 'MUN', 'TOT')
$derbies = @('LIV|EVE', 'NEW|SUN', 'AVL|BIR', 'BHA|CRY')

function Log([string]$msg) {
  $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
  Add-Content -Path $logFile -Value $line -Encoding UTF8
  Write-Host $line
}
function Get-Api([string]$path) {
  for ($i = 1; $i -le 3; $i++) {
    try {
      $resp = Invoke-WebRequest -Uri "$api/$path" -Headers $headers -TimeoutSec 30 -UseBasicParsing
      $json = [System.Text.Encoding]::UTF8.GetString($resp.RawContentStream.ToArray())   # 回應為 UTF-8，需手動解碼
      return ($json | ConvertFrom-Json)
    }
    catch { if ($i -eq 3) { throw }; Start-Sleep -Seconds (3 * $i) }
  }
}
function Get-AllPages([string]$path) {
  $all = @(); $page = 0
  do {
    $r = Get-Api "$path&page=$page&pageSize=100"
    if ($r.content) { $all += @($r.content) }
    $page++
  } while ($r.pageInfo -and $page -lt [int]$r.pageInfo.numPages)
  return $all
}
function JsStr($s) {
  if ($null -eq $s) { return '""' }
  $t = ([string]$s).Replace('\', '\\').Replace('"', '\"').Replace("`r", '').Replace("`n", ' ')
  return '"' + $t + '"'
}
function IsoUtc($millis) {
  return [DateTimeOffset]::FromUnixTimeMilliseconds([long]$millis).UtcDateTime.ToString('yyyy-MM-ddTHH:mm:ssZ')
}
function MinuteLabel($clockLabel) {
  # "90+1'00" -> "90+1"；"08'00" -> "8"
  if (-not $clockLabel) { return '' }
  $m = ([string]$clockLabel) -replace "'.*$", ''
  $parts = $m.Split('+')
  $parts[0] = [string][int]$parts[0]
  return ($parts -join '+')
}
function KickMillis($f) {
  if ($f.kickoff -and $f.kickoff.millis) { return [long]$f.kickoff.millis }
  if ($f.provisionalKickoff -and $f.provisionalKickoff.millis) { return [long]$f.provisionalKickoff.millis }
  return $null
}
function IsFeatured($hTeam, $aTeam) {
  if (($bigSix -contains $hTeam) -and ($bigSix -contains $aTeam)) { return $true }
  return ($derbies -contains "$hTeam|$aTeam") -or ($derbies -contains "$aTeam|$hTeam")
}

try {
  Log "開始更新（compSeason=$CompSeason）"

  # ---------- 讀取快取 ----------
  $cache = @{}
  if (Test-Path $cacheFile) {
    $obj = Get-Content $cacheFile -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($p in $obj.PSObject.Properties) { $cache[$p.Name] = $p.Value }
  }

  # ---------- 抓取賽事列表 ----------
  $completed = Get-AllPages "fixtures?comps=1&compSeasons=$CompSeason&statuses=C&sort=asc&altIds=true"
  $upcoming  = Get-AllPages "fixtures?comps=1&compSeasons=$CompSeason&statuses=U,L&sort=asc&altIds=true"
  Log "已完成 $($completed.Count) 場；未賽／進行中 $($upcoming.Count) 場"

  # ---------- 已完成賽事（細節按需抓取） ----------
  $nowUtc = [DateTimeOffset]::UtcNow
  $fetched = 0
  $results = @()
  foreach ($f in $completed) {
    $id = [string][int]$f.id
    $km = KickMillis $f
    if ($null -eq $km) { continue }
    $recent = ($nowUtc - [DateTimeOffset]::FromUnixTimeMilliseconds($km)).TotalHours -lt 48
    if ($Force -or $recent -or -not $cache.ContainsKey($id)) {
      $d = Get-Api "fixtures/$id`?altIds=true"
      $fetched++
      $abbrById = @{}
      foreach ($t in $d.teams) { $abbrById[[string][int]$t.team.id] = $t.team.club.abbr }
      $nameById = @{}
      foreach ($tl in @($d.teamLists)) {
        foreach ($pl in (@($tl.lineup) + @($tl.substitutes))) {
          if ($pl -and $pl.id) { $nameById[[string][int]$pl.id] = $pl.name.display }
        }
      }
      $hTeam = $d.teams[0].team.club.abbr
      $aTeam = $d.teams[1].team.club.abbr
      $goals = @()
      foreach ($e in @($d.events)) {
        if (-not $e.type -or ($e.type -notin @('G', 'P', 'O'))) { continue }
        $personKey = [string][int]$e.personId
        $name = $nameById[$personKey]
        if (-not $name) {
          try { $ps = Get-Api "stats/player/$personKey`?comps=1&compSeasons=$CompSeason"; $name = $ps.entity.name.display } catch { }
          if (-not $name) { $name = "球員 #$personKey" }
        }
        $credited = $abbrById[[string][int]$e.teamId]
        $isOg = ($e.type -eq 'O')
        $playerTeam = $credited
        if ($isOg) { $playerTeam = if ($credited -eq $hTeam) { $aTeam } else { $hTeam } }
        $goals += [pscustomobject]@{ p = $name; t = $playerTeam; min = (MinuteLabel $e.clock.label); pen = ($e.type -eq 'P'); og = $isOg }
      }
      $att = $null
      if ($d.attendance) { $att = [int]$d.attendance }
      $cache[$id] = [pscustomobject]@{
        id = [int]$id; gw = [int]$f.gameweek.gameweek; kickoff = (IsoUtc $km)
        home = $hTeam; away = $aTeam; hs = [int]$d.teams[0].score; 'as' = [int]$d.teams[1].score
        venue = $d.ground.name; att = $att; goals = $goals
      }
    }
    $results += $cache[$id]
  }
  Log "已完成賽事：$($results.Count) 場（本次抓取細節 $fetched 場）"

  # ---------- 未來賽程 / 進行中 ----------
  $fixtures = @()
  foreach ($f in $upcoming) {
    $km = KickMillis $f
    if ($null -eq $km) { continue }
    $hTeam = $f.teams[0].team.club.abbr
    $aTeam = $f.teams[1].team.club.abbr
    $fx = [pscustomobject]@{
      gw = [int]$f.gameweek.gameweek; kickoff = (IsoUtc $km); home = $hTeam; away = $aTeam
      venue = $f.ground.name; featured = (IsFeatured $hTeam $aTeam); live = ($f.status -eq 'L')
      hs = $null; 'as' = $null; clock = $null
    }
    if ($fx.live) {
      $fx.hs = [int]$f.teams[0].score; $fx.'as' = [int]$f.teams[1].score
      if ($f.clock) { $fx.clock = [string]$f.clock.label }
    }
    $fixtures += $fx
  }

  # ---------- 助攻榜 ----------
  $assists = @()
  try {
    $as = Get-Api "stats/ranked/players/goal_assist?comps=1&compSeasons=$CompSeason&pageSize=10&altIds=true"
    foreach ($e in @($as.stats.content)) {
      $assists += [pscustomobject]@{ n = $e.owner.name.display; t = $e.owner.currentTeam.club.abbr; v = [int]$e.value }
    }
  } catch { Log "助攻榜抓取失敗：$($_.Exception.Message)" }

  # ---------- YouTube 影片（用 RSS，毋須 API key） ----------
  $videos = @()
  $videosCacheFile = Join-Path $toolsDir 'videos-cache.json'
  $sourcesFile = Join-Path $toolsDir 'video-sources.json'
  if (Test-Path $sourcesFile) {
    $sources = Get-Content $sourcesFile -Raw -Encoding UTF8 | ConvertFrom-Json   # PS 5.1 的 ConvertFrom-Json 會把陣列當單一物件輸出，不可用 @() 包住
    foreach ($src in $sources) {
      try {
        $rss = Invoke-WebRequest -Uri "https://www.youtube.com/feeds/videos.xml?channel_id=$($src.channelId)" -Headers @{ 'User-Agent' = $headers['User-Agent'] } -TimeoutSec 30 -UseBasicParsing
        $xml = New-Object System.Xml.XmlDocument
        $xml.LoadXml([System.Text.Encoding]::UTF8.GetString($rss.RawContentStream.ToArray()))
        $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
        $ns.AddNamespace('a', 'http://www.w3.org/2005/Atom')
        $ns.AddNamespace('yt', 'http://www.youtube.com/xml/schemas/2015')
        $chNode = $xml.SelectSingleNode('/a:feed/a:title', $ns)
        $chName = if ($chNode) { $chNode.InnerText } else { $src.channelId }
        $max = if ($src.max) { [int]$src.max } else { 6 }
        $n = 0
        foreach ($e in $xml.SelectNodes('/a:feed/a:entry', $ns)) {
          if ($n -ge $max) { break }
          $vidNode = $e.SelectSingleNode('yt:videoId', $ns)
          $ttlNode = $e.SelectSingleNode('a:title', $ns)
          $pubNode = $e.SelectSingleNode('a:published', $ns)
          if (-not $vidNode -or -not $ttlNode -or -not $pubNode) { continue }
          $videos += [pscustomobject]@{
            id        = $vidNode.InnerText
            title     = $ttlNode.InnerText
            channel   = $chName
            label     = [string]$src.label
            published = [DateTimeOffset]::Parse($pubNode.InnerText).UtcDateTime.ToString('yyyy-MM-ddTHH:mm:ssZ')
          }
          $n++
        }
        Log "YouTube：$chName 取得 $n 條片"
      }
      catch { Log "YouTube 抓取失敗（$($src.channelId)）：$($_.Exception.Message)" }
    }
  }
  if ($videos.Count -gt 0) {
    $videos = @($videos | Sort-Object { $_.published } -Descending | Select-Object -First 12)
    [IO.File]::WriteAllText($videosCacheFile, ($videos | ConvertTo-Json -Depth 5 -Compress), (New-Object System.Text.UTF8Encoding($false)))
  }
  elseif (Test-Path $videosCacheFile) {
    $videos = Get-Content $videosCacheFile -Raw -Encoding UTF8 | ConvertFrom-Json   # 抓取失敗時沿用上次結果
    Log "YouTube 全部來源失敗，改用快取（$($videos.Count) 條）"
  }
  # ---------- 輸出 live.js ----------
  $hkNow = $null
  foreach ($tzId in @('China Standard Time', 'Asia/Hong_Kong')) {   # Windows 與 Linux 的時區名稱不同
    try { $hkNow = [TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow, $tzId); break } catch { }
  }
  if (-not $hkNow) { $hkNow = [DateTime]::UtcNow.AddHours(8) }
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine("/* 自動產生檔案，請勿手動編輯。由 tools/update-epl.ps1 於 $($hkNow.ToString('yyyy-MM-dd HH:mm')) (HKT) 產生。 */")
  [void]$sb.AppendLine("var LIVE = { updated: $(JsStr $hkNow.ToString('yyyy-MM-dd HH:mm')), season: $CompSeason };")
  [void]$sb.AppendLine('var RESULTS = [')
  foreach ($r in ($results | Sort-Object { $_.kickoff }, { $_.home })) {
    $gl = @()
    foreach ($g in @($r.goals)) {
      $extra = ''
      if ($g.pen) { $extra += ', pen: true' }
      if ($g.og)  { $extra += ', og: true' }
      $gl += "{ p: $(JsStr $g.p), t: $(JsStr $g.t), min: $(JsStr $g.min)$extra }"
    }
    $attJs = 'null'
    if ($null -ne $r.att -and "$($r.att)" -ne '') { $attJs = [string][int]$r.att }
    [void]$sb.AppendLine("  { gw: $($r.gw), kickoff: $(JsStr $r.kickoff), home: $(JsStr $r.home), away: $(JsStr $r.away), hs: $($r.hs), as: $($r.'as'), venue: $(JsStr $r.venue), att: $attJs, goals: [ $($gl -join ', ') ] },")
  }
  [void]$sb.AppendLine('];')
  [void]$sb.AppendLine('var FIXTURES = [')
  foreach ($x in ($fixtures | Sort-Object { $_.kickoff }, { $_.home })) {
    $extra = ''
    if ($x.featured) { $extra += ', featured: true' }
    if ($x.live) { $extra += ", live: true, hs: $($x.hs), as: $($x.'as'), clock: $(JsStr $x.clock)" }
    [void]$sb.AppendLine("  { gw: $($x.gw), kickoff: $(JsStr $x.kickoff), home: $(JsStr $x.home), away: $(JsStr $x.away), venue: $(JsStr $x.venue)$extra },")
  }
  [void]$sb.AppendLine('];')
  [void]$sb.AppendLine('var VIDEOS = [')
  foreach ($v in $videos) {
    [void]$sb.AppendLine("  { id: $(JsStr $v.id), title: $(JsStr $v.title), channel: $(JsStr $v.channel), label: $(JsStr $v.label), published: $(JsStr $v.published) },")
  }
  [void]$sb.AppendLine('];')
  [void]$sb.AppendLine('var ASSISTS = [')
  foreach ($a in $assists) { [void]$sb.AppendLine("  { n: $(JsStr $a.n), t: $(JsStr $a.t), v: $($a.v) },") }
  [void]$sb.AppendLine('];')

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  $tmp = "$outFile.tmp"
  [IO.File]::WriteAllText($tmp, $sb.ToString(), $utf8NoBom)
  Move-Item -Force $tmp $outFile

  # ---------- 儲存快取、整理記錄 ----------
  $sortedCache = [ordered]@{}                       # 固定鍵值順序，避免每次執行產生不同內容
  foreach ($k in ($cache.Keys | Sort-Object { [int]$_ })) { $sortedCache[$k] = $cache[$k] }
  [IO.File]::WriteAllText($cacheFile, ($sortedCache | ConvertTo-Json -Depth 8 -Compress), $utf8NoBom)
  Log "已寫入 $outFile（賽果 $($results.Count)、賽程 $($fixtures.Count)、助攻 $($assists.Count)）"
  if (Test-Path $logFile) {
    $lines = Get-Content $logFile -Encoding UTF8
    if ($lines.Count -gt 400) { $lines[-400..-1] | Set-Content $logFile -Encoding UTF8 }
  }
  exit 0
}
catch {
  Log "失敗：$($_.Exception.Message)（$($_.InvocationInfo.ScriptLineNumber) 行）"
  exit 1
}
