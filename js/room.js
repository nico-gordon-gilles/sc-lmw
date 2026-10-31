/* Rooms: a team shares one code. The site does not read the game folder.
   "I am here" is a click on a place. Routes are Shift+click, then publish. */
(function(){
  var SC = window.SCLMW = window.SCLMW || {};
  var TOKEN = 'sclmw_room_token';
  var CODE = 'sclmw_room_code';
  var NICK = 'sclmw_room_nick';
  var HIST = 'sclmw_room_hist';
  var FRAME = 'sclmw_room_frame';
  var CREW = 'sclmw_crew_frame';
  var DICT = {
    'zh-Hans': {
      title:'团队房间', lead:'这个网页不读取游戏目录。在星图上右键，选「我在这里」，队友就能看到。',
      s1:'填写昵称。建议用游戏里的名字，方便队长认出你。',
      s2:'队长建立房间，把房间码发给队员。',
      s3:'队员申请加入，队长确认后，大家只看得到这个房间。',
      nick:'昵称', create:'建立房间', join:'加入房间', code:'房间码',
      recover:'恢复码', recoverLead:'这组码只给你。换浏览器或清掉网站数据后，用房间码和它接管队长。请另外抄下来。', recoverCopy:'复制恢复码', recoverGo:'接管队长', recoverPh:'ABCD-EFGH-JKLM', errRecover:'恢复码不对。',
      wait:'已提交申请，等待队长确认。', copy:'复制房间码', copied:'已复制',
      enter:'进入星图', leave:'离开房间', pending:'待确认', approve:'通过', reject:'拒绝', alertLater:'稍后',
      here:'我在这里', hereNeed:'右键要落在一个地点上。',
      route:'标记路线', routeOn:'结束标记', routeHint:'按住 Shift，依次点地点。',
      note:'路线备注', publish:'发布给房间', clear:'清空', comment:'评论', send:'发送', del:'删除',
      mode:'谁可以画路线', modeCaptain:'仅队长', modeMembers:'队员也可以',
      members:'房间成员', online:'在线', offline:'离线', server:'服务器', fold:'收起', unfold:'展开', you:'你', captainTag:'队长',
      find:'搜索昵称或地点', none:'没有匹配的人',
      give:'设为队长', giveShort:'队长', giveLeave:'交给他并离开', dissolve:'解散房间', dissolveLeave:'解散并离开', cancel:'取消',
      kick:'踢出', kickYes:'确定', kicked:'你已被移出这个房间。', denied:'队长拒绝了这次申请。',
      cast:'广播', castLead:'发给这个房间里的所有人。', castPh:'写一句给小队的话', castSend:'发送', castFrom:'来自', castClose:'知道了', castSound:'广播音效', castOn:'开', castOff:'关', castEmpty:'先写一点内容。',
      handTitle:'离开前先交接', handLead:'把队长交给一位队员，或解散房间。', handSolo:'房间里只有你。离开会解散这个房间。',
      errNick:'请填写 1 到 32 个字的昵称。', errRoom:'没有这个房间。',
      agoNow:'刚刚', agoSec:'{n} 秒前', agoMin:'{n} 分钟前', agoHour:'{n} 小时前', agoDay:'{n} 天前',
      noPlace:'星图上对不上这个地点。',
      errNet:'房间服务没连上。请在项目目录运行 python server/room_server.py，然后打开 http://127.0.0.1:8770/ 。', published:'已发布的路线', by:'来自',
      yours:'你的房间', switchRoom:'建立或加入别的房间',
      hist:'最近的房间', histWait:'正在查看', histAlive:'还在', histGone:'已不在', histOnline:'{n} 人', histBack:'返回这个房间',
      visTitle:'对外', visPublic:'公开', visPrivate:'私人', visLead:'公开后，这个房间会出现在首页，别人可以直接进入。',
      visCool:'{n}后可再改', visSec:'{n} 秒', visMin:'{n} 分钟',
      pubTitle:'公开房间', pubEmpty:'现在没有公开房间', pubPeople:'{n} 人',
      resumed:'上次留下的房间', resumedLead:'刷新后仍是这个房间。房间码没有变，可以直接进入星图。',
      freshCreate:'刚建立的房间', freshCreateLead:'把房间码发给队员。恢复码只留给自己，换浏览器时用来接管队长。',
      freshJoin:'刚加入的房间', freshJoinLead:'可以直接进入星图。',
      resumedWait:'上次提交的申请还在等队长确认。',
      link:'连到这台电脑', linkSent:'已经发给本机的 Starfix。回到那个窗口，点确认。',
      linkWait:'请在 Starfix 窗口点确认。',
      linkOn:'已连上房间',
      linkOff:'本机的 Starfix 没开。先双击 Starfix，等窗口出现后再点一次。',
      locGuide:'你可以手动标位置，也可以用附带程序试着自动读日志。手动：在星图上右键，选「我在这里」。自动：项目自带 Starfix，源码都在 companion/，可以先读完再运行。它只读本机 Game.log，不进游戏、不读内存、不改游戏文件。打开后点「连到这台电脑」，回窗口确认。网页本身不读游戏目录。RSI 条款没有书面允许读日志，开不开由你决定。'
    },
    'zh-Hant': {
      title:'團隊房間', lead:'這個網頁不讀取遊戲資料夾。在星圖上右鍵，選「我在這裡」，隊友就能看到。',
      s1:'填寫暱稱。建議用遊戲裡的名字，方便隊長認出你。',
      s2:'隊長建立房間，把房間碼發給隊員。',
      s3:'隊員申請加入，隊長確認後，大家只看得到這個房間。',
      nick:'暱稱', create:'建立房間', join:'加入房間', code:'房間碼',
      recover:'恢復碼', recoverLead:'這組碼只給你。換瀏覽器或清掉網站資料後，用房間碼和它接管隊長。請另外抄下來。', recoverCopy:'複製恢復碼', recoverGo:'接管隊長', recoverPh:'ABCD-EFGH-JKLM', errRecover:'恢復碼不對。',
      wait:'已送出申請，等待隊長確認。', copy:'複製房間碼', copied:'已複製',
      enter:'進入星圖', leave:'離開房間', pending:'待確認', approve:'通過', reject:'拒絕', alertLater:'稍後',
      here:'我在這裡', hereNeed:'右鍵要落在一個地點上。',
      route:'標記路線', routeOn:'結束標記', routeHint:'按住 Shift，依序點地點。',
      note:'路線備註', publish:'發布給房間', clear:'清空', comment:'評論', send:'送出', del:'刪除',
      mode:'誰可以畫路線', modeCaptain:'僅隊長', modeMembers:'隊員也可以',
      members:'房間成員', online:'在線', offline:'離線', server:'伺服器', fold:'收起', unfold:'展開', you:'你', captainTag:'隊長',
      find:'搜尋暱稱或地點', none:'沒有符合的人',
      give:'設為隊長', giveShort:'隊長', giveLeave:'交給他並離開', dissolve:'解散房間', dissolveLeave:'解散並離開', cancel:'取消',
      kick:'踢出', kickYes:'確定', kicked:'你已被移出這個房間。', denied:'隊長拒絕了這次申請。',
      cast:'廣播', castLead:'發給這個房間裡的所有人。', castPh:'寫一句給小隊的話', castSend:'發送', castFrom:'來自', castClose:'知道了', castSound:'廣播音效', castOn:'開', castOff:'關', castEmpty:'先寫一點內容。',
      handTitle:'離開前先交接', handLead:'把隊長交給一位隊員，或解散房間。', handSolo:'房間裡只有你。離開會解散這個房間。',
      errNick:'請填寫 1 到 32 個字的暱稱。', errRoom:'沒有這個房間。',
      agoNow:'剛剛', agoSec:'{n} 秒前', agoMin:'{n} 分鐘前', agoHour:'{n} 小時前', agoDay:'{n} 天前',
      noPlace:'星圖上對不上這個地點。',
      errNet:'房間服務沒連上。請在專案目錄執行 python server/room_server.py，然後打開 http://127.0.0.1:8770/ 。', published:'已發布的路線', by:'來自',
      yours:'你的房間', switchRoom:'建立或加入別的房間',
      hist:'最近的房間', histWait:'正在查看', histAlive:'還在', histGone:'已不在', histOnline:'{n} 人', histBack:'返回這個房間',
      visTitle:'對外', visPublic:'公開', visPrivate:'私人', visLead:'公開後，這個房間會出現在首頁，別人可以直接進入。',
      visCool:'{n}後可再改', visSec:'{n} 秒', visMin:'{n} 分鐘',
      pubTitle:'公開房間', pubEmpty:'現在沒有公開房間', pubPeople:'{n} 人',
      resumed:'上次留下的房間', resumedLead:'重新整理後仍是這個房間。房間碼沒有變，可以直接進入星圖。',
      freshCreate:'剛建立的房間', freshCreateLead:'把房間碼發給隊員。恢復碼只留給自己，換瀏覽器時用來接管隊長。',
      freshJoin:'剛加入的房間', freshJoinLead:'可以直接進入星圖。',
      resumedWait:'上次送出的申請還在等隊長確認。',
      link:'連到這台電腦', linkSent:'已經發給本機的 Starfix。回到那個視窗，點確認。',
      linkWait:'請在 Starfix 視窗點確認。',
      linkOn:'已連上房間',
      linkOff:'本機的 Starfix 沒開。先雙擊 Starfix，等視窗出現後再點一次。',
      locGuide:'你可以手動標位置，也可以用附帶程式試著自動讀日誌。手動：在星圖上右鍵，選「我在這裡」。自動：專案自帶 Starfix，源碼都在 companion/，可以先讀完再執行。它只讀本機 Game.log，不進遊戲、不讀記憶體、不改遊戲檔案。打開後點「連到這台電腦」，回視窗確認。網頁本身不讀遊戲資料夾。RSI 條款沒有書面允許讀日誌，開不開由你決定。'
    },
    en: {
      title:'Team room', lead:'This page does not read the game folder. Right-click the map and choose “I am here”.',
      s1:'Pick a nickname. Your in-game name makes you easy to recognize.',
      s2:'The captain creates a room and shares the code.',
      s3:'Members apply. After the captain accepts, only this room can see each other.',
      nick:'Nickname', create:'Create room', join:'Join room', code:'Room code',
      recover:'Recovery code', recoverLead:'This code is only for you. After a new browser or cleared site data, use it with the room code to take the captain role. Copy it somewhere else.', recoverCopy:'Copy recovery code', recoverGo:'Take captain', recoverPh:'ABCD-EFGH-JKLM', errRecover:'That recovery code does not match.',
      wait:'Request sent. Waiting for the captain.', copy:'Copy code', copied:'Copied',
      enter:'Enter map', leave:'Leave room', pending:'Waiting', approve:'Accept', reject:'Decline', alertLater:'Later',
      here:'I am here', hereNeed:'Right-click a place on the map.',
      route:'Mark route', routeOn:'Stop marking', routeHint:'Hold Shift and click places in order.',
      note:'Route note', publish:'Publish to room', clear:'Clear', comment:'Comment', send:'Send', del:'Delete',
      mode:'Who can draw routes', modeCaptain:'Captain only', modeMembers:'Members too',
      members:'Room members', online:'Online', offline:'Offline', server:'Server', fold:'Minimize', unfold:'Expand', you:'you', captainTag:'Captain',
      find:'Search name or place', none:'No match',
      give:'Make captain', giveShort:'Lead', giveLeave:'Give and leave', dissolve:'Close room', dissolveLeave:'Close and leave', cancel:'Cancel',
      kick:'Remove', kickYes:'Confirm', kicked:'You were removed from this room.', denied:'The captain declined this request.',
      cast:'Broadcast', castLead:'Send this to everyone in the room.', castPh:'A note for the squad', castSend:'Send', castFrom:'From', castClose:'Got it', castSound:'Broadcast sound', castOn:'On', castOff:'Off', castEmpty:'Write something first.',
      handTitle:'Hand off before leaving', handLead:'Give the captain role to a member, or close the room.', handSolo:'You are the only person here. Leaving closes the room.',
      errNick:'Use a nickname of 1 to 32 characters.', errRoom:'No room with that code.',
      agoNow:'Just now', agoSec:'{n}s ago', agoMin:'{n} min ago', agoHour:'{n} h ago', agoDay:'{n} d ago',
      noPlace:'This place is not on the map.',
      errNet:'Room service is not reachable. Run python server/room_server.py and open http://127.0.0.1:8770/ .', published:'Published routes', by:'by',
      yours:'Your room', switchRoom:'Create or join a different room',
      hist:'Recent rooms', histWait:'Checking', histAlive:'Open', histGone:'Gone', histOnline:'{n} people', histBack:'Back to this room',
      visTitle:'Access', visPublic:'Public', visPrivate:'Private', visLead:'A public room is listed on the home page. People can enter directly.',
      visCool:'Change again in {n}', visSec:'{n}s', visMin:'{n} min',
      pubTitle:'Public rooms', pubEmpty:'No public rooms right now', pubPeople:'{n} people',
      resumed:'Room from last time', resumedLead:'Refreshing kept this room. The code is unchanged. You can enter the map.',
      freshCreate:'Room just created', freshCreateLead:'Send the room code to your team. Keep the recovery code. It takes the captain role on a new browser.',
      freshJoin:'Room just joined', freshJoinLead:'You can enter the map.',
      resumedWait:'Your earlier request is still waiting for the captain.',
      link:'Connect this computer', linkSent:'Sent to Starfix on this computer. Go back to that window and confirm.',
      linkWait:'Confirm in the Starfix window.',
      linkOn:'Connected to',
      linkOff:'Starfix is not running. Double-click Starfix, wait for its window, then click again.',
      locGuide:'You can mark your place by hand, or try the bundled program to read the game log. By hand: right-click the map and choose “I am here.” Automatic: this project includes Starfix. All of its source is in companion/. Read it before you run it. It only reads Game.log on this computer. It does not enter the game, read memory, or change game files. Open it, choose “Connect this computer,” then confirm in its window. This page does not read the game folder. The RSI terms do not permit reading the log in writing. You decide.'
    },
    de: {
      title:'Teamraum', lead:'Diese Seite liest keinen Spielordner. Rechtsklick auf der Karte, dann „Ich bin hier“.',
      s1:'Nickname eintragen. Der Name aus dem Spiel hilft dem Captain.',
      s2:'Der Captain legt einen Raum an und gibt den Code weiter.',
      s3:'Mitglieder fragen an. Nach dem Ja sieht nur dieser Raum einander.',
      nick:'Nickname', create:'Raum anlegen', join:'Raum beitreten', code:'Raumcode',
      recover:'Wiederherstellungscode', recoverLead:'Dieser Code ist nur für dich. Nach einem neuen Browser oder gelöschten Websitedaten übernimmst du damit zusammen mit dem Raumcode den Captain. Kopiere ihn extra.', recoverCopy:'Code kopieren', recoverGo:'Captain übernehmen', recoverPh:'ABCD-EFGH-JKLM', errRecover:'Der Wiederherstellungscode stimmt nicht.',
      wait:'Anfrage ist raus. Der Captain muss zustimmen.', copy:'Code kopieren', copied:'Kopiert',
      enter:'Zur Karte', leave:'Raum verlassen', pending:'Offen', approve:'Annehmen', reject:'Ablehnen', alertLater:'Später',
      here:'Ich bin hier', hereNeed:'Der Rechtsklick muss auf einem Ort liegen.',
      route:'Route markieren', routeOn:'Markieren beenden', routeHint:'Shift halten und Orte der Reihe nach anklicken.',
      note:'Notiz zur Route', publish:'Für den Raum veröffentlichen', clear:'Leeren', comment:'Kommentar', send:'Senden', del:'Löschen',
      mode:'Wer Routen zeichnen darf', modeCaptain:'Nur der Captain', modeMembers:'Auch Mitglieder',
      members:'Im Raum', online:'Online', offline:'Offline', server:'Server', fold:'Einklappen', unfold:'Ausklappen', you:'du', captainTag:'Captain',
      find:'Name oder Ort', none:'Niemand passt',
      give:'Zum Captain machen', giveShort:'Capt.', giveLeave:'Geben und gehen', dissolve:'Raum schließen', dissolveLeave:'Schließen und gehen', cancel:'Abbrechen',
      kick:'Entfernen', kickYes:'Wirklich', kicked:'Du wurdest aus diesem Raum entfernt.', denied:'Der Captain hat diese Anfrage abgelehnt.',
      cast:'Durchsage', castLead:'Das geht an alle in diesem Raum.', castPh:'Ein Satz für die Gruppe', castSend:'Senden', castFrom:'Von', castClose:'Verstanden', castSound:'Durchsage-Ton', castOn:'An', castOff:'Aus', castEmpty:'Erst etwas schreiben.',
      handTitle:'Vor dem Gehen übergeben', handLead:'Captain an ein Mitglied geben, oder den Raum schließen.', handSolo:'Du bist allein. Gehen schließt den Raum.',
      errNick:'Nickname mit 1 bis 32 Zeichen.', errRoom:'Diesen Raum gibt es nicht.',
      agoNow:'Gerade', agoSec:'vor {n} s', agoMin:'vor {n} min', agoHour:'vor {n} h', agoDay:'vor {n} d',
      noPlace:'Dieser Ort ist nicht auf der Karte.',
      errNet:'Der Raumdienst ist nicht erreichbar. python server/room_server.py starten und http://127.0.0.1:8770/ öffnen.', published:'Veröffentlichte Routen', by:'von',
      yours:'Dein Raum', switchRoom:'Anderen Raum anlegen oder beitreten',
      hist:'Letzte Räume', histWait:'Prüfung', histAlive:'Offen', histGone:'Weg', histOnline:'{n} Personen', histBack:'Zurück zu diesem Raum',
      visTitle:'Zugang', visPublic:'Öffentlich', visPrivate:'Privat', visLead:'Ein öffentlicher Raum steht auf der Startseite. Man kann direkt eintreten.',
      visCool:'Wieder änderbar in {n}', visSec:'{n} s', visMin:'{n} min',
      pubTitle:'Öffentliche Räume', pubEmpty:'Gerade keine öffentlichen Räume', pubPeople:'{n} Personen',
      resumed:'Raum von zuletzt', resumedLead:'Nach dem Neuladen ist es derselbe Raum. Der Code ist unverändert. Du kannst die Karte öffnen.',
      freshCreate:'Gerade angelegt', freshCreateLead:'Gib den Raumcode an das Team. Den Wiederherstellungscode behältst du. Damit übernimmst du den Captain in einem neuen Browser.',
      freshJoin:'Gerade beigetreten', freshJoinLead:'Du kannst die Karte öffnen.',
      resumedWait:'Deine frühere Anfrage wartet noch auf den Captain.',
      link:'Diesen Computer verbinden', linkSent:'An Starfix auf diesem Computer gesendet. Dort bestätigen.',
      linkWait:'Im Starfix-Fenster bestätigen.',
      linkOn:'Verbunden mit',
      linkOff:'Starfix läuft nicht. Starfix doppelklicken, auf das Fenster warten und erneut klicken.',
      locGuide:'Du kannst den Ort von Hand setzen oder das mitgelieferte Programm das Spiellog lesen lassen. Von Hand: Rechtsklick auf der Karte, dann „Ich bin hier“. Automatisch: das Projekt enthält Starfix. Der ganze Quelltext liegt in companion/. Lies ihn, bevor du ihn startest. Es liest nur die Game.log auf diesem Computer. Es betritt das Spiel nicht, liest keinen Speicher und ändert keine Spieldateien. Öffne es, wähle „Diesen Computer verbinden“ und bestätige im Fenster. Diese Seite liest keinen Spielordner. Die RSI-Bedingungen erlauben das Lesen des Logs nicht schriftlich. Du entscheidest.'
    }
  };
  function lang(){ return (SC.i18n && SC.i18n.lang) || 'en'; }
  function t(k){ var d = DICT[lang()] || DICT.en; return d[k] || DICT.en[k] || k; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function token(){ try{ return localStorage.getItem(TOKEN)||''; }catch(e){ return ''; } }
  function savedCode(){ try{ return localStorage.getItem(CODE)||''; }catch(e){ return ''; } }
  var state = null, draft = [], marking = false, note = '', statusMsg = '', selected = '', API = '', entered = false, roomKind = '', linkState = '', linkMiss = 0, leaving = false, crewQ = '', picking = false, histInfo = {}, histKey = '', pubRooms = null, pubSig = null, pubAt = 0, alertHold = false, alertSeen = {}, alertFlash = null, alertTimer = 0, kickAsk = '', alertDeny = null, castCompose = false, castDraft = '', castErr = '', castIncoming = null, castAudio = null, ctxAt = null, ctxSig = '', recoverDraft = '', recoverFocus = '';

  function api(path, opt){
    opt = opt || {};
    var headers = {'Content-Type':'application/json'};
    if(token()) headers.Authorization = 'Bearer '+token();
    return fetch(API+path, {
      method: opt.method || 'GET',
      headers: headers,
      body: opt.body ? JSON.stringify(opt.body) : undefined,
      cache: 'no-store'
    }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(j){
        if(!r.ok){ var err = new Error((j&&j.error)||('http '+r.status)); err.status=r.status; err.body=j; throw err; }
        return j;
      });
    });
  }

  function root(){ return document.querySelector('.sc-lmw') || document.body; }

  function ensure(){
    var g = document.getElementById('stGate');
    if(!g){
      g = document.createElement('div');
      g.id = 'stGate';
      g.className = 'st-gate';
      g.hidden = true;
      root().appendChild(g);
    }
    var dock = document.getElementById('stRoom');
    var dockIco = document.getElementById('stRoomIco');
    if(!dock){
      dock = document.createElement('div');
      dock.id = 'stRoom';
      dock.className = 'st-room';
      dock.hidden = true;
      root().appendChild(dock);
      bindFrame(dock, {key:FRAME, minW:280, minH:220});
    }
    if(!dockIco){
      dockIco = document.createElement('button');
      dockIco.type = 'button';
      dockIco.id = 'stRoomIco';
      dockIco.className = 'st-float-ico st-room-ico';
      dockIco.hidden = true;
      root().appendChild(dockIco);
      bindIcon(dockIco, FRAME, function(){ patchFrame(FRAME, {mini:0}); paint(); });
    }
    var crew = document.getElementById('stCrew');
    var crewIco = document.getElementById('stCrewIco');
    if(!crew){
      crew = document.createElement('div');
      crew.id = 'stCrew';
      crew.className = 'st-room st-crew';
      crew.hidden = true;
      root().appendChild(crew);
      crewIco = document.createElement('button');
      crewIco.type = 'button';
      crewIco.id = 'stCrewIco';
      crewIco.className = 'st-float-ico';
      crewIco.hidden = true;
      root().appendChild(crewIco);
      bindFrame(crew, {key:CREW, minW:220, minH:160});
      bindIcon(crewIco, CREW, function(){ patchFrame(CREW, {mini:0}); paint(); });
    }
    return {gate:g, dock:dock, dockIco:dockIco, crew:crew, crewIco:crewIco};
  }

  function readRaw(key){
    try{ var s = JSON.parse(localStorage.getItem(key)||'null'); if(s && typeof s==='object') return s; }catch(e){}
    return null;
  }
  function patchFrame(key, part){
    var s = readRaw(key) || {};
    Object.keys(part).forEach(function(k){ s[k] = part[k]; });
    try{ localStorage.setItem(key, JSON.stringify(s)); }catch(e){}
    return s;
  }
  function sheetLayout(){
    var host = root();
    var w = host.clientWidth||999, h = host.clientHeight||999;
    return w<=700 || (w<=900 && h<=500);
  }
  function clearFrame(dock){
    if(!dock) return;
    dock.style.left = '';
    dock.style.top = '';
    dock.style.right = '';
    dock.style.bottom = '';
    dock.style.width = '';
    dock.style.height = '';
  }
  function applyFrame(dock, key, minW, minH){
    if(sheetLayout()){ clearFrame(dock); return; }
    var s = readRaw(key || FRAME);
    if(!s || !dock || typeof s.l!=='number' || !(s.w>0) || !(s.h>0)) return;
    minW = minW || 280; minH = minH || 220;
    var host = root();
    var W = host.clientWidth||1, H = host.clientHeight||1;
    var w = Math.max(minW, Math.min(s.w, W));
    var h = Math.max(minH, Math.min(s.h, H));
    var l = Math.max(0, Math.min(s.l, Math.max(0, W-w)));
    var t = Math.max(0, Math.min(s.t, Math.max(0, H-h)));
    dock.style.left = l+'px';
    dock.style.top = t+'px';
    dock.style.right = 'auto';
    dock.style.bottom = 'auto';
    dock.style.width = w+'px';
    dock.style.height = h+'px';
  }
  function saveFrame(dock, key){
    if(!dock || dock.hidden || dock.offsetWidth<40) return;
    var host = root().getBoundingClientRect();
    var box = dock.getBoundingClientRect();
    patchFrame(key || FRAME, {
      l: Math.round(box.left-host.left),
      t: Math.round(box.top-host.top),
      w: Math.round(box.width),
      h: Math.round(box.height)
    });
  }
  function placeIcon(ico, l, t){
    var host = root();
    var W = host.clientWidth||1, H = host.clientHeight||1;
    var w = ico.offsetWidth||48, h = ico.offsetHeight||48;
    l = Math.max(8, Math.min(l, W-w-8));
    t = Math.max(8, Math.min(t, H-h-8));
    ico.style.left = l+'px';
    ico.style.top = t+'px';
  }
  function bindFrame(dock, opt){
    opt = opt || {};
    var key = opt.key || FRAME, minW = opt.minW || 280, minH = opt.minH || 220, drag = null;
    function place(l, t, w, h){
      var host = root();
      var W = host.clientWidth||1, H = host.clientHeight||1;
      w = Math.max(minW, Math.min(w, W));
      h = Math.max(minH, Math.min(h, H));
      l = Math.max(0, Math.min(l, Math.max(0, W-w)));
      t = Math.max(0, Math.min(t, Math.max(0, H-h)));
      dock.style.left = l+'px';
      dock.style.top = t+'px';
      dock.style.right = 'auto';
      dock.style.bottom = 'auto';
      dock.style.width = w+'px';
      dock.style.height = h+'px';
    }
    dock.addEventListener('pointerdown', function(e){
      if(e.button!==0) return;
      var edge = e.target.closest && e.target.closest('[data-resize]');
      var bar = e.target.closest && e.target.closest('.st-room-h');
      if(!edge && !(bar && !(e.target.closest && e.target.closest('button')))) return;
      var host = root().getBoundingClientRect();
      var box = dock.getBoundingClientRect();
      drag = {
        mode: edge ? edge.getAttribute('data-resize') : 'move',
        x: e.clientX, y: e.clientY,
        l: box.left-host.left, t: box.top-host.top,
        w: box.width, h: box.height
      };
      dock.__frameDrag = true;
      dock.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    dock.addEventListener('pointermove', function(e){
      if(!drag) return;
      var dx = e.clientX-drag.x, dy = e.clientY-drag.y;
      var l = drag.l, t = drag.t, w = drag.w, h = drag.h, m = drag.mode;
      if(m==='move'){ l += dx; t += dy; }
      else {
        var east = m==='e'||m==='ne'||m==='se';
        var west = m==='w'||m==='nw'||m==='sw';
        var south = m==='s'||m==='se'||m==='sw';
        var north = m==='n'||m==='ne'||m==='nw';
        if(east) w = drag.w+dx;
        if(south) h = drag.h+dy;
        if(west){ w = drag.w-dx; l = drag.l+dx; }
        if(north){ h = drag.h-dy; t = drag.t+dy; }
        if(w<minW){ if(west) l -= minW-w; w = minW; }
        if(h<minH){ if(north) t -= minH-h; h = minH; }
      }
      place(l, t, w, h);
    });
    function end(e){
      if(!drag) return;
      drag = null;
      dock.__frameDrag = false;
      saveFrame(dock, key);
      try{ dock.releasePointerCapture(e.pointerId); }catch(err){}
    }
    dock.addEventListener('pointerup', end);
    dock.addEventListener('pointercancel', end);
    if(window.ResizeObserver){
      new ResizeObserver(function(){ if(!drag) applyFrame(dock, key, minW, minH); }).observe(root());
    } else {
      window.addEventListener('resize', function(){ if(!drag) applyFrame(dock, key, minW, minH); });
    }
  }
  function bindIcon(ico, key, onOpen){
    var drag = null, moved = false;
    ico.addEventListener('pointerdown', function(e){
      if(e.button!==0) return;
      var host = root().getBoundingClientRect();
      var box = ico.getBoundingClientRect();
      drag = {x:e.clientX, y:e.clientY, l:box.left-host.left, t:box.top-host.top};
      moved = false;
      ico.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    ico.addEventListener('pointermove', function(e){
      if(!drag) return;
      var dx = e.clientX-drag.x, dy = e.clientY-drag.y;
      if(Math.abs(dx)>4 || Math.abs(dy)>4) moved = true;
      placeIcon(ico, drag.l+dx, drag.t+dy);
    });
    function end(e){
      if(!drag) return;
      var dx = e.clientX-drag.x, dy = e.clientY-drag.y;
      placeIcon(ico, drag.l+dx, drag.t+dy);
      patchFrame(key, {ix:parseFloat(ico.style.left), iy:parseFloat(ico.style.top)});
      drag = null;
      try{ ico.releasePointerCapture(e.pointerId); }catch(err){}
      if(!moved) onOpen();
    }
    ico.addEventListener('pointerup', end);
    ico.addEventListener('pointercancel', end);
  }
  function edgeHtml(){
    return '<i class="st-room-edge n" data-resize="n"></i><i class="st-room-edge s" data-resize="s"></i>'+
      '<i class="st-room-edge e" data-resize="e"></i><i class="st-room-edge w" data-resize="w"></i>'+
      '<i class="st-room-edge nw" data-resize="nw"></i><i class="st-room-edge ne" data-resize="ne"></i>'+
      '<i class="st-room-edge sw" data-resize="sw"></i><i class="st-room-edge se" data-resize="se"></i>';
  }

  function bindPlayers(){
    if(!state || state.status!=='member') return;
    var cfg = window.LIVEMAP_CONFIG = window.LIVEMAP_CONFIG || {};
    cfg.PLAYERS_URL = API+'/api/rooms/'+encodeURIComponent(state.code)+'/players';
    cfg.PLAYERS_HEADERS = {Authorization:'Bearer '+token()};
    if(typeof window.__stReloadPlayers==='function') window.__stReloadPlayers();
  }

  function drawSelected(){
    var ctl = window.__stCtl;
    if(!ctl || !ctl.showRoute) return;
    var rt = (state&&state.routes||[]).filter(function(r){ return r.id===selected; })[0];
    var ids = rt ? rt.points.map(function(p){ return p.id; }) : (marking ? draft.map(function(p){ return p.id; }) : []);
    ctl.showRoute(ids);
  }

  function canDraw(){
    if(!state || state.status!=='member') return false;
    return state.routeMode==='members' || state.role==='captain';
  }

  function noteRecoverFocus(){
    var ids = ['stRoomRecover', 'stGateRecoverIn', 'stDockRecoverIn'];
    for(var i = 0; i < ids.length; i++){
      var el = document.getElementById(ids[i]);
      if(!el) continue;
      if(document.activeElement === el){
        recoverDraft = el.value;
        recoverFocus = ids[i];
        return;
      }
      if(el.value) recoverDraft = el.value;
    }
    recoverFocus = '';
  }
  function paint(){
    noteRecoverFocus();
    var ui = ensure();
    var onMap = !!(entered && state && state.status==='member');
    var dockMini = !!(readRaw(FRAME) && readRaw(FRAME).mini);
    var crewMini = !!(readRaw(CREW) && readRaw(CREW).mini);
    ui.gate.hidden = onMap;
    ui.dock.hidden = !onMap || dockMini;
    ui.dockIco.hidden = !onMap || !dockMini;
    ui.dockIco.textContent = state && state.code ? state.code : '';
    ui.dockIco.title = t('title');
    ui.dockIco.setAttribute('aria-label', t('title'));
    ui.crew.hidden = !onMap || crewMini;
    ui.crewIco.hidden = !onMap || !crewMini;
    if(!onMap) paintGate(ui.gate);
    if(onMap){
      paintDock(ui.dock);
      paintCrew(ui.crew, ui.crewIco);
      if(!ui.dock.__frameDrag) applyFrame(ui.dock, FRAME, 280, 220);
      if(!ui.crew.__frameDrag) applyFrame(ui.crew, CREW, 220, 160);
      var roomSaved = readRaw(FRAME);
      if(roomSaved && typeof roomSaved.ix==='number') placeIcon(ui.dockIco, roomSaved.ix, roomSaved.iy);
      var saved = readRaw(CREW);
      if(saved && typeof saved.ix==='number') placeIcon(ui.crewIco, saved.ix, saved.iy);
    }
    mountDockBar();
    window.__stRouteOn = !!(state && state.status==='member' && marking && canDraw());
    window.__stRouteAdd = function(o){
      if(!window.__stRouteOn || !o) return;
      if(draft.length && draft[draft.length-1].id===o.id) return;
      draft.push({id:o.id, n:o.n, sy:o.sy||''});
      if(draft.length>40) draft.shift();
      paint();
    };
    drawSelected();
    paintAlert();
    syncCtx();
    if(recoverFocus){
      var again = document.getElementById(recoverFocus);
      if(again) again.focus();
    }
  }

  function ti(k){
    if(SC.i18n && typeof SC.i18n.t==='function') return SC.i18n.t(k);
    return k;
  }
  function starfixFactsHtml(){
    return '<h2>'+esc(ti('home.need_h'))+'</h2>'+
      '<ul><li>'+esc(ti('home.gain_1'))+'</li><li>'+esc(ti('home.gain_2'))+'</li><li>'+esc(ti('home.gain_3'))+'</li></ul>'+
      '<p>'+esc(ti('home.need_no'))+'</p>'+
      '<h2>'+esc(ti('home.know_h'))+'</h2>'+
      '<ul><li>'+esc(ti('home.know_1'))+'</li><li>'+esc(ti('home.know_2'))+'</li><li>'+esc(ti('home.know_3'))+'</li></ul>'+
      '<p class="st-home-links">'+
        '<a href="https://github.com/GuguguBear/sc-lmw/blob/master/companion/README.md" target="_blank" rel="noopener">'+esc(ti('starfix.src_read'))+'</a>'+
        '<a href="https://github.com/GuguguBear/sc-lmw/releases/tag/starfix-1.0.9" target="_blank" rel="noopener">'+esc(ti('starfix.src_rel'))+'</a>'+
        '<a href="https://github.com/GuguguBear/sc-lmw/blob/master/companion/app.py" target="_blank" rel="noopener">'+esc(ti('starfix.src_app'))+'</a>'+
      '</p>';
  }
  function openStarfix(){
    var onMap = !!(entered && state && state.status==='member');
    if(!onMap){
      var sec = document.getElementById('stHomeStarfix');
      if(sec && sec.scrollIntoView) sec.scrollIntoView({block:'start'});
      return;
    }
    var box = document.getElementById('stSfx');
    if(!box){
      box = document.createElement('div');
      box.id = 'stSfx';
      box.className = 'st-sfx';
      root().appendChild(box);
    }
    box.hidden = false;
    box.innerHTML = '<div class="st-sfx-h"><b>'+esc(ti('starfix.title'))+'</b><button type="button" id="stSfxX">✕</button></div><div class="st-sfx-b">'+starfixFactsHtml()+'</div>';
    var x = box.querySelector('#stSfxX');
    if(x) x.onclick = function(){ box.hidden = true; };
  }
  function readHist(){
    try{
      var list = JSON.parse(localStorage.getItem(HIST)||'[]');
      if(!Array.isArray(list)) return [];
      return list.filter(function(x){ return x && x.code; }).slice(0, 90);
    }catch(e){ return []; }
  }
  function rememberHist(code){
    code = String(code||'').toUpperCase();
    if(!code) return;
    var list = readHist().filter(function(x){ return x.code!==code; });
    list.unshift({code:code, at:Date.now()});
    try{ localStorage.setItem(HIST, JSON.stringify(list.slice(0, 90))); }catch(e){}
    histKey = '';
  }
  function histLine(code){
    var info = histInfo[code];
    if(!info) return t('histWait');
    if(!info.exists) return t('histGone');
    return t('histAlive')+' · '+t('histOnline').replace('{n}', String(info.members||0));
  }
  function histHtml(){
    var list = readHist();
    if(!list.length) return '';
    return '<div class="st-home-hist"><h2>'+esc(t('hist'))+'</h2><div class="st-home-hist-list">'+
      list.map(function(x){
        var cur = state && state.code===x.code ? ' is-cur' : '';
        return '<button type="button" class="st-past'+cur+'" data-hist="'+esc(x.code)+'"><b>'+esc(x.code)+'</b><span>'+esc(histLine(x.code))+'</span></button>';
      }).join('')+'</div></div>';
  }
  function pullHist(){
    var list = readHist();
    var key = list.map(function(x){ return x.code; }).join(',');
    if(!key || !token()) return;
    if(key===histKey) return;
    histKey = key;
    api('/api/rooms/lookup', {method:'POST', body:{codes:list.map(function(x){ return x.code; })}}).then(function(d){
      histInfo = {};
      (d && d.rooms || []).forEach(function(r){ if(r && r.code) histInfo[r.code] = r; });
      if(document.getElementById('stGate') && !document.getElementById('stGate').hidden) paint();
    }).catch(function(){});
  }
  function bindHist(el){
    el.querySelectorAll('[data-hist]').forEach(function(b){
      b.onclick = function(){ enterCode(b.getAttribute('data-hist')); };
    });
    pullHist();
  }
  function coolLeft(){
    if(!state || !state.openUntil) return 0;
    return Math.max(0, Math.ceil((state.openUntil-Date.now())/1000));
  }
  function coolLabel(sec){
    sec = Math.max(0, sec|0);
    if(sec>=60) return t('visMin').replace('{n}', String(Math.ceil(sec/60)));
    return t('visSec').replace('{n}', String(sec));
  }
  function visHtml(){
    if(!state || state.role!=='captain' || state.status!=='member') return '';
    var open = !!state.open;
    var left = coolLeft();
    var disPub = (!open && left>0) ? ' disabled' : '';
    var disPriv = (open && left>0) ? ' disabled' : '';
    return '<div class="st-vis"><span>'+esc(t('visTitle'))+'</span>'+
      '<button type="button" data-open="1"'+(open?' class="on"':'')+disPub+'>'+esc(t('visPublic'))+'</button>'+
      '<button type="button" data-open="0"'+(!open?' class="on"':'')+disPriv+'>'+esc(t('visPrivate'))+'</button>'+
      (left ? '<em data-cool="'+state.openUntil+'">'+esc(t('visCool').replace('{n}', coolLabel(left)))+'</em>' : '')+
      '</div><p class="st-room-dim">'+esc(t('visLead'))+'</p>';
  }
  function bindOpen(el){
    el.querySelectorAll('[data-open]').forEach(function(b){
      b.onclick = function(){
        var want = b.getAttribute('data-open')==='1';
        if(!state || !!state.open===want) return;
        setOpen(want);
      };
    });
  }
  function setOpen(open){
    if(!state || state.role!=='captain' || !state.code) return;
    api('/api/rooms/'+encodeURIComponent(state.code)+'/open', {method:'POST', body:{open:!!open}}).then(function(st){
      pubAt = 0;
      take(st);
    }).catch(fail);
  }
  function pubHtml(){
    if(!pubRooms) return '';
    var rows = pubRooms.map(function(r){
      var meta = (r.captain ? esc(r.captain)+' · ' : '')+esc(t('pubPeople').replace('{n}', String(r.members||0)));
      return '<button type="button" class="st-past" data-pub="'+esc(r.code)+'"><b>'+esc(r.code)+'</b><span>'+meta+'</span></button>';
    }).join('');
    return '<section class="st-home-card st-home-pub"><h2>'+esc(t('pubTitle'))+'</h2>'+
      (rows ? '<div class="st-home-hist-list">'+rows+'</div>' : '<p>'+esc(t('pubEmpty'))+'</p>')+
      '</section>';
  }
  function pullPublic(force){
    var nowMs = Date.now();
    if(!force && nowMs-pubAt<4000) return;
    pubAt = nowMs;
    fetch((API||'')+'/api/rooms/public', {cache:'no-store'}).then(function(r){
      if(!r.ok) throw new Error('public');
      return r.json();
    }).then(function(d){
      var next = (d && d.rooms) || [];
      var sig = next.map(function(r){ return r.code+':'+r.members+':'+(r.captain||''); }).join(',');
      if(sig===pubSig) return;
      pubRooms = next;
      pubSig = sig;
      var gate = document.getElementById('stGate');
      if(gate && !gate.hidden) paint();
    }).catch(function(){});
  }
  function bindPub(el){
    el.querySelectorAll('[data-pub]').forEach(function(b){
      b.onclick = function(){ enterCode(b.getAttribute('data-pub')); };
    });
    pullPublic(false);
  }
  function rsiHtml(){
    var lang = (SC.i18n && SC.i18n.getLang) ? SC.i18n.getLang() : 'en';
    var local = lang==='en' ? '' : '<p>'+esc(ti('home.rsi_local'))+'</p>';
    return '<section class="st-home-card st-home-rsi">'+
      '<img class="st-rsi-mark" src="./icons/made-by-the-community.png" alt="Made by the Community" width="168" height="168">'+
      '<h2>'+esc(ti('home.rsi_h'))+'</h2>'+
      '<p class="st-rsi-en">This is an unofficial Star Citizen fan site, not affiliated with the Cloud Imperium group of companies. All content on this site not authored by its host or users are property of their respective owners.</p>'+
      local+
      '<p class="st-rsi-markline"><b>'+esc(ti('home.rsi_tm'))+'</b> Star Citizen®, Squadron 42®, Roberts Space Industries®, and Cloud Imperium® are registered trademarks of Cloud Imperium Rights LLC and Cloud Imperium Rights Ltd. All rights reserved.</p>'+
      '<p class="st-home-links">'+
        '<a href="https://robertsspaceindustries.com/" target="_blank" rel="noopener">'+esc(ti('home.rsi_official'))+'</a>'+
        '<a href="https://www.robertsspaceindustries.com/enlist?referral=STAR-SYHL-2MV5" target="_blank" rel="noopener">'+esc(ti('home.rsi_invite'))+'</a>'+
        '<a href="https://support.robertsspaceindustries.com/hc/en-us/articles/360006895793-Star-Citizen-Fankit-and-Fandom-FAQ" target="_blank" rel="noopener">'+esc(ti('home.rsi_policy'))+'</a>'+
      '</p></section>';
  }

  function childByClass(el, cls){
    for(var i = 0; i < el.children.length; i++){
      if(el.children[i].classList.contains(cls)) return el.children[i];
    }
    return null;
  }
  function ensureHomeField(el){
    var field = childByClass(el, 'st-home-field');
    if(field) return field;
    field = document.createElement('div');
    field.className = 'st-home-field';
    field.setAttribute('aria-hidden', 'true');
    field.innerHTML = '<div class="st-home-floor"><div class="st-home-grid"></div></div>';
    el.insertBefore(field, el.firstChild);
    return field;
  }
  function mountHome(el, narrow){
    ensureHomeField(el);
    var home = childByClass(el, 'st-home');
    if(!home){
      home = document.createElement('div');
      el.appendChild(home);
    }
    home.className = narrow ? 'st-home st-home-narrow' : 'st-home';
    return home;
  }
  function paintGate(el){
    if(leaving && state && state.role==='captain' && state.status==='member'){
      var hand = mountHome(el, true);
      hand.innerHTML = '<header class="st-home-hero"><div class="st-home-kicker">SC LMW</div><h1>'+esc(t('title'))+'</h1></header><section class="st-home-card">'+handoffHtml()+'</section>';
      bindHandoff(el);
      return;
    }
    var nick = '';
    try{ nick = localStorage.getItem(NICK)||''; }catch(e){}
    var pre = '';
    try{ pre = new URLSearchParams(location.search).get('room')||''; }catch(e){}
    if(state && state.code && !picking) pre = state.code;
    var wait = state && state.status==='pending' && !picking;
    var member = state && state.status==='member' && !picking;
    var kind = roomKind==='create' ? 'create' : roomKind==='join' ? 'join' : 'saved';
    var kindLabel = kind==='create' ? t('freshCreate') : kind==='join' ? t('freshJoin') : t('resumed');
    var kindLead = kind==='create' ? t('freshCreateLead') : kind==='join' ? t('freshJoinLead') : t('resumedLead');
    var roomBody = member ? (
          '<p class="st-room-kind">'+esc(kindLabel)+'</p>'+
          '<p>'+esc(kindLead)+'</p>'+
          '<p class="st-room-code">'+esc(state.code)+'</p>'+
          recoverHtml('stGateRecover')+
          visHtml()+
          '<div class="row"><button type="button" class="act" id="stEnter">'+esc(t('enter'))+'</button>'+
          '<button type="button" id="stGateCopy">'+esc(t('copy'))+'</button></div>'+
          '<button type="button" id="stSwitch" class="st-room-link">'+esc(t('switchRoom'))+'</button>'
        ) : wait ? (
          '<p class="st-room-kind">'+esc(kind==='join' ? t('wait') : t('resumedWait'))+'</p>'+
          '<p class="st-room-code">'+esc(state.code)+'</p>'+
          recoverHtml('stGateRecover')
        ) : (
          '<label>'+esc(t('nick'))+'<input id="stRoomNick" maxlength="32" value="'+esc(nick)+'"></label>'+
          '<label>'+esc(t('code'))+'<input id="stRoomCode" maxlength="9" value="'+esc(pre)+'" placeholder="K7MQ-4R2P"></label>'+
          '<label>'+esc(t('recover'))+'<input id="stRoomRecover" maxlength="14" value="'+esc(recoverDraft)+'" placeholder="'+esc(t('recoverPh'))+'" autocomplete="off"></label>'+
          '<div class="row"><button type="button" class="act" id="stRoomCreate">'+esc(t('create'))+'</button>'+
          '<button type="button" id="stRoomJoin">'+esc(t('join'))+'</button>'+
          '<button type="button" id="stRoomRecoverGo">'+esc(t('recoverGo'))+'</button></div>'+
          (state && state.status==='member' ? '<button type="button" id="stHistBack" class="st-room-link">'+esc(t('histBack'))+'</button>' : '')
        )+
        (statusMsg ? '<p class="st-room-err">'+esc(statusMsg)+'</p>' : '')+
        histHtml();
    var home = mountHome(el, false);
    home.innerHTML =
        '<header class="st-home-hero"><div class="st-home-kicker">SC LMW · '+esc(ti('home.kicker'))+'</div>'+
          '<h1>'+esc(t('title'))+'</h1><p>'+esc(ti('home.lead'))+'</p></header>'+
        rsiHtml()+
        '<section class="st-home-card" id="stHomeStarfix">'+starfixFactsHtml()+'</section>'+
        '<section class="st-home-card st-home-join"><h2>'+esc(ti('home.join_h'))+'</h2>'+roomBody+'</section>'+
        pubHtml();
    var c = el.querySelector('#stRoomCreate'), j = el.querySelector('#stRoomJoin');
    if(c) c.onclick = function(){ act('create'); };
    if(j) j.onclick = function(){ act('join'); };
    var recIn = el.querySelector('#stRoomRecover');
    if(recIn) recIn.oninput = function(){ recoverDraft = recIn.value; };
    var recGo = el.querySelector('#stRoomRecoverGo');
    if(recGo) recGo.onclick = function(){
      reclaimFrom(nickValue() || savedNick(), codeValue(), recIn ? recIn.value : recoverDraft);
    };
    bindRecover(el, 'stGateRecover');
    var enter = el.querySelector('#stEnter');
    if(enter){ enter.onclick = enterMap; markEnterWait(); }
    var copy = el.querySelector('#stGateCopy');
    if(copy) copy.onclick = function(){
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(state.code);
      statusMsg = t('copied'); paint();
      setTimeout(function(){ if(statusMsg===t('copied')){ statusMsg=''; paint(); } }, 1200);
    };
    var sw = el.querySelector('#stSwitch');
    if(sw) sw.onclick = function(){ picking = true; statusMsg = ''; paint(); };
    var back = el.querySelector('#stHistBack');
    if(back) back.onclick = function(){ picking = false; statusMsg = ''; paint(); };
    bindHist(el);
    bindOpen(el);
    bindPub(el);
  }

  function roomOps(){
    var cap = state && state.role==='captain' && state.status==='member';
    var open = !!(state && state.open);
    var left = coolLeft();
    var disPub = (!open && left>0) ? ' disabled' : '';
    var disPriv = (open && left>0) ? ' disabled' : '';
    var vis = cap ? (
      '<span class="st-seg"'+(left?' data-cool="'+state.openUntil+'"':'')+' title="'+esc(t('visTitle')+' · '+t('visLead')+(left?(' · '+t('visCool').replace('{n}', coolLabel(left))):''))+'">'+
        '<button type="button" data-open="1"'+(open?' class="on"':'')+disPub+'>'+esc(t('visPublic'))+'</button>'+
        '<button type="button" data-open="0"'+(!open?' class="on"':'')+disPriv+'>'+esc(t('visPrivate'))+'</button>'+
      '</span>'+
      '<button type="button" id="stCast">'+esc(t('cast'))+'</button>'
    ) : '';
    return '<button type="button" id="stLinkPc">'+esc(t('link'))+'</button>'+vis;
  }
  function mountDockBar(){
    var slot = document.getElementById('sclmw-stDockSlot');
    if(!slot) return;
    slot.hidden = true;
    slot.innerHTML = '';
  }
  window.__stDockMount = mountDockBar;

  function paintDock(el){
    var mine = canDraw();
    el.innerHTML =
      '<div class="st-room-h" id="stRoomBar" role="group" aria-label="'+esc(state.code)+'"><b>'+esc(state.code)+'</b>'+
        '<div class="st-room-acts">'+
        '<button type="button" id="stRoomCopy">'+esc(t('copy'))+'</button>'+
        '<button type="button" id="stRoomLeave">'+esc(t('leave'))+'</button>'+
        (state.role==='captain' ? '<button type="button" id="stDissolve">'+esc(t('dissolve'))+'</button>' : '')+
        '<button type="button" id="stRoomMin">'+esc(sheetLayout() && !el.classList.contains('st-sheet-open') ? t('unfold') : t('fold'))+'</button>'+
        '</div>'+
        '<div class="st-room-ops">'+roomOps()+'</div></div>'+
      '<div class="st-room-body">'+
      recoverHtml('stDockRecover')+
      (leaving && state.role==='captain' ? handoffHtml() : '')+
      '<p class="st-room-dim">'+esc(t('locGuide'))+'</p>'+
      linkNote()+
      (marking && mine ? (
        '<p class="st-room-dim">'+esc(t('routeHint'))+'</p>'+
        '<ol class="st-room-pts">'+draft.map(function(p,i){
          return '<li><span>'+esc(p.n)+'</span><button type="button" data-rm="'+i+'">'+esc(t('del'))+'</button></li>';
        }).join('')+'</ol>'+
        '<textarea id="stRouteNote" maxlength="500" placeholder="'+esc(t('note'))+'">'+esc(note)+'</textarea>'+
        '<div class="row"><button type="button" id="stPublish">'+esc(t('publish'))+'</button>'+
          '<button type="button" id="stDraftClear">'+esc(t('clear'))+'</button></div>'
      ) : '')+
      '<div class="st-room-sec"><span>'+esc(t('published'))+'</span>'+
        ((state.routes||[]).map(function(r){
          return '<div class="st-room-route'+(r.id===selected?' on':'')+'" data-rt="'+esc(r.id)+'">'+
            '<b>'+esc(r.title||r.points.map(function(p){return p.n;}).join(' → '))+'</b>'+
            '<small>'+esc(t('by'))+' '+esc(r.authorName)+'</small>'+
            (r.note?'<p>'+esc(r.note)+'</p>':'')+
            (r.comments||[]).map(function(c){ return '<div class="st-room-c"><b>'+esc(c.authorName)+'</b> '+esc(c.body)+'</div>'; }).join('')+
            '<div class="row"><input data-cmt="'+esc(r.id)+'" maxlength="300" placeholder="'+esc(t('comment'))+'">'+
              '<button type="button" data-send="'+esc(r.id)+'">'+esc(t('send'))+'</button>'+
              (r.author===state.me.id || state.role==='captain' ? '<button type="button" data-del="'+esc(r.id)+'">'+esc(t('del'))+'</button>' : '')+
            '</div></div>';
        }).join('') || '<div class="st-room-dim">—</div>')+
      '</div>'+
      (statusMsg ? '<p class="st-room-err">'+esc(statusMsg)+'</p>' : '')+
      '</div>'+
      edgeHtml();
    bindRecover(el, 'stDockRecover');
    el.querySelector('#stRoomCopy').onclick = function(){
      var text = state.code;
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
      statusMsg = t('copied'); paint();
      setTimeout(function(){ if(statusMsg===t('copied')){ statusMsg=''; paint(); } }, 1200);
    };
    el.querySelector('#stRoomLeave').onclick = askLeave;
    el.querySelector('#stRoomMin').onclick = function(ev){
      ev.stopPropagation();
      if(sheetLayout()){
        el.classList.toggle('st-sheet-open');
        paint();
        return;
      }
      var box = el.getBoundingClientRect();
      var host = root().getBoundingClientRect();
      var prev = readRaw(FRAME) || {};
      var ix = typeof prev.ix==='number' ? prev.ix : Math.round(box.left-host.left);
      var iy = typeof prev.iy==='number' ? prev.iy : Math.round(box.top-host.top);
      patchFrame(FRAME, {mini:1, ix:ix, iy:iy});
      paint();
    };
    bindHandoff(el);
    var dissolve = el.querySelector('#stDissolve');
    if(dissolve) dissolve.onclick = function(){ exitRoom({dissolve:true}); };
    var link = el.querySelector('#stLinkPc');
    if(link) link.onclick = linkPc;
    var castBtn = el.querySelector('#stCast');
    if(castBtn) castBtn.onclick = function(){ castCompose = true; castErr = ''; paint(); };
    var mark = el.querySelector('#stMark');
    if(mark) mark.onclick = function(){ marking=!marking; if(!marking) window.__stRouteOn=false; selected=''; paint(); };
    el.querySelectorAll('[data-rm]').forEach(function(b){ b.onclick=function(){ draft.splice(+b.getAttribute('data-rm'),1); paint(); }; });
    var box = el.querySelector('#stRouteNote');
    if(box) box.oninput = function(){ note = box.value; };
    var pub = el.querySelector('#stPublish');
    if(pub) pub.onclick = publish;
    var clr = el.querySelector('#stDraftClear');
    if(clr) clr.onclick = function(){ draft=[]; note=''; paint(); };
    el.querySelectorAll('[data-rt]').forEach(function(b){ b.onclick=function(ev){
      if(ev.target.closest('input,button')) return;
      var id = b.getAttribute('data-rt');
      if(selected===id){ selected=''; paint(); return; }
      selected = id; marking=false;
      paint();
    }; });
    el.querySelectorAll('[data-send]').forEach(function(b){ b.onclick=function(){ sendComment(b.getAttribute('data-send')); }; });
    el.querySelectorAll('[data-del]').forEach(function(b){ b.onclick=function(){ delRoute(b.getAttribute('data-del')); }; });
    bindOpen(el);
  }

  function liveMembers(){
    return (state.members||[]).filter(function(m){ return m.status==='member'; });
  }
  function memberRank(m){
    if(state.me && m.id===state.me.id) return 0;
    if(state.captain && m.id===state.captain) return 1;
    return 2;
  }
  function paintCrew(el, ico){
    var live = liveMembers();
    var boxWas = document.activeElement && document.activeElement.id==='stCrewQ' ? document.activeElement : null;
    var caret = boxWas ? boxWas.selectionStart : null;
    var caretEnd = boxWas ? boxWas.selectionEnd : null;
    var listWas = el.querySelector('#stCrewList');
    var scroll = listWas ? listWas.scrollTop : 0;
    el.innerHTML =
      '<div class="st-room-h"><b>'+esc(t('members'))+'</b>'+
        '<em class="st-crew-n" id="stCrewN"></em>'+
        '<button type="button" id="stCrewMin">'+esc(t('fold'))+'</button></div>'+
      '<input id="stCrewQ" class="st-crew-q" type="search" autocomplete="off" placeholder="'+esc(t('find'))+'" value="'+esc(crewQ)+'">'+
      '<div class="st-room-body" id="stCrewList"></div>'+edgeHtml();
    el.querySelector('#stCrewMin').onclick = function(ev){
      ev.stopPropagation();
      var box = el.getBoundingClientRect();
      var host = root().getBoundingClientRect();
      var prev = readRaw(CREW) || {};
      var ix = typeof prev.ix==='number' ? prev.ix : Math.round(box.left-host.left);
      var iy = typeof prev.iy==='number' ? prev.iy : Math.round(box.top-host.top);
      patchFrame(CREW, {mini:1, ix:ix, iy:iy});
      paint();
    };
    var q = el.querySelector('#stCrewQ');
    function onQ(){ crewQ = q.value; fillCrew(el); }
    q.addEventListener('input', onQ);
    q.addEventListener('search', onQ);
    fillCrew(el);
    var listNow = el.querySelector('#stCrewList');
    if(listNow) listNow.scrollTop = scroll;
    if(boxWas){
      q.focus();
      if(caret!=null) q.setSelectionRange(caret, caretEnd);
    }
    ico.textContent = String(live.length);
    ico.title = t('members');
    ico.setAttribute('aria-label', t('members'));
  }
  function fillCrew(el){
    var live = liveMembers();
    var q = crewQ.trim().toLowerCase();
    var shown = live.filter(function(m){
      if(!q) return true;
      return ((m.nickname||'')+' '+(m.location||'')+' '+placeLabel(m)+' '+(m.server||'')).toLowerCase().indexOf(q)!==-1;
    }).sort(function(a,b){
      var d = memberRank(a)-memberRank(b);
      return d || ((b.seen||0)-(a.seen||0));
    });
    var n = el.querySelector('#stCrewN');
    if(n) n.textContent = q ? (shown.length+'/'+live.length) : String(live.length);
    var list = el.querySelector('#stCrewList');
    if(!list) return;
    var on = shown.filter(isOnline), off = shown.filter(function(m){ return !isOnline(m); });
    var split = serverSplit(on);
    var html = '';
    if(on.length) html += '<div class="st-crew-sec">'+esc(t('online'))+' '+on.length+(split.mixed?' · '+esc(t('server'))+' '+split.kinds:'')+'</div>'+on.map(function(m){ return memberRow(m, split); }).join('');
    if(off.length) html += '<div class="st-crew-sec">'+esc(t('offline'))+' '+off.length+'</div>'+off.map(function(m){ return memberRow(m, split); }).join('');
    list.innerHTML = html || '<div class="st-room-dim">'+(q ? esc(t('none')) : '—')+'</div>';
    rollCrew(list);
    list.querySelectorAll('[data-mate]').forEach(function(b){ b.onclick=function(){ jumpMember(b.getAttribute('data-mate')); }; });
    list.querySelectorAll('[data-cap]').forEach(function(b){ b.onclick=function(){
      kickAsk = '';
      api('/api/rooms/'+encodeURIComponent(state.code)+'/captain', {method:'POST', body:{member:b.getAttribute('data-cap')}}).then(take).catch(fail);
    }; });
    list.querySelectorAll('[data-kick]').forEach(function(b){ b.onclick=function(){ kickAsk = b.getAttribute('data-kick'); paint(); }; });
    list.querySelectorAll('[data-kick-yes]').forEach(function(b){ b.onclick=function(){
      var id = b.getAttribute('data-kick-yes');
      kickAsk = '';
      api('/api/rooms/'+encodeURIComponent(state.code)+'/members/'+encodeURIComponent(id)+'/kick', {method:'POST', body:{}}).then(take).catch(fail);
    }; });
  }

  function rollCrew(list){
    if(!list) return;
    if(!list.__roll && window.ResizeObserver){
      list.__roll = true;
      new ResizeObserver(function(){ rollCrew(list); }).observe(list);
    }
    list.querySelectorAll('.st-mate-roll').forEach(function(box){
      var inner = box.firstElementChild;
      if(!inner) return;
      inner.style.animation = 'none';
      var extra = inner.scrollWidth - box.clientWidth;
      if(extra <= 4){
        inner.style.animation = '';
        inner.style.removeProperty('--st-roll');
        return;
      }
      var sec = Math.max(4, extra / 24);
      inner.style.setProperty('--st-roll', (-extra)+'px');
      inner.style.animation = 'st-roll '+sec.toFixed(2)+'s ease-in-out infinite alternate';
    });
  }
  function ageText(seen){
    if(typeof seen!=='number' || !isFinite(seen)) return '';
    var s = Math.max(0, Math.round(Date.now()/1000 - seen));
    if(s<5) return t('agoNow');
    if(s<60) return t('agoSec').replace('{n}', String(s));
    var m = Math.floor(s/60);
    if(m<60) return t('agoMin').replace('{n}', String(m));
    var h = Math.floor(m/60);
    if(h<48) return t('agoHour').replace('{n}', String(h));
    return t('agoDay').replace('{n}', String(Math.floor(h/24)));
  }
  function tickAges(){
    document.querySelectorAll('.st-mate time[data-seen]').forEach(function(n){
      var next = ageText(+n.getAttribute('data-seen'));
      if(n.textContent!==next) n.textContent = next;
    });
    document.querySelectorAll('[data-cool]').forEach(function(n){
      var left = Math.max(0, Math.ceil((+n.getAttribute('data-cool')-Date.now())/1000));
      var next = left ? t('visCool').replace('{n}', coolLabel(left)) : '';
      if(n.classList.contains('st-seg')){
        var title = t('visTitle')+' · '+t('visLead')+(next?(' · '+next):'');
        if(n.title!==title) n.title = title;
      } else if(n.textContent!==next) n.textContent = next;
      if(!left && n.getAttribute('data-cool-done')!=='1'){
        n.setAttribute('data-cool-done', '1');
        paint();
      }
    });
  }
  function isOnline(m){
    if(!m) return false;
    if(typeof m.online==='boolean') return m.online;
    return typeof m.seen==='number' && (Date.now()/1000-m.seen)<600;
  }
  function placeLabel(m){
    var raw = m.location || '';
    if(SC.loc && SC.loc.text) return SC.loc.text(raw) || raw;
    return raw;
  }
  function shipLabel(raw){
    if(!raw) return '';
    if(SC.loc && SC.loc.text) return SC.loc.text(raw) || raw;
    return raw;
  }
  function memberAsPlayer(m){
    var when = typeof m.seen==='number' ? new Date(m.seen*1000).toISOString() : '';
    return {id:m.id, name:m.nickname||'', online:isOnline(m), last_seen:when, when:when,
      code:m.code||'', location:m.location||'', system:m.system||'', ship:m.ship||'',
      gear:Array.isArray(m.gear)?m.gear:[], server:m.server||'', travel:m.travel||null};
  }
  function serverSplit(list){
    var counts = {};
    (list||[]).forEach(function(m){
      if(!m.server) return;
      var k = String(m.server);
      counts[k] = (counts[k]||0)+1;
    });
    var keys = Object.keys(counts);
    if(!keys.length) return {top:'', mixed:false, kinds:0};
    var ref = '';
    (list||[]).forEach(function(m){
      if(ref || !m.server) return;
      if(state.captain && m.id===state.captain) ref = String(m.server);
    });
    if(!ref){
      (list||[]).forEach(function(m){
        if(ref || !m.server) return;
        if(state.me && m.id===state.me.id) ref = String(m.server);
      });
    }
    var top = ref && counts[ref] ? ref : keys[0];
    var n = counts[top]||0;
    keys.forEach(function(k){ if(counts[k]>n){ top=k; n=counts[k]; } });
    return {top:top, mixed:keys.length>1, kinds:keys.length};
  }
  function hostShort(id){
    var s = String(id);
    return s.length>8 ? '…'+s.slice(-7) : s;
  }
  function memberRow(m, split){
    var tags = '';
    if(state.me && m.id===state.me.id) tags += '<em>'+esc(t('you'))+'</em>';
    var isCap = state.captain ? m.id===state.captain : !!(state.role==='captain' && state.me && m.id===state.me.id);
    if(isCap) tags += '<em class="is-cap">'+esc(t('captainTag'))+'</em>';
    var own = state.role==='captain' && state.me && m.id!==state.me.id;
    var give = own ? '<button type="button" data-cap="'+esc(m.id)+'" title="'+esc(t('give'))+'">'+esc(t('giveShort'))+'</button>' : '';
    var kick = own ? (kickAsk===m.id
      ? '<button type="button" class="on" data-kick-yes="'+esc(m.id)+'" title="'+esc(t('kick'))+'">'+esc(t('kickYes'))+'</button>'
      : '<button type="button" data-kick="'+esc(m.id)+'" title="'+esc(t('kick'))+'">'+esc(t('kick'))+'</button>') : '';
    var on = isOnline(m);
    var when = typeof m.seen==='number' ? '<time data-seen="'+m.seen+'">'+esc(ageText(m.seen))+'</time>' : '';
    var place = m.location ? esc(placeLabel(m)) : '';
    var ship = m.ship ? esc(shipLabel(m.ship)) : '';
    var bits = [place, ship].filter(Boolean).join(' · ');
    var host = '<span class="st-mate-host" title="'+esc(t('server'))+'">—</span>';
    if(m.server){
      var same = split && split.top && String(m.server)===split.top;
      var tone = split && split.mixed ? (same?' is-same':' is-other') : (split && split.top ? ' is-same' : '');
      host = '<span class="st-mate-host'+tone+'" title="'+esc(t('server'))+' '+esc(String(m.server))+'">'+esc(hostShort(m.server))+'</span>';
    }
    var inner = '<i class="st-crew-pip'+(on?' on':'')+'"></i>'+
      '<span class="st-mate-roll"><span><b>'+esc(m.nickname)+'</b>'+tags+
      (bits?'<span class="st-mate-last">'+bits+'</span>':'')+'</span></span>'+host+when;
    return '<div class="st-mate-row'+(kickAsk===m.id?' st-kick-ask':'')+'"><button type="button" class="st-mate'+(m.location?' has-place':'')+(on?'':' is-off')+'" data-mate="'+esc(m.id)+'">'+inner+'</button>'+kick+give+'</div>';
  }
  function handoffHtml(){
    var rest = (state.members||[]).filter(function(m){ return m.status==='member' && state.me && m.id!==state.me.id; });
    if(!rest.length){
      return '<div class="st-room-sec st-hand"><span>'+esc(t('handTitle'))+'</span><p class="st-room-dim">'+esc(t('handSolo'))+'</p>'+
        '<div class="row"><button type="button" id="stDissolveLeave">'+esc(t('dissolveLeave'))+'</button>'+
        '<button type="button" id="stHandCancel">'+esc(t('cancel'))+'</button></div></div>';
    }
    return '<div class="st-room-sec st-hand"><span>'+esc(t('handTitle'))+'</span><p class="st-room-dim">'+esc(t('handLead'))+'</p>'+
      rest.map(function(m){
        return '<div class="st-room-row"><span>'+esc(m.nickname)+'</span><button type="button" data-hand="'+esc(m.id)+'">'+esc(t('giveLeave'))+'</button></div>';
      }).join('')+
      '<div class="row"><button type="button" id="stDissolveLeave">'+esc(t('dissolve'))+'</button>'+
      '<button type="button" id="stHandCancel">'+esc(t('cancel'))+'</button></div></div>';
  }
  function bindHandoff(el){
    var go = el.querySelector('#stDissolveLeave');
    if(go) go.onclick = function(){ exitRoom({dissolve:true}); };
    var cancel = el.querySelector('#stHandCancel');
    if(cancel) cancel.onclick = function(){ leaving = false; paint(); };
    el.querySelectorAll('[data-hand]').forEach(function(b){
      b.onclick = function(){ exitRoom({transfer:b.getAttribute('data-hand')}); };
    });
  }
  function jumpMember(id){
    var m = (state.members||[]).filter(function(x){ return x.id===id; })[0];
    if(!m) return;
    if(typeof window.stOpenPlayer==='function') window.stOpenPlayer(memberAsPlayer(m));
    var o = SC.playerLoc ? SC.playerLoc({code:m.code||'', location:m.location||'', system:m.system||''}) : null;
    var ctl = window.__stCtl;
    if(o && ctl && ctl.flyTo) ctl.flyTo(o);
  }
  function nickValue(){
    var el = document.getElementById('stRoomNick');
    return el ? el.value.trim() : '';
  }
  function codeValue(){
    var el = document.getElementById('stRoomCode');
    return (el ? el.value : '').toUpperCase().replace(/[^A-Z0-9-]/g,'');
  }
  function rememberNick(n){ try{ localStorage.setItem(NICK, n); }catch(e){} }
  function recoverHtml(where){
    if(state && state.role==='captain' && state.status==='member' && state.recover){
      return '<div class="st-recover"><span>'+esc(t('recoverLead'))+'</span><b>'+esc(state.recover)+'</b><button type="button" id="'+where+'Copy">'+esc(t('recoverCopy'))+'</button></div>';
    }
    if(!state || state.role==='captain') return '';
    return '<div class="st-recover"><span>'+esc(t('recover'))+'</span><input id="'+where+'In" maxlength="14" value="'+esc(recoverDraft)+'" placeholder="'+esc(t('recoverPh'))+'" autocomplete="off"><button type="button" id="'+where+'Go">'+esc(t('recoverGo'))+'</button></div>';
  }
  function bindRecover(rootEl, where){
    var copy = rootEl.querySelector('#'+where+'Copy');
    if(copy) copy.onclick = function(){
      var text = state && state.recover || '';
      if(text && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
      statusMsg = t('copied');
      paint();
      setTimeout(function(){ if(statusMsg===t('copied')){ statusMsg=''; paint(); } }, 1200);
    };
    var input = rootEl.querySelector('#'+where+'In');
    if(input) input.oninput = function(){ recoverDraft = input.value; };
    var go = rootEl.querySelector('#'+where+'Go');
    if(go) go.onclick = function(){
      var nick = savedNick() || (state && state.me && state.me.nickname) || '';
      var code = (state && state.code) || '';
      reclaimFrom(nick, code, input ? input.value : recoverDraft);
    };
  }
  function reclaimFrom(nick, code, secret){
    nick = String(nick || '').trim();
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
    secret = String(secret || '').trim();
    if(!nick || nick.length>32){ statusMsg = t('errNick'); paint(); return; }
    if(!code){ statusMsg = t('errRoom'); paint(); return; }
    if(!secret){ statusMsg = t('errRecover'); paint(); return; }
    rememberNick(nick);
    roomKind = 'join';
    api('/api/session', {method:'POST', body:{nickname:nick}}).then(function(s){
      try{ localStorage.setItem(TOKEN, s.token); }catch(e){}
      return api('/api/rooms/'+encodeURIComponent(code)+'/recover', {method:'POST', body:{recover:secret}});
    }).then(function(st){
      if(!st) return;
      recoverDraft = '';
      picking = false;
      take(st);
    }).catch(fail);
  }

  function savedNick(){
    var typed = nickValue();
    if(typed) return typed;
    try{ return localStorage.getItem(NICK)||''; }catch(e){ return ''; }
  }
  function enterCode(code){
    code = String(code||'').toUpperCase();
    if(!code) return;
    if(state && state.code===code && state.status==='member'){
      picking = false;
      enterMap();
      return;
    }
    var nick = savedNick();
    if(!nick || nick.length>32){
      picking = true;
      statusMsg = t('errNick');
      paint();
      var box = document.getElementById('stRoomCode');
      if(box) box.value = code;
      return;
    }
    statusMsg = '';
    roomKind = 'join';
    rememberNick(nick);
    api('/api/session', {method:'POST', body:{nickname:nick}}).then(function(s){
      try{ localStorage.setItem(TOKEN, s.token); }catch(e){}
      return api('/api/rooms/'+encodeURIComponent(code)+'/join', {method:'POST', body:{}});
    }).then(function(st){ if(st){ picking = false; take(st); } }).catch(fail);
  }
  function act(kind){
    var nick = nickValue();
    if(!nick || nick.length>32){ statusMsg=t('errNick'); paint(); return; }
    statusMsg = '';
    roomKind = kind==='create' ? 'create' : 'join';
    rememberNick(nick);
    api('/api/session', {method:'POST', body:{nickname:nick}}).then(function(s){
      try{ localStorage.setItem(TOKEN, s.token); }catch(e){}
      if(kind==='create') return api('/api/rooms', {method:'POST', body:{}});
      var code = codeValue();
      if(!code){ statusMsg=t('errRoom'); paint(); return null; }
      return api('/api/rooms/'+encodeURIComponent(code)+'/join', {method:'POST', body:{}});
    }).then(function(st){ if(st){ picking = false; take(st); } }).catch(fail);
  }

  var mapArming = false;
  function markEnterWait(){
    var btn = document.getElementById('stEnter');
    if(!btn || !mapArming) return;
    btn.disabled = true;
    if(window.SCLMW && window.SCLMW.i18n) btn.textContent = window.SCLMW.i18n.t('page.loading');
  }
  function enterMap(){
    if(!state || state.status!=='member') return;
    if(mapArming) return;
    var arm = window.SCLMW && window.SCLMW.armScene;
    if(arm && !window.__stCtl){
      mapArming = true;
      markEnterWait();
      arm().then(function(){
        mapArming = false;
        entered = true;
        bindPlayers();
        paint();
        pullLink();
      }).catch(function(){
        mapArming = false;
        paint();
      });
      return;
    }
    entered = true;
    bindPlayers();
    paint();
    pullLink();
  }
  function take(st){
    var prevCode = state && state.code;
    if(st && typeof st.openWait==='number') st.openUntil = Date.now()+st.openWait*1000;
    state = st;
    statusMsg = '';
    if(st && st.code && st.code!==prevCode) rememberHist(st.code);
    try{ localStorage.setItem(CODE, st.code); }catch(e){}
    if(st.status!=='member') entered = false;
    if(st.status==='member' && entered) bindPlayers();
    noteCast(st);
    paint();
  }
  function fail(e){
    if(e && e.body && e.body.error==='room') statusMsg = t('errRoom');
    else if(e && e.body && e.body.error==='cooldown'){
      var wait = e.body.wait||0;
      if(state) state.openUntil = Date.now()+wait*1000;
      statusMsg = t('visCool').replace('{n}', coolLabel(wait));
    }
    else if(e && e.body && e.body.error==='recover') statusMsg = t('errRecover');
    else if(e && e.status===0) statusMsg = t('errNet');
    else statusMsg = t('errNet');
    paint();
  }
  function zhDict(){ return DICT[lang()==='zh-Hant'?'zh-Hant':'zh-Hans'] || DICT['zh-Hans']; }
  function pair(k){ return {zh:(zhDict()[k]||''), en:(DICT.en[k]||'')}; }
  function bi(k){ var p = pair(k); return '<b>'+esc(p.zh)+'</b><em>'+esc(p.en)+'</em>'; }
  function pendingList(){ return (state&&state.members||[]).filter(function(m){ return m.status==='pending'; }); }
  function syncAlert(list){
    var ids = {}, fresh = false;
    list.forEach(function(m){ ids[m.id] = 1; if(!alertSeen[m.id]) fresh = true; });
    alertSeen = ids;
    if(fresh) alertHold = false;
  }
  function armAlert(){
    clearTimeout(alertTimer);
    if(!alertFlash) return;
    alertTimer = setTimeout(function(){ if(alertFlash && alertFlash.until<=Date.now()){ alertFlash = null; paint(); } }, Math.max(40, alertFlash.until-Date.now()));
  }
  function alertSkin(){ return '<i class="st-alert-haze"></i><i class="st-alert-grain"></i>'; }
  function alertPlate(tone, titleKey, subKey, body, acts){
    var title = pair(titleKey), sub = subKey ? pair(subKey) : null;
    return '<div class="st-alert-plate" role="dialog" aria-label="'+esc(title.zh+' '+title.en)+'">'+
      alertSkin()+
      '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>'+
      '<div class="st-alert-bar"></div>'+
      '<div class="st-alert-kicker">'+esc(title.zh)+'</div>'+
      '<div class="st-alert-en">'+esc(title.en)+'</div>'+
      (sub ? '<p class="st-alert-sub"><span>'+esc(sub.zh)+'</span><span>'+esc(sub.en)+'</span></p>' : '')+
      body+acts+'</div>';
  }
  function grabCastDraft(){
    var area = document.getElementById('stCastBody');
    if(area) castDraft = area.value;
  }
  function castSoundOn(){ return SC.castSound ? !!SC.castSound() : true; }
  function setCastSound(on){ if(SC.castSound) SC.castSound(!!on); }
  function castSoundHtml(){
    var on = castSoundOn();
    var a = pair('castSound'), b = pair(on?'castOn':'castOff');
    return '<button type="button" id="stCastSound" class="'+(on?'on':'')+'"><b>'+esc(a.zh+' · '+b.zh)+'</b><em>'+esc(a.en+' · '+b.en)+'</em></button>';
  }
  function bindCastSound(box){
    var b = box.querySelector('#stCastSound');
    if(!b) return;
    b.onclick = function(){ grabCastDraft(); setCastSound(!castSoundOn()); paint(); };
  }
  function castSeenId(){
    try{
      var m = JSON.parse(localStorage.getItem('sclmw_cast_seen')||'{}');
      return state && state.code ? (m[state.code]||'') : '';
    }catch(e){ return ''; }
  }
  function castMarkSeen(id){
    try{
      var m = JSON.parse(localStorage.getItem('sclmw_cast_seen')||'{}');
      if(state && state.code) m[state.code] = id;
      localStorage.setItem('sclmw_cast_seen', JSON.stringify(m));
    }catch(e){}
  }
  function castPlayed(id){
    try{ return !!JSON.parse(sessionStorage.getItem('sclmw_cast_played')||'{}')[id]; }catch(e){ return false; }
  }
  function castMarkPlayed(id){
    try{
      var m = JSON.parse(sessionStorage.getItem('sclmw_cast_played')||'{}');
      m[id] = 1;
      sessionStorage.setItem('sclmw_cast_played', JSON.stringify(m));
    }catch(e){}
  }
  function armCastAudio(){
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return null;
    if(!castAudio){ try{ castAudio = new Ctx(); }catch(e){ return null; } }
    if(castAudio.state==='suspended') castAudio.resume();
    return castAudio;
  }
  function playCastChime(){
    if(!castSoundOn()) return;
    var ctx = armCastAudio();
    if(!ctx) return;
    var t0 = ctx.currentTime;
    function tone(freq, start, dur, peak){
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t0+start);
      g.gain.setValueAtTime(0.0001, t0+start);
      g.gain.exponentialRampToValueAtTime(peak, t0+start+0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0+start+dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0+start); o.stop(t0+start+dur+0.02);
    }
    tone(494, 0, 0.22, 0.05);
    tone(740, 0.12, 0.28, 0.04);
    tone(988, 0.24, 0.36, 0.03);
  }
  function noteCast(st){
    var c = st && st.cast;
    if(!st || st.status!=='member' || !c || !c.id || c.id===castSeenId()){
      if(!c || !c.id || (st && c && c.id===castSeenId())) castIncoming = null;
      return;
    }
    var fresh = !castIncoming || castIncoming.id!==c.id;
    castIncoming = {id:c.id, body:c.body||'', name:c.name||''};
    if(fresh && !castPlayed(c.id)){ castMarkPlayed(c.id); playCastChime(); }
  }
  function sendCast(){
    grabCastDraft();
    var body = castDraft.trim();
    if(!body){ castErr = t('castEmpty'); paint(); return; }
    castErr = '';
    api('/api/rooms/'+encodeURIComponent(state.code)+'/broadcast', {method:'POST', body:{body:body}}).then(function(st){
      castCompose = false; castDraft = '';
      take(st);
    }).catch(fail);
  }
  function paintAlert(){
    var host = root();
    var box = document.getElementById('stAlert');
    if(!box){
      box = document.createElement('div');
      box.id = 'stAlert';
      box.className = 'st-alert';
      box.hidden = true;
      host.appendChild(box);
    }
    if(alertFlash && alertFlash.until<=Date.now()) alertFlash = null;
    var list = pendingList();
    var captain = !!(state && state.role==='captain' && state.status==='member');
    if(captain) syncAlert(list); else alertSeen = {};
    var waiting = !!(state && state.status==='pending' && !picking);
    var flash = alertFlash;
    var review = captain && list.length;
    if(alertDeny && !flash && !waiting && !review){
      box.hidden = false;
      box.className = 'st-alert tone-deny';
      var codeHtml = alertDeny.code ? '<p class="st-alert-code">'+esc(alertDeny.code)+'</p>' : '';
      box.innerHTML = alertPlate('deny', 'reject', 'denied', codeHtml, '<div class="st-alert-acts"><button type="button" id="stAlertDeny">'+bi('switchRoom')+'</button></div>');
      var denyBtn = box.querySelector('#stAlertDeny');
      if(denyBtn) denyBtn.onclick = function(){ alertDeny = null; paint(); };
      return;
    }
    grabCastDraft();
    if(castCompose && state && state.role==='captain' && state.status==='member'){
      var area0 = document.getElementById('stCastBody');
      if(area0 && document.activeElement===area0 && box.classList.contains('tone-cast') && !castErr){
        box.hidden = false;
        return;
      }
      box.hidden = false;
      box.className = 'st-alert tone-cast';
      var field = '<textarea id="stCastBody" maxlength="120" placeholder="'+esc(t('castPh'))+'">'+esc(castDraft)+'</textarea>'+
        (castErr ? '<p class="st-alert-sub"><span>'+esc(castErr)+'</span></p>' : '');
      var acts = '<div class="st-alert-acts"><button type="button" id="stCastSend">'+bi('castSend')+'</button><button type="button" id="stCastCancel">'+bi('cancel')+'</button>'+castSoundHtml()+'</div>';
      box.innerHTML = alertPlate('cast', 'cast', 'castLead', field, acts);
      var area = box.querySelector('#stCastBody');
      if(area) area.oninput = function(){ castDraft = area.value; castErr = ''; };
      box.querySelector('#stCastSend').onclick = sendCast;
      box.querySelector('#stCastCancel').onclick = function(){ castCompose = false; castErr = ''; paint(); };
      bindCastSound(box);
      return;
    }
    if(castIncoming && state && state.status==='member' && castIncoming.id!==castSeenId()){
      box.hidden = false;
      box.className = 'st-alert tone-cast';
      var who = '<p class="st-alert-from"><b>'+esc(pair('castFrom').zh+' '+castIncoming.name)+'</b><em>'+esc(pair('castFrom').en+' '+castIncoming.name)+'</em></p>'+
        '<p class="st-alert-msg">'+esc(castIncoming.body)+'</p>';
      box.innerHTML = alertPlate('cast', 'cast', '', who, '<div class="st-alert-acts"><button type="button" id="stCastClose">'+bi('castClose')+'</button>'+castSoundHtml()+'</div>');
      box.querySelector('#stCastClose').onclick = function(){ castMarkSeen(castIncoming.id); castIncoming = null; paint(); };
      bindCastSound(box);
      return;
    }
    if(!flash && !waiting && !review){ box.hidden = true; box.innerHTML = ''; return; }
    if(!flash && review && alertHold){
      box.hidden = false;
      box.className = 'st-alert hold tone-review';
      var badge = pair('pending');
      box.innerHTML = '<button type="button" class="st-alert-badge">'+alertSkin()+'<b>'+esc(badge.zh)+'</b><em>'+esc(badge.en)+'</em><span>'+list.length+'</span></button>';
      box.querySelector('button').onclick = function(){ alertHold = false; paint(); };
      return;
    }
    var tone = flash ? flash.tone : (waiting ? 'wait' : 'review');
    var titleKey = flash ? (flash.tone==='ok'?'approve':'reject') : 'pending';
    var subKey = flash ? '' : (waiting ? (roomKind==='join' ? 'wait' : 'resumedWait') : 's3');
    var body = '';
    if(flash) body = '<p class="st-alert-who">'+esc(flash.name||'')+'</p>';
    else if(waiting) body = '<p class="st-alert-code">'+esc(state.code||'')+'</p>';
    else body = list.map(function(m){
      return '<div class="st-alert-row"><span>'+esc(m.nickname)+'</span>'+
        '<button type="button" class="ok" data-ok="'+esc(m.id)+'">'+bi('approve')+'</button>'+
        '<button type="button" class="no" data-no="'+esc(m.id)+'">'+bi('reject')+'</button></div>';
    }).join('');
    var acts = '';
    if(waiting) acts = '<div class="st-alert-acts"><button type="button" id="stAlertSwitch">'+bi('switchRoom')+'</button></div>';
    else if(!flash && review) acts = '<div class="st-alert-acts"><button type="button" id="stAlertLater">'+bi('alertLater')+'</button></div>';
    box.hidden = false;
    box.className = 'st-alert tone-'+tone;
    box.innerHTML = alertPlate(tone, titleKey, subKey, body, acts);
    box.querySelectorAll('[data-ok]').forEach(function(b){ b.onclick=function(){ decide(b.getAttribute('data-ok'),'approve'); }; });
    box.querySelectorAll('[data-no]').forEach(function(b){ b.onclick=function(){ decide(b.getAttribute('data-no'),'reject'); }; });
    var later = box.querySelector('#stAlertLater');
    if(later) later.onclick = function(){ alertHold = true; paint(); };
    var sw = box.querySelector('#stAlertSwitch');
    if(sw) sw.onclick = function(){ picking = true; statusMsg = ''; paint(); };
    armAlert();
  }
  function decide(id, action){
    var name = '';
    (state&&state.members||[]).forEach(function(m){ if(m.id===id) name = m.nickname||''; });
    api('/api/rooms/'+encodeURIComponent(state.code)+'/members/'+encodeURIComponent(id)+'/'+action, {method:'POST', body:{}}).then(function(st){
      alertFlash = {tone:action==='approve'?'ok':'no', name:name, until:Date.now()+2200};
      alertHold = false;
      take(st);
    }).catch(fail);
  }
  function linkNote(){
    if(!state) return '';
    if(linkState==='on') return '<p class="st-link on">'+esc(t('linkOn'))+' '+esc(state.code)+'</p>';
    if(linkState==='wait') return '<p class="st-link wait">'+esc(t('linkWait'))+'</p>';
    if(linkState==='off') return '<p class="st-link off">'+esc(t('linkOff'))+'</p>';
    return '';
  }
  function setLink(next){
    if(next===linkState) return;
    linkState = next;
    if(entered) paint();
  }
  function pullLink(){
    if(!entered || !state || state.status!=='member') return;
    fetch('http://127.0.0.1:8780/api/status', {cache:'no-store'})
      .then(function(r){ if(!r.ok) throw new Error('status'); return r.json(); })
      .then(function(d){
        var room = String(d && d.room || '').toUpperCase();
        var pending = String(d && d.pendingRoom || '').toUpperCase();
        linkMiss = 0;
        if(d && d.tokenSet && room===state.code) setLink('on');
        else if(pending===state.code) setLink('wait');
        else if(linkState==='on') setLink('');
      })
      .catch(function(){
        linkMiss += 1;
        if(linkMiss>=3 && linkState==='on') setLink('');
      });
  }
  function linkPc(){
    var tok = token();
    if(!tok || !state || !state.code){ setLink('off'); return; }
    var payload = JSON.stringify({apiBase: API || location.origin, room: state.code, token: tok});
    fetch('http://127.0.0.1:8780/api/pair', {method:'POST', headers:{'Content-Type':'application/json'}, body: payload})
      .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(d){ if(d && d.error) throw new Error(d.error); setLink('wait'); pullLink(); })
      .catch(function(){ setLink('off'); });
  }
  function mapTarget(node){
    if(!node || !node.closest) return false;
    return !node.closest('.st-loc-card,.st-zoom,.stx,.st-side,.st-crumb,.st-top,.st-room,.st-crew,.st-float-ico,.st-gate,.st-call,.st-sfx,.st-ctrldlg,.st-locdlg,.st-alert,.st-ctx');
  }
  function closeCtx(){
    ctxAt = null;
    ctxSig = '';
    var menu = document.getElementById('stCtx');
    if(menu) menu.hidden = true;
  }
  function syncCtx(){
    var menu = document.getElementById('stCtx');
    if(!menu) return;
    if(!ctxAt || !entered || !state || state.status!=='member'){ menu.hidden = true; ctxSig = ''; return; }
    var mine = canDraw();
    var cap = state.role==='captain';
    var members = state.routeMode==='members';
    var sig = [mine?1:0, cap?1:0, members?1:0, marking?1:0, t('here'), t('route'), t('routeOn'), t('mode'), t('modeCaptain'), t('modeMembers')].join('|');
    if(sig === ctxSig && !menu.hidden && menu.childElementCount) return;
    var keepOpen = !!menu.querySelector('.st-ctx-sub.st-open');
    ctxSig = sig;
    menu.innerHTML =
      '<button type="button" class="st-ctx-btn" data-ctx="here">'+esc(t('here'))+'</button>'+
      (mine ? '<button type="button" class="st-ctx-btn'+(marking?' on':'')+'" data-ctx="mark">'+esc(marking?t('routeOn'):t('route'))+'</button>' : '')+
      (cap ? '<div class="st-ctx-sub">'+
        '<button type="button" class="st-ctx-btn" data-ctx="mode" aria-haspopup="menu" title="'+esc(members?t('modeMembers'):t('modeCaptain'))+'">'+esc(t('mode'))+'<i class="st-ctx-caret"></i></button>'+
        '<div class="st-ctx-pop" role="menu">'+
          '<button type="button" class="st-ctx-btn'+(!members?' on':'')+'" data-ctx-mode="captain">'+esc(t('modeCaptain'))+'</button>'+
          '<button type="button" class="st-ctx-btn'+(members?' on':'')+'" data-ctx-mode="members">'+esc(t('modeMembers'))+'</button>'+
        '</div></div>' : '');
    menu.hidden = false;
    if(keepOpen){
      var sub = menu.querySelector('.st-ctx-sub');
      if(sub) sub.classList.add('st-open');
    }
    var host = root().getBoundingClientRect();
    var x = ctxAt.x-host.left, y = ctxAt.y-host.top;
    menu.style.left = '0px';
    menu.style.top = '0px';
    var w = menu.offsetWidth, h = menu.offsetHeight;
    var maxX = Math.max(8, host.width-w-8);
    var maxY = Math.max(8, host.height-h-36);
    menu.style.left = Math.max(8, Math.min(x, maxX))+'px';
    menu.style.top = Math.max(8, Math.min(y, maxY))+'px';
    placeCtxPop();
  }
  function placeCtxPop(){
    var pop = document.querySelector('#stCtx .st-ctx-pop');
    var sub = pop && pop.parentNode;
    if(!pop || !sub) return;
    pop.classList.remove('st-flip');
    pop.classList.remove('st-drop');
    pop.style.display = 'block';
    pop.style.visibility = 'hidden';
    var host = root().getBoundingClientRect();
    var edge = sub.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    pop.style.display = '';
    pop.style.visibility = '';
    var roomR = host.right-edge.right, roomL = edge.left-host.left;
    if(roomR<pw+8 && roomL>=pw+8) pop.classList.add('st-flip');
    else if(roomR<pw+8 && roomL<pw+8) pop.classList.add('st-drop');
    if(edge.top+ph>host.bottom-8 && !pop.classList.contains('st-drop')){
      pop.style.top = 'auto';
      pop.style.bottom = '0px';
    }
  }
  function openCtx(x, y){
    if(!entered || !state || state.status!=='member') return;
    ctxAt = {x:x, y:y};
    syncCtx();
  }
  function onCtxClick(e){
    var b = e.target.closest('button');
    if(!b) return;
    e.stopPropagation();
    var act = b.getAttribute('data-ctx');
    var mode = b.getAttribute('data-ctx-mode');
    var at = ctxAt;
    if(act==='here'){
      closeCtx();
      var hit = at && window.__stCtl && window.__stCtl.hitAt && window.__stCtl.hitAt(at.x, at.y);
      if(hit) window.__stPlace = hit;
      here();
      return;
    }
    if(act==='mark'){
      if(!canDraw()) return;
      marking = !marking;
      if(!marking) window.__stRouteOn = false;
      selected = '';
      closeCtx();
      paint();
      return;
    }
    if(act==='mode'){
      var sub = b.closest('.st-ctx-sub');
      if(sub) sub.classList.toggle('st-open');
      return;
    }
    if(mode && state && state.role==='captain'){
      closeCtx();
      api('/api/rooms/'+encodeURIComponent(state.code)+'/settings', {method:'POST', body:{routeMode:mode}}).then(take).catch(fail);
    }
  }
  function bindCtx(){
    if(window.__stCtxBound) return;
    window.__stCtxBound = true;
    var menu = document.createElement('div');
    menu.id = 'stCtx';
    menu.className = 'st-ctx';
    menu.hidden = true;
    menu.setAttribute('role', 'menu');
    root().appendChild(menu);
    menu.addEventListener('click', onCtxClick);
    menu.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    var arm = {x:0, y:0, moved:false, btn:-1};
    var hold = 0;
    var host = root();
    host.addEventListener('pointerdown', function(e){
      arm.x = e.clientX; arm.y = e.clientY; arm.moved = false; arm.btn = e.button;
      if(ctxAt && !(e.target && e.target.closest && e.target.closest('.st-ctx'))) closeCtx();
    }, true);
    host.addEventListener('pointermove', function(e){
      if(Math.abs(e.clientX-arm.x)+Math.abs(e.clientY-arm.y)>=6) arm.moved = true;
    }, true);
    host.addEventListener('contextmenu', function(e){
      if(!entered || !state || state.status!=='member' || !mapTarget(e.target)) return;
      if(arm.moved && arm.btn===2) return;
      e.preventDefault();
      openCtx(e.clientX, e.clientY);
    });
    host.addEventListener('touchstart', function(e){
      if(!entered || e.touches.length!==1 || !mapTarget(e.target)) return;
      var t = e.touches[0];
      var x = t.clientX, y = t.clientY;
      clearTimeout(hold);
      hold = setTimeout(function(){ arm.moved = true; openCtx(x, y); }, 560);
    }, {passive:true});
    host.addEventListener('touchmove', function(e){
      var t = e.touches && e.touches[0];
      if(t && Math.abs(t.clientX-arm.x)+Math.abs(t.clientY-arm.y)>=8) clearTimeout(hold);
    }, {passive:true});
    host.addEventListener('touchend', function(){ clearTimeout(hold); }, {passive:true});
    host.addEventListener('touchcancel', function(){ clearTimeout(hold); }, {passive:true});
    window.addEventListener('keydown', function(e){
      if(e.key==='Escape' && ctxAt) closeCtx();
    });
  }
  function here(){
    var ctl = window.__stCtl;
    var o = window.__stPlace;
    var lv = ctl && ctl.level && ctl.level();
    if(!o && lv) o = lv.o;
    if(!o || !o.n){ statusMsg = t('hereNeed'); paint(); return; }
    api('/api/rooms/'+encodeURIComponent(state.code)+'/presence', {
      method:'POST', body:{location:o.n, system:o.sy||'', code:o.tag||''}
    }).then(function(){ statusMsg=''; return refresh(); }).catch(fail);
  }
  function publish(){
    if(draft.length<2) return;
    var title = draft.map(function(p){ return p.n; }).join(' → ').slice(0,40);
    api('/api/rooms/'+encodeURIComponent(state.code)+'/routes', {
      method:'POST', body:{title:title, note:note, points:draft}
    }).then(function(st){ draft=[]; note=''; marking=false; take(st); }).catch(fail);
  }
  function sendComment(id){
    var input = document.querySelector('[data-cmt="'+id+'"]');
    var body = input ? input.value.trim() : '';
    if(!body) return;
    api('/api/rooms/'+encodeURIComponent(state.code)+'/routes/'+encodeURIComponent(id)+'/comments', {method:'POST', body:{body:body}}).then(take).catch(fail);
  }
  function delRoute(id){
    api('/api/rooms/'+encodeURIComponent(state.code)+'/routes/'+encodeURIComponent(id), {method:'DELETE'}).then(function(st){ if(selected===id) selected=''; take(st); }).catch(fail);
  }
  function localLeave(){
    leaving = false;
    state = null; draft = []; marking = false; note = ''; selected = ''; statusMsg = ''; entered = false; roomKind = ''; linkState = ''; linkMiss = 0;
    castCompose = false; castDraft = ''; castErr = ''; castIncoming = null; ctxAt = null;
    try{ localStorage.removeItem(CODE); }catch(e){}
    window.__stRouteOn = false;
    var cfg = window.LIVEMAP_CONFIG || {};
    cfg.PLAYERS_URL = './players.example.json';
    cfg.PLAYERS_HEADERS = {};
    if(window.__stCtl && window.__stCtl.showRoute) window.__stCtl.showRoute([]);
    if(typeof window.__stReloadPlayers==='function') window.__stReloadPlayers();
    paint();
  }
  function askLeave(){
    if(state && state.role==='captain' && state.status==='member'){ leaving = true; paint(); return; }
    exitRoom({});
  }
  function exitRoom(body){
    if(!state || !state.code){ localLeave(); return; }
    api('/api/rooms/'+encodeURIComponent(state.code)+'/leave', {method:'POST', body:body||{}}).then(function(){
      localLeave();
    }).catch(function(e){
      if(e && e.body && (e.body.error==='handoff' || e.body.error==='solo')){ leaving = true; paint(); return; }
      fail(e);
    });
  }
  function noteDenied(code){
    alertDeny = {code: code || (state && state.code) || ''};
    localLeave();
  }
  function refresh(){
    if(!state || !token()) return Promise.resolve();
    return api('/api/rooms/'+encodeURIComponent(state.code)).then(function(st){
      var keep = statusMsg;
      take(st);
      statusMsg = keep;
      if(keep) paint();
    }).catch(function(e){
      if(e && e.status===403 && e.body && e.body.error==='rejected'){ noteDenied(); return; }
      if(e && (e.status===403 || e.status===404)){
        var removed = e.status===403 && e.body && e.body.error==='forbidden';
        localLeave();
        if(removed){ statusMsg = t('kicked'); paint(); }
      }
    });
  }

  function probe(base){
    return fetch(base+'/api/health', {cache:'no-store'}).then(function(r){ return r.ok ? r.json() : null; }).then(function(h){ return !!(h&&h.ok); }).catch(function(){ return false; });
  }
  function detect(){
    return probe('').then(function(ok){
      if(ok){ API=''; return true; }
      if(location.hostname==='127.0.0.1' && location.port==='8770') return false;
      return probe('http://127.0.0.1:8770').then(function(ok2){ if(ok2){ API='http://127.0.0.1:8770'; return true; } return false; });
    });
  }
  function start(){
    ensure();
    paint();
    if(!window.__stRoomFit){
      window.__stRoomFit=function(){
        var host = root();
        if(host){
          var nodes = host.querySelectorAll('.st-sys,.st-cats,.st-tabs,.st-sbox');
          var origin = host.getBoundingClientRect().top, bottom = 0;
          for(var i=0;i<nodes.length;i++){
            var st = getComputedStyle(nodes[i]);
            if(st.display==='none' || st.visibility==='hidden') continue;
            var r = nodes[i].getBoundingClientRect();
            if(r.height>1 && r.width>1 && r.bottom>bottom) bottom = r.bottom;
          }
          if(bottom>origin) host.style.setProperty('--st-chrome', Math.ceil(bottom-origin)+'px');
        }
        var ui = ensure();
        if(ui.dock && !ui.dock.hidden) applyFrame(ui.dock, FRAME, 280, 220);
        if(ui.crew && !ui.crew.hidden) applyFrame(ui.crew, CREW, 220, 160);
      };
      window.addEventListener('resize', window.__stRoomFit);
      if(window.ResizeObserver) new ResizeObserver(window.__stRoomFit).observe(root());
      requestAnimationFrame(window.__stRoomFit);
    }
    bindCtx();
    if(!window.__stCastArm){
      window.__stCastArm = true;
      window.addEventListener('pointerdown', function(){ armCastAudio(); }, true);
    }
    if(!window.__stRoomLang){
      window.__stRoomLang=function(){
        if(document.getElementById('stGate')) paint();
        var box = document.getElementById('stSfx');
        if(box && !box.hidden) openStarfix();
      };
      document.addEventListener('sclmw-lang', window.__stRoomLang);
    }
    detect().then(function(ok){
      if(!ok){ statusMsg=t('errNet'); paint(); return; }
      var code = savedCode();
      if(token() && code) api('/api/rooms/'+encodeURIComponent(code)).then(function(st){ if(!roomKind) roomKind='saved'; take(st); }).catch(function(e){ if(e && e.status===403 && e.body && e.body.error==='rejected'){ noteDenied(code); return; } paint(); });
      if(!window.__stRoomPoll) window.__stRoomPoll=setInterval(function(){
        if(state) refresh();
        var gate = document.getElementById('stGate');
        if(gate && !gate.hidden) pullPublic(true);
      }, 8000);
      if(!window.__stAgeTick) window.__stAgeTick=setInterval(tickAges, 1000);
      if(!window.__stLinkWatch) window.__stLinkWatch=setInterval(pullLink, 2000);
    if(!window.__stDdClose){
      window.__stDdClose=function(e){ if(e.target.closest&&e.target.closest('.st-dd')) return; document.querySelectorAll('.st-dd-list').forEach(function(n){ n.hidden=true; }); };
      document.addEventListener('click', window.__stDdClose);
    }
    });
  }

  SC.room = {start:start, openStarfix:openStarfix};
})();
