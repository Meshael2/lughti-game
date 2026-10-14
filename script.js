/* =====================================================================
   رحلتنا مع لغتي — منطق اللعبة
   ملف JavaScript عادي (ليس Module) ليعمل مباشرة عبر file:// دون خادم.
   ===================================================================== */
(function () {
  'use strict';

  var DATA = window.LUGHTI_DATA;
  var ART = window.ART;

  /* =================================================================
     أدوات مساعدة
     ================================================================= */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function N(n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var LETTERS = ['أ', 'ب', 'ج', 'د'];

  /* =================================================================
     الحالة والحفظ المحلي
     ================================================================= */
  var STORE_KEY = 'lughti-airplane-v1';
  var DEFAULT_STATE = {
    mode: 'teams',
    teams: [
      { name: 'الفريق الأزرق', score: 0, badges: [] },
      { name: 'الفريق البرتقالي', score: 0, badges: [] }
    ],
    active: 0,
    progress: {},          // visited | done لكل قسم
    cardsKnown: [],
    bagsDone: [],
    settings: {
      sound: true, volume: 0.8,
      timerOn: true, quizTime: 30, speedTime: 15,
      quizCount: 12, speedCount: 15, level: 'mixed',
      autoSwitch: true, showAnswers: false, spins: 6
    }
  };
  var state = load();

  function load() {
    var s = clone(DEFAULT_STATE);
    try {
      var raw = window.localStorage && localStorage.getItem(STORE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        for (var k in saved) if (k !== 'settings') s[k] = saved[k];
        for (var k2 in saved.settings || {}) s.settings[k2] = saved.settings[k2];
      }
    } catch (e) { /* التخزين غير متاح؛ نكمل بدونه */ }
    return s;
  }
  function save() {
    try { if (window.localStorage) localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { }
  }

  function teamIdx() { return state.mode === 'solo' ? 0 : state.active; }
  function curTeam() { return state.teams[teamIdx()]; }

  /* =================================================================
     الأصوات (مولّدة برمجيًا بـ Web Audio — لا تحتاج ملفات)
     ================================================================= */
  var Sound = {
    ctx: null, master: null,
    init: function () {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.setVolume();
      } catch (e) { this.ctx = null; }
    },
    setVolume: function () { if (this.master) this.master.gain.value = state.settings.volume; },
    ok: function () { return this.ctx && state.settings.sound; },
    tone: function (f, dur, type, vol, delay, slide) {
      if (!this.ok()) return;
      var c = this.ctx, t = c.currentTime + (delay || 0);
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
    },
    noise: function (dur, vol, f1, f2, delay) {
      if (!this.ok()) return;
      var c = this.ctx, t = c.currentTime + (delay || 0);
      var len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      var src = c.createBufferSource(); src.buffer = buf;
      var flt = c.createBiquadFilter(); flt.type = 'bandpass'; flt.Q.value = 1.2;
      flt.frequency.setValueAtTime(f1 || 800, t); flt.frequency.exponentialRampToValueAtTime(f2 || 2400, t + dur);
      var g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.3, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(flt); flt.connect(g); g.connect(this.master); src.start(t); src.stop(t + dur + 0.05);
    },
    click: function () { this.tone(880, 0.07, 'triangle', 0.18); },
    correct: function () { this.tone(660, 0.14, 'triangle', 0.3); this.tone(880, 0.14, 'triangle', 0.3, 0.1); this.tone(1320, 0.3, 'triangle', 0.32, 0.2); },
    wrong: function () { this.tone(300, 0.22, 'sawtooth', 0.12, 0, 200); this.tone(200, 0.32, 'square', 0.08, 0.16, 150); },
    soft: function () { this.tone(520, 0.12, 'sine', 0.2); this.tone(440, 0.2, 'sine', 0.2, 0.1); },
    flip: function () { this.noise(0.28, 0.25, 600, 3200); },
    whoosh: function () { this.noise(0.7, 0.3, 300, 2600); },
    door: function () { this.noise(0.35, 0.25, 200, 500); this.tone(140, 0.2, 'sine', 0.2, 0.25); },
    tick: function () { this.tone(1400, 0.05, 'square', 0.08); },
    star: function () { var n = [523, 659, 784, 1047, 1319]; for (var i = 0; i < n.length; i++) this.tone(n[i], 0.25, 'triangle', 0.25, i * 0.08); },
    fanfare: function () {
      var seq = [[523, 0], [523, .15], [523, .3], [659, .45], [784, .75], [659, 1.0], [784, 1.15], [1047, 1.4]];
      for (var i = 0; i < seq.length; i++) { this.tone(seq[i][0], 0.32, 'triangle', 0.3, seq[i][1]); this.tone(seq[i][0] / 2, 0.32, 'sine', 0.15, seq[i][1]); }
    },
    engine: function (dur) {
      if (!this.ok()) return;
      this.noise(dur, 0.22, 120, 90);
      this.tone(95, dur, 'sawtooth', 0.05, 0, 60);
    },
    ding: function () { this.tone(1568, 0.5, 'sine', 0.25); this.tone(2093, 0.6, 'sine', 0.15, 0.05); }
  };

  /* =================================================================
     مؤثرات بصرية: القصاصات الملونة، الرسائل، النقاط الطائرة
     ================================================================= */
  var Confetti = (function () {
    var cv, cx, parts = [], running = false;
    var COLORS = ['#ff8a00', '#1e88e5', '#0e9f6e', '#ffc83d', '#e2557a', '#8e44ad', '#38bdf8'];
    function size() { cv.width = window.innerWidth; cv.height = window.innerHeight; }
    function loop() {
      cx.clearRect(0, 0, cv.width, cv.height);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vy += 0.18; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
        if (p.s === 0) cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        else if (p.s === 1) { cx.beginPath(); cx.arc(0, 0, p.w / 2, 0, 6.3); cx.fill(); }
        else { cx.font = (p.w * 2) + 'px serif'; cx.fillText('⭐', -p.w, p.w); }
        cx.restore();
        if (p.y > cv.height + 40) parts.splice(i, 1);
      }
      if (parts.length) requestAnimationFrame(loop); else { running = false; cx.clearRect(0, 0, cv.width, cv.height); }
    }
    return {
      init: function () { cv = $('#confetti'); cx = cv.getContext('2d'); size(); window.addEventListener('resize', size); },
      burst: function (n, x, y) {
        n = n || 120;
        for (var i = 0; i < n; i++) {
          var fromTop = x === undefined;
          parts.push({
            x: fromTop ? Math.random() * cv.width : x, y: fromTop ? -20 - Math.random() * cv.height * 0.3 : y,
            vx: fromTop ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 16, vy: fromTop ? Math.random() * 3 : -Math.random() * 14 - 4,
            w: 8 + Math.random() * 8, h: 6 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
            c: COLORS[i % COLORS.length], s: Math.random() < 0.08 ? 2 : (Math.random() < 0.5 ? 0 : 1)
          });
        }
        if (!running) { running = true; requestAnimationFrame(loop); }
      }
    };
  })();

  var toastTimer;
  function toast(msg, kind, ms) {
    var t = $('#toast');
    t.textContent = msg; t.className = 'show ' + (kind || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = ''; }, ms || 2200);
  }

  function floatPoints(n, el) {
    var layer = $('#float-layer'), d = document.createElement('div');
    var r = el ? el.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    d.className = 'float-pts' + (n < 0 ? ' neg' : '');
    d.textContent = (n > 0 ? '+' : '') + N(n);
    d.style.left = (r.left + r.width / 2 - 30) + 'px';
    d.style.top = (r.top + r.height / 2) + 'px';
    layer.appendChild(d);
    setTimeout(function () { d.remove(); }, 1400);
  }

  function starBurst() {
    var s = document.createElement('div');
    s.className = 'star-burst'; s.textContent = '⭐';
    s.style.left = (window.innerWidth / 2 - 50) + 'px'; s.style.top = (window.innerHeight / 2 - 60) + 'px';
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 1600);
  }

  /* =================================================================
     النقاط والفرق
     ================================================================= */
  var sessionGain = [0, 0]; // نقاط كل فريق داخل اللعبة الحالية (لمنح الأوسمة)

  function stars(score) { return Math.floor(score / 50); }

  function renderScoreboard() {
    var sb = $('#scoreboard'), html = '';
    var count = state.mode === 'solo' ? 1 : 2;
    for (var i = 0; i < count; i++) {
      var t = state.teams[i];
      html += '<div class="team-card t' + i + (i === teamIdx() ? ' active' : '') + '" data-team="' + i + '" title="انقر لتحديد الفريق الذي يجيب">' +
        '<div class="tc-dot">' + (state.mode === 'solo' ? '🧒' : (i === 0 ? '🔵' : '🟠')) + '</div>' +
        '<div class="tc-info"><div class="tc-name">' + esc(t.name) + '</div><div class="tc-meta">⭐ ' + N(stars(t.score)) + ' • 🏅 ' + N(t.badges.length) + '</div></div>' +
        '<div class="tc-score" id="score-' + i + '">' + N(t.score) + '</div></div>';
    }
    sb.innerHTML = html;
    $('#app').classList.toggle('solo', state.mode === 'solo');
    renderTeacherTeams();
    renderCockpitScores();
  }

  function setActive(i) {
    if (state.mode === 'solo') return;
    state.active = i; save(); renderScoreboard();
  }

  function switchTurn(silent) {
    if (state.mode === 'solo') return;
    state.active = state.active ? 0 : 1; save(); renderScoreboard();
    if (!silent) toast('🔄 الدور الآن: ' + state.teams[state.active].name, 'soft', 1600);
  }

  function afterAnswer() {
    if (state.mode === 'teams' && state.settings.autoSwitch) switchTurn();
  }

  function addPoints(n, anchorEl, teamOverride) {
    if (!n) return;
    var i = teamOverride !== undefined ? teamOverride : teamIdx();
    var t = state.teams[i], before = stars(t.score);
    t.score = Math.max(0, t.score + n);
    sessionGain[i] += n;
    save(); renderScoreboard();
    var sc = $('#score-' + i);
    if (sc) { sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); }
    floatPoints(n, anchorEl || sc);
    if (stars(t.score) > before) { setTimeout(function () { starBurst(); Sound.star(); toast('⭐ نجمة جديدة لـ ' + t.name + '!', 'good'); }, 500); }
  }

  var SEC_NAMES = { cockpit: 'قمرة القيادة', cards: 'الدرجة الأولى', quiz: 'مقاعد الركاب', bags: 'قسم الأمتعة', speed: 'جناح الطائرة', gate: 'بوابة الوصول' };
  var BADGES = { cards: '🎴 وسام البطاقات', quiz: '💺 وسام الركاب', bags: '🧳 وسام الأمتعة', speed: '⚡ وسام السرعة', gate: '🏆 وسام النجومية' };

  function markVisited(sec) {
    if (!state.progress[sec]) { state.progress[sec] = 'visited'; save(); }
    renderProgress();
  }
  function markDone(sec) {
    state.progress[sec] = 'done';
    if (BADGES[sec]) {
      var winners = [];
      if (state.mode === 'solo') winners = [0];
      else if (sessionGain[0] === sessionGain[1]) winners = [0, 1];
      else winners = [sessionGain[0] > sessionGain[1] ? 0 : 1];
      winners.forEach(function (w) {
        if (state.teams[w].badges.indexOf(sec) < 0) state.teams[w].badges.push(sec);
      });
    }
    save(); renderProgress(); renderScoreboard();
  }

  function renderProgress() {
    $$('.cutaway .sec-label').forEach(function (l) { l.classList.toggle('done', state.progress[l.getAttribute('data-sec')] === 'done'); });
    $$('.minimap .mm-sec').forEach(function (m) { m.classList.toggle('done', state.progress[m.getAttribute('data-sec')] === 'done'); });
    renderFlightScreen();
  }

  /* =================================================================
     التنقل بين الشاشات + الكاميرا + الأبواب
     ================================================================= */
  var current = 'splash', busy = false;
  var SCREEN_OF = { cockpit: 'cockpit', cards: 'cards', quiz: 'quiz', bags: 'bags', speed: 'speed', gate: 'wheel' };
  var SEC_OF_SCREEN = { cockpit: 'cockpit', cards: 'cards', quiz: 'quiz', bags: 'bags', speed: 'speed', wheel: 'gate' };
  var lastSec = null;

  function showScreen(name) {
    stopAllTimers();
    if (wheelS.spinning) { wheelS.spinning = false; wheelS.left++; }
    $$('.screen').forEach(function (s) { s.classList.remove('active'); });
    $('#scr-' + name).classList.add('active');
    current = name;
    $('#app').classList.toggle('on-splash', name === 'splash');
    var sec = SEC_OF_SCREEN[name] || null;
    $$('.minimap .mm-sec').forEach(function (m) { m.classList.toggle('current', m.getAttribute('data-sec') === sec); });
    if (name === 'cabin') layoutCamera(true);
  }

  /* --- الكاميرا --- */
  var cam = { s: 1, ox: 0, oy: 0, W: 0, H: 0 };
  function layoutCamera(reset) {
    var vp = $('#camera-viewport'), c = $('#camera');
    if (!vp || !c) return;
    var W = vp.clientWidth, H = vp.clientHeight;
    if (!W || !H) return;
    var s = Math.min(W / 1600, H / 820) * 0.98;
    cam = { s: s, W: W, H: H, ox: (W - 1600 * s) / 2, oy: (H - 820 * s) / 2 };
    c.style.width = (1600 * s) + 'px'; c.style.height = (820 * s) + 'px';
    if (reset) setCam('translate(' + cam.ox + 'px,' + cam.oy + 'px) scale(1)', false);
  }
  function camFor(secId) {
    var sec = ART.SECTIONS.filter(function (x) { return x.id === secId; })[0];
    var b = sec.box, s = cam.s;
    var z = Math.min(cam.W / (b[2] * s), cam.H / (b[3] * s)) * 0.82;
    z = Math.max(1.3, Math.min(z, 3.4));
    var cx = (b[0] + b[2] / 2) * s, cy = (b[1] + b[3] / 2) * s;
    return 'translate(' + (cam.W / 2 - z * cx) + 'px,' + (cam.H / 2 - z * cy) + 'px) scale(' + z + ')';
  }
  function setCam(tf, animate) {
    var c = $('#camera');
    c.style.transition = animate ? '' : 'none';
    c.style.transform = tf;
    if (!animate) { void c.offsetWidth; c.style.transition = ''; }
  }

  function doors(close, label) {
    var d = $('#doors');
    if (close) {
      $('#door-badge').textContent = label || '';
      d.classList.add('show'); void d.offsetWidth; d.classList.add('closed');
    } else {
      d.classList.remove('closed');
      setTimeout(function () { if (!d.classList.contains('closed')) d.classList.remove('show'); }, 480);
    }
  }

  function goSection(secId) {
    if (busy) return;
    busy = true;
    Sound.init();
    var sec = ART.SECTIONS.filter(function (x) { return x.id === secId; })[0];
    var p = Promise.resolve();
    if (current !== 'cabin') {
      p = p.then(function () { showScreen('cabin'); return wait(80); });
    }
    p.then(function () {
      layoutCamera(true);
      $$('.cutaway .sec').forEach(function (g) { g.classList.toggle('lit', g.getAttribute('data-sec') === secId); });
      return wait(30);
    }).then(function () {
      Sound.whoosh();
      setCam(camFor(secId), true);
      return wait(950);
    }).then(function () {
      Sound.door();
      doors(true, sec.icon + ' ' + sec.name + ' • ' + sec.game);
      return wait(650);
    }).then(function () {
      showScreen(SCREEN_OF[secId]);
      lastSec = secId;
      enterSection(secId);
      $$('.cutaway .sec').forEach(function (g) { g.classList.remove('lit'); });
      return wait(250);
    }).then(function () {
      doors(false);
      busy = false;
    }).catch(function (e) { busy = false; doors(false); console.error(e); });
  }

  function backToPlane() {
    if (busy || current === 'cabin') return;
    Sound.whoosh();
    showScreen('cabin');
    if (lastSec) {
      setCam(camFor(lastSec), false);
      setTimeout(function () { setCam('translate(' + cam.ox + 'px,' + cam.oy + 'px) scale(1)', true); }, 40);
    }
  }

  function enterSection(secId) {
    sessionGain = [0, 0];
    markVisited(secId);
    switch (secId) {
      case 'cockpit': enterCockpit(); break;
      case 'cards': enterCards(); break;
      case 'quiz': enterQuiz(); break;
      case 'bags': enterBags(); break;
      case 'speed': enterSpeed(); break;
      case 'gate': enterWheel(); break;
    }
  }

  /* --- المؤقتات --- */
  var timers = [];
  function addTimer(id) { timers.push(id); return id; }
  function stopAllTimers() { timers.forEach(function (t) { clearInterval(t); clearTimeout(t); }); timers = []; }

  /* =================================================================
     السحب في الخلفية
     ================================================================= */
  function makeClouds() {
    $$('.clouds').forEach(function (box) {
      var near = box.classList.contains('near'), n = near ? 4 : 6, html = '';
      for (var i = 0; i < n; i++) {
        var w = near ? 180 + Math.random() * 140 : 90 + Math.random() * 90;
        var top = Math.random() * (near ? 70 : 80);
        var dur = near ? 26 + Math.random() * 18 : 50 + Math.random() * 40;
        html += '<span class="cloud" style="top:' + top + '%;width:' + w + 'px;height:' + (w / 2) + 'px;animation-duration:' + dur + 's;animation-delay:-' + (Math.random() * dur) + 's"><svg viewBox="0 0 220 110"><use href="#sym-cloud"/></svg></span>';
      }
      box.innerHTML = html;
    });
  }

  /* =================================================================
     ١) قمرة القيادة
     ================================================================= */
  var PILOT_LINES = [
    'السلام عليكم يا أبطال! أنا قائد طائرتكم، أهلًا بكم في رحلتنا مع لغتي. اربطوا الأحزمة واستعدوا للانطلاق!',
    'تذكّروا قول الرسول ﷺ: «إنَّ خِيارَكُمْ أَحاسِنُكُمْ أَخْلاقًا». فلنكن مسافرين مهذبين!',
    'مثل عادل في الطائرة: نجلس بهدوء، ونستمع إلى تعليمات السلامة، ونحترم الآخرين.',
    'اختاروا أي قسم من الطائرة، وفي النهاية تنتظركم عجلة التحدي الذهبي في بوابة الوصول!'
  ];
  var pilotLine = 0;

  function enterCockpit() {
    $('#pilot-speech').textContent = PILOT_LINES[pilotLine % PILOT_LINES.length];
    pilotLine++;
    renderCockpit();
  }

  function renderCockpit() {
    $$('.mode-btn').forEach(function (b) {
      var on = b.getAttribute('data-mode') === state.mode;
      b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    $('#cp-name-0').value = state.teams[0].name;
    $('#cp-name-1').value = state.teams[1].name;
    renderFlightScreen();
    renderCockpitScores();
    var order = ['cards', 'quiz', 'bags', 'speed', 'gate'], html = '';
    order.forEach(function (id) {
      var s = ART.SECTIONS.filter(function (x) { return x.id === id; })[0];
      html += '<button class="cp-go" data-go="' + id + '" style="background:var(--sec-' + id + ')"><b>' + s.icon + '</b>' + s.name + '<small>' + s.game + '</small></button>';
    });
    $('#cp-buttons').innerHTML = html;
  }

  function renderCockpitScores() {
    // يظهر النقاط بجوار أسماء الفرق داخل القمرة
    [0, 1].forEach(function (i) {
      var lab = $('#cp-name-' + i);
      if (!lab) return;
      var holder = lab.parentNode, sp = holder.querySelector('.cp-sc');
      if (!sp) { sp = document.createElement('b'); sp.className = 'cp-sc'; holder.appendChild(sp); }
      sp.textContent = N(state.teams[i].score) + ' ⭐' + N(stars(state.teams[i].score));
    });
  }

  function renderFlightScreen() {
    var box = $('#fs-route');
    if (!box) return;
    var order = ['cockpit', 'cards', 'quiz', 'bags', 'speed', 'gate'], html = '';
    order.forEach(function (id) {
      var s = ART.SECTIONS.filter(function (x) { return x.id === id; })[0];
      var st = state.progress[id] || '';
      html += '<button class="fs-stop ' + st + '" data-go="' + id + '"><span class="dot">' + s.icon + '</span><span>' + s.name + '</span><small>' + (st === 'done' ? '✔ مكتمل' : st === 'visited' ? '• زُرتَه' : '') + '</small></button>';
    });
    box.innerHTML = html;
  }

  /* =================================================================
     ٢) بطاقات المسافر الذكي
     ================================================================= */
  var CARD_TYPES = [
    { id: 'all', name: 'الكل' },
    { id: 'meaning', name: 'الكلمة ومعناها', ask: 'ما مَعْنى الكَلِمَةِ؟' },
    { id: 'opposite', name: 'الكلمة وضدها', ask: 'ما ضِدُّ الكَلِمَةِ؟' },
    { id: 'qa', name: 'سؤال وجواب', ask: 'سُؤالٌ وَجَوابٌ' },
    { id: 'behavior', name: 'السلوك الصحيح والخاطئ', ask: 'سُلوكٌ صَحيحٌ أَمْ خاطِئٌ؟' },
    { id: 'story', name: 'الشخصيات والأحداث', ask: 'الشَّخْصِيّاتُ وَالأَحْداثُ' }
  ];
  var cardsS = { filter: 'all', deck: [], i: 0, flipped: false };

  function enterCards() {
    var html = '';
    CARD_TYPES.forEach(function (t) { html += '<button class="chip' + (t.id === cardsS.filter ? ' on' : '') + '" data-filter="' + t.id + '">' + t.name + '</button>'; });
    $('#cards-filter').innerHTML = html;
    buildDeck();
  }

  function buildDeck() {
    cardsS.deck = [];
    DATA.cards.forEach(function (c, idx) { if (cardsS.filter === 'all' || c.type === cardsS.filter) cardsS.deck.push(idx); });
    cardsS.deck = shuffle(cardsS.deck);
    cardsS.i = 0;
    showCard();
  }

  function showCard() {
    var card = $('#flip-card');
    var idx = cardsS.deck[cardsS.i], c = DATA.cards[idx];
    cardsS.flipped = false;
    card.classList.remove('flipped');
    var t = CARD_TYPES.filter(function (x) { return x.id === c.type; })[0];
    setTimeout(function () {
      $('#fc-type').textContent = t.ask;
      var f = $('#fc-front'), b = $('#fc-back');
      f.textContent = c.front; b.textContent = c.back;
      f.classList.toggle('long', c.front.length > 34);
      b.classList.toggle('long', c.back.length > 34);
      $('#fc-src').textContent = 'كتاب لغتي ص ' + N(c.src);
      card.classList.toggle('known', state.cardsKnown.indexOf(idx) >= 0);
      card.classList.remove('deal'); void card.offsetWidth; card.classList.add('deal');
    }, 180);
    $('#card-know').disabled = true; $('#card-again').disabled = true;
    $('#cards-count').textContent = 'البطاقة ' + N(cardsS.i + 1) + ' من ' + N(cardsS.deck.length);
    $('#cards-known').textContent = '✔ عرفتم ' + N(state.cardsKnown.length) + ' من ' + N(DATA.cards.length) + ' بطاقة';
  }

  function flipCard() {
    cardsS.flipped = !cardsS.flipped;
    $('#flip-card').classList.toggle('flipped', cardsS.flipped);
    Sound.flip();
    if (cardsS.flipped) { $('#card-know').disabled = false; $('#card-again').disabled = false; }
  }

  function nextCard(dir) {
    cardsS.i = (cardsS.i + (dir || 1) + cardsS.deck.length) % cardsS.deck.length;
    Sound.click();
    showCard();
  }

  function cardKnow() {
    var idx = cardsS.deck[cardsS.i];
    Sound.correct();
    if (state.cardsKnown.indexOf(idx) < 0) {
      state.cardsKnown.push(idx); save();
      addPoints(10, $('#card-know'));
      Confetti.burst(40, window.innerWidth / 2, window.innerHeight / 2);
    } else {
      toast('هذه البطاقة محسوبة من قبل 👍', 'soft');
    }
    afterAnswer();
    if (state.cardsKnown.length >= 15 && state.progress.cards !== 'done') {
      markDone('cards');
      toast('🏅 أحسنتم! حصلتم على وسام البطاقات', 'good', 3000);
      Sound.fanfare(); Confetti.burst(160);
    }
    setTimeout(function () { nextCard(1); }, 650);
  }

  function cardAgain() {
    Sound.soft();
    toast('لا بأس! سنعود إلى هذه البطاقة لاحقًا 🙂', 'soft');
    // نعيد البطاقة إلى نهاية المجموعة لتظهر مرة أخرى
    var idx = cardsS.deck.splice(cardsS.i, 1)[0];
    cardsS.deck.push(idx);
    if (cardsS.i >= cardsS.deck.length) cardsS.i = 0;
    afterAnswer();
    showCard();
  }

  /* =================================================================
     أدوات مشتركة لأسئلة الاختيار
     ================================================================= */
  function optionsHTML(q, cls) {
    var order = shuffle(q.options.map(function (o, i) { return i; }));
    var html = '';
    order.forEach(function (oi, k) {
      html += '<button class="opt ' + (cls || '') + '" data-oi="' + oi + '"' + (oi === q.answer ? ' data-correct="1"' : '') + '><span class="ol">' + LETTERS[k] + '</span><span>' + esc(q.options[oi]) + '</span></button>';
    });
    return html;
  }
  function lockOptions(box, chosen, correctIdx) {
    $$('.opt', box).forEach(function (b) {
      var oi = +b.getAttribute('data-oi');
      b.disabled = true;
      if (oi === correctIdx) b.classList.add('correct');
      else if (oi === chosen) b.classList.add('wrong');
    });
  }

  /* =================================================================
     ٣) تحدي الركاب
     ================================================================= */
  var quizS = null;
  var LEVEL_NAMES = { easy: 'سهل', medium: 'متوسط', hard: 'صعب', mixed: 'مختلط' };
  var LEVEL_PTS = { easy: 10, medium: 15, hard: 20 };

  function enterQuiz() { quizStartScreen(); }

  function quizStartScreen() {
    var st = state.settings;
    $('#quiz-progress').innerHTML = '';
    var counts = { easy: 0, medium: 0, hard: 0 };
    DATA.quiz.forEach(function (q) { counts[q.level]++; });
    var html = '<div class="q-start"><h3>💺 تحدي الركاب</h3><p>اختر مستوى الصعوبة، ثم انطلق! لكل سؤال أربعة اختيارات وتلميح واحد عند الحاجة.</p><div class="level-pick">';
    ['easy', 'medium', 'hard', 'mixed'].forEach(function (l) {
      var c = l === 'mixed' ? DATA.quiz.length : counts[l];
      html += '<button class="level-btn' + (st.level === l ? ' on' : '') + '" data-level="' + l + '">' + { easy: '🟢', medium: '🟠', hard: '🔴', mixed: '🌈' }[l] + ' ' + LEVEL_NAMES[l] + '<small>' + N(c) + ' سؤالًا</small></button>';
    });
    html += '</div><div class="opt-row"><label>عدد الأسئلة: <select id="q-count">';
    [5, 8, 10, 12, 15, 20, 25, 30, 32].forEach(function (n) { html += '<option value="' + n + '"' + (n === st.quizCount ? ' selected' : '') + '>' + N(n) + '</option>'; });
    html += '</select></label><label><input type="checkbox" id="q-timer"' + (st.timerOn ? ' checked' : '') + '> المؤقت (' + N(st.quizTime) + ' ثانية)</label></div>' +
      '<button class="btn-big btn-green" id="q-go">🚀 ابدأ التحدي</button></div>';
    $('#quiz-body').innerHTML = html;
  }

  function quizBegin() {
    var st = state.settings;
    st.quizCount = +$('#q-count').value; st.timerOn = $('#q-timer').checked; save(); syncTeacher();
    var pool = DATA.quiz.filter(function (q) { return st.level === 'mixed' || q.level === st.level; });
    var list = shuffle(pool).slice(0, Math.min(st.quizCount, pool.length));
    if (st.level === 'mixed') list.sort(function (a, b) { return ['easy', 'medium', 'hard'].indexOf(a.level) - ['easy', 'medium', 'hard'].indexOf(b.level); });
    quizS = { list: list, i: 0, correct: 0, answered: false, hintUsed: false };
    Sound.click();
    quizShow();
  }

  function quizShow() {
    stopAllTimers();
    var q = quizS.list[quizS.i], st = state.settings;
    quizS.answered = false; quizS.hintUsed = false;
    $('#quiz-progress').innerHTML = '<span class="pill">السؤال ' + N(quizS.i + 1) + ' من ' + N(quizS.list.length) + '</span><span class="pill">✔ ' + N(quizS.correct) + '</span>';
    var who = state.mode === 'teams' ? '<span>يجيب الآن: <b style="color:' + (teamIdx() ? 'var(--orange-d)' : 'var(--blue-d)') + '">' + esc(curTeam().name) + '</b></span>' : '<span>' + esc(curTeam().name) + '</span>';
    var html = '<div class="q-card"><div class="q-meta"><span class="lvl-tag lvl-' + q.level + '">' + LEVEL_NAMES[q.level] + ' • ' + N(LEVEL_PTS[q.level]) + ' نقطة</span>' + who +
      (st.timerOn ? '<span class="timer-num" id="q-tnum">' + N(st.quizTime) + '</span>' : '') + '</div>' +
      '<div class="q-text">' + esc(q.q) + '</div>' +
      (st.timerOn ? '<div class="timer-bar"><div class="timer-fill" id="q-tfill"></div></div>' : '') + '</div>' +
      '<div class="options" id="q-opts">' + optionsHTML(q) + '</div>' +
      '<div class="q-tools"><button class="btn-small" id="q-hint">💡 تلميح (مرة واحدة)</button><div id="q-hintbox"></div><button class="btn-small" id="q-skip">⏭ تخطي السؤال</button></div>' +
      '<div id="q-explain"></div>';
    $('#quiz-body').innerHTML = html;
    if (st.timerOn) startCountdown(st.quizTime, $('#q-tfill'), $('#q-tnum'), function () { quizAnswer(-1); });
  }

  function startCountdown(total, fill, num, onEnd) {
    var start = Date.now(), lastSec = total;
    var id = addTimer(setInterval(function () {
      var left = Math.max(0, total - (Date.now() - start) / 1000);
      if (fill) fill.style.transform = 'scaleX(' + (left / total) + ')';
      var s = Math.ceil(left);
      if (num && s !== lastSec) { num.textContent = N(s); num.classList.toggle('warn', s <= 5); if (s <= 5 && s > 0) Sound.tick(); lastSec = s; }
      if (left <= 0) { clearInterval(id); onEnd(); }
    }, 100));
    return { left: function () { return Math.max(0, total - (Date.now() - start) / 1000); } };
  }

  function quizHint() {
    if (quizS.answered || quizS.hintUsed) return;
    quizS.hintUsed = true;
    var q = quizS.list[quizS.i];
    var wrongs = shuffle($$('#q-opts .opt').filter(function (b) { return +b.getAttribute('data-oi') !== q.answer; }));
    wrongs[0].classList.add('gone'); wrongs[0].disabled = true;
    $('#q-hintbox').innerHTML = '<div class="hint-box">💡 ' + esc(q.hint || 'فكّر جيدًا في النص.') + '</div>';
    $('#q-hint').disabled = true;
    Sound.ding();
  }

  function quizAnswer(oi) {
    if (quizS.answered) return;
    quizS.answered = true;
    stopAllTimers();
    var q = quizS.list[quizS.i], ok = oi === q.answer;
    lockOptions($('#q-opts'), oi, q.answer);
    $('#q-hint').disabled = true; $('#q-skip').disabled = true;
    var pts = LEVEL_PTS[q.level];
    if (quizS.hintUsed) pts = Math.round(pts / 2);
    if (ok) {
      quizS.correct++;
      Sound.correct();
      var btn = $('#q-opts .opt.correct');
      addPoints(pts, btn);
      var r = btn.getBoundingClientRect();
      Confetti.burst(70, r.left + r.width / 2, r.top);
    } else Sound.wrong();
    var title = ok ? '🎉 إجابة صحيحة! أحسنت' : (oi === -1 ? '⏰ انتهى الوقت' : oi === -2 ? '⏭ تم تخطي السؤال، وهذه الإجابة الصحيحة' : '🙂 إجابة غير صحيحة، لنتعلم معًا');
    $('#q-explain').innerHTML = '<div class="explain' + (ok ? '' : ' bad') + '"><span class="ex-ico">' + (ok ? '✅' : '📘') + '</span><div class="ex-text"><b>' + title + '</b>' + esc(q.explain || '') + ' <span class="ex-src">(كتاب لغتي ص ' + N(q.src) + ')</span></div>' +
      '<button class="btn-big btn-blue" id="q-next">' + (quizS.i + 1 < quizS.list.length ? 'التالي ⬅' : 'النتيجة 🏁') + '</button></div>';
    afterAnswer();
  }

  function quizNext() {
    quizS.i++;
    if (quizS.i < quizS.list.length) { Sound.click(); quizShow(); return; }
    var n = quizS.list.length, c = quizS.correct;
    if (n >= 10 || c >= 10) markDone('quiz'); else markVisited('quiz');
    Sound.fanfare(); Confetti.burst(150);
    $('#quiz-progress').innerHTML = '';
    $('#quiz-body').innerHTML = '<div class="q-end"><div class="big-ico">' + (c / n >= 0.7 ? '🏆' : '🌟') + '</div><h3>انتهى تحدي الركاب!</h3>' +
      '<p>الإجابات الصحيحة: ' + N(c) + ' من ' + N(n) + '</p>' + gainSummary() +
      (state.progress.quiz === 'done' ? '<span class="medal">💺 وسام الركاب</span>' : '<p>أجب عن ١٠ أسئلة أو أكثر لتحصل على الوسام</p>') +
      '<div class="row-btns"><button class="btn-big btn-green" id="q-again">🔁 تحدٍّ جديد</button><button class="btn-big btn-blue" data-back="1">✈️ العودة إلى الطائرة</button></div></div>';
  }

  function gainSummary() {
    if (state.mode === 'solo') return '<p>النقاط في هذه الجولة: ' + N(sessionGain[0]) + '</p>';
    return '<p>🔵 ' + esc(state.teams[0].name) + ': +' + N(sessionGain[0]) + ' &nbsp; • &nbsp; 🟠 ' + esc(state.teams[1].name) + ': +' + N(sessionGain[1]) + '</p>';
  }

  /* =================================================================
     ٤) حقيبة الكلمات — السحب والإفلات
     ================================================================= */
  var bagS = { act: null, idx: -1, placed: 0, total: 0, mistakes: 0, selected: null };
  var KIND_NAMES = { match: 'مطابقة', classify: 'تصنيف', order: 'ترتيب' };
  var KIND_COLORS = { match: '#1e88e5', classify: '#ff8a00', order: '#8e44ad' };

  function enterBags() { bagsList(); }

  function bagsList() {
    var html = '<div class="act-head"><h3>🧳 اختر حقيبة نشاط من سير الأمتعة</h3><span class="instr">أنجزتم ' + N(state.bagsDone.length) + ' من ' + N(DATA.dragdrop.length) + ' نشاطًا</span></div><div class="act-grid">';
    DATA.dragdrop.forEach(function (a, i) {
      html += '<button class="act-tag' + (state.bagsDone.indexOf(i) >= 0 ? ' done' : '') + '" data-act="' + i + '" style="--c:' + KIND_COLORS[a.kind] + '"><span class="at-num">' + N(i + 1) + '</span><span class="at-kind">' + KIND_NAMES[a.kind] + ' • ص ' + N(a.src) + '</span><span class="at-title">' + esc(a.title) + '</span></button>';
    });
    html += '</div>';
    $('#bags-body').innerHTML = html;
    bagS.act = null;
  }

  function bagsOpen(i) {
    var a = DATA.dragdrop[i];
    bagS = { act: a, idx: i, placed: 0, total: a.items.length, mistakes: 0, selected: null };
    var html = '<div class="act-head"><div><h3>' + esc(a.title) + '</h3><span class="instr">👆 ' + esc(a.instr) + ' — اسحب البطاقة، أو انقرها ثم انقر مكانها</span></div>' +
      '<span class="pill" id="bag-prog">' + N(0) + ' / ' + N(a.items.length) + '</span></div><div class="act-zone">';
    var items = [];
    if (a.kind === 'match') {
      html += '<div class="targets-match">';
      shuffle(a.items.map(function (p, k) { return k; })).forEach(function (k) {
        html += '<div class="tgt" data-drop="1" data-ans="' + esc(a.items[k][0]) + '"><span class="tgt-text">' + esc(a.items[k][1]) + '</span><span class="slot">أفلت هنا</span></div>';
      });
      html += '</div>';
      items = a.items.map(function (p) { return p[0]; });
    } else if (a.kind === 'classify') {
      html += '<div class="bins">';
      a.bins.forEach(function (b, k) { html += '<div class="bin" data-drop="1" data-bin="' + k + '"><div class="bin-title">' + esc(b) + '</div><div class="bin-items"></div></div>'; });
      html += '</div>';
      items = a.items.map(function (p) { return p[0]; });
    } else {
      html += '<div class="order-slots' + (a.sentence ? '' : ' list') + '">';
      a.items.forEach(function (t, k) { html += '<div class="oslot" data-drop="1" data-pos="' + k + '"><span class="on">' + N(k + 1) + '</span><span class="ot"></span></div>'; });
      html += '</div>';
      items = a.items.slice();
    }
    html += '</div><div class="belt-wrap"><span class="belt-label">سير الأمتعة</span><div class="belt" id="belt">';
    shuffle(items.map(function (t, k) { return k; })).forEach(function (k) {
      var extra = a.kind === 'classify' ? ' data-bin="' + a.items[k][1] + '"' : (a.kind === 'order' ? ' data-pos="' + k + '"' : '');
      html += '<div class="ditem" data-text="' + esc(items[k]) + '"' + extra + ' tabindex="0" role="button">' + esc(items[k]) + '</div>';
    });
    html += '</div></div>';
    $('#bags-body').innerHTML = html;
    Sound.click();
  }

  function bagCheck(item, target) {
    var a = bagS.act;
    if (a.kind === 'match') return target.getAttribute('data-ans') === item.getAttribute('data-text') && !target.classList.contains('filled');
    if (a.kind === 'classify') return target.getAttribute('data-bin') === item.getAttribute('data-bin');
    // الترتيب: الموضع الصحيح أو نص مطابق للموضع (في حال تكرار الكلمة)
    var pos = +target.getAttribute('data-pos');
    return !target.classList.contains('filled') && a.items[pos] === item.getAttribute('data-text');
  }

  function bagDrop(item, target) {
    clearSelection();
    if (!target) return;
    if (bagCheck(item, target)) {
      Sound.correct();
      item.classList.add('placed'); item.removeAttribute('tabindex');
      if (bagS.act.kind === 'match') {
        var slot = target.querySelector('.slot'); slot.textContent = ''; slot.appendChild(item); target.classList.add('filled');
      } else if (bagS.act.kind === 'classify') {
        var chip = document.createElement('span'); chip.className = 'chipd'; chip.textContent = item.textContent;
        target.querySelector('.bin-items').appendChild(chip); item.remove();
      } else {
        var ot = target.querySelector('.ot'); ot.textContent = ''; ot.appendChild(item); target.classList.add('filled');
      }
      bagS.placed++;
      $('#bag-prog').textContent = N(bagS.placed) + ' / ' + N(bagS.total);
      if (bagS.placed >= bagS.total) setTimeout(bagFinish, 500);
    } else {
      bagS.mistakes++;
      Sound.wrong();
      item.classList.remove('back'); void item.offsetWidth; item.classList.add('back');
      var tips = ['حاول مرة أخرى 🙂 أنت قريب!', 'فكّر قليلًا وجرّب مكانًا آخر 💭', 'لا بأس، الخطأ طريق التعلم 🌱'];
      toast(tips[bagS.mistakes % tips.length], 'soft');
    }
  }

  function bagFinish() {
    var pts = bagS.mistakes <= 2 ? 20 : 10;
    if (state.bagsDone.indexOf(bagS.idx) < 0) state.bagsDone.push(bagS.idx);
    save();
    Sound.fanfare(); Confetti.burst(120);
    var zone = $('.act-zone');
    zone.innerHTML = '<div class="act-done"><div class="loaded-bag">🧳</div><h3>أحسنت! حُمِّلت الحقيبة إلى الطائرة ✈️</h3><p class="instr">الأخطاء: ' + N(bagS.mistakes) + ' • النقاط: +' + N(pts) + '</p>' +
      '<div class="row-btns"><button class="btn-big btn-green" id="bag-next">النشاط التالي ⬅</button><button class="btn-big btn-amber" id="bag-list">🗂️ قائمة الأنشطة</button></div></div>';
    $('.belt-wrap').style.display = 'none';
    addPoints(pts, zone);
    afterAnswer();
    if (state.bagsDone.length >= 12 && state.progress.bags !== 'done') {
      markDone('bags');
      setTimeout(function () { toast('🏅 رائع! حصلتم على وسام الأمتعة', 'good', 3000); }, 900);
    }
  }

  function clearSelection() {
    if (bagS.selected) bagS.selected.classList.remove('selected');
    bagS.selected = null;
    $$('[data-drop].pickable').forEach(function (t) { t.classList.remove('pickable'); });
  }

  /* السحب بالمؤشر (يعمل بالفأرة واللمس والقلم) */
  var drag = null;
  function onPointerDown(e) {
    var item = e.target.closest('.ditem');
    if (!item || item.classList.contains('placed') || current !== 'bags') return;
    e.preventDefault();
    Sound.init();
    drag = { item: item, x0: e.clientX, y0: e.clientY, ghost: null, over: null, id: e.pointerId };
    try { item.setPointerCapture(e.pointerId); } catch (er) { }
  }
  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.ghost && Math.abs(dx) + Math.abs(dy) > 8) {
      var r = drag.item.getBoundingClientRect();
      var g = drag.item.cloneNode(true);
      g.classList.add('drag-ghost'); g.classList.remove('selected');
      g.style.width = r.width + 'px';
      document.body.appendChild(g);
      drag.ghost = g; drag.offX = drag.x0 - r.left; drag.offY = drag.y0 - r.top;
      drag.item.classList.add('dragging-src');
      clearSelection();
    }
    if (drag.ghost) {
      drag.ghost.style.left = (e.clientX - drag.offX) + 'px';
      drag.ghost.style.top = (e.clientY - drag.offY) + 'px';
      var el = document.elementFromPoint(e.clientX, e.clientY);
      var t = el && el.closest('[data-drop]');
      if (t !== drag.over) {
        if (drag.over) drag.over.classList.remove('hover');
        if (t) t.classList.add('hover');
        drag.over = t;
      }
    }
  }
  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    if (d.ghost) {
      d.ghost.remove();
      d.item.classList.remove('dragging-src');
      if (d.over) d.over.classList.remove('hover');
      if (d.over) bagDrop(d.item, d.over);
    } else {
      // نقرة: اختيار العنصر ثم النقر على مكانه
      if (bagS.selected === d.item) { clearSelection(); return; }
      clearSelection();
      bagS.selected = d.item; d.item.classList.add('selected');
      $$('[data-drop]').forEach(function (t) { if (!t.classList.contains('filled')) t.classList.add('pickable'); });
      Sound.click();
    }
  }
  function onPointerCancel() {
    if (!drag) return;
    if (drag.ghost) drag.ghost.remove();
    drag.item.classList.remove('dragging-src');
    if (drag.over) drag.over.classList.remove('hover');
    drag = null;
  }

  /* =================================================================
     ٥) السرعة والنجوم
     ================================================================= */
  var speedS = null, speedUsed = [];

  function enterSpeed() {
    if (!$('#speed-plane').innerHTML) $('#speed-plane').innerHTML = ART.planeExterior();
    speedStart();
  }

  function speedStart() {
    var st = state.settings;
    $('#speed-stats').innerHTML = '';
    var html = '<div class="q-start"><h3>⚡ السرعة والنجوم</h3><p>أسئلة سريعة: صح أو خطأ، واختيار من متعدد. كلما أسرعت زادت نقاطك!</p>' +
      '<div class="opt-row"><label>زمن السؤال: <select id="s-time">';
    [5, 8, 10, 15, 20, 25, 30].forEach(function (n) { html += '<option value="' + n + '"' + (n === st.speedTime ? ' selected' : '') + '>' + N(n) + ' ثانية</option>'; });
    html += '</select></label><label>عدد الأسئلة: <select id="s-count">';
    [5, 10, 15, 20, 24].forEach(function (n) { html += '<option value="' + n + '"' + (n === st.speedCount ? ' selected' : '') + '>' + N(n) + '</option>'; });
    html += '</select></label></div><button class="btn-big btn-purple" id="s-go">🚀 انطلق!</button></div>';
    $('#speed-body').innerHTML = html;
  }

  function speedBegin() {
    var st = state.settings;
    st.speedTime = +$('#s-time').value; st.speedCount = +$('#s-count').value; save(); syncTeacher();
    var all = DATA.speed.map(function (q, i) { return i; });
    var unused = all.filter(function (i) { return speedUsed.indexOf(i) < 0; });
    if (unused.length < st.speedCount) { speedUsed = []; unused = all; }
    var list = shuffle(unused).slice(0, Math.min(st.speedCount, unused.length));
    speedUsed = speedUsed.concat(list);
    speedS = { list: list, i: 0, ok: 0, bad: 0, streak: 0, best: 0, answered: false, cd: null };
    Sound.whoosh();
    speedShow();
  }

  function speedStats() {
    $('#speed-stats').innerHTML = '<span class="pill">' + N(speedS.i + 1) + ' / ' + N(speedS.list.length) + '</span><span class="pill">✔ <b>' + N(speedS.ok) + '</b></span><span class="pill">✘ ' + N(speedS.bad) + '</span><span class="pill">🔥 ' + N(speedS.streak) + '</span>';
  }

  function speedShow() {
    stopAllTimers();
    var q = DATA.speed[speedS.list[speedS.i]], t = state.settings.speedTime;
    speedS.answered = false;
    speedStats();
    var who = state.mode === 'teams' ? '<span>يجيب الآن: <b style="color:' + (teamIdx() ? 'var(--orange-d)' : 'var(--blue-d)') + '">' + esc(curTeam().name) + '</b></span>' : '<span>' + esc(curTeam().name) + '</span>';
    var html = '<div class="q-card"><div class="q-meta"><span class="lvl-tag lvl-' + (q.tf ? 'easy' : 'medium') + '">' + (q.tf ? 'صح أم خطأ؟' : 'اختر الإجابة') + '</span>' + who + '<span class="timer-num" id="s-tnum">' + N(t) + '</span></div>' +
      '<div class="q-text">' + esc(q.q) + '</div><div class="timer-bar"><div class="timer-fill" id="s-tfill"></div></div></div>';
    if (q.tf) html += '<div class="tf-row" id="s-opts"><button class="tf-btn tf-true" data-tf="1"' + (q.answer ? ' data-correct="1"' : '') + '>✔ صح</button><button class="tf-btn tf-false" data-tf="0"' + (!q.answer ? ' data-correct="1"' : '') + '>✘ خطأ</button></div>';
    else html += '<div class="options" id="s-opts">' + optionsHTML(q) + '</div>';
    $('#speed-body').innerHTML = html;
    speedS.cd = startCountdown(t, $('#s-tfill'), $('#s-tnum'), function () { speedAnswer(null); });
  }

  function speedAnswer(val) {
    if (speedS.answered) return;
    speedS.answered = true;
    var left = speedS.cd ? speedS.cd.left() : 0;
    stopAllTimers();
    var q = DATA.speed[speedS.list[speedS.i]], ok;
    if (q.tf) {
      ok = val !== null && (val === 1) === q.answer;
      $$('#s-opts .tf-btn').forEach(function (b) {
        b.disabled = true;
        var isTrue = b.getAttribute('data-tf') === '1';
        if (isTrue === q.answer) b.classList.add('correct');
        else if (val !== null && (+b.getAttribute('data-tf')) === val) b.classList.add('wrong');
      });
    } else {
      ok = val === q.answer;
      lockOptions($('#s-opts'), val, q.answer);
    }
    if (ok) {
      speedS.ok++; speedS.streak++; speedS.best = Math.max(speedS.best, speedS.streak);
      var bonus = Math.round(10 * left / state.settings.speedTime);
      Sound.correct();
      addPoints(10 + bonus, $('#s-opts .correct'));
      var p = document.createElement('div'); p.className = 'bonus-pop'; p.textContent = bonus > 0 ? '⚡ +' + N(bonus) + ' سرعة!' : '✔';
      $('#speed-body').appendChild(p);
      if (speedS.streak >= 3) Confetti.burst(50, window.innerWidth / 2, window.innerHeight / 2);
    } else {
      speedS.bad++; speedS.streak = 0;
      Sound.wrong();
      if (val === null) toast('⏰ انتهى الوقت!', 'soft', 1200);
    }
    speedStats();
    afterAnswer();
    addTimer(setTimeout(speedNext, ok ? 1500 : 2300));
  }

  function speedNext() {
    speedS.i++;
    if (speedS.i < speedS.list.length) { speedShow(); return; }
    if (speedS.list.length >= 10) markDone('speed'); else markVisited('speed');
    Sound.fanfare(); Confetti.burst(150);
    $('#speed-stats').innerHTML = '';
    $('#speed-body').innerHTML = '<div class="q-end"><div class="big-ico">⚡</div><h3>انتهى التحدي السريع!</h3><p>✔ ' + N(speedS.ok) + ' صحيحة • ✘ ' + N(speedS.bad) + ' • 🔥 أطول سلسلة: ' + N(speedS.best) + '</p>' + gainSummary() +
      (state.progress.speed === 'done' ? '<span class="medal">⚡ وسام السرعة</span>' : '<p>العب ١٠ أسئلة أو أكثر لتحصل على الوسام</p>') +
      '<div class="row-btns"><button class="btn-big btn-purple" id="s-again">🔁 جولة جديدة</button><button class="btn-big btn-blue" data-back="1">✈️ العودة إلى الطائرة</button></div></div>';
  }

  /* =================================================================
     ٦) الوصول إلى النجومية — عجلة التحدي الذهبي
     ================================================================= */
  var SEGMENTS = [
    { key: 'surprise', label: 'سؤال مفاجئ', icon: '❓', color: '#1e88e5', pts: 10, desc: 'سؤال من الوحدة' },
    { key: 'vocab', label: 'تحدي مفردات', icon: '📚', color: '#0e9f6e', pts: 15, desc: 'معنى أو ضد' },
    { key: 'order', label: 'تحدي ترتيب', icon: '🧩', color: '#8e44ad', pts: 20, desc: 'رتّب الكلمات' },
    { key: 'golden', label: 'سؤال ذهبي', icon: '🏆', color: '#e0a100', pts: 30, desc: 'أصعب سؤال' },
    { key: 'double', label: 'مضاعفة النقاط', icon: '💫', color: '#e2557a', pts: 0, desc: 'الإجابة القادمة ×٢' },
    { key: 'extra', label: 'فرصة إضافية', icon: '🎁', color: '#ff8a00', pts: 5, desc: '+٥ ودورة إضافية' }
  ];
  var wheelS = { rot: 0, spinning: false, left: 6, dbl: [false, false], ptr: { surprise: 0, vocab: 0, order: 0, golden: 0 }, built: false };

  function buildWheel() {
    var n = SEGMENTS.length, R = 190, html = '<svg viewBox="-200 -200 400 400" xmlns="http://www.w3.org/2000/svg">';
    html += '<circle r="198" fill="#fff"/>';
    for (var i = 0; i < n; i++) {
      var a0 = (i * 360 / n - 90) * Math.PI / 180, a1 = ((i + 1) * 360 / n - 90) * Math.PI / 180;
      var x0 = R * Math.cos(a0), y0 = R * Math.sin(a0), x1 = R * Math.cos(a1), y1 = R * Math.sin(a1);
      html += '<path d="M0 0 L' + x0 + ' ' + y0 + ' A' + R + ' ' + R + ' 0 0 1 ' + x1 + ' ' + y1 + ' Z" fill="' + SEGMENTS[i].color + '" stroke="#fff" stroke-width="4"/>';
      var mid = i * 360 / n + 180 / n;
      var words = SEGMENTS[i].label.split(' ');
      var flip = mid > 90 && mid < 270 ? ' rotate(180)' : '';
      html += '<g transform="rotate(' + mid + ')">' +
        '<g transform="translate(0 -142)' + flip + '"><text y="12" text-anchor="middle" font-size="34">' + SEGMENTS[i].icon + '</text></g>' +
        '<g transform="translate(0 -90)' + flip + '"><text text-anchor="middle" font-size="19" font-weight="800" fill="#fff" font-family="Baloo Bhaijaan 2, Cairo, sans-serif" direction="rtl">' +
        (words.length > 1 ? '<tspan x="0" y="-4">' + words[0] + '</tspan><tspan x="0" y="18">' + words.slice(1).join(' ') + '</tspan>' : '<tspan x="0" y="7">' + words[0] + '</tspan>') +
        '</text></g></g>';
    }
    for (var k = 0; k < 24; k++) {
      var ang = k * 15 * Math.PI / 180;
      html += '<circle cx="' + (194 * Math.cos(ang)) + '" cy="' + (194 * Math.sin(ang)) + '" r="5" fill="' + (k % 2 ? '#ffc83d' : '#fff') + '" stroke="#e09200" stroke-width="1.5"/>';
    }
    html += '<circle r="196" fill="none" stroke="#e09200" stroke-width="6"/></svg>';
    $('#wheel-rot').innerHTML = html;
    var lg = '';
    SEGMENTS.forEach(function (s) { lg += '<div class="wl" style="--c:' + s.color + '"><b>' + s.icon + '</b><div>' + s.label + '<small>' + s.desc + (s.pts && s.key !== 'extra' ? ' • ' + N(s.pts) + ' نقطة' : '') + '</small></div></div>'; });
    $('#wheel-legend').innerHTML = lg;
    wheelS.built = true;
  }

  function enterWheel() {
    if (!wheelS.built) buildWheel();
    if (wheelS.left <= 0 || wheelS.sessionDone) { wheelS.left = state.settings.spins; wheelS.sessionDone = false; }
    wheelStatus();
  }

  function wheelStatus() {
    var dbl = state.mode === 'solo' ? wheelS.dbl[0] : wheelS.dbl[teamIdx()];
    $('#wheel-status').innerHTML = '<span class="pill">🎡 الدورات المتبقية: ' + N(wheelS.left) + '</span>' + (dbl ? '<span class="dbl-flag">💫 نقاط مضاعفة لـ ' + esc(curTeam().name) + '</span>' : '');
    var dis = wheelS.left <= 0 || wheelS.spinning;
    $('#wheel-spin').disabled = dis; $('#wheel-spin2').disabled = dis;
    $('#btn-land').classList.toggle('btn-gold', wheelS.left <= 0);
  }

  function spinWheel() {
    if (wheelS.spinning || wheelS.left <= 0) return;
    Sound.init();
    wheelS.spinning = true; wheelS.left--;
    wheelStatus();
    var idx = Math.floor(Math.random() * SEGMENTS.length);
    var seg = 360 / SEGMENTS.length;
    var target = (360 - (idx * seg + seg / 2)) % 360;
    var cur = ((wheelS.rot % 360) + 360) % 360;
    var delta = 360 * 5 + ((target - cur + 360) % 360);
    wheelS.rot += delta;
    $('#wheel-rot').style.transform = 'rotate(' + wheelS.rot + 'deg)';
    // أصوات النقرات تتباطأ مع العجلة
    var t = 0, gap = 50;
    while (t < 4700) { addTimer(setTimeout(function () { Sound.tick(); }, t)); t += gap; gap *= 1.07; }
    addTimer(setTimeout(function () {
      wheelS.spinning = false;
      wheelStatus();
      Sound.ding();
      wheelChallenge(SEGMENTS[idx]);
    }, 5150));
  }

  function nextFrom(key, arr) {
    var i = wheelS.ptr[key] % arr.length; wheelS.ptr[key]++;
    return arr[i];
  }

  function wheelChallenge(seg) {
    var ti = teamIdx(), team = curTeam();
    if (seg.key === 'double') {
      wheelS.dbl[ti] = true; wheelStatus();
      openModal('<div class="mb-head"><span class="mb-ico">💫</span><div><h3>مضاعفة النقاط!</h3><p>الإجابة الصحيحة القادمة لـ «' + esc(team.name) + '» بنقاط مضاعفة. أدِر العجلة مرة أخرى!</p></div></div><div class="row-btns"><button class="btn-big btn-gold" data-close="modal">🎡 رائع، أكمل</button></div>', 'golden');
      Sound.star(); Confetti.burst(60);
      return;
    }
    if (seg.key === 'extra') {
      wheelS.left++; wheelStatus();
      addPoints(5);
      openModal('<div class="mb-head"><span class="mb-ico">🎁</span><div><h3>فرصة إضافية!</h3><p>حصل «' + esc(team.name) + '» على ٥ نقاط ودورة إضافية للعجلة.</p></div></div><div class="row-btns"><button class="btn-big btn-gold" data-close="modal">🎡 أدِر مرة أخرى</button></div>', 'golden');
      Sound.star();
      return;
    }
    if (seg.key === 'order') { wheelOrder(seg); return; }
    var pool = seg.key === 'surprise' ? DATA.wheel.surprise.concat(DATA.quiz.filter(function (q) { return q.level === 'easy'; }))
      : seg.key === 'vocab' ? DATA.wheel.vocab : DATA.wheel.golden.concat(DATA.quiz.filter(function (q) { return q.level === 'hard'; }));
    var q = nextFrom(seg.key, pool);
    var html = '<div class="mb-head"><span class="mb-ico">' + seg.icon + '</span><div><h3>' + seg.label + '</h3><p>' + esc(team.name) + ' • ' + N(seg.pts) + ' نقطة' + (wheelS.dbl[ti] ? ' × ٢' : '') + '</p></div></div>' +
      '<div class="q-text">' + esc(q.q) + '</div><div class="options" id="w-opts">' + optionsHTML(q) + '</div><div id="w-res"></div>';
    openModal(html, seg.key === 'golden' ? 'golden' : '');
    var box = $('#w-opts');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.opt'); if (!b || b.disabled) return;
      var oi = +b.getAttribute('data-oi'), ok = oi === q.answer;
      lockOptions(box, oi, q.answer);
      wheelResult(ok, seg, ti, q.src);
    });
  }

  function wheelResult(ok, seg, ti, src) {
    var pts = seg.pts * (wheelS.dbl[ti] ? 2 : 1);
    if (ok) {
      Sound.correct(); Confetti.burst(100);
      addPoints(pts, $('#modal-box'), ti);
      if (wheelS.dbl[ti]) wheelS.dbl[ti] = false;
    } else Sound.wrong();
    $('#w-res').innerHTML = '<div class="explain' + (ok ? '' : ' bad') + '" style="margin-top:12px"><span class="ex-ico">' + (ok ? '🌟' : '📘') + '</span><div class="ex-text"><b>' + (ok ? 'إجابة صحيحة! +' + N(pts) : 'إجابة غير صحيحة، الإجابة الصحيحة مظللة بالأخضر') + '</b>' + (src ? '<span class="ex-src">كتاب لغتي ص ' + N(src) + '</span>' : '') + '</div><button class="btn-big btn-blue" id="w-continue">متابعة ⬅</button></div>';
    var cont = $('#w-continue');
    if (cont) cont.addEventListener('click', function () { closeModal('modal'); afterAnswer(); wheelStatus(); wheelEndCheck(); });
  }

  function wheelOrder(seg) {
    var ti = teamIdx(), team = curTeam(), item = nextFrom('order', DATA.wheel.order);
    var words = item.words, built = [];
    var pool = shuffle(words.map(function (w, i) { return i; }));
    var html = '<div class="mb-head"><span class="mb-ico">🧩</span><div><h3>تحدي ترتيب</h3><p>' + esc(team.name) + ' • انقر الكلمات بالترتيب الصحيح لتكوين جملة • ' + N(seg.pts) + ' نقطة' + (wheelS.dbl[ti] ? ' × ٢' : '') + '</p></div></div>' +
      '<div class="build-row" id="w-build"></div><div class="build-pool" id="w-pool">';
    pool.forEach(function (i) { html += '<button class="wbtn" data-wi="' + i + '">' + esc(words[i]) + '</button>'; });
    html += '</div><div class="row-btns" style="margin-top:12px"><button class="btn-small" id="w-reset">↺ إعادة</button><button class="btn-big btn-green" id="w-check" disabled>✔ تحقق</button></div><div id="w-res"></div>';
    openModal(html);
    function redraw() {
      $('#w-build').innerHTML = built.map(function (i, k) { return '<button class="wbtn in" data-bi="' + k + '">' + esc(words[i]) + '</button>'; }).join('');
      $$('#w-pool .wbtn').forEach(function (b) { b.classList.toggle('used', built.indexOf(+b.getAttribute('data-wi')) >= 0); });
      $('#w-check').disabled = built.length !== words.length;
    }
    $('#w-pool').addEventListener('click', function (e) {
      var b = e.target.closest('.wbtn'); if (!b || b.classList.contains('used')) return;
      built.push(+b.getAttribute('data-wi')); Sound.click(); redraw();
    });
    $('#w-build').addEventListener('click', function (e) {
      var b = e.target.closest('.wbtn'); if (!b || $('#w-check').hidden) return;
      built.splice(+b.getAttribute('data-bi'), 1); redraw();
    });
    $('#w-reset').addEventListener('click', function () { built = []; redraw(); });
    $('#w-check').addEventListener('click', function () {
      var sentence = built.map(function (i) { return words[i]; }).join(' ');
      var ok = sentence === words.join(' ');
      $('#w-check').hidden = true; $('#w-reset').hidden = true;
      $$('#w-pool .wbtn').forEach(function (b) { b.disabled = true; });
      if (!ok) $('#w-build').insertAdjacentHTML('afterend', '<div class="hint-box">الجملة الصحيحة: ' + esc(words.join(' ')) + '</div>');
      wheelResult(ok, seg, ti, item.src);
    });
  }

  function wheelEndCheck() {
    if (wheelS.left <= 0) {
      wheelS.sessionDone = true;
      markDone('gate');
      toast('🛬 انتهت دورات العجلة! اضغط «الهبوط في المطار» لإعلان الفائز', 'good', 3500);
    }
  }

  /* =================================================================
     الهبوط والاحتفال والشهادة
     ================================================================= */
  var landingTimers = [];
  function startLanding() {
    closeModal('modal'); closeModal('teacher');
    if (state.progress.gate !== 'done' && wheelS.left < state.settings.spins) markDone('gate');
    showScreen('landing');
    if (!$('#landing-scene').innerHTML) $('#landing-scene').innerHTML = ART.landingScene();
    var pl = $('#landing-plane');
    pl.innerHTML = ART.planeExterior({ gear: true });
    pl.classList.remove('go'); void pl.offsetWidth; pl.classList.add('go');
    $('#landing-msg').classList.remove('show');
    Sound.init(); Sound.engine(4.2);
    landingTimers.forEach(clearTimeout);
    landingTimers = [
      setTimeout(function () {
        var r = pl.getBoundingClientRect();
        for (var i = 0; i < 4; i++) {
          var s = document.createElement('div'); s.className = 'smoke';
          s.style.left = (r.left + r.width * (0.25 + i * 0.04)) + 'px'; s.style.top = (r.top + r.height * 0.7) + 'px';
          s.style.animationDelay = (i * 0.08) + 's';
          $('#scr-landing').appendChild(s);
          setTimeout(function (el) { el.remove(); }.bind(null, s), 1500);
        }
        Sound.noise(0.6, 0.3, 300, 120);
      }, 3750),
      setTimeout(function () { $('#landing-msg').classList.add('show'); Sound.ding(); }, 4700),
      setTimeout(showWin, 7600)
    ];
  }

  function showWin() {
    landingTimers.forEach(clearTimeout);
    showScreen('win');
    var t = state.teams, html = '', title;
    if (state.mode === 'solo') {
      title = '🏆 أحسنت يا ' + t[0].name + '!';
      html = podHTML(0, true);
    } else {
      var w = t[0].score === t[1].score ? -1 : (t[0].score > t[1].score ? 0 : 1);
      title = w < 0 ? '🤝 تعادل رائع! كلاكما قائد مبدع' : '🏆 الفريق الفائز: ' + t[w].name;
      html = podHTML(0, w === 0 || w < 0) + podHTML(1, w === 1 || w < 0);
    }
    $('#win-title').textContent = title;
    $('#podium').innerHTML = html;
    Sound.fanfare();
    Confetti.burst(220);
    setTimeout(function () { Confetti.burst(160); }, 1200);
  }

  function podHTML(i, win) {
    var t = state.teams[i], st = stars(t.score), starsStr = '';
    for (var k = 0; k < Math.min(st, 5); k++) starsStr += '⭐';
    if (st > 5) starsStr = '⭐ × ' + N(st);
    return '<div class="pod t' + i + (win ? ' winner' : '') + '"><h3>' + (state.mode === 'solo' ? '🧒 ' : (i ? '🟠 ' : '🔵 ')) + esc(t.name) + '</h3><div class="pts">' + N(t.score) + '</div><div>نقطة</div><div class="stars">' + (starsStr || '—') + '</div>' +
      '<div class="badges">' + t.badges.map(function (b) { return '<span>' + (BADGES[b] || b) + '</span>'; }).join('') + '</div></div>';
  }

  function winnerName() {
    var t = state.teams;
    if (state.mode === 'solo') return t[0].name;
    if (t[0].score === t[1].score) return t[0].name + ' و' + t[1].name;
    return t[0].score > t[1].score ? t[0].name : t[1].name;
  }
  function winnerScore() {
    var t = state.teams;
    if (state.mode === 'solo') return t[0].score;
    return Math.max(t[0].score, t[1].score);
  }

  function hijriDate() {
    var d = new Date(), out = '';
    try { out = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch (e) { }
    var g = '';
    try { g = new Intl.DateTimeFormat('ar-EG-u-ca-gregory-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch (e) { g = d.toLocaleDateString(); }
    return out ? out + ' — ' + g : g;
  }

  function drawCertificate(name, score) {
    var W = 2000, H = 1414, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    var FUN = '"Baloo Bhaijaan 2", "Cairo", sans-serif', UI = '"Cairo", sans-serif';
    c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'middle';
    // الخلفية
    var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#fffdf6'); bg.addColorStop(1, '#fff3d6');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    // سماء ناعمة أعلى الشهادة
    var sky = c.createLinearGradient(0, 0, 0, 380); sky.addColorStop(0, 'rgba(90,184,245,.35)'); sky.addColorStop(1, 'rgba(90,184,245,0)');
    c.fillStyle = sky; c.fillRect(40, 40, W - 80, 380);
    // الإطار
    c.lineWidth = 26; c.strokeStyle = '#0e9f6e'; roundRect(c, 40, 40, W - 80, H - 80, 50); c.stroke();
    c.lineWidth = 8; c.strokeStyle = '#ffc83d'; roundRect(c, 78, 78, W - 156, H - 156, 36); c.stroke();
    c.setLineDash([18, 14]); c.lineWidth = 4; c.strokeStyle = '#1e88e5'; roundRect(c, 104, 104, W - 208, H - 208, 28); c.stroke(); c.setLineDash([]);
    // نجوم الزوايا
    [[170, 170], [W - 170, 170], [170, H - 170], [W - 170, H - 170]].forEach(function (p) { drawStar(c, p[0], p[1], 52, '#ffc83d', '#e09200'); });
    // طائرة صغيرة
    c.save(); c.translate(W / 2 - 230, 120); c.scale(0.46, 0.46);
    c.fillStyle = '#ffffff'; c.strokeStyle = '#8aa2c2'; c.lineWidth = 6;
    var body = new Path2D('M150 116 L790 116 C880 116 958 160 978 205 C986 226 975 246 950 253 L902 263 C872 269 842 271 800 271 L262 271 C200 271 150 256 110 226 L32 152 C24 141 34 132 50 131 Z');
    var fin = new Path2D('M70 140 L26 22 C23 12 30 6 40 6 L98 6 C112 6 122 13 130 24 L232 126 Z');
    var wing = new Path2D('M500 232 L650 232 L470 372 L412 374 Z');
    c.fillStyle = '#0e9f6e'; c.fill(fin);
    c.fillStyle = '#ffffff'; c.fill(body); c.stroke(body);
    c.fillStyle = '#ff8a00'; c.fillRect(120, 206, 840, 12);
    c.fillStyle = '#d3e0ef'; c.fill(wing); c.stroke(wing);
    c.fillStyle = '#2f6fb5'; for (var x = 230; x <= 820; x += 40) { c.beginPath(); c.ellipse(x, 168, 9, 12, 0, 0, 6.3); c.fill(); }
    c.restore();
    // النصوص
    c.fillStyle = '#16294d'; c.font = '800 112px ' + FUN; c.fillText('شهادة قائد الرحلة المبدع', W / 2, 400);
    c.fillStyle = '#0b7a55'; c.font = '700 46px ' + UI; c.fillText('رحلتنا مع لغتي — مغامرة الطائرة التعليمية', W / 2, 500);
    c.fillStyle = '#4a5d7c'; c.font = '600 46px ' + UI; c.fillText('تُمنح هذه الشهادة بكل فخر إلى', W / 2, 600);
    // شريط الاسم
    var nameFont = 120; c.font = '800 ' + nameFont + 'px ' + FUN;
    while (c.measureText(name).width > 1400 && nameFont > 60) { nameFont -= 6; c.font = '800 ' + nameFont + 'px ' + FUN; }
    var nw = Math.min(1500, c.measureText(name).width + 200);
    c.fillStyle = '#ff8a00'; roundRect(c, W / 2 - nw / 2, 650, nw, 170, 85); c.fill();
    c.fillStyle = '#ffffff'; c.fillText(name, W / 2, 740);
    c.fillStyle = '#1d2b45'; c.font = '600 46px ' + UI;
    c.fillText('تقديرًا لتميّزه وإبداعه وحسن تعامله مع الآخرين في رحلة «رحلتنا مع لغتي»', W / 2, 900);
    c.fillText('لغتي – الصف الثالث الابتدائي – الوحدة الأولى: التعامل مع الآخرين', W / 2, 970);
    c.fillStyle = '#0b7a55'; c.font = '800 54px ' + FUN; c.fillText('⭐ بمجموع ' + N(score) + ' نقطة ⭐', W / 2, 1060);
    c.fillStyle = '#1e88e5'; c.font = '700 40px ' + FUN; c.fillText('قال رسول الله ﷺ: «إنَّ مِنْ خِيارِكُمْ أَحْسَنَكُمْ أَخْلاقًا»', W / 2, 1140);
    c.font = '600 34px ' + UI; c.fillStyle = '#4a5d7c';
    c.textAlign = 'right'; c.fillText('المعلم/ة: ...........................', W - 260, 1240);
    c.textAlign = 'left'; c.fillText('التاريخ: ' + hijriDate(), 250, 1240);
    return cv;
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function drawStar(c, cx, cy, r, fill, stroke) {
    c.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); }
    c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 4; c.strokeStyle = stroke; c.stroke();
  }

  function openCertificate() {
    var html = '<div class="mb-head"><span class="mb-ico">📜</span><div><h3>شهادة «قائد الرحلة المبدع»</h3><p>يمكنك تعديل الاسم، ثم الطباعة أو الحفظ كصورة</p></div><button class="x-btn" data-close="modal" style="margin-inline-start:auto">✕</button></div>' +
      '<img class="cert-img" id="cert-img" alt="شهادة قائد الرحلة المبدع">' +
      '<div class="cert-controls"><label>الاسم: <input id="cert-name" maxlength="40" value="' + esc(winnerName()) + '"></label>' +
      (window.LUGHTI_HOSTED ? '</div><p class="cert-hint">📱 لحفظ الشهادة على الآيباد: اضغط مطولًا على صورة الشهادة ثم اختر «حفظ في الصور». وعلى الكمبيوتر: انقر عليها بزر الفأرة الأيمن ثم «حفظ الصورة».</p>'
        : '<button class="btn-big btn-gold" id="cert-print">🖨️ طباعة</button><button class="btn-big btn-green" id="cert-save">💾 حفظ صورة</button></div>');
    openModal(html);
    var render = function () {
      var name = $('#cert-name').value.trim() || winnerName();
      var url = drawCertificate(name, winnerScore()).toDataURL('image/png');
      $('#cert-img').src = url;
      return url;
    };
    var ready = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('800 60px "Baloo Bhaijaan 2"'), document.fonts.load('600 40px "Cairo"'), document.fonts.load('700 40px "Cairo"')]).catch(function () { }) : Promise.resolve();
    ready.then(render);
    $('#cert-name').addEventListener('input', render);
    if (window.LUGHTI_HOSTED) return;
    $('#cert-print').addEventListener('click', function () {
      $('#print-area').innerHTML = '<img src="' + render() + '" alt="">';
      setTimeout(function () { window.print(); }, 150);
    });
    $('#cert-save').addEventListener('click', function () {
      var name = $('#cert-name').value.trim() || winnerName();
      var cv = drawCertificate(name, winnerScore());
      var fname = 'Lughti-Captain-Certificate.png';
      var go = function (href, revoke) {
        var a = document.createElement('a');
        a.href = href; a.download = fname;
        document.body.appendChild(a); a.click(); a.remove();
        if (revoke) setTimeout(function () { URL.revokeObjectURL(href); }, 4000);
        toast('💾 تم حفظ الشهادة في مجلد التنزيلات', 'good');
      };
      if (cv.toBlob && window.URL && URL.createObjectURL) cv.toBlob(function (b) { go(URL.createObjectURL(b), true); }, 'image/png');
      else go(cv.toDataURL('image/png'));
    });
  }

  /* =================================================================
     النوافذ
     ================================================================= */
  function openModal(html, cls) {
    var box = $('#modal-box');
    box.className = 'modal-box ' + (cls || '');
    box.innerHTML = html;
    $('#modal').classList.add('show');
  }
  /* نافذة تأكيد داخل الصفحة (بديل confirm الذي تمنعه بعض المتصفحات) */
  function askConfirm(title, msg, yesLabel, onYes) {
    openModal('<div class="mb-head"><span class="mb-ico">❓</span><div><h3>' + esc(title) + '</h3><p>' + esc(msg) + '</p></div></div>' +
      '<div class="row-btns"><button class="btn-big btn-amber" id="cf-yes">' + yesLabel + '</button><button class="btn-big btn-blue" data-close="modal">✕ إلغاء</button></div>');
    $('#cf-yes').addEventListener('click', function () { closeModal('modal'); onYes(); });
  }

  function closeModal(id) {
    var m = $('#' + id);
    if (m) m.classList.remove('show');
  }

  /* =================================================================
     لوحة تحكم المعلم
     ================================================================= */
  function fillSelect(sel, values, cur, suffix) {
    sel.innerHTML = values.map(function (v) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + N(v) + (suffix || '') + '</option>'; }).join('');
  }

  function syncTeacher() {
    var st = state.settings;
    fillSelect($('#tp-quiz-count'), [5, 8, 10, 12, 15, 20, 25, 30, 32], st.quizCount);
    fillSelect($('#tp-speed-count'), [5, 10, 15, 20, 24], st.speedCount);
    fillSelect($('#tp-spins'), [3, 4, 5, 6, 8, 10, 12], st.spins);
    fillSelect($('#tp-quiz-time'), [10, 15, 20, 30, 45, 60], st.quizTime, ' ث');
    fillSelect($('#tp-speed-time'), [5, 8, 10, 15, 20, 25, 30], st.speedTime, ' ث');
    $('#tp-level').value = st.level;
    $('#tp-timer').checked = st.timerOn;
    $('#tp-autoswitch').checked = st.autoSwitch;
    $('#tp-show-answers').checked = st.showAnswers;
    $('#tp-sound').checked = st.sound;
    $('#tp-volume').value = st.volume;
    document.body.classList.toggle('show-answers', st.showAnswers);
    $('#btn-sound').textContent = st.sound ? '🔊' : '🔇';
    renderTeacherTeams();
  }

  function renderTeacherTeams() {
    var box = $('#tp-teams');
    if (!box || box.contains(document.activeElement)) { if (box) $$('.sc', box).forEach(function (s, i) { s.textContent = N(state.teams[i].score); }); return; }
    var html = '';
    [0, 1].forEach(function (i) {
      var t = state.teams[i];
      html += '<div class="tp-team t' + i + '"><label>اسم ' + (i ? 'الفريق البرتقالي' : (state.mode === 'solo' ? 'اللاعب' : 'الفريق الأزرق')) + ' <input type="text" data-tname="' + i + '" value="' + esc(t.name) + '" maxlength="24"></label>' +
        '<div class="tp-score-row"><button data-adj="' + i + '" data-v="-10">−١٠</button><button data-adj="' + i + '" data-v="-1">−١</button><span class="sc">' + N(t.score) + '</span><button data-adj="' + i + '" data-v="1">+١</button><button data-adj="' + i + '" data-v="10">+١٠</button>' +
        (state.mode === 'teams' ? '<button data-turn="' + i + '" style="min-width:auto;padding:0 10px">👉 دوره</button>' : '') + '</div></div>';
    });
    box.innerHTML = html;
    var g = '';
    [{ id: 'cabin', icon: '🗺️', name: 'خريطة الطائرة', color: '#16294d' }].concat(ART.SECTIONS.slice().sort(function (a, b) { return a.num - b.num; }).map(function (s) { return { id: s.id, icon: s.icon, name: s.game, color: 'var(--sec-' + s.id + ')' }; }))
      .forEach(function (s) { g += '<button data-tgo="' + s.id + '" style="background:' + s.color + '">' + s.icon + ' ' + s.name + '</button>'; });
    g += '<button data-tgo="landing" style="background:#0b7a55">🛬 الهبوط والفوز</button>';
    $('#tp-games').innerHTML = g;
  }

  function answerKey() {
    var h = '<div class="mb-head"><span class="mb-ico">📖</span><div><h3>الإجابات الصحيحة</h3><p>للمعلم فقط • مأخوذة من الوحدة الأولى في كتاب لغتي</p></div><button class="x-btn" data-close="modal" style="margin-inline-start:auto">✕</button></div><div class="key-list">';
    h += '<h4>💺 تحدي الركاب</h4><ol>';
    DATA.quiz.forEach(function (q) { h += '<li>' + esc(q.q) + ' ← <b>' + esc(q.options[q.answer]) + '</b> <span class="src">(' + LEVEL_NAMES[q.level] + ' • ص ' + N(q.src) + ')</span></li>'; });
    h += '</ol><h4>⚡ السرعة والنجوم</h4><ol>';
    DATA.speed.forEach(function (q) { h += '<li>' + esc(q.q) + ' ← <b>' + (q.tf ? (q.answer ? 'صح' : 'خطأ') : esc(q.options[q.answer])) + '</b> <span class="src">(ص ' + N(q.src) + ')</span></li>'; });
    h += '</ol><h4>🧳 حقيبة الكلمات</h4><ol>';
    DATA.dragdrop.forEach(function (a) {
      var sol = a.kind === 'match' ? a.items.map(function (p) { return p[0] + ' ← ' + p[1]; }).join(' | ')
        : a.kind === 'classify' ? a.bins.map(function (b, k) { return b + ': ' + a.items.filter(function (p) { return p[1] === k; }).map(function (p) { return p[0]; }).join('، '); }).join(' | ')
          : a.items.map(function (t, k) { return N(k + 1) + ') ' + t; }).join(' ');
      h += '<li><b>' + esc(a.title) + ':</b> ' + esc(sol) + '</li>';
    });
    h += '</ol><h4>🎡 عجلة التحدي الذهبي</h4><ol>';
    DATA.wheel.surprise.concat(DATA.wheel.vocab, DATA.wheel.golden).forEach(function (q) { h += '<li>' + esc(q.q) + ' ← <b>' + esc(q.options[q.answer]) + '</b></li>'; });
    DATA.wheel.order.forEach(function (o) { h += '<li>ترتيب: <b>' + esc(o.words.join(' ')) + '</b></li>'; });
    h += '</ol></div>';
    openModal(h);
  }

  function resetScores() {
    state.teams.forEach(function (t) { t.score = 0; t.badges = []; });
    state.active = 0; save(); renderScoreboard();
  }

  function resetAll() {
    var keepNames = [state.teams[0].name, state.teams[1].name];
    var keepSettings = clone(state.settings), mode = state.mode;
    state = clone(DEFAULT_STATE);
    state.settings = keepSettings; state.mode = mode;
    state.teams[0].name = keepNames[0]; state.teams[1].name = keepNames[1];
    wheelS.left = state.settings.spins; wheelS.dbl = [false, false]; wheelS.sessionDone = false;
    speedUsed = [];
    save(); renderScoreboard(); renderProgress(); syncTeacher();
  }

  /* =================================================================
     ملء الشاشة
     ================================================================= */
  function toggleFullscreen() {
    var d = document, el = d.documentElement;
    var isFs = d.fullscreenElement || d.webkitFullscreenElement;
    try {
      if (!isFs) { (el.requestFullscreen || el.webkitRequestFullscreen || function () { toast('المتصفح لا يدعم ملء الشاشة، اضغط F11', 'soft'); }).call(el); }
      else { (d.exitFullscreen || d.webkitExitFullscreen).call(d); }
    } catch (e) { toast('اضغط F11 لملء الشاشة', 'soft'); }
  }

  /* =================================================================
     ربط الأحداث
     ================================================================= */
  function bind() {
    document.addEventListener('pointerdown', function () { Sound.init(); }, { capture: true });
    // سفاري على الآيباد يفتح الصوت عند انتهاء اللمسة أو النقر
    document.addEventListener('touchend', function () { Sound.init(); }, { capture: true, passive: true });
    document.addEventListener('click', function () { Sound.init(); }, { capture: true });

    $('#btn-start').addEventListener('click', function () {
      Sound.init(); Sound.whoosh();
      var s = $('#scr-splash');
      s.classList.add('zooming');
      setTimeout(function () {
        s.classList.remove('zooming');
        showScreen('cabin');
        setCam('translate(' + cam.ox + 'px,' + cam.oy + 'px) scale(.6)', false);
        layoutCamera(false);
        setTimeout(function () { setCam('translate(' + cam.ox + 'px,' + cam.oy + 'px) scale(1)', true); }, 30);
        toast('✈️ أهلًا بك على متن الطائرة! اختر قسمًا لتبدأ', 'good', 2600);
      }, 1050);
    });

    // أقسام الخريطة
    $('#camera').addEventListener('click', function (e) {
      var g = e.target.closest('[data-sec]');
      if (g) goSection(g.getAttribute('data-sec'));
    });
    $('#camera').addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.sec')) { e.preventDefault(); goSection(e.target.closest('.sec').getAttribute('data-sec')); }
    });
    $('#minimap-wrap').addEventListener('click', function (e) {
      var m = e.target.closest('.mm-sec');
      if (m) goSection(m.getAttribute('data-sec'));
      else if (current !== 'cabin') backToPlane();
    });

    $('#btn-back-plane').addEventListener('click', backToPlane);
    $('#btn-switch-turn').addEventListener('click', function () { Sound.click(); switchTurn(); });
    $('#btn-sound').addEventListener('click', function () { state.settings.sound = !state.settings.sound; save(); syncTeacher(); Sound.init(); Sound.click(); });
    $('#btn-fullscreen').addEventListener('click', toggleFullscreen);
    $('#btn-teacher').addEventListener('click', function () { syncTeacher(); $('#teacher').classList.add('show'); });
    $('#scoreboard').addEventListener('click', function (e) {
      var c = e.target.closest('.team-card');
      if (c) { setActive(+c.getAttribute('data-team')); Sound.click(); }
    });

    // نقرات عامة بالسمات
    document.addEventListener('click', function (e) {
      var t = e.target;
      var go = t.closest('[data-go]');
      if (go && !t.closest('#camera')) { goSection(go.getAttribute('data-go')); return; }
      if (t.closest('[data-back]')) { backToPlane(); return; }
      var cl = t.closest('[data-close]');
      if (cl) { closeModal(cl.getAttribute('data-close')); return; }
    });
    $$('.modal').forEach(function (m) {
      m.addEventListener('click', function (e) { if (e.target === m && m.id === 'teacher') closeModal('teacher'); });
    });

    // القمرة
    $$('.mode-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        state.mode = b.getAttribute('data-mode'); state.active = 0; save();
        Sound.click(); renderCockpit(); renderScoreboard();
        $('#pilot-speech').textContent = state.mode === 'solo' ? 'رائع! ستلعب بمفردك؛ اكتب اسمك وابدأ رحلتك.' : 'ممتاز! فريقان يتنافسان: الأزرق والبرتقالي. من سيكون قائد الرحلة المبدع؟';
      });
    });
    [0, 1].forEach(function (i) {
      $('#cp-name-' + i).addEventListener('input', function (e) { state.teams[i].name = e.target.value.trim() || DEFAULT_STATE.teams[i].name; save(); renderScoreboard(); });
    });

    // البطاقات
    $('#cards-filter').addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      cardsS.filter = b.getAttribute('data-filter');
      $$('#cards-filter .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
      Sound.click(); buildDeck();
    });
    $('#flip-card').addEventListener('click', flipCard);
    $('#flip-card').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard(); } });
    $('#card-next').addEventListener('click', function () { nextCard(1); });
    $('#card-prev').addEventListener('click', function () { nextCard(-1); });
    $('#card-know').addEventListener('click', cardKnow);
    $('#card-again').addEventListener('click', cardAgain);

    // تحدي الركاب
    $('#quiz-body').addEventListener('click', function (e) {
      var t = e.target;
      var lv = t.closest('.level-btn');
      if (lv) { state.settings.level = lv.getAttribute('data-level'); save(); Sound.click(); $$('.level-btn').forEach(function (b) { b.classList.toggle('on', b === lv); }); syncTeacher(); return; }
      if (t.closest('#q-go')) { quizBegin(); return; }
      var o = t.closest('.opt');
      if (o && !o.disabled) { quizAnswer(+o.getAttribute('data-oi')); return; }
      if (t.closest('#q-hint')) { quizHint(); return; }
      if (t.closest('#q-skip')) { quizAnswer(-2); return; }
      if (t.closest('#q-next')) { quizNext(); return; }
      if (t.closest('#q-again')) { quizStartScreen(); return; }
    });

    // حقيبة الكلمات
    $('#bags-list-btn').addEventListener('click', function () { Sound.click(); bagsList(); });
    $('#bags-body').addEventListener('click', function (e) {
      var t = e.target;
      var tag = t.closest('.act-tag');
      if (tag) { bagsOpen(+tag.getAttribute('data-act')); return; }
      if (t.closest('#bag-list')) { bagsList(); return; }
      if (t.closest('#bag-next')) { bagsOpen((bagS.idx + 1) % DATA.dragdrop.length); return; }
      var tgt = t.closest('[data-drop]');
      if (tgt && bagS.selected) { bagDrop(bagS.selected, tgt); }
    });
    $('#bags-body').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var it = e.target.closest('.ditem');
      if (it && !it.classList.contains('placed')) {
        e.preventDefault(); clearSelection(); bagS.selected = it; it.classList.add('selected');
        $$('[data-drop]').forEach(function (t) { if (!t.classList.contains('filled')) { t.classList.add('pickable'); t.tabIndex = 0; } });
        return;
      }
      var tg = e.target.closest('[data-drop]');
      if (tg && bagS.selected) { e.preventDefault(); bagDrop(bagS.selected, tg); }
    });
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);

    // السرعة
    $('#speed-body').addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('#s-go')) { speedBegin(); return; }
      if (t.closest('#s-again')) { speedStart(); return; }
      var tf = t.closest('.tf-btn');
      if (tf && !tf.disabled) { speedAnswer(+tf.getAttribute('data-tf')); return; }
      var o = t.closest('.opt');
      if (o && !o.disabled) speedAnswer(+o.getAttribute('data-oi'));
    });

    // العجلة
    $('#wheel-spin').addEventListener('click', spinWheel);
    $('#wheel-spin2').addEventListener('click', spinWheel);
    $('#btn-land').addEventListener('click', startLanding);
    $('#landing-skip').addEventListener('click', showWin);

    // الفوز
    $('#btn-cert').addEventListener('click', openCertificate);
    $('#btn-win-plane').addEventListener('click', function () { showScreen('cabin'); });
    $('#btn-new-trip').addEventListener('click', function () {
      askConfirm('بدء رحلة جديدة؟', 'سيتم تصفير النقاط والأوسمة والتقدم.', '🔁 نعم، رحلة جديدة', function () {
        resetAll(); showScreen('cabin'); toast('✈️ رحلة جديدة! بالتوفيق للجميع', 'good');
      });
    });

    // لوحة المعلم
    var st = function () { return state.settings; };
    $('#tp-quiz-count').addEventListener('change', function (e) { st().quizCount = +e.target.value; save(); });
    $('#tp-speed-count').addEventListener('change', function (e) { st().speedCount = +e.target.value; save(); });
    $('#tp-spins').addEventListener('change', function (e) { st().spins = +e.target.value; wheelS.left = st().spins; save(); if (current === 'wheel') wheelStatus(); });
    $('#tp-level').addEventListener('change', function (e) { st().level = e.target.value; save(); });
    $('#tp-timer').addEventListener('change', function (e) { st().timerOn = e.target.checked; save(); });
    $('#tp-quiz-time').addEventListener('change', function (e) { st().quizTime = +e.target.value; save(); });
    $('#tp-speed-time').addEventListener('change', function (e) { st().speedTime = +e.target.value; save(); });
    $('#tp-autoswitch').addEventListener('change', function (e) { st().autoSwitch = e.target.checked; save(); });
    $('#tp-show-answers').addEventListener('change', function (e) { st().showAnswers = e.target.checked; save(); syncTeacher(); });
    $('#tp-sound').addEventListener('change', function (e) { st().sound = e.target.checked; save(); syncTeacher(); });
    $('#tp-volume').addEventListener('input', function (e) { st().volume = +e.target.value; Sound.setVolume(); save(); });
    $('#tp-test-sound').addEventListener('click', function () { Sound.init(); Sound.correct(); });
    $('#tp-fullscreen').addEventListener('click', toggleFullscreen);
    $('#tp-answers').addEventListener('click', function () { closeModal('teacher'); answerKey(); });
    $('#tp-land').addEventListener('click', function () { closeModal('teacher'); startLanding(); });
    $('#tp-reset-scores').addEventListener('click', function () {
      askConfirm('تصفير النقاط؟', 'سيتم تصفير نقاط وأوسمة الفريقين.', '↺ نعم، صفّر النقاط', function () { resetScores(); toast('تم تصفير النقاط'); });
    });
    $('#tp-reset-all').addEventListener('click', function () {
      askConfirm('إعادة ضبط اللعبة كاملة؟', 'سيتم مسح النقاط والأوسمة والتقدم.', '🗑️ نعم، أعد الضبط', function () {
        resetAll(); closeModal('teacher'); showScreen('cabin'); toast('تمت إعادة ضبط اللعبة');
      });
    });
    $('#teacher').addEventListener('click', function (e) {
      var adj = e.target.closest('[data-adj]');
      if (adj) {
        var i = +adj.getAttribute('data-adj'), v = +adj.getAttribute('data-v');
        addPoints(v, adj, i); $$('#tp-teams .sc')[i].textContent = N(state.teams[i].score); return;
      }
      var turn = e.target.closest('[data-turn]');
      if (turn) { setActive(+turn.getAttribute('data-turn')); toast('الدور الآن: ' + curTeam().name, 'soft'); return; }
      var g = e.target.closest('[data-tgo]');
      if (g) {
        var id = g.getAttribute('data-tgo');
        closeModal('teacher');
        if (id === 'cabin') { showScreen('cabin'); return; }
        if (id === 'landing') { startLanding(); return; }
        goSection(id);
      }
    });
    $('#teacher').addEventListener('input', function (e) {
      var n = e.target.getAttribute('data-tname');
      if (n !== null) { state.teams[+n].name = e.target.value.trim() || DEFAULT_STATE.teams[+n].name; save(); renderScoreboard(); }
    });

    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', function (e) {
      if (e.target.matches('input, select, textarea')) return;
      if (e.key === 'Escape') { closeModal('modal'); closeModal('teacher'); return; }
      if (e.altKey && (e.key === 't' || e.key === 'T' || e.key === 'ف')) { syncTeacher(); $('#teacher').classList.add('show'); }
      if (current === 'cards' && (e.key === 'ArrowLeft')) nextCard(1);
      if (current === 'cards' && (e.key === 'ArrowRight')) nextCard(-1);
    });

    window.addEventListener('resize', function () { if (current === 'cabin') layoutCamera(true); });
  }

  /* =================================================================
     البدء
     ================================================================= */
  function init() {
    document.body.insertAdjacentHTML('afterbegin', ART.SHARED_DEFS);
    $('#splash-plane').innerHTML = ART.planeExterior();
    $('#camera').innerHTML = ART.cabinCutaway();
    $('#minimap-wrap').innerHTML = ART.miniMap();
    $('#pilot-holder').innerHTML = ART.pilot();
    makeClouds();
    Confetti.init();
    bind();
    syncTeacher();
    renderScoreboard();
    renderProgress();
    wheelS.left = state.settings.spins;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
