/* ==========================================================
   英超戰報 — 資料層（data.js）
   ----------------------------------------------------------
   人手維護的內容集中在這個檔案：球隊譯名、球場譯名、新聞。
   - 賽果、賽程、助攻榜由 tools/update-epl.ps1 自動抓取並寫入 js/live.js，請勿在此手動加入。
   - 積分榜、近況、射手榜由 live.js 的 RESULTS 自動計算。
   - 球隊名稱支援「港式」與「台式」兩套譯名。
   ========================================================== */

const SEASON = {
  label: "2026/27",
  updated: "2026-09-03",
  round: 2,          // 僅作備用；實際輪次由 live.js 計算
  champion: "ARS",
  promoted: ["COV", "IPS", "HUL"],
  relegatedLastSeason: ["West Ham United", "Burnley", "Wolverhampton Wanderers"]
};

/* 球隊：hk / tw 為全名譯名，shk / stw 為手機版簡稱（沒有則用全名）
   c1 = 主色，c2 = 邊框色，ct = 文字色 */
const TEAMS = {
  ARS: { en: "Arsenal",                hk: "阿仙奴",     tw: "阿森納",     c1: "#EF0107", c2: "#FFFFFF", ct: "#FFFFFF" },
  AVL: { en: "Aston Villa",            hk: "阿士東維拉", tw: "阿斯頓維拉", shk: "維拉", stw: "維拉", c1: "#670E36", c2: "#95BFE5", ct: "#FFFFFF" },
  BOU: { en: "Bournemouth",            hk: "般尼茅夫",   tw: "伯恩茅斯",   c1: "#DA291C", c2: "#111111", ct: "#FFFFFF" },
  BRE: { en: "Brentford",              hk: "賓福特",     tw: "布倫特福德", c1: "#E30613", c2: "#FFFFFF", ct: "#FFFFFF" },
  BHA: { en: "Brighton & Hove Albion", hk: "白禮頓",     tw: "布萊頓",     c1: "#0057B8", c2: "#FFFFFF", ct: "#FFFFFF" },
  CHE: { en: "Chelsea",                hk: "車路士",     tw: "切爾西",     c1: "#034694", c2: "#FFFFFF", ct: "#FFFFFF" },
  COV: { en: "Coventry City",          hk: "高雲地利",   tw: "考文垂",     c1: "#5FBFEA", c2: "#FFFFFF", ct: "#0B1E2E" },
  CRY: { en: "Crystal Palace",         hk: "水晶宮",     tw: "水晶宮",     c1: "#1B458F", c2: "#C4122E", ct: "#FFFFFF" },
  EVE: { en: "Everton",                hk: "愛華頓",     tw: "埃弗頓",     c1: "#003399", c2: "#FFFFFF", ct: "#FFFFFF" },
  FUL: { en: "Fulham",                 hk: "富咸",       tw: "富勒姆",     c1: "#1C1C1C", c2: "#FFFFFF", ct: "#FFFFFF" },
  HUL: { en: "Hull City",              hk: "侯城",       tw: "赫爾城",     c1: "#F5A300", c2: "#111111", ct: "#1A1000" },
  IPS: { en: "Ipswich Town",           hk: "葉士域治",   tw: "伊普斯維奇", c1: "#0044A9", c2: "#FFFFFF", ct: "#FFFFFF" },
  LEE: { en: "Leeds United",           hk: "列斯聯",     tw: "里茲聯",     c1: "#FFFFFF", c2: "#1D428A", ct: "#1D428A" },
  LIV: { en: "Liverpool",              hk: "利物浦",     tw: "利物浦",     c1: "#C8102E", c2: "#FFFFFF", ct: "#FFFFFF" },
  MCI: { en: "Manchester City",        hk: "曼城",       tw: "曼城",       c1: "#6CABDD", c2: "#FFFFFF", ct: "#0B2A44" },
  MUN: { en: "Manchester United",      hk: "曼聯",       tw: "曼聯",       c1: "#DA291C", c2: "#FBE122", ct: "#FFFFFF" },
  NEW: { en: "Newcastle United",       hk: "紐卡素",     tw: "紐卡索",     c1: "#241F20", c2: "#FFFFFF", ct: "#FFFFFF" },
  NFO: { en: "Nottingham Forest",      hk: "諾定咸森林", tw: "諾丁漢森林", shk: "森林", stw: "森林", c1: "#DD0000", c2: "#FFFFFF", ct: "#FFFFFF" },
  SUN: { en: "Sunderland",             hk: "新特蘭",     tw: "桑德蘭",     c1: "#EB172B", c2: "#FFFFFF", ct: "#FFFFFF" },
  TOT: { en: "Tottenham Hotspur",      hk: "熱刺",       tw: "熱刺",       c1: "#132257", c2: "#FFFFFF", ct: "#FFFFFF" }
};

/* 球場譯名 */
const VENUES = {
  "Emirates Stadium":                { hk: "酋長球場",           tw: "酋長球場" },
  "The MKM Stadium":                 { hk: "MKM球場",            tw: "MKM球場" },
  "Hill Dickinson Stadium":          { hk: "希爾迪金森球場",     tw: "希爾迪金森球場" },
  "Portman Road":                    { hk: "樸茨文路球場",       tw: "波特曼路球場" },
  "The City Ground":                 { hk: "城市球場",           tw: "城市球場" },
  "Gtech Community Stadium":         { hk: "Gtech社區球場",      tw: "Gtech社區球場" },
  "American Express Stadium":        { hk: "美國運通球場",       tw: "美國運通球場" },
  "Etihad Stadium":                  { hk: "伊蒂哈德球場",       tw: "伊蒂哈德球場" },
  "St. James' Park":                 { hk: "聖占士公園",         tw: "聖詹姆斯公園" },
  "Craven Cottage":                  { hk: "卡雲卓奇球場",       tw: "克雷文農場球場" },
  "Selhurst Park":                   { hk: "施賀斯公園",         tw: "塞爾赫斯特公園" },
  "Anfield":                         { hk: "晏菲路球場",         tw: "安菲爾德球場" },
  "Vitality Stadium":                { hk: "活力球場",           tw: "活力球場" },
  "Coventry Building Society Arena": { hk: "高雲地利CBS球場",    tw: "考文垂CBS球場" },
  "Tottenham Hotspur Stadium":       { hk: "熱刺球場",           tw: "熱刺球場" },
  "Stamford Bridge":                 { hk: "史丹福橋球場",       tw: "史丹佛橋球場" },
  "Elland Road":                     { hk: "艾蘭路球場",         tw: "艾蘭路球場" },
  "Stadium of Light":                { hk: "光明球場",           tw: "光明球場" },
  "Old Trafford":                    { hk: "奧脫福球場",         tw: "老特拉福德球場" },
  "Villa Park":                      { hk: "維拉公園",           tw: "維拉公園" }
};

/* 新聞
   - 第一篇為首頁頭條
   - 文字中可用 {{ARS}} 代入球隊譯名、{{V:Old Trafford}} 代入球場譯名，會隨港／台切換
   - cat: match（賽事）/ transfer（轉會）/ feature（專題）/ league（聯賽） */
const NEWS = [
  {
    cat: "match", date: "2026-08-30", teams: ["MUN", "IPS"], score: "5 - 2",
    title: "布魯諾戴帽 {{MUN}}主場5:2大勝{{IPS}} 收復開季首敗失地",
    summary: "首輪作客不敵升班馬{{HUL}}後，{{MUN}}回到主場火力全開。隊長 Bruno Fernandes 上演帽子戲法，Bryan Mbeumo 錦上添花，紅魔以5:2擊退{{IPS}}，取得本季首勝。",
    body: [
      "{{MUN}}周日（8月30日）在{{V:Old Trafford}}迎戰同樣升班的{{IPS}}，全場74,148名觀眾見證紅魔本季首場勝仗。開賽29分鐘，{{IPS}}左閘 Leif Davis 先開紀錄，令主場球迷一度憂心開季兩連敗；不過隊長 Bruno Fernandes 於40分鐘扳平，為下半場反撲揭開序幕。",
      "易邊後{{MUN}}全面壓上，56分鐘{{IPS}}中堅 Jacob Greaves 攔截時擺烏龍，紅魔反超前。Bruno Fernandes 隨後在61分鐘射入12碼，再於68分鐘完成帽子戲法，Bryan Mbeumo 於82分鐘再下一城。{{IPS}}補時階段由 Chuba Akpom 追回一球，最終{{MUN}}以5:2勝出。",
      "此役後{{MUN}}以3分暫列第10位，Bruno Fernandes 更以3球暫居射手榜首。球隊下輪將於9月6日作客{{EVE}}，之後在9月13日迎來主場曼市打吡對{{MCI}}。"
    ]
  },
  {
    cat: "match", date: "2026-08-28", teams: ["CRY", "MCI"], score: "1 - 4",
    title: "{{MCI}}作客4:1輕取{{CRY}} Haaland、Cherki各建兩功 開季兩連勝登榜首",
    summary: "Erling Haaland 與 Rayan Cherki 各入兩球，{{MCI}}周五晚在{{V:Selhurst Park}}大勝{{CRY}}，以較多入球力壓{{ARS}}暫居榜首。",
    body: [
      "第二輪揭幕戰，{{MCI}}周五（8月28日）作客{{V:Selhurst Park}}。Erling Haaland 於17分鐘先開紀錄，下半場 Rayan Cherki 在54分鐘擴大比數，客隊早早掌握主動。",
      "{{CRY}}的唯一入球來自{{MCI}}門將 Gianluigi Donnarumma 於56分鐘的烏龍球，但主隊未能乘勢追擊。Cherki 在59分鐘梅開二度，Haaland 於84分鐘再度建功，鎖定4:1的比數。",
      "{{MCI}}首輪已在主場以2:1險勝{{BOU}}，當時由 Marc Guéhi 與 Josko Gvardiol 在84分鐘及補時階段連入兩球反勝。兩戰全勝共入6球、得失球差+4，與{{ARS}}同分但以入球較多暫列第一。Cherki 與 Phil Foden 各錄得2次助攻，並列助攻榜首。"
    ]
  },
  {
    cat: "match", date: "2026-08-31", teams: ["AVL", "ARS"], score: "0 - 1",
    title: "衛冕冠軍{{ARS}}兩戰全勝零失球 Saka作客{{AVL}}一箭定江山",
    summary: "{{ARS}}周一晚作客{{V:Villa Park}}憑 Bukayo Saka 於59分鐘的入球以1:0小勝，連同首輪3:0擊敗{{COV}}，衛冕之路以兩連勝零失球起步。",
    body: [
      "作為上季相隔22年再奪聯賽冠軍的衛冕球隊，{{ARS}}開季表現穩健。揭幕戰8月21日周五晚在{{V:Emirates Stadium}}迎戰升班馬{{COV}}，Kai Havertz（15分鐘）、Bukayo Saka（23分鐘）及隊長 Martin Ødegaard（49分鐘）各入一球，以3:0輕鬆取勝。",
      "第二輪8月31日作客{{AVL}}，{{ARS}}面對開季0:4慘敗於{{BHA}}後急需反彈的主隊，上半場互無紀錄。59分鐘 Saka 打破僵局，成為全場唯一入球，{{ARS}}以1:0帶走3分。",
      "兩輪過後{{ARS}}入4球零失球，與{{MCI}}同得6分暫列第二。下輪9月6日周日將在主場迎戰同樣兩戰全勝的{{CHE}}，是開季至今最矚目的對決。"
    ]
  },
  {
    cat: "feature", date: "2026-08-29", teams: ["COV", "HUL"], score: "0 - 1",
    title: "升班馬{{HUL}}兩連勝驚艷開季 相隔9年重返英超即挫{{MUN}}",
    summary: "闊別英超9年的{{HUL}}，開季主場2:0擊敗{{MUN}}，再作客1:0小勝同樣升班的{{COV}}，兩戰全勝零失球，暫列第三。",
    body: [
      "本季三支升班馬中，{{HUL}}的開局最為亮眼。8月22日周六在{{V:The MKM Stadium}}迎戰{{MUN}}，Semi Ajayi 於17分鐘先開紀錄，Nobel Mendy 在38分鐘再下一城，{{HUL}}以2:0爆冷擊敗紅魔，全場24,470名觀眾見證球隊重返頂級聯賽的首場勝仗。",
      "第二輪作客{{COV}}，兩支升班馬正面交鋒，賽事一直膠着至82分鐘，Liam Millar 攻入全場唯一入球，{{HUL}}以1:0取勝。",
      "{{HUL}}兩戰全勝、入3球零失球，暫居榜首集團。另外兩支升班馬方面，{{IPS}}首輪2:1擊敗{{SUN}}後，次輪作客2:5不敵{{MUN}}；相隔25年重返英超的{{COV}}則兩戰皆北，尚未開齋。"
    ]
  },
  {
    cat: "match", date: "2026-08-30", teams: ["CHE", "BHA"], score: "4 - 3",
    title: "七球大戰 {{CHE}}主場4:3險勝{{BHA}} 上半場3:0領先險遭追平",
    summary: "{{CHE}}上半場32分鐘內連入三球，卻在下半場被{{BHA}}步步追近，最終憑 Cole Palmer 74分鐘的入球以4:3驚險保住3分，開季兩戰全勝。",
    body: [
      "8月30日周日{{V:Stamford Bridge}}上演開季至今入球最多的賽事。{{CHE}}開賽4分鐘由 Roméo Lavia 先開紀錄，Pedro Neto 於14分鐘擴大比數，João Pedro 再在32分鐘射入第三球，主隊一度以3:0大幅領先。",
      "{{BHA}}隨即由 Malick Yalcouyé 在35分鐘追回一球。下半場63分鐘，João Pedro 自擺烏龍，比數變成3:2，{{BHA}}士氣大振。Cole Palmer 於74分鐘為{{CHE}}射入第四球，但 Pascal Groß 在補時第6分鐘再為客隊追近，最終{{CHE}}驚險以4:3勝出。",
      "{{CHE}}首輪已在{{V:Craven Cottage}}以3:2險勝{{FUL}}，兩戰共入7球但失5球，攻力驚人惟防守隱憂明顯。João Pedro 與 Palmer 各入2球，並列射手榜次席。"
    ]
  },
  {
    cat: "feature", date: "2026-08-31", teams: ["TOT", "AVL"],
    title: "{{TOT}}、{{AVL}}開季兩連敗未開齋 榜尾拉響警號",
    summary: "{{TOT}}作客0:3負{{BRE}}後，主場再0:2不敵{{NEW}}；{{AVL}}則先後0:4慘敗{{BHA}}及0:1負{{ARS}}。兩隊兩輪合共零入球、各失5球，包辦聯賽榜尾。",
    body: [
      "{{TOT}}開季首輪作客{{V:Gtech Community Stadium}}，被 Keane Lewis-Potter、Vitaly Janelt 及 Michael Kayode 各入一球，以0:3完敗。第二輪回到主場面對{{NEW}}，Anthony Elanga 於62分鐘及 Yoane Wissa 於72分鐘先後建功，{{TOT}}在61,025名主場球迷面前再吞0:2。",
      "{{AVL}}的情況同樣不妙。首輪作客{{BHA}}，開賽8分鐘 Victor Lindelöf 已擺烏龍，Maxim De Cuyper 與梅開二度的 Jack Hinshelwood 再添三球，{{AVL}}以0:4慘敗。次輪主場對{{ARS}}雖然守至59分鐘，最終仍以0:1落敗。",
      "兩隊目前同以0分、得失球差-5包辦第19及20位，暫以隊名字母排序區分。{{TOT}}下輪作客{{NFO}}，{{AVL}}則作客兩戰全勝的{{HUL}}，兩隊均急需首場勝仗止血。"
    ]
  },
  {
    cat: "transfer", date: "2026-09-02", teams: ["ARS", "EVE", "CHE"],
    title: "轉會窗關閉 英超球會開支再創紀錄 {{ARS}}未補前鋒惹爭議",
    summary: "夏季轉會窗於9月1日關閉，據英國傳媒統計，英超球會總開支再破紀錄。{{ARS}}未能引入新前鋒，{{EVE}}洽購 Folarin Balogun 亦告吹。",
    body: [
      "英超夏季轉會窗已於9月1日截止。據天空體育報道，英超球會今夏的轉會總開支再次刷新紀錄，但多宗矚目交易在死線前告吹，令不少球會在窗口關閉後仍有遺憾。",
      "{{ARS}}方面，Julián Álvarez 最終留效馬德里體育會，令衛冕冠軍在沒有新前鋒的情況下開展新季，英國傳媒質疑球隊攻擊線深度是否足以應付多線作戰。{{EVE}}洽購前鋒 Folarin Balogun 的交易，則在最後階段因球員決定放棄而告吹。",
      "{{CHE}}方面，摩納哥在死線前臨時取消出售中場 Lamine Camara 予藍軍，據報{{CHE}}對此相當不滿。{{MUN}}則安排年輕前鋒 Chido Obi 外借至荷甲球會一季，以爭取更多上陣機會。"
    ]
  },
  {
    cat: "league", date: "2026-09-01", glyph: "📅",
    title: "9月國際賽期改制 英超第五輪後停賽三週 10月10日復賽",
    summary: "國際足協自2026年起合併9、10月國際賽期，英超在9月18至20日的第五輪後將暫停三週，直至10月10日第六輪才復賽。",
    body: [
      "由2026年開始，國際足協將9月及10月的男子國際賽期合併為一個較長的賽期，各國家隊最多可在期間進行四場賽事。對英超而言，聯賽將在9月20日完成第五輪後暫停，10月10日周六以{{ARS}}主場對{{LEE}}揭開第六輪序幕。",
      "停賽前的兩輪賽程相當精彩：第四輪9月13日周日將上演曼市打吡，{{MUN}}在{{V:Old Trafford}}迎戰{{MCI}}；第五輪則有{{BHA}}對{{ARS}}、{{BOU}}對{{LIV}}等賽事。復賽後的第六輪，{{LIV}}將在10月11日於{{V:Anfield}}迎戰{{MCI}}。",
      "另外，本季亦是英超禁止博彩公司標誌出現於比賽球衣正面的首個賽季。本站賽程時間一律以香港時間（UTC+8）顯示，較英國夏令時間快7小時。"
    ]
  },
  {
    cat: "match", date: "2026-08-29", teams: ["LIV", "NFO"], score: "2 - 2",
    title: "{{LIV}}開季兩戰兩和 補時12碼救主後再被{{NFO}}逼和",
    summary: "{{LIV}}首輪作客{{NEW}}靠 Dominik Szoboszlai 補時第9分鐘射入12碼以2:2逼和，次輪主場對{{NFO}}再以2:2言和，兩輪僅得2分。",
    body: [
      "{{LIV}}8月23日作客{{V:St. James' Park}}，開賽5分鐘即被 Anthony Elanga 攻破大門。Cody Gakpo 於55分鐘扳平，但{{NEW}}兩分鐘後由 Joe Willock 再度領先。直至補時第9分鐘，Szoboszlai 一射12碼中的，{{LIV}}才驚險搶回1分。",
      "第二輪8月29日回到{{V:Anfield}}，{{LIV}}再次先失球，Dan Ndoye 於24分鐘為{{NFO}}先開紀錄。Alexander Isak 在60分鐘扳平，惟 Morgan Gibbs-White 於70分鐘射入12碼令客隊再次領先，最後由 Víctor Muñoz 在82分鐘救回一球，賽果2:2。",
      "兩輪過後{{LIV}}以2分排第13位，是傳統勁旅中開局最慢的一隊。下輪9月4日周五將作客{{IPS}}，為第三輪揭幕戰。"
    ]
  }
];
