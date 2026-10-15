/* =====================================================================
   مغامرة المستكشف السعودي — منطق اللعبة
   JavaScript عادي (ليس Module) ليعمل مباشرة عبر file:// ومن GitHub Pages.
   ===================================================================== */
(function () {
  'use strict';

  var DATA = window.EXPLORER_DATA, ART = window.ART, MAP = window.MAP_DATA;

  /* ================= أدوات ================= */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function N(n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var LETTERS = ['أ', 'ب', 'ج', 'د'];

  /* ================= المحطات ================= */
  var STATIONS = [
    { id: 'riyadh', num: 1, geo: 'riyadh', city: 'الرياض', game: 'أسرار الرياض', icon: '🏰', color: '#c46a1e', stamp: 'مستكشف الرياض', stampShort: 'مستكشف الرياض', lm: [52, -8, 1], lbl: [0, 46] },
    { id: 'taif', num: 2, geo: 'taif', city: 'الطائف', game: 'تحدي المصايف', icon: '⛰️', color: '#1f8a4c', stamp: 'بطل المصايف', stampShort: 'بطل المصايف', lm: [-52, -6, 1], lbl: [-30, 44] },
    { id: 'asir', num: 3, geo: 'asir', city: 'عسير', game: 'وادي الكلمات', icon: '🌿', color: '#2a9d8f', stamp: 'خبير الكلمات', stampShort: 'خبير الكلمات', lm: [-52, -4, .9], lbl: [-112, -26] },
    { id: 'jazan', num: 4, geo: 'jazan', city: 'جازان', game: 'السباق الذهبي', icon: '🏁', color: '#1e7fc2', stamp: 'بطل السرعة', stampShort: 'بطل السرعة', lm: [-50, 6, .9], lbl: [-132, -2] },
    { id: 'najran', num: 5, geo: 'najran', city: 'نجران', game: 'كنز ربوع بلادي', icon: '💰', color: '#b47a00', stamp: 'مستكشف ربوع بلادي', stampShort: 'كنز بلادي', lm: [52, -4, .9], lbl: [120, 6] }
  ];
  function ST(id) { return STATIONS.filter(function (s) { return s.id === id; })[0]; }

  /* ================= الحالة والتخزين (مع بديل في الذاكرة) ================= */
  var KEY = 'saudi-explorer-v1';
  var storageOK = true;
  var memStore = {};
  function storeGet() {
    try { return window.localStorage.getItem(KEY); } catch (e) { storageOK = false; return memStore[KEY] || null; }
  }
  function storeSet(v) {
    try { window.localStorage.setItem(KEY, v); } catch (e) { storageOK = false; memStore[KEY] = v; }
  }
  var DEFAULT = {
    started: false, avatar: 'boy', mode: 'teams', active: 0, pos: null,
    teams: [
      { name: 'فريق الصقور', score: 0, got: {}, stamps: [] },
      { name: 'فريق النخيل', score: 0, got: {}, stamps: [] }
    ],
    cardsKnown: {}, bagsDone: {}, stGain: {}, finished: false,
    settings: { sound: true, volume: .8, timerOn: true, qTime: 30, rTime: 15, qCount: 12, rCount: 15, level: 'mixed', spins: 8, autoSwitch: true, hintStar: false }
  };
  var state = load();
  function load() {
    var s = clone(DEFAULT);
    try {
      var raw = storeGet();
      if (raw) {
        var o = JSON.parse(raw);
        for (var k in o) if (k !== 'settings') s[k] = o[k];
        for (var k2 in (o.settings || {})) s.settings[k2] = o.settings[k2];
      }
    } catch (e) { }
    return s;
  }
  function save() { try { storeSet(JSON.stringify(state)); } catch (e) { } }
  function ti() { return state.mode === 'solo' ? 0 : state.active; }
  function team() { return state.teams[ti()]; }

  /* ================= الأصوات (Web Audio مولّدة برمجيًا) ================= */
  var Sound = {
    ctx: null, master: null,
    init: function () {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      try { this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination); this.vol(); } catch (e) { this.ctx = null; }
    },
    vol: function () { if (this.master) this.master.gain.value = state.settings.volume; },
    ok: function () { return this.ctx && state.settings.sound; },
    tone: function (f, d, type, v, delay, slide) {
      if (!this.ok()) return; var c = this.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v || .25, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + .05);
    },
    noise: function (d, v, f1, f2, delay) {
      if (!this.ok()) return; var c = this.ctx, t = c.currentTime + (delay || 0), n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0);
      for (var i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
      var s = c.createBufferSource(); s.buffer = b; var f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(f1 || 800, t); f.frequency.exponentialRampToValueAtTime(f2 || 2400, t + d);
      var g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v || .25, t + d * .3); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + d + .05);
    },
    click: function () { this.tone(900, .06, 'triangle', .14); },
    correct: function () { this.tone(660, .13, 'triangle', .26); this.tone(880, .13, 'triangle', .26, .1); this.tone(1320, .28, 'triangle', .26, .2); },
    wrong: function () { this.tone(320, .2, 'sine', .2, 0, 220); this.tone(240, .28, 'sine', .16, .15, 180); },
    soft: function () { this.tone(520, .12, 'sine', .18); this.tone(440, .18, 'sine', .18, .1); },
    flip: function () { this.noise(.25, .2, 700, 3000); },
    whoosh: function () { this.noise(.6, .22, 300, 2400); },
    step: function () { this.tone(180, .06, 'sine', .14); },
    tick: function () { this.tone(1500, .04, 'square', .05); },
    stamp: function () { this.noise(.18, .45, 200, 120); this.tone(90, .25, 'sine', .4); this.tone(1568, .4, 'sine', .14, .22); },
    chest: function () { this.noise(.5, .18, 150, 500); var n = [523, 659, 784, 1047, 1319, 1568]; for (var i = 0; i < n.length; i++) this.tone(n[i], .3, 'triangle', .2, .35 + i * .08); },
    star: function () { var n = [784, 988, 1175, 1568]; for (var i = 0; i < n.length; i++) this.tone(n[i], .22, 'triangle', .2, i * .07); },
    fanfare: function () { var s = [[523, 0], [523, .15], [659, .3], [784, .5], [659, .75], [784, .9], [1047, 1.1]]; for (var i = 0; i < s.length; i++) { this.tone(s[i][0], .3, 'triangle', .24, s[i][1]); this.tone(s[i][0] / 2, .3, 'sine', .12, s[i][1]); } }
  };

  /* ================= مؤثرات بصرية ================= */
  var Confetti = (function () {
    var cv, cx, parts = [], run = false, C = ['#1f8a4c', '#f5c430', '#1e7fc2', '#f08a24', '#d9558a', '#ffffff'];
    function size() { cv.width = innerWidth; cv.height = innerHeight; }
    function loop() {
      cx.clearRect(0, 0, cv.width, cv.height);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.vy += .18; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
        if (p.s) cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); else { cx.beginPath(); cx.arc(0, 0, p.w / 2, 0, 6.3); cx.fill(); }
        cx.restore(); if (p.y > cv.height + 40) parts.splice(i, 1);
      }
      if (parts.length) requestAnimationFrame(loop); else { run = false; cx.clearRect(0, 0, cv.width, cv.height); }
    }
    return {
      init: function () { cv = $('#confetti'); cx = cv.getContext('2d'); size(); addEventListener('resize', size); },
      burst: function (n, x, y) {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        for (var i = 0; i < (n || 120); i++) {
          var top = x === undefined;
          parts.push({ x: top ? Math.random() * cv.width : x, y: top ? -20 - Math.random() * cv.height * .3 : y, vx: top ? (Math.random() - .5) * 4 : (Math.random() - .5) * 16, vy: top ? Math.random() * 3 : -Math.random() * 14 - 4, w: 8 + Math.random() * 8, h: 6 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: C[i % C.length], s: Math.random() < .5 });
        }
        if (!run) { run = true; requestAnimationFrame(loop); }
      }
    };
  })();
  var toastT;
  function toast(m, k, ms) { var t = $('#toast'); t.textContent = m; t.className = 'show ' + (k || ''); clearTimeout(toastT); toastT = setTimeout(function () { t.className = ''; }, ms || 2300); }
  function floatPts(n, el) {
    var r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    var d = document.createElement('div'); d.className = 'float-pts'; d.textContent = (n > 0 ? '+' : '') + N(n);
    d.style.left = (r.left + r.width / 2 - 30) + 'px'; d.style.top = (r.top + r.height / 2) + 'px';
    $('#float-layer').appendChild(d); setTimeout(function () { d.remove(); }, 1400);
  }

  /* ================= النقاط (دون احتساب الإجابة نفسها مرتين) ================= */
  var curStation = null;
  function stars(s) { return Math.floor(s / 50); }
  function stGain(st, i, n) {
    state.stGain[st] = state.stGain[st] || [0, 0];
    state.stGain[st][i] += n;
  }
  /* يمنح النقاط مرة واحدة لكل فريق عن كل عنصر (id). يعيد true إن احتُسبت. */
  function award(id, pts, anchor, teamOverride) {
    var i = teamOverride !== undefined ? teamOverride : ti(), t = state.teams[i];
    if (id && t.got[id]) { toast('✔ إجابة صحيحة، لكن هذا السؤال احتُسب لـ«' + t.name + '» من قبل', 'soft', 2600); return false; }
    if (id) t.got[id] = 1;
    addPoints(pts, anchor, i);
    return true;
  }
  function addPoints(n, anchor, i) {
    if (!n) return;
    if (i === undefined) i = ti();
    var t = state.teams[i], before = stars(t.score);
    t.score = Math.max(0, t.score + n);
    if (curStation && n > 0) stGain(curStation, i, n);
    save(); renderScore();
    var sc = $('#score-' + i); if (sc) { sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); }
    floatPts(n, anchor || sc);
    if (stars(t.score) > before) setTimeout(function () { Sound.star(); toast('⭐ نجمة جديدة لـ«' + t.name + '»!', 'good'); }, 500);
  }
  function renderScore() {
    var html = '', count = state.mode === 'solo' ? 1 : 2;
    for (var i = 0; i < count; i++) {
      var t = state.teams[i];
      html += '<div class="team-card t' + i + (i === ti() ? ' active' : '') + '" data-team="' + i + '"><div class="tc-av">' + avatarSVG(i) + '</div>' +
        '<div><div class="tc-name">' + esc(t.name) + '</div><div class="tc-meta">⭐ ' + N(stars(t.score)) + ' • 🛂 ' + N(t.stamps.length) + '/٥</div></div>' +
        '<div class="tc-score" id="score-' + i + '">' + N(t.score) + '</div></div>';
    }
    $('#scoreboard').innerHTML = html;
    $('#app').classList.toggle('solo', state.mode === 'solo');
    renderTeacherTeams();
  }
  function avatarSVG(i) {
    var kind = state.mode === 'solo' ? state.avatar : (i === 0 ? state.avatar : (state.avatar === 'boy' ? 'girl' : 'boy'));
    return ART.explorer(kind).replace('<svg class="explorer"', '<svg class="explorer" preserveAspectRatio="xMidYMin slice"');
  }
  function setActive(i) { if (state.mode === 'solo') return; state.active = i; save(); renderScore(); }
  function switchTurn(silent) { if (state.mode === 'solo') return; state.active = state.active ? 0 : 1; save(); renderScore(); if (!silent) toast('🔄 الدور الآن: ' + team().name, 'soft', 1500); }
  function afterAnswer() { if (state.mode === 'teams' && state.settings.autoSwitch) switchTurn(); }

  /* ================= الأختام وجواز السفر ================= */
  function completeStation(st) {
    var gains = state.stGain[st] || [0, 0], winners = [];
    var count = state.mode === 'solo' ? 1 : 2;
    for (var i = 0; i < count; i++) if (gains[i] > 0) winners.push(i);
    if (!winners.length) winners = state.mode === 'solo' ? [0] : [ti()];
    var newOnes = winners.filter(function (i) { return state.teams[i].stamps.indexOf(st) < 0; });
    newOnes.forEach(function (i) { state.teams[i].stamps.push(st); });
    save(); renderScore(); renderMapState();
    if (newOnes.length) return showStamp(st, newOnes);
    return Promise.resolve();
  }
  function showStamp(st, teamIdx) {
    return new Promise(function (res) {
      var s = ST(st);
      var names = teamIdx.map(function (i) { return state.teams[i].name; }).join(' و');
      $('#stamp-fx-inner').innerHTML = '<h3>🛂 ختم جديد في جواز السفر!</h3><div class="stamp-drop">' + ART.stamp(s, true) + '</div><h3>«' + s.stamp + '»</h3><p>' + esc(names) + '</p><div class="row-btns" style="margin-top:10px"><button class="btn-big btn-green" id="stamp-ok">رائع! ⬅</button></div>';
      $('#stamp-fx').classList.add('show');
      setTimeout(function () { Sound.stamp(); Confetti.burst(90); }, 450);
      $('#stamp-ok').addEventListener('click', function () {
        $('#stamp-fx').classList.remove('show');
        checkFinal();
        res();
      });
    });
  }
  function checkFinal() {
    var full = state.teams.slice(0, state.mode === 'solo' ? 1 : 2).some(function (t) { return t.stamps.length >= 5; });
    if (full && !state.finished) { state.finished = true; save(); setTimeout(showWin, 400); }
  }
  var passTab = 0;
  function openPassport(i) {
    if (i !== undefined) passTab = i;
    if (state.mode === 'solo') passTab = 0;
    var t = state.teams[passTab], pct = Math.round(t.stamps.length / 5 * 100);
    var tabs = state.mode === 'teams' ? '<div class="pass-team-tabs">' + [0, 1].map(function (k) { return '<button data-ptab="' + k + '" class="' + (k === passTab ? 'on' : '') + '">' + esc(state.teams[k].name) + '</button>'; }).join('') + '</div>' : '';
    $('#pass-id').innerHTML = tabs + '<div class="pass-crest">🌴⚔️</div><h3>جواز سفر المستكشف</h3><div class="pass-photo">' + avatarSVG(passTab) + '</div>' +
      '<div class="pass-row"><span>الاسم</span>' + esc(t.name) + '</div>' +
      '<div class="pass-row"><span>الرحلة</span>ربوع من بلادي</div>' +
      '<div class="pass-row"><span>النقاط</span>' + N(t.score) + '</div>' +
      '<div class="pass-row"><span>النجوم</span>⭐ ' + N(stars(t.score)) + '</div>' +
      '<div class="pass-row"><span>الأختام</span>' + N(t.stamps.length) + ' من ٥</div>' +
      '<div class="pass-row"><span>نسبة التقدم</span>' + N(pct) + '٪</div><div class="pass-progress"><i style="width:' + pct + '%"></i></div>';
    $('#pass-stamps').innerHTML = '<h3>أختام المحطات</h3><div class="stamp-grid">' + STATIONS.map(function (s) {
      var done = t.stamps.indexOf(s.id) >= 0;
      return '<div class="stamp-cell">' + ART.stamp(s, done) + (done ? '✔ ' : '') + s.city + '<br>«' + s.stamp + '»</div>';
    }).join('') + '</div>' + (t.stamps.length >= 5 ? '<p class="tp-note" style="text-align:center;margin-top:8px;font-size:.8em">🏆 لقب: مستكشف ربوع بلادي</p>' : '');
    $('#passport').classList.add('show');
  }

  /* ================= الشاشات والتنقل ================= */
  var current = 'splash', busy = false;
  function show(name) {
    stopTimers();
    if (wheelS.spinning) { wheelS.spinning = false; wheelS.left++; }
    $$('.screen').forEach(function (s) { s.classList.remove('active'); });
    $('#scr-' + name).classList.add('active');
    current = name;
    $('#app').classList.toggle('on-splash', name === 'splash');
    $('#app').classList.toggle('on-setup', name === 'setup');
    curStation = ST(name) ? name : null;
    if (name === 'map') { layoutMap(); renderMapState(); }
  }
  var timers = [];
  function addT(id) { timers.push(id); return id; }
  function stopTimers() { timers.forEach(function (t) { clearInterval(t); clearTimeout(t); }); timers = []; }

  /* ================= الخريطة والكاميرا ================= */
  var cam = { ox: 0, oy: 0, w: 0, h: 0 };
  function layoutMap() {
    var vp = $('#map-viewport'), c = $('#map-camera');
    var W = vp.clientWidth, H = vp.clientHeight; if (!W || !H) return;
    var s = Math.min(W / MAP.W, H / MAP.H) * .94;
    cam = { w: MAP.W * s, h: MAP.H * s, ox: (W - MAP.W * s) / 2, oy: (H - MAP.H * s) / 2, W: W, H: H };
    c.style.width = cam.w + 'px'; c.style.height = cam.h + 'px';
    setCam('translate(' + cam.ox + 'px,' + cam.oy + 'px) scale(1)', false);
  }
  function setCam(tf, anim) {
    var c = $('#map-camera'); c.style.transition = anim ? '' : 'none'; c.style.transform = tf;
    if (!anim) { void c.offsetWidth; c.style.transition = ''; }
  }
  function camOn(st) {
    var el = $('#map-plane .station[data-st="' + st + '"] .pin'), vp = $('#map-viewport').getBoundingClientRect(), r = el.getBoundingClientRect();
    var lx = (r.left + r.width / 2) - vp.left - cam.ox, ly = (r.top + r.height / 2) - vp.top - cam.oy;
    var z = 2.4;
    return 'translate(' + (cam.W / 2 - z * lx) + 'px,' + (cam.H / 2 - z * ly) + 'px) scale(' + z + ')';
  }
  function walkerTo(st, anim) {
    var g = $('#map-walker'); if (!g) return Promise.resolve();
    var p = MAP.pts[ST(st).geo];
    var from = state.pos ? MAP.pts[ST(state.pos).geo] : null;
    if (from && from[0] > p[0]) g.querySelector('.walker-inner').style.transform = 'scaleX(-1)'; else g.querySelector('.walker-inner').style.transform = '';
    g.style.transition = anim ? '' : 'none';
    g.style.transform = 'translate(' + (p[0] - 34) + 'px,' + (p[1] - 18) + 'px)';
    if (!anim) return Promise.resolve();
    g.classList.add('walking');
    for (var i = 0; i < 6; i++) addT(setTimeout(function () { Sound.step(); }, i * 170));
    return wait(1150).then(function () { g.classList.remove('walking'); });
  }
  function renderMapState() {
    var t = team();
    var union = {};
    state.teams.slice(0, state.mode === 'solo' ? 1 : 2).forEach(function (x) { x.stamps.forEach(function (s) { union[s] = 1; }); });
    $$('#map-plane .station').forEach(function (g) { g.classList.toggle('done', !!union[g.getAttribute('data-st')]); });
    $('#map-legend').innerHTML = STATIONS.map(function (s) {
      return '<button class="lg-btn' + (union[s.id] ? ' done' : '') + '" data-go="' + s.id + '" style="--c:' + s.color + '"><b>' + s.icon + '</b><span>' + N(s.num) + '. ' + s.city + '<small>' + s.game + '</small></span></button>';
    }).join('') + '<button class="lg-btn" id="lg-pass" style="--c:#7a2e3a"><b>🛂</b><span>جواز السفر<small>' + N(t.stamps.length) + ' من ٥ أختام</small></span></button>';
    var inner = $('#map-walker .walker-inner');
    if (inner) {
      inner.innerHTML = ART.explorer(state.mode === 'solo' ? state.avatar : (ti() === 0 ? state.avatar : (state.avatar === 'boy' ? 'girl' : 'boy'))).replace('<svg class="explorer" viewBox', '<svg class="explorer" x="-30" y="-74" width="60" height="84" viewBox');
      if (state.pos) walkerTo(state.pos, false); else { $('#map-walker').style.transform = 'translate(' + (MAP.pts.riyadh[0] + 60) + 'px,' + (MAP.pts.riyadh[1] - 40) + 'px)'; }
    }
  }
  function goStation(st) {
    if (busy) return;
    busy = true; Sound.init();
    var s = ST(st);
    var p = Promise.resolve();
    if (current !== 'map') p = p.then(function () { show('map'); return wait(60); });
    p.then(function () {
      $$('#map-plane .station').forEach(function (g) { g.classList.toggle('lit', g.getAttribute('data-st') === st); });
      return walkerTo(st, true);
    }).then(function () {
      state.pos = st; save();
      Sound.whoosh(); setCam(camOn(st), true);
      return wait(1000);
    }).then(function () {
      var tr = $('#transition'); $('#tr-card').textContent = s.icon + ' ' + s.city + ' • ' + s.game;
      tr.classList.remove('show'); void tr.offsetWidth; tr.classList.add('show');
      return wait(420);
    }).then(function () {
      show(st); enter(st);
      $$('#map-plane .station').forEach(function (g) { g.classList.remove('lit'); });
      return wait(520);
    }).then(function () { $('#transition').classList.remove('show'); busy = false; })
      .catch(function (e) { console.error(e); busy = false; $('#transition').classList.remove('show'); });
  }
  function backToMap() {
    if (busy || current === 'map') return;
    var from = curStation;
    Sound.whoosh(); show('map');
    if (from && $('#map-plane .station[data-st="' + from + '"]')) {
      setCam(camOn(from), false);
      setTimeout(function () { setCam('translate(' + cam.ox + 'px,' + cam.oy + 'px) scale(1)', true); }, 40);
    }
  }
  function enter(st) {
    current_q = null;
    if (st === 'riyadh') enterCards();
    else if (st === 'taif') quizStart();
    else if (st === 'asir') bagsList();
    else if (st === 'jazan') raceStart();
    else if (st === 'najran') enterWheel();
  }

  /* التحكم بالسؤال الحالي من لوحة المعلم */
  var current_q = null; // { reveal(), skip(), repeat() }

  /* ================= ١) أسرار الرياض — البطاقات ================= */
  var CTYPES = [
    { id: 'all', name: 'الكل' }, { id: 'meaning', name: 'كلمة ومعناها', ask: 'ما مَعْنى الْكَلِمَةِ؟' },
    { id: 'opposite', name: 'كلمة وضدها', ask: 'ما ضِدُّ الْكَلِمَةِ؟' }, { id: 'people', name: 'شخصيات وأحداث', ask: 'شَخْصِيّاتٌ وَأَحْداثٌ' },
    { id: 'info', name: 'معلومات من الدرس', ask: 'مَعْلومَةٌ مِنَ الدَّرْسِ' }, { id: 'qa', name: 'فهم واستيعاب', ask: 'فَهْمٌ وَاسْتيعابٌ' }
  ];
  var cardsS = { filter: 'all', deck: [], i: 0, flipped: false };
  function enterCards() {
    $('#cards-filter').innerHTML = CTYPES.map(function (t) { return '<button class="chip' + (t.id === cardsS.filter ? ' on' : '') + '" data-filter="' + t.id + '">' + t.name + '</button>'; }).join('');
    buildDeck();
  }
  function buildDeck() {
    cardsS.deck = shuffle(DATA.cards.map(function (c, i) { return i; }).filter(function (i) { return cardsS.filter === 'all' || DATA.cards[i].type === cardsS.filter; }));
    cardsS.i = 0; showCard();
  }
  function showCard() {
    var card = $('#flip-card'), c = DATA.cards[cardsS.deck[cardsS.i]];
    cardsS.flipped = false; card.classList.remove('flipped');
    setTimeout(function () {
      $('#fc-type').textContent = CTYPES.filter(function (t) { return t.id === c.type; })[0].ask;
      $('#fc-front').textContent = c.front; $('#fc-back').textContent = c.back;
      $('#fc-front').classList.toggle('long', c.front.length > 34); $('#fc-back').classList.toggle('long', c.back.length > 34);
      $('#fc-src').textContent = 'كتاب لغتي ص ' + N(c.src);
      card.classList.toggle('known', !!state.cardsKnown[c.id]);
      card.classList.remove('deal'); void card.offsetWidth; card.classList.add('deal');
    }, 170);
    $('#card-know').disabled = true; $('#card-again').disabled = true;
    $('#cards-count').textContent = 'البطاقة ' + N(cardsS.i + 1) + ' من ' + N(cardsS.deck.length);
    $('#cards-known').textContent = '✔ بطاقات معروفة: ' + N(Object.keys(state.cardsKnown).length) + ' من ' + N(DATA.cards.length);
    current_q = { reveal: function () { if (!cardsS.flipped) flipCard(); }, skip: function () { nextCard(1); }, repeat: function () { showCard(); } };
  }
  function flipCard() { cardsS.flipped = !cardsS.flipped; $('#flip-card').classList.toggle('flipped', cardsS.flipped); Sound.flip(); if (cardsS.flipped) { $('#card-know').disabled = false; $('#card-again').disabled = false; } }
  function nextCard(d) { cardsS.i = (cardsS.i + (d || 1) + cardsS.deck.length) % cardsS.deck.length; Sound.click(); showCard(); }
  function cardKnow() {
    var c = DATA.cards[cardsS.deck[cardsS.i]];
    Sound.correct();
    if (award(c.id, 10, $('#card-know'))) Confetti.burst(40, innerWidth / 2, innerHeight / 2);
    state.cardsKnown[c.id] = 1; save();
    afterAnswer();
    if (Object.keys(state.cardsKnown).length >= 15 && !stationDoneBy('riyadh')) {
      setTimeout(function () { completeStation('riyadh'); }, 700);
    }
    setTimeout(function () { nextCard(1); }, 650);
  }
  function cardAgain() {
    Sound.soft(); toast('لا بأس! ستعود البطاقة إليك لاحقًا 🙂', 'soft');
    var idx = cardsS.deck.splice(cardsS.i, 1)[0]; cardsS.deck.push(idx); if (cardsS.i >= cardsS.deck.length) cardsS.i = 0;
    afterAnswer(); showCard();
  }
  function stationDoneBy(st) { return state.teams.slice(0, state.mode === 'solo' ? 1 : 2).every(function (t) { return t.stamps.indexOf(st) >= 0; }); }

  /* ================= أدوات الاختيار من متعدد ================= */
  function optsHTML(q) {
    return shuffle(q.options.map(function (o, i) { return i; })).map(function (oi, k) {
      return '<button class="opt" data-oi="' + oi + '"' + (oi === q.answer ? ' data-correct="1"' : '') + '><span class="ol">' + LETTERS[k] + '</span><span>' + esc(q.options[oi]) + '</span></button>';
    }).join('');
  }
  function lockOpts(box, chosen, correct) {
    $$('.opt', box).forEach(function (b) { var oi = +b.getAttribute('data-oi'); b.disabled = true; if (oi === correct) b.classList.add('correct'); else if (oi === chosen) b.classList.add('wrong'); });
  }
  function countdown(total, fill, num, end) {
    var start = Date.now(), last = total;
    var id = addT(setInterval(function () {
      var left = Math.max(0, total - (Date.now() - start) / 1000);
      if (fill) fill.style.transform = 'scaleX(' + (left / total) + ')';
      var s = Math.ceil(left);
      if (num && s !== last) { num.textContent = N(s); num.classList.toggle('warn', s <= 5); if (s <= 5 && s > 0) Sound.tick(); last = s; }
      if (left <= 0) { clearInterval(id); end(); }
    }, 100));
    return { left: function () { return Math.max(0, total - (Date.now() - start) / 1000); } };
  }
  function whoHTML() { return state.mode === 'teams' ? '<span>يجيب الآن: <b style="color:var(--t' + ti() + '-d)">' + esc(team().name) + '</b></span>' : '<span>' + esc(team().name) + '</span>'; }

  /* ================= ٢) تحدي المصايف ================= */
  var LV = { easy: 'سهل', medium: 'متوسط', hard: 'صعب', mixed: 'مختلط' }, LVP = { easy: 10, medium: 15, hard: 20 };
  var quizS = null;
  function quizStart() {
    var st = state.settings, cnt = { easy: 0, medium: 0, hard: 0 };
    DATA.quiz.forEach(function (q) { cnt[q.level]++; });
    $('#quiz-progress').innerHTML = '';
    var h = '<div class="q-start"><h3>⛰️ تحدي المصايف</h3><p>أسئلة من الوحدة: المصايف والمعالم والمفردات والفهم. لكل سؤال أربعة اختيارات وتلميح عند الحاجة.</p><div class="level-pick">';
    ['easy', 'medium', 'hard', 'mixed'].forEach(function (l) { h += '<button class="level-btn' + (st.level === l ? ' on' : '') + '" data-level="' + l + '">' + { easy: '🟢', medium: '🟠', hard: '🔴', mixed: '🌈' }[l] + ' ' + LV[l] + '<small>' + N(l === 'mixed' ? DATA.quiz.length : cnt[l]) + ' سؤالًا</small></button>'; });
    h += '</div><div class="opt-row"><label>عدد الأسئلة: <select id="q-count">' + [5, 8, 10, 12, 15, 20, 25, 30].map(function (n) { return '<option value="' + n + '"' + (n === st.qCount ? ' selected' : '') + '>' + N(n) + '</option>'; }).join('') + '</select></label>' +
      '<label><input type="checkbox" id="q-timer"' + (st.timerOn ? ' checked' : '') + '> المؤقت (' + N(st.qTime) + ' ثانية)</label></div>' +
      '<button class="btn-big btn-green" id="q-go">🚀 ابدأ التحدي</button></div>';
    $('#quiz-body').innerHTML = h;
    current_q = null;
  }
  function quizBegin() {
    var st = state.settings; st.qCount = +$('#q-count').value; st.timerOn = $('#q-timer').checked; save(); syncTeacher();
    var pool = DATA.quiz.filter(function (q) { return st.level === 'mixed' || q.level === st.level; });
    var list = shuffle(pool).slice(0, Math.min(st.qCount, pool.length));
    if (st.level === 'mixed') list.sort(function (a, b) { return ['easy', 'medium', 'hard'].indexOf(a.level) - ['easy', 'medium', 'hard'].indexOf(b.level); });
    quizS = { list: list, i: 0, ok: 0, answered: false, hint: false };
    quizShow();
  }
  function quizShow() {
    stopTimers();
    var q = quizS.list[quizS.i], st = state.settings; quizS.answered = false; quizS.hint = false;
    $('#quiz-progress').innerHTML = '<span class="pill">السؤال ' + N(quizS.i + 1) + ' من ' + N(quizS.list.length) + '</span><span class="pill">✔ ' + N(quizS.ok) + '</span>';
    $('#quiz-body').innerHTML = '<div class="q-card"><div class="q-meta"><span class="lvl lvl-' + q.level + '">' + LV[q.level] + ' • ' + N(LVP[q.level]) + ' نقطة</span>' + whoHTML() + (st.timerOn ? '<span class="timer-num" id="q-tn">' + N(st.qTime) + '</span>' : '') + '</div>' +
      '<div class="q-text">' + esc(q.q) + '</div>' + (st.timerOn ? '<div class="timer-bar"><div class="timer-fill" id="q-tf"></div></div>' : '') + '</div>' +
      '<div class="options" id="q-opts">' + optsHTML(q) + '</div>' +
      '<div class="q-tools"><button class="btn-small" id="q-hint">💡 تلميح</button><div id="q-hintbox"></div><button class="btn-small" id="q-skip">⏭ تخطي</button></div><div id="q-explain"></div>';
    if (st.timerOn) countdown(st.qTime, $('#q-tf'), $('#q-tn'), function () { quizAnswer(-1); });
    current_q = { reveal: function () { quizAnswer(-3); }, skip: function () { quizAnswer(-2); }, repeat: function () { quizShow(); } };
  }
  function quizHint() {
    if (quizS.answered || quizS.hint) return; quizS.hint = true;
    var q = quizS.list[quizS.i], w = shuffle($$('#q-opts .opt').filter(function (b) { return +b.getAttribute('data-oi') !== q.answer; }));
    w[0].classList.add('gone'); w[0].disabled = true;
    $('#q-hintbox').innerHTML = '<div class="hint-box">💡 ' + esc(q.hint || 'ارجع إلى النص.') + '</div>'; $('#q-hint').disabled = true; Sound.tick();
  }
  function quizAnswer(oi) {
    if (!quizS || quizS.answered) return; quizS.answered = true; stopTimers();
    var q = quizS.list[quizS.i], ok = oi === q.answer;
    lockOpts($('#q-opts'), oi, q.answer); $('#q-hint').disabled = true; $('#q-skip').disabled = true;
    if (ok) {
      quizS.ok++; Sound.correct();
      var b = $('#q-opts .opt.correct'), r = b.getBoundingClientRect();
      award(q.id, quizS.hint ? Math.round(LVP[q.level] / 2) : LVP[q.level], b);
      Confetti.burst(60, r.left + r.width / 2, r.top);
    } else if (oi !== -3) Sound.wrong();
    var title = ok ? '🎉 إجابة صحيحة! أحسنت' : oi === -1 ? '⏰ انتهى الوقت' : oi === -2 ? '⏭ تم التخطي، وهذه الإجابة الصحيحة' : oi === -3 ? '👁️ الإجابة الصحيحة' : '🙂 إجابة غير صحيحة، لنتعلم معًا';
    $('#q-explain').innerHTML = '<div class="explain' + (ok ? '' : ' bad') + '"><span class="ex-ico">' + (ok ? '✅' : '📘') + '</span><div class="ex-text"><b>' + title + '</b>' + esc(q.explain) + ' <span class="ex-src">(كتاب لغتي ص ' + N(q.src) + ')</span></div><button class="btn-big btn-blue" id="q-next">' + (quizS.i + 1 < quizS.list.length ? 'التالي ⬅' : 'النتيجة 🏁') + '</button></div>';
    afterAnswer();
  }
  function quizNext() {
    quizS.i++;
    if (quizS.i < quizS.list.length) { Sound.click(); quizShow(); return; }
    current_q = null; $('#quiz-progress').innerHTML = '';
    var n = quizS.list.length, c = quizS.ok, earned = n >= 10;
    Sound.fanfare(); Confetti.burst(140);
    $('#quiz-body').innerHTML = '<div class="q-end"><div class="big-ico">' + (c / n >= .7 ? '🏆' : '🌟') + '</div><h3>انتهى تحدي المصايف!</h3><p>الإجابات الصحيحة: ' + N(c) + ' من ' + N(n) + '</p>' +
      (earned ? '' : '<p>أجيبوا عن ١٠ أسئلة أو أكثر في جولة واحدة لتحصلوا على ختم «بطل المصايف»</p>') +
      '<div class="row-btns"><button class="btn-big btn-green" id="q-again">🔁 جولة جديدة</button><button class="btn-big btn-blue" data-back="1">🗺️ الخريطة</button></div></div>';
    if (earned) setTimeout(function () { completeStation('taif'); }, 900);
  }

  /* ================= ٣) وادي الكلمات — سحب وإفلات ================= */
  var KN = { match: 'مطابقة', classify: 'تصنيف', order: 'ترتيب' }, KC = { match: '#1e7fc2', classify: '#2a9d8f', order: '#7d4cc2' };
  var bag = { a: null, idx: -1, placed: 0, total: 0, miss: 0, sel: null };
  var BAGS_NEEDED = 6;
  function bagsList() {
    current_q = null;
    var done = Object.keys(state.bagsDone).length;
    var h = '<div class="act-head"><h3>🌿 اختر نشاطًا من وادي الكلمات</h3><span class="instr">أنجزتم ' + N(done) + ' من ' + N(DATA.dragdrop.length) + ' • الختم بعد إنجاز ' + N(BAGS_NEEDED) + ' أنشطة</span></div><div class="act-grid">';
    DATA.dragdrop.forEach(function (a, i) {
      h += '<button class="act-tag' + (state.bagsDone[a.id] ? ' done' : '') + '" data-act="' + i + '" style="--c:' + KC[a.kind] + '"><span class="at-num">' + N(i + 1) + '</span><span class="at-kind">' + KN[a.kind] + ' • ص ' + N(a.src) + '</span><span class="at-title">' + esc(a.title) + '</span></button>';
    });
    $('#bags-body').innerHTML = h + '</div>';
  }
  function bagOpen(i) {
    var a = DATA.dragdrop[i];
    bag = { a: a, idx: i, placed: 0, total: a.items.length, miss: 0, sel: null };
    var h = '<div class="act-head"><div><h3>' + esc(a.title) + '</h3><span class="instr">👆 ' + esc(a.instr) + ' — اسحب البطاقة، أو المسها ثم المس مكانها</span></div><span class="pill" id="bag-prog">٠ / ' + N(a.items.length) + '</span></div><div class="act-zone">';
    var items;
    if (a.kind === 'match') {
      h += '<div class="targets">' + shuffle(a.items.map(function (p, k) { return k; })).map(function (k) { return '<div class="tgt" data-drop="1" data-ans="' + esc(a.items[k][0]) + '"><span class="tgt-text">' + esc(a.items[k][1]) + '</span><span class="slot">أفلت هنا</span></div>'; }).join('') + '</div>';
      items = a.items.map(function (p) { return p[0]; });
    } else if (a.kind === 'classify') {
      h += '<div class="bins">' + a.bins.map(function (b, k) { return '<div class="bin" data-drop="1" data-bin="' + k + '"><div class="bin-title">' + esc(b) + '</div><div class="bin-items"></div></div>'; }).join('') + '</div>';
      items = a.items.map(function (p) { return p[0]; });
    } else {
      h += '<div class="order-slots' + (a.sentence ? '' : ' list') + '">' + a.items.map(function (t, k) { return '<div class="oslot" data-drop="1" data-pos="' + k + '"><span class="on">' + N(k + 1) + '</span><span class="ot"></span></div>'; }).join('') + '</div>';
      items = a.items.slice();
    }
    h += '</div><div class="tray"><span class="tray-label">بطاقات الكلمات</span><div class="tray-items" id="tray">' +
      shuffle(items.map(function (t, k) { return k; })).map(function (k) {
        var ex = a.kind === 'classify' ? ' data-bin="' + a.items[k][1] + '"' : '';
        return '<div class="ditem" data-text="' + esc(items[k]) + '"' + ex + ' tabindex="0" role="button">' + esc(items[k]) + '</div>';
      }).join('') + '</div></div>';
    $('#bags-body').innerHTML = h; Sound.click();
    current_q = { reveal: bagReveal, skip: function () { bagOpen((bag.idx + 1) % DATA.dragdrop.length); }, repeat: function () { bagOpen(bag.idx); } };
  }
  function bagCheck(it, tg) {
    var a = bag.a, txt = it.getAttribute('data-text');
    if (tg.classList.contains('filled')) return false;
    if (a.kind === 'match') return tg.getAttribute('data-ans') === txt;
    if (a.kind === 'classify') return tg.getAttribute('data-bin') === it.getAttribute('data-bin');
    return a.items[+tg.getAttribute('data-pos')] === txt;
  }
  function place(it, tg) {
    it.classList.add('placed'); it.removeAttribute('tabindex');
    if (bag.a.kind === 'classify') { var c = document.createElement('span'); c.className = 'chipd'; c.textContent = it.textContent; tg.querySelector('.bin-items').appendChild(c); it.remove(); }
    else { var s = tg.querySelector(bag.a.kind === 'match' ? '.slot' : '.ot'); s.textContent = ''; s.appendChild(it); tg.classList.add('filled'); }
    bag.placed++; $('#bag-prog').textContent = N(bag.placed) + ' / ' + N(bag.total);
  }
  function bagDrop(it, tg) {
    clearSel(); if (!tg || !it) return;
    if (bagCheck(it, tg)) { Sound.correct(); place(it, tg); if (bag.placed >= bag.total) setTimeout(bagFinish, 450); }
    else {
      bag.miss++; Sound.wrong(); it.classList.remove('back'); void it.offsetWidth; it.classList.add('back');
      toast(['حاول مرة أخرى 🙂 أنت قريب!', 'فكّر قليلًا وجرّب مكانًا آخر 💭', 'لا بأس، الخطأ طريق التعلم 🌱'][bag.miss % 3], 'soft');
    }
  }
  function bagReveal() {
    if (!bag.a) return;
    $$('#tray .ditem:not(.placed)').forEach(function (it) {
      var tg = $$('[data-drop]', $('#bags-body')).filter(function (t) { return bagCheck(it, t); })[0];
      if (tg) place(it, tg);
    });
    bag.revealed = true;
    toast('👁️ عُرضت الإجابة الصحيحة (دون نقاط)', 'soft');
    setTimeout(function () { bagFinish(true); }, 600);
  }
  function bagFinish(revealed) {
    var a = bag.a, pts = bag.miss <= 2 ? 20 : 10;
    Sound.fanfare(); Confetti.burst(100);
    var zone = $('.act-zone');
    zone.innerHTML = '<div class="act-done"><div class="big-ico">🌿</div><h3>' + (revealed ? 'هذه هي الإجابة الصحيحة' : 'أحسنت! أنجزت نشاط وادي الكلمات') + '</h3><p class="instr">الأخطاء: ' + N(bag.miss) + (revealed ? '' : ' • النقاط: +' + N(pts)) + '</p>' +
      '<div class="row-btns"><button class="btn-big btn-green" id="bag-next">النشاط التالي ⬅</button><button class="btn-big btn-amber" id="bag-list">🗂️ قائمة الأنشطة</button></div></div>';
    $('.tray').style.display = 'none';
    if (!revealed) { award(a.id, pts, zone); state.bagsDone[a.id] = 1; save(); }
    afterAnswer(); current_q = null;
    if (Object.keys(state.bagsDone).length >= BAGS_NEEDED && !stationDoneBy('asir')) setTimeout(function () { completeStation('asir'); }, 900);
  }
  function clearSel() { if (bag.sel) bag.sel.classList.remove('selected'); bag.sel = null; $$('.pickable').forEach(function (t) { t.classList.remove('pickable'); }); }
  function selectItem(it) {
    if (bag.sel === it) { clearSel(); return; }
    clearSel(); bag.sel = it; it.classList.add('selected');
    $$('[data-drop]', $('#bags-body')).forEach(function (t) { if (!t.classList.contains('filled')) { t.classList.add('pickable'); t.tabIndex = 0; } });
    Sound.click();
  }
  /* سحب بالمؤشر: يعمل بالفأرة واللمس والقلم (iPad والسبورة الذكية) */
  var drag = null;
  function pDown(e) {
    var it = e.target.closest('.ditem'); if (!it || it.classList.contains('placed') || current !== 'asir') return;
    e.preventDefault(); Sound.init();
    drag = { it: it, x: e.clientX, y: e.clientY, g: null, over: null, id: e.pointerId };
    try { it.setPointerCapture(e.pointerId); } catch (er) { }
  }
  function pMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.g && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 8) {
      var r = drag.it.getBoundingClientRect(), g = drag.it.cloneNode(true);
      g.classList.add('drag-ghost'); g.classList.remove('selected'); g.style.width = r.width + 'px'; document.body.appendChild(g);
      drag.g = g; drag.ox = drag.x - r.left; drag.oy = drag.y - r.top; drag.it.classList.add('src-drag'); clearSel();
    }
    if (drag.g) {
      e.preventDefault();
      drag.g.style.left = (e.clientX - drag.ox) + 'px'; drag.g.style.top = (e.clientY - drag.oy) + 'px';
      var el = document.elementFromPoint(e.clientX, e.clientY), t = el && el.closest('[data-drop]');
      if (t !== drag.over) { if (drag.over) drag.over.classList.remove('hover'); if (t) t.classList.add('hover'); drag.over = t; }
    }
  }
  function pUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    if (d.g) { d.g.remove(); d.it.classList.remove('src-drag'); if (d.over) { d.over.classList.remove('hover'); bagDrop(d.it, d.over); } }
    else selectItem(d.it);
  }
  function pCancel() { if (!drag) return; if (drag.g) drag.g.remove(); drag.it.classList.remove('src-drag'); if (drag.over) drag.over.classList.remove('hover'); drag = null; }

  /* ================= ٤) السباق الذهبي ================= */
  var race = null, raceUsed = [];
  function raceStart() {
    var st = state.settings; $('#race-stats').innerHTML = ''; setRunner(0, 1);
    $('#race-body').innerHTML = '<div class="q-start"><h3>🏁 السباق الذهبي</h3><p>أسئلة سريعة: صح أو خطأ، واختيار من متعدد. كل إجابة صحيحة تُقدّم المستكشف نحو خط النهاية، والإجابة الأسرع تمنح نقاطًا إضافية!</p>' +
      '<div class="opt-row"><label>زمن السؤال: <select id="r-time">' + [5, 8, 10, 15, 20, 25, 30].map(function (n) { return '<option value="' + n + '"' + (n === st.rTime ? ' selected' : '') + '>' + N(n) + ' ثانية</option>'; }).join('') + '</select></label>' +
      '<label>عدد الأسئلة: <select id="r-count">' + [5, 10, 15, 20, 25].map(function (n) { return '<option value="' + n + '"' + (n === st.rCount ? ' selected' : '') + '>' + N(n) + '</option>'; }).join('') + '</select></label></div>' +
      '<button class="btn-big btn-blue" id="r-go">🚀 انطلق!</button></div>';
    current_q = null;
  }
  function setRunner(done, total) {
    var pct = total ? done / total : 0, tr = $('#race-track');
    $('#race-runner').style.right = 'calc(' + (pct * 100) + '% - ' + (pct * 80) + 'px)';
    $('#race-fill').style.width = (pct * 100) + '%';
    if (!$('#race-runner').innerHTML) $('#race-runner').innerHTML = avatarSVG(ti());
    tr.setAttribute('aria-label', 'التقدم ' + Math.round(pct * 100) + '%');
  }
  function raceBegin() {
    var st = state.settings; st.rTime = +$('#r-time').value; st.rCount = +$('#r-count').value; save(); syncTeacher();
    var all = DATA.speed.map(function (q, i) { return i; }), unused = all.filter(function (i) { return raceUsed.indexOf(i) < 0; });
    if (unused.length < st.rCount) { raceUsed = []; unused = all; }
    var list = shuffle(unused).slice(0, Math.min(st.rCount, unused.length)); raceUsed = raceUsed.concat(list);
    race = { list: list, i: 0, ok: 0, bad: 0, streak: 0, ans: false, cd: null };
    $('#race-runner').innerHTML = avatarSVG(ti());
    setRunner(0, list.length); Sound.whoosh(); raceShow();
  }
  function raceStats() { $('#race-stats').innerHTML = '<span class="pill">' + N(race.i + 1) + ' / ' + N(race.list.length) + '</span><span class="pill">✔ ' + N(race.ok) + '</span><span class="pill">✘ ' + N(race.bad) + '</span><span class="pill">🔥 ' + N(race.streak) + '</span>'; }
  function raceShow() {
    stopTimers();
    var q = DATA.speed[race.list[race.i]], t = state.settings.rTime; race.ans = false; raceStats();
    var h = '<div class="q-card"><div class="q-meta"><span class="lvl ' + (q.tf ? 'lvl-tf' : 'lvl-medium') + '">' + (q.tf ? 'صح أم خطأ؟' : 'اختر الإجابة') + '</span>' + whoHTML() + '<span class="timer-num" id="r-tn">' + N(t) + '</span></div><div class="q-text">' + esc(q.q) + '</div><div class="timer-bar"><div class="timer-fill" id="r-tf"></div></div></div>';
    h += q.tf ? '<div class="tf-row" id="r-opts"><button class="tf-btn tf-true" data-tf="1"' + (q.answer ? ' data-correct="1"' : '') + '>✔ صح</button><button class="tf-btn tf-false" data-tf="0"' + (!q.answer ? ' data-correct="1"' : '') + '>✘ خطأ</button></div>' : '<div class="options" id="r-opts">' + optsHTML(q) + '</div>';
    $('#race-body').innerHTML = h;
    race.cd = countdown(t, $('#r-tf'), $('#r-tn'), function () { raceAnswer(null); });
    current_q = { reveal: function () { raceAnswer('reveal'); }, skip: function () { raceAnswer(null, true); }, repeat: function () { raceShow(); } };
  }
  function raceAnswer(v, skipped) {
    if (!race || race.ans) return; race.ans = true;
    var left = race.cd ? race.cd.left() : 0; stopTimers();
    var q = DATA.speed[race.list[race.i]], ok;
    if (q.tf) {
      ok = v !== null && v !== 'reveal' && (v === 1) === q.answer;
      $$('#r-opts .tf-btn').forEach(function (b) { b.disabled = true; var isT = b.getAttribute('data-tf') === '1'; if (isT === q.answer) b.classList.add('correct'); else if (v !== null && v !== 'reveal' && +b.getAttribute('data-tf') === v) b.classList.add('wrong'); });
    } else { ok = v === q.answer; lockOpts($('#r-opts'), typeof v === 'number' ? v : -1, q.answer); }
    if (ok) {
      race.ok++; race.streak++;
      var bonus = Math.round(10 * left / state.settings.rTime); Sound.correct();
      award(q.id, 10 + bonus, $('#r-opts .correct'));
      var p = document.createElement('div'); p.className = 'bonus-pop'; p.textContent = bonus > 0 ? '⚡ +' + N(bonus) + ' سرعة!' : '✔'; $('#race-body').appendChild(p);
      var rn = $('#race-runner'); rn.classList.remove('run'); void rn.offsetWidth; rn.classList.add('run');
      setRunner(race.ok, race.list.length);
      if (race.streak >= 3) Confetti.burst(40, innerWidth / 2, innerHeight / 3);
    } else {
      race.bad++; race.streak = 0;
      if (v !== 'reveal') { Sound.wrong(); if (v === null && !skipped) toast('⏰ انتهى الوقت!', 'soft', 1200); }
    }
    raceStats(); afterAnswer();
    addT(setTimeout(raceNext, ok ? 1500 : 2300));
  }
  function raceNext() {
    race.i++;
    if (race.i < race.list.length) { raceShow(); return; }
    current_q = null; $('#race-stats').innerHTML = '';
    var earned = race.list.length >= 10;
    Sound.fanfare(); Confetti.burst(140);
    $('#race-body').innerHTML = '<div class="q-end"><div class="big-ico">🏁</div><h3>وصل المستكشف إلى خط النهاية!</h3><p>✔ ' + N(race.ok) + ' صحيحة • ✘ ' + N(race.bad) + '</p>' +
      (earned ? '' : '<p>العبوا ١٠ أسئلة أو أكثر في سباق واحد لتحصلوا على ختم «بطل السرعة»</p>') +
      '<div class="row-btns"><button class="btn-big btn-blue" id="r-again">🔁 سباق جديد</button><button class="btn-big btn-green" data-back="1">🗺️ الخريطة</button></div></div>';
    if (earned) setTimeout(function () { completeStation('jazan'); }, 900);
  }

  /* ================= ٥) كنز ربوع بلادي — العجلة ================= */
  var SEG = [
    { key: 'golden', label: 'سؤال ذهبي', icon: '🏆', color: '#d39a00', pts: 30, desc: 'أصعب سؤال' },
    { key: 'vocab', label: 'تحدي المفردات', icon: '📚', color: '#1f8a4c', pts: 15, desc: 'معنى أو مفرد' },
    { key: 'complete', label: 'أكمل الجملة', icon: '✍️', color: '#1e7fc2', pts: 15, desc: 'اختر الكلمة المناسبة' },
    { key: 'order', label: 'رتب الكلمات', icon: '🧩', color: '#7d4cc2', pts: 20, desc: 'كوّن جملة' },
    { key: 'surprise', label: 'سؤال مفاجئ', icon: '🎁', color: '#e76f51', pts: 10, desc: 'سؤال عن الوحدة' },
    { key: 'double', label: 'ضاعف النقاط', icon: '💫', color: '#d9558a', pts: 0, desc: 'الإجابة القادمة ×٢' }
  ];
  var wheelS = { rot: 0, spinning: false, left: 8, dbl: [false, false], ptr: { golden: 0, vocab: 0, complete: 0, order: 0, surprise: 0 }, built: false, done: false };
  function buildWheel() {
    var n = SEG.length, R = 190, h = '<svg viewBox="-200 -200 400 400" xmlns="http://www.w3.org/2000/svg"><circle r="198" fill="#fff"/>';
    for (var i = 0; i < n; i++) {
      var a0 = (i * 360 / n - 90) * Math.PI / 180, a1 = ((i + 1) * 360 / n - 90) * Math.PI / 180;
      h += '<path d="M0 0 L' + R * Math.cos(a0) + ' ' + R * Math.sin(a0) + ' A' + R + ' ' + R + ' 0 0 1 ' + R * Math.cos(a1) + ' ' + R * Math.sin(a1) + ' Z" fill="' + SEG[i].color + '" stroke="#fff" stroke-width="4"/>';
      var mid = i * 360 / n + 180 / n, flip = mid > 90 && mid < 270 ? ' rotate(180)' : '', w = SEG[i].label.split(' ');
      h += '<g transform="rotate(' + mid + ')"><g transform="translate(0 -142)' + flip + '"><text y="12" text-anchor="middle" font-size="34">' + SEG[i].icon + '</text></g>' +
        '<g transform="translate(0 -88)' + flip + '"><text text-anchor="middle" font-size="19" font-weight="800" fill="#fff" font-family="Baloo Bhaijaan 2, Cairo, sans-serif" direction="rtl"><tspan x="0" y="-4">' + w[0] + '</tspan><tspan x="0" y="18">' + w.slice(1).join(' ') + '</tspan></text></g></g>';
    }
    for (var k = 0; k < 24; k++) { var an = k * 15 * Math.PI / 180; h += '<circle cx="' + 194 * Math.cos(an) + '" cy="' + 194 * Math.sin(an) + '" r="5" fill="' + (k % 2 ? '#f5c430' : '#fff') + '" stroke="#b47a00" stroke-width="1.5"/>'; }
    $('#wheel-rot').innerHTML = h + '<circle r="196" fill="none" stroke="#b47a00" stroke-width="6"/></svg>';
    $('#wheel-legend').innerHTML = SEG.map(function (s) { return '<div class="wl" style="--c:' + s.color + '"><b>' + s.icon + '</b><div>' + s.label + '<small>' + s.desc + (s.pts ? ' • ' + N(s.pts) + ' نقطة' : '') + '</small></div></div>'; }).join('');
    $('#chest-box').innerHTML = ART.chest();
    wheelS.built = true;
  }
  function enterWheel() {
    if (!wheelS.built) buildWheel();
    if (wheelS.left <= 0 || wheelS.done) { wheelS.left = state.settings.spins; wheelS.done = false; $('#chest-box .chest').classList.remove('open'); }
    wheelStatus(); current_q = null;
  }
  function wheelStatus() {
    var d = wheelS.dbl[ti()];
    $('#wheel-status').innerHTML = '<span class="pill">🎡 الدورات المتبقية: ' + N(wheelS.left) + '</span>' + (d ? '<span class="dbl-flag">💫 نقاط مضاعفة لـ«' + esc(team().name) + '»</span>' : '');
    var dis = wheelS.left <= 0 || wheelS.spinning; $('#wheel-spin').disabled = dis; $('#wheel-spin2').disabled = dis;
  }
  function spin() {
    if (wheelS.spinning || wheelS.left <= 0) return;
    Sound.init(); wheelS.spinning = true; wheelS.left--; wheelStatus();
    var idx = Math.floor(Math.random() * SEG.length), seg = 360 / SEG.length;
    var target = (360 - (idx * seg + seg / 2)) % 360, cur = ((wheelS.rot % 360) + 360) % 360;
    wheelS.rot += 360 * 5 + ((target - cur + 360) % 360);
    $('#wheel-rot').style.transform = 'rotate(' + wheelS.rot + 'deg)';
    var t = 0, gap = 50; while (t < 4700) { addT(setTimeout(function () { Sound.tick(); }, t)); t += gap; gap *= 1.07; }
    addT(setTimeout(function () { wheelS.spinning = false; wheelStatus(); Sound.star(); challenge(SEG[idx]); }, 5150));
  }
  function nextFrom(key) { var arr = DATA.wheel[key], i = wheelS.ptr[key] % arr.length; wheelS.ptr[key]++; return arr[i]; }
  function openModal(h, cls) { var b = $('#modal-box'); b.className = 'modal-box ' + (cls || ''); b.innerHTML = h; $('#modal').classList.add('show'); }
  function closeModal(id) { var m = $('#' + id); if (m) m.classList.remove('show'); }
  function challenge(seg) {
    var i = ti(), t = team();
    if (seg.key === 'double') {
      wheelS.dbl[i] = true; wheelStatus();
      openModal('<div class="mb-head"><span class="mb-ico">💫</span><div><h3>ضاعف النقاط!</h3><p>الإجابة الصحيحة القادمة لـ«' + esc(t.name) + '» بنقاط مضاعفة. أدر العجلة مرة أخرى!</p></div></div><div class="row-btns"><button class="btn-big btn-gold" id="w-cont">🎡 أكمل</button></div>', 'golden');
      $('#w-cont').addEventListener('click', function () { closeModal('modal'); wheelEnd(); });
      Confetti.burst(50); return;
    }
    if (seg.key === 'order') { orderChallenge(seg); return; }
    var q = nextFrom(seg.key);
    openModal('<div class="mb-head"><span class="mb-ico">' + seg.icon + '</span><div><h3>' + seg.label + '</h3><p>' + esc(t.name) + ' • ' + N(seg.pts) + ' نقطة' + (wheelS.dbl[i] ? ' × ٢' : '') + '</p></div></div><div class="q-text">' + esc(q.q) + '</div><div class="options" id="w-opts" style="margin-top:10px">' + optsHTML(q) + '</div><div id="w-res"></div>', seg.key === 'golden' ? 'golden' : '');
    var box = $('#w-opts');
    function answer(oi) { lockOpts(box, oi, q.answer); wheelResult(oi === q.answer, seg, i, q, oi === -3); }
    box.addEventListener('click', function (e) { var b = e.target.closest('.opt'); if (b && !b.disabled) answer(+b.getAttribute('data-oi')); });
    current_q = { reveal: function () { if (!box.querySelector('.correct')) answer(-3); }, skip: function () { if (!box.querySelector('.correct')) answer(-2); }, repeat: function () { closeModal('modal'); wheelS.ptr[seg.key]--; challenge(seg); } };
  }
  function wheelResult(ok, seg, i, q, revealed) {
    var pts = seg.pts * (wheelS.dbl[i] ? 2 : 1);
    if (ok) { Sound.correct(); Confetti.burst(90); if (award(q.id, pts, $('#modal-box'), i)) wheelS.dbl[i] = false; }
    else if (!revealed) Sound.wrong();
    $('#w-res').innerHTML = '<div class="explain' + (ok ? '' : ' bad') + '" style="margin-top:12px"><span class="ex-ico">' + (ok ? '🌟' : '📘') + '</span><div class="ex-text"><b>' + (ok ? 'إجابة صحيحة!' : revealed ? 'هذه الإجابة الصحيحة' : 'إجابة غير صحيحة، والصحيحة مظللة بالأخضر') + '</b><span class="ex-src">كتاب لغتي ص ' + N(q.src) + '</span></div><button class="btn-big btn-blue" id="w-cont">متابعة ⬅</button></div>';
    $('#w-cont').addEventListener('click', function () { closeModal('modal'); afterAnswer(); wheelStatus(); wheelEnd(); });
    current_q = null;
  }
  function orderChallenge(seg) {
    var i = ti(), t = team(), item = nextFrom('order'), words = item.words, built = [];
    openModal('<div class="mb-head"><span class="mb-ico">🧩</span><div><h3>رتب الكلمات</h3><p>' + esc(t.name) + ' • المس الكلمات بالترتيب الصحيح • ' + N(seg.pts) + ' نقطة' + (wheelS.dbl[i] ? ' × ٢' : '') + '</p></div></div><div class="build-row" id="w-build"></div><div class="build-pool" id="w-pool">' +
      shuffle(words.map(function (w, k) { return k; })).map(function (k) { return '<button class="wbtn" data-wi="' + k + '">' + esc(words[k]) + '</button>'; }).join('') +
      '</div><div class="row-btns" style="margin-top:10px"><button class="btn-small" id="w-reset">↺ إعادة</button><button class="btn-big btn-green" id="w-check" disabled>✔ تحقق</button></div><div id="w-res"></div>');
    function redraw() {
      $('#w-build').innerHTML = built.map(function (k, j) { return '<button class="wbtn in" data-bi="' + j + '">' + esc(words[k]) + '</button>'; }).join('');
      $$('#w-pool .wbtn').forEach(function (b) { b.classList.toggle('used', built.indexOf(+b.getAttribute('data-wi')) >= 0); });
      $('#w-check').disabled = built.length !== words.length;
    }
    function check(rev) {
      var ok = !rev && built.map(function (k) { return words[k]; }).join(' ') === words.join(' ');
      $('#w-check').hidden = true; $('#w-reset').hidden = true; $$('#w-pool .wbtn').forEach(function (b) { b.disabled = true; });
      if (!ok) $('#w-build').insertAdjacentHTML('afterend', '<div class="hint-box">الجملة الصحيحة: ' + esc(words.join(' ')) + '</div>');
      wheelResult(ok, seg, i, item, rev);
    }
    $('#w-pool').addEventListener('click', function (e) { var b = e.target.closest('.wbtn'); if (!b || b.classList.contains('used') || b.disabled) return; built.push(+b.getAttribute('data-wi')); Sound.click(); redraw(); });
    $('#w-build').addEventListener('click', function (e) { var b = e.target.closest('.wbtn'); if (!b || $('#w-check').hidden) return; built.splice(+b.getAttribute('data-bi'), 1); redraw(); });
    $('#w-reset').addEventListener('click', function () { built = []; redraw(); });
    $('#w-check').addEventListener('click', function () { check(false); });
    current_q = { reveal: function () { if (!$('#w-check').hidden) check(true); }, skip: function () { if (!$('#w-check').hidden) check(true); }, repeat: function () { closeModal('modal'); wheelS.ptr.order--; orderChallenge(seg); } };
  }
  function wheelEnd() {
    if (wheelS.left > 0 || wheelS.done) return;
    wheelS.done = true;
    var ch = $('#chest-box .chest'); ch.classList.add('open'); Sound.chest(); Confetti.burst(160);
    toast('💰 فُتح صندوق الكنز! حصلتم على وسام «مستكشف ربوع بلادي»', 'good', 3500);
    setTimeout(function () { completeStation('najran'); }, 1600);
  }

  /* ================= شاشة الفوز ================= */
  function showWin() {
    closeModal('modal'); closeModal('passport'); closeModal('teacher');
    show('win');
    $('#win-chest').innerHTML = ART.chest();
    setTimeout(function () { $('#win-chest .chest').classList.add('open'); Sound.chest(); }, 400);
    var t = state.teams, html = '', title, sub;
    if (state.mode === 'solo') { title = '🏆 مستكشف ربوع بلادي'; sub = 'أحسنت يا «' + t[0].name + '»! جمعت أختام المحطات الخمس'; html = pod(0, true); }
    else {
      var w = t[0].score === t[1].score ? -1 : t[0].score > t[1].score ? 0 : 1;
      title = '🏆 مستكشف ربوع بلادي'; sub = w < 0 ? 'تعادل رائع! كلا الفريقين بطل' : 'الفريق الفائز: «' + t[w].name + '»';
      html = pod(0, w !== 1) + pod(1, w !== 0);
    }
    $('#win-title').textContent = title; $('#win-sub').textContent = sub; $('#podium').innerHTML = html;
    Sound.fanfare(); Confetti.burst(220); setTimeout(function () { Confetti.burst(160); }, 1300);
  }
  function pod(i, win) {
    var t = state.teams[i];
    return '<div class="pod t' + i + (win ? ' winner' : '') + '"><h3>' + esc(t.name) + '</h3><div class="pts">' + N(t.score) + '</div><div class="sm">نقطة • ⭐ ' + N(stars(t.score)) + ' نجمة • 🛂 ' + N(t.stamps.length) + ' أختام</div></div>';
  }

  /* ================= لوحة المعلم ================= */
  function fill(sel, vals, cur, suf) { sel.innerHTML = vals.map(function (v) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + N(v) + (suf || '') + '</option>'; }).join(''); }
  function syncTeacher() {
    var s = state.settings;
    fill($('#tp-qcount'), [5, 8, 10, 12, 15, 20, 25, 30], s.qCount); fill($('#tp-rcount'), [5, 10, 15, 20, 25], s.rCount);
    fill($('#tp-spins'), [4, 6, 8, 10, 12], s.spins); fill($('#tp-qtime'), [10, 15, 20, 30, 45, 60], s.qTime, ' ث'); fill($('#tp-rtime'), [5, 8, 10, 15, 20, 25, 30], s.rTime, ' ث');
    $('#tp-level').value = s.level; $('#tp-timer').checked = s.timerOn; $('#tp-autoswitch').checked = s.autoSwitch; $('#tp-hintstar').checked = s.hintStar;
    $('#tp-sound').checked = s.sound; $('#tp-volume').value = s.volume;
    document.body.classList.toggle('hint-star', s.hintStar);
    $('#btn-sound').textContent = s.sound ? '🔊' : '🔇';
    $('#tp-storage-note').textContent = storageOK ? '💾 يُحفظ التقدم تلقائيًا في هذا المتصفح.' : '⚠️ المتصفح يمنع الحفظ المحلي؛ ستعمل اللعبة بشكل طبيعي لكن لن يُحفظ التقدم بعد إغلاق الصفحة.';
    $('#tp-go').innerHTML = '<button data-tgo="map" style="background:#12663a">🗺️ الخريطة</button>' + STATIONS.map(function (s2) { return '<button data-tgo="' + s2.id + '" style="background:' + s2.color + '">' + s2.icon + ' ' + s2.city + '</button>'; }).join('');
    renderTeacherTeams();
  }
  function renderTeacherTeams() {
    var box = $('#tp-teams'); if (!box) return;
    if (box.contains(document.activeElement)) { $$('.sc', box).forEach(function (s, i) { s.textContent = N(state.teams[i].score); }); return; }
    box.innerHTML = [0, 1].map(function (i) {
      var t = state.teams[i];
      return '<div class="tp-team t' + i + '"><label>' + (i ? 'الفريق الثاني' : state.mode === 'solo' ? 'اسم اللاعب' : 'الفريق الأول') + ' <input type="text" data-tname="' + i + '" value="' + esc(t.name) + '" maxlength="24"></label>' +
        '<div class="tp-score-row"><button data-adj="' + i + '" data-v="-10">−١٠</button><button data-adj="' + i + '" data-v="-1">−١</button><span class="sc">' + N(t.score) + '</span><button data-adj="' + i + '" data-v="1">+١</button><button data-adj="' + i + '" data-v="10">+١٠</button>' +
        (state.mode === 'teams' ? '<button data-turn="' + i + '" style="padding:0 10px">👉 دوره</button>' : '') + '</div></div>';
    }).join('');
  }
  function answerKey() {
    var h = '<div class="mb-head"><span class="mb-ico">📖</span><div><h3>مفتاح الإجابات</h3><p>للمعلم • من الوحدة الثانية «ربوع من بلادي»</p></div><button class="x-btn" data-close="modal" style="margin-inline-start:auto">✕</button></div><div class="key-list">';
    h += '<h4>⛰️ تحدي المصايف</h4><ol>' + DATA.quiz.map(function (q) { return '<li>' + esc(q.q) + ' ← <b>' + esc(q.options[q.answer]) + '</b> <span class="src">(' + LV[q.level] + ' • ص ' + N(q.src) + ')</span></li>'; }).join('') + '</ol>';
    h += '<h4>🏁 السباق الذهبي</h4><ol>' + DATA.speed.map(function (q) { return '<li>' + esc(q.q) + ' ← <b>' + (q.tf ? (q.answer ? 'صح' : 'خطأ') : esc(q.options[q.answer])) + '</b> <span class="src">(ص ' + N(q.src) + ')</span></li>'; }).join('') + '</ol>';
    h += '<h4>🌿 وادي الكلمات</h4><ol>' + DATA.dragdrop.map(function (a) {
      var s = a.kind === 'match' ? a.items.map(function (p) { return p[0] + ' ← ' + p[1]; }).join(' | ') : a.kind === 'classify' ? a.bins.map(function (b, k) { return b + ': ' + a.items.filter(function (p) { return p[1] === k; }).map(function (p) { return p[0]; }).join('، '); }).join(' | ') : a.items.map(function (t, k) { return N(k + 1) + ') ' + t; }).join(' ');
      return '<li><b>' + esc(a.title) + ':</b> ' + esc(s) + '</li>';
    }).join('') + '</ol>';
    h += '<h4>💰 عجلة الكنز</h4><ol>' + ['golden', 'vocab', 'complete', 'surprise'].map(function (k) { return DATA.wheel[k].map(function (q) { return '<li>' + esc(q.q) + ' ← <b>' + esc(q.options[q.answer]) + '</b></li>'; }).join(''); }).join('') + DATA.wheel.order.map(function (o) { return '<li>رتب: <b>' + esc(o.words.join(' ')) + '</b></li>'; }).join('') + '</ol>';
    h += '<h4>🏰 بطاقات الرياض</h4><ol>' + DATA.cards.map(function (c) { return '<li>' + esc(c.front) + ' ← <b>' + esc(c.back) + '</b></li>'; }).join('') + '</ol></div>';
    openModal(h);
  }
  function askConfirm(title, msg, yes, fn) {
    openModal('<div class="mb-head"><span class="mb-ico">❓</span><div><h3>' + esc(title) + '</h3><p>' + esc(msg) + '</p></div></div><div class="row-btns"><button class="btn-big btn-amber" id="cf-yes">' + yes + '</button><button class="btn-big btn-blue" data-close="modal">✕ إلغاء</button></div>');
    $('#cf-yes').addEventListener('click', function () { closeModal('modal'); fn(); });
  }
  function resetScores() { state.teams.forEach(function (t) { t.score = 0; t.got = {}; }); state.stGain = {}; save(); renderScore(); }
  function resetAll() {
    var keep = { names: [state.teams[0].name, state.teams[1].name], settings: clone(state.settings), mode: state.mode, avatar: state.avatar };
    state = clone(DEFAULT); state.settings = keep.settings; state.mode = keep.mode; state.avatar = keep.avatar; state.started = true;
    state.teams[0].name = keep.names[0]; state.teams[1].name = keep.names[1];
    wheelS.left = state.settings.spins; wheelS.done = false; wheelS.dbl = [false, false]; raceUsed = [];
    if (wheelS.built) $('#chest-box .chest').classList.remove('open');
    save(); renderScore(); renderMapState(); syncTeacher();
  }
  function fullscreen() {
    var d = document, el = d.documentElement;
    try {
      if (!(d.fullscreenElement || d.webkitFullscreenElement)) {
        var fn = el.requestFullscreen || el.webkitRequestFullscreen;
        if (fn) { var r = fn.call(el); if (r && r.catch) r.catch(function () { toast('ملء الشاشة غير متاح هنا. على iPad: أضف اللعبة إلى الشاشة الرئيسية', 'soft', 3500); }); }
        else toast('على iPad: أضف اللعبة إلى الشاشة الرئيسية لتفتح بملء الشاشة', 'soft', 3500);
      } else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } catch (e) { toast('اضغط F11 لملء الشاشة', 'soft'); }
  }

  /* ================= الإعداد ================= */
  function renderSetup() {
    $('#av-boy').innerHTML = ART.explorer('boy'); $('#av-girl').innerHTML = ART.explorer('girl');
    $$('.avatar-btn').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-av') === state.avatar); });
    $$('.mode-btn').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-mode') === state.mode); });
    $('#name-0').value = state.teams[0].name; $('#name-1').value = state.teams[1].name;
    $('#lbl-name-0').textContent = state.mode === 'solo' ? 'اسم المستكشف' : 'اسم الفريق الأول';
    $('#app').classList.toggle('solo', state.mode === 'solo');
  }

  /* ================= السحب في الخلفية ================= */
  function clouds() {
    $$('.clouds').forEach(function (box) {
      var h = '';
      for (var i = 0; i < 6; i++) { var w = 110 + Math.random() * 150, d = 40 + Math.random() * 40; h += '<span class="cloud" style="top:' + (Math.random() * 55) + '%;width:' + w + 'px;height:' + (w / 2) + 'px;animation-duration:' + d + 's;animation-delay:-' + (Math.random() * d) + 's"><svg viewBox="0 0 220 110"><use href="#s-cloud"/></svg></span>'; }
      box.innerHTML = h;
    });
    $$('.twinkles').forEach(function (box) {
      var h = ''; for (var i = 0; i < 10; i++) h += '<i style="top:' + (Math.random() * 60) + '%;left:' + (Math.random() * 100) + '%;animation-delay:' + (Math.random() * 2.4) + 's">✦</i>';
      box.innerHTML = h;
    });
  }

  /* ================= ربط الأحداث ================= */
  function bind() {
    ['pointerdown', 'touchend', 'click'].forEach(function (ev) { document.addEventListener(ev, function () { Sound.init(); }, { capture: true, passive: true }); });

    $('#btn-start').addEventListener('click', function () { Sound.whoosh(); renderSetup(); show('setup'); });
    $$('.avatar-btn').forEach(function (b) { b.addEventListener('click', function () { state.avatar = b.getAttribute('data-av'); save(); Sound.click(); renderSetup(); }); });
    $$('.mode-btn').forEach(function (b) { b.addEventListener('click', function () { state.mode = b.getAttribute('data-mode'); state.active = 0; save(); Sound.click(); renderSetup(); renderScore(); }); });
    [0, 1].forEach(function (i) { $('#name-' + i).addEventListener('input', function (e) { state.teams[i].name = e.target.value.trim() || DEFAULT.teams[i].name; save(); renderScore(); }); });
    $('#btn-go-map').addEventListener('click', function () {
      state.started = true; save(); renderScore(); show('map');
      setCam('translate(' + cam.ox + 'px,' + cam.oy + 'px) scale(.7)', false);
      setTimeout(function () { setCam('translate(' + cam.ox + 'px,' + cam.oy + 'px) scale(1)', true); }, 30);
      toast('🧭 مرحبًا بك أيها المستكشف! اختر محطتك الأولى', 'good', 2600);
    });

    $('#map-plane').addEventListener('click', function (e) { var g = e.target.closest('.station'); if (g) goStation(g.getAttribute('data-st')); });
    $('#map-plane').addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.station')) { e.preventDefault(); goStation(e.target.closest('.station').getAttribute('data-st')); } });
    $('#btn-map').addEventListener('click', backToMap);
    $('#btn-passport').addEventListener('click', function () { Sound.click(); openPassport(ti()); });
    $('#btn-switch').addEventListener('click', function () { Sound.click(); switchTurn(); });
    $('#btn-sound').addEventListener('click', function () { state.settings.sound = !state.settings.sound; save(); syncTeacher(); Sound.init(); Sound.click(); });
    $('#btn-full').addEventListener('click', fullscreen);
    $('#btn-teacher').addEventListener('click', function () { syncTeacher(); $('#teacher').classList.add('show'); });
    $('#scoreboard').addEventListener('click', function (e) { var c = e.target.closest('.team-card'); if (c) { setActive(+c.getAttribute('data-team')); Sound.click(); } });

    document.addEventListener('click', function (e) {
      var t = e.target, go = t.closest('[data-go]');
      if (go) { goStation(go.getAttribute('data-go')); return; }
      if (t.closest('#lg-pass')) { openPassport(ti()); return; }
      if (t.closest('[data-back]')) { backToMap(); return; }
      var cl = t.closest('[data-close]'); if (cl) { closeModal(cl.getAttribute('data-close')); return; }
      var pt = t.closest('[data-ptab]'); if (pt) { openPassport(+pt.getAttribute('data-ptab')); return; }
    });
    $('#passport').addEventListener('click', function (e) { if (e.target.id === 'passport') closeModal('passport'); });
    $('#teacher').addEventListener('click', function (e) { if (e.target.id === 'teacher') closeModal('teacher'); });

    // البطاقات
    $('#cards-filter').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; cardsS.filter = b.getAttribute('data-filter'); $$('#cards-filter .chip').forEach(function (c) { c.classList.toggle('on', c === b); }); Sound.click(); buildDeck(); });
    $('#flip-card').addEventListener('click', flipCard);
    $('#flip-card').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard(); } });
    $('#card-next').addEventListener('click', function () { nextCard(1); });
    $('#card-prev').addEventListener('click', function () { nextCard(-1); });
    $('#card-know').addEventListener('click', cardKnow);
    $('#card-again').addEventListener('click', cardAgain);

    // المصايف
    $('#quiz-body').addEventListener('click', function (e) {
      var t = e.target, lv = t.closest('.level-btn');
      if (lv) { state.settings.level = lv.getAttribute('data-level'); save(); Sound.click(); $$('.level-btn').forEach(function (b) { b.classList.toggle('on', b === lv); }); syncTeacher(); return; }
      if (t.closest('#q-go')) { quizBegin(); return; }
      var o = t.closest('.opt'); if (o && !o.disabled) { quizAnswer(+o.getAttribute('data-oi')); return; }
      if (t.closest('#q-hint')) { quizHint(); return; }
      if (t.closest('#q-skip')) { quizAnswer(-2); return; }
      if (t.closest('#q-next')) { quizNext(); return; }
      if (t.closest('#q-again')) { quizStart(); return; }
    });

    // وادي الكلمات
    $('#bags-list-btn').addEventListener('click', function () { Sound.click(); bagsList(); });
    $('#bags-body').addEventListener('click', function (e) {
      var t = e.target, tag = t.closest('.act-tag');
      if (tag) { bagOpen(+tag.getAttribute('data-act')); return; }
      if (t.closest('#bag-list')) { bagsList(); return; }
      if (t.closest('#bag-next')) { bagOpen((bag.idx + 1) % DATA.dragdrop.length); return; }
      var tg = t.closest('[data-drop]'); if (tg && bag.sel) bagDrop(bag.sel, tg);
    });
    $('#bags-body').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var it = e.target.closest('.ditem'); if (it && !it.classList.contains('placed')) { e.preventDefault(); selectItem(it); return; }
      var tg = e.target.closest('[data-drop]'); if (tg && bag.sel) { e.preventDefault(); bagDrop(bag.sel, tg); }
    });
    document.addEventListener('pointerdown', pDown);
    document.addEventListener('pointermove', pMove, { passive: false });
    document.addEventListener('pointerup', pUp);
    document.addEventListener('pointercancel', pCancel);
    // منع تمرير الصفحة على iPad أثناء السحب
    document.addEventListener('touchmove', function (e) { if (drag) e.preventDefault(); }, { passive: false });

    // السباق
    $('#race-body').addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('#r-go')) { raceBegin(); return; }
      if (t.closest('#r-again')) { raceStart(); return; }
      var tf = t.closest('.tf-btn'); if (tf && !tf.disabled) { raceAnswer(+tf.getAttribute('data-tf')); return; }
      var o = t.closest('.opt'); if (o && !o.disabled) raceAnswer(+o.getAttribute('data-oi'));
    });

    // العجلة
    $('#wheel-spin').addEventListener('click', spin);
    $('#wheel-spin2').addEventListener('click', spin);

    // الفوز
    $('#btn-win-pass').addEventListener('click', function () { openPassport(0); });
    $('#btn-win-map').addEventListener('click', function () { show('map'); });
    $('#btn-new').addEventListener('click', function () { askConfirm('مغامرة جديدة؟', 'سيتم تصفير النقاط والأختام والتقدم.', '🔁 نعم، مغامرة جديدة', function () { resetAll(); show('map'); toast('🧭 مغامرة جديدة! بالتوفيق', 'good'); }); });

    // لوحة المعلم
    var S = function () { return state.settings; };
    $('#tp-qcount').addEventListener('change', function (e) { S().qCount = +e.target.value; save(); });
    $('#tp-rcount').addEventListener('change', function (e) { S().rCount = +e.target.value; save(); });
    $('#tp-spins').addEventListener('change', function (e) { S().spins = +e.target.value; wheelS.left = S().spins; wheelS.done = false; save(); if (current === 'najran') wheelStatus(); });
    $('#tp-level').addEventListener('change', function (e) { S().level = e.target.value; save(); });
    $('#tp-timer').addEventListener('change', function (e) { S().timerOn = e.target.checked; save(); });
    $('#tp-qtime').addEventListener('change', function (e) { S().qTime = +e.target.value; save(); });
    $('#tp-rtime').addEventListener('change', function (e) { S().rTime = +e.target.value; save(); });
    $('#tp-autoswitch').addEventListener('change', function (e) { S().autoSwitch = e.target.checked; save(); });
    $('#tp-hintstar').addEventListener('change', function (e) { S().hintStar = e.target.checked; save(); syncTeacher(); });
    $('#tp-sound').addEventListener('change', function (e) { S().sound = e.target.checked; save(); syncTeacher(); });
    $('#tp-volume').addEventListener('input', function (e) { S().volume = +e.target.value; Sound.vol(); save(); });
    $('#tp-test').addEventListener('click', function () { Sound.init(); Sound.correct(); });
    $('#tp-full').addEventListener('click', fullscreen);
    $('#tp-key').addEventListener('click', function () { closeModal('teacher'); answerKey(); });
    $('#tp-win').addEventListener('click', function () { closeModal('teacher'); showWin(); });
    function qctl(fn, label) { return function () { closeModal('teacher'); if (current_q && current_q[fn]) current_q[fn](); else toast('لا يوجد سؤال مفتوح حاليًا. ادخل إلى محطة وابدأ اللعب أولًا', 'soft', 3000); }; }
    $('#tp-reveal').addEventListener('click', qctl('reveal'));
    $('#tp-skip').addEventListener('click', qctl('skip'));
    $('#tp-repeat').addEventListener('click', qctl('repeat'));
    $('#tp-reset-scores').addEventListener('click', function () { askConfirm('تصفير النقاط؟', 'تُصفّر نقاط الفريقين ويُسمح باحتساب الأسئلة من جديد. تبقى الأختام.', '↺ نعم، صفّر', function () { resetScores(); toast('تم تصفير النقاط'); }); });
    $('#tp-reset').addEventListener('click', function () { askConfirm('إعادة ضبط المغامرة؟', 'سيتم مسح النقاط والأختام والتقدم.', '🗑️ نعم، أعد الضبط', function () { resetAll(); closeModal('teacher'); show('map'); toast('تمت إعادة ضبط المغامرة'); }); });
    $('#teacher').addEventListener('click', function (e) {
      var a = e.target.closest('[data-adj]');
      if (a) { var i = +a.getAttribute('data-adj'); addPoints(+a.getAttribute('data-v'), a, i); $$('#tp-teams .sc')[i].textContent = N(state.teams[i].score); return; }
      var tn = e.target.closest('[data-turn]'); if (tn) { setActive(+tn.getAttribute('data-turn')); toast('الدور الآن: ' + team().name, 'soft'); return; }
      var g = e.target.closest('[data-tgo]');
      if (g) { var id = g.getAttribute('data-tgo'); closeModal('teacher'); if (id === 'map') backToMap(); else goStation(id); }
    });
    $('#teacher').addEventListener('input', function (e) { var n = e.target.getAttribute('data-tname'); if (n !== null) { state.teams[+n].name = e.target.value.trim() || DEFAULT.teams[+n].name; save(); renderScore(); } });

    document.addEventListener('keydown', function (e) {
      if (e.target.matches('input, select')) return;
      if (e.key === 'Escape') { closeModal('modal'); closeModal('teacher'); closeModal('passport'); }
      if (e.altKey && (e.key === 't' || e.key === 'ف')) { syncTeacher(); $('#teacher').classList.add('show'); }
      if (current === 'riyadh' && e.key === 'ArrowLeft') nextCard(1);
      if (current === 'riyadh' && e.key === 'ArrowRight') nextCard(-1);
    });
    addEventListener('resize', function () { if (current === 'map') layoutMap(); });
    addEventListener('orientationchange', function () { setTimeout(function () { if (current === 'map') layoutMap(); }, 300); });
  }

  /* ================= البدء ================= */
  function init() {
    document.body.insertAdjacentHTML('afterbegin', ART.DEFS);
    $('#map-plane').innerHTML = ART.saudiMap(STATIONS);
    $('#splash-map').innerHTML = ART.saudiMap(STATIONS).replace(/ id="map-walker"/, '').replace(/class="station"/g, 'class="station-mini"').replace(/ tabindex="0" role="button"/g, '');
    $('#splash-hero').innerHTML = ART.explorer(state.avatar);
    $$('.scene').forEach(function (s) { s.innerHTML = ART.scene(s.getAttribute('data-scene')); });
    clouds(); Confetti.init(); bind(); syncTeacher(); renderScore();
    wheelS.left = state.settings.spins;
    // PWA: فقط عند التشغيل عبر https (GitHub Pages). التشغيل المحلي لا يعتمد عليه.
    if (location.protocol === 'https:') {
      var ml = document.createElement('link'); ml.rel = 'manifest'; ml.href = 'manifest.webmanifest'; document.head.appendChild(ml);
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () { });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
