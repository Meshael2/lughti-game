/* =====================================================================
   art.js — رسومات SVG المحلية للعبة (الطائرة، المقطع الداخلي، الشخصيات)
   كل الرسومات مولّدة برمجيًا ولا تحتاج إلى أي ملف خارجي.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- تعريفات مشتركة (تدرجات وظلال ورموز) ---------- */
  var SHARED_DEFS = '' +
  '<svg id="shared-defs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">' +
  '<defs>' +
    '<linearGradient id="g-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f1f6fc"/><stop offset="1" stop-color="#c9d8ea"/></linearGradient>' +
    '<linearGradient id="g-wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9f1fb"/><stop offset="1" stop-color="#9fb6d3"/></linearGradient>' +
    '<linearGradient id="g-fin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#19b37d"/><stop offset="1" stop-color="#0b7a55"/></linearGradient>' +
    '<linearGradient id="g-engine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3f7fc"/><stop offset=".5" stop-color="#c6d3e4"/><stop offset="1" stop-color="#8ea3bf"/></linearGradient>' +
    '<linearGradient id="g-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe9ff"/><stop offset="1" stop-color="#3a8fd6"/></linearGradient>' +
    '<linearGradient id="g-window" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#2f6fb5"/></linearGradient>' +
    '<linearGradient id="g-cabin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff9ef"/><stop offset="1" stop-color="#f6e7cf"/></linearGradient>' +
    '<linearGradient id="g-first" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4e2"/><stop offset="1" stop-color="#f3dcb6"/></linearGradient>' +
    '<linearGradient id="g-cockpit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f2ff"/><stop offset="1" stop-color="#c9dcf3"/></linearGradient>' +
    '<linearGradient id="g-hold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b6b82"/><stop offset="1" stop-color="#3b4658"/></linearGradient>' +
    '<linearGradient id="g-gate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#ffe9a8"/></linearGradient>' +
    '<linearGradient id="g-door-light" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff7c2"/><stop offset="1" stop-color="#ffd54f"/></linearGradient>' +
    '<linearGradient id="g-seat-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4fa3ff"/><stop offset="1" stop-color="#1c5fb8"/></linearGradient>' +
    '<linearGradient id="g-seat-red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2557a"/><stop offset="1" stop-color="#8e1f45"/></linearGradient>' +
    '<linearGradient id="g-seat-dark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5c6f8c"/><stop offset="1" stop-color="#2b3850"/></linearGradient>' +
    '<linearGradient id="g-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset=".5" stop-color="#ffc83d"/><stop offset="1" stop-color="#e09200"/></linearGradient>' +
    '<linearGradient id="g-navy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d4a7c"/><stop offset="1" stop-color="#16294d"/></linearGradient>' +
    '<radialGradient id="g-skin" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#ffe0c2"/><stop offset="1" stop-color="#e8a979"/></radialGradient>' +
    '<radialGradient id="g-cheek" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8aa0" stop-opacity=".75"/><stop offset="1" stop-color="#ff8aa0" stop-opacity="0"/></radialGradient>' +
    '<filter id="f-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#0b2a55" flood-opacity=".28"/></filter>' +
    '<filter id="f-soft" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0b2a55" flood-opacity=".25"/></filter>' +
    '<filter id="f-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '<symbol id="sym-cloud" viewBox="0 0 220 110"><path d="M40 95 C10 95 5 60 32 55 C30 30 62 18 82 34 C92 8 140 6 150 36 C175 26 205 44 196 70 C215 78 210 98 190 98 Z" fill="#fff"/><path d="M40 95 C24 95 16 84 18 74 C40 86 160 92 196 80 C204 90 200 98 190 98 Z" fill="#dbe9f7"/></symbol>' +
    '<symbol id="sym-star" viewBox="0 0 100 100"><path d="M50 4 L62 36 L96 38 L69 59 L79 93 L50 73 L21 93 L31 59 L4 38 L38 36 Z" fill="url(#g-gold)" stroke="#d98a00" stroke-width="3" stroke-linejoin="round"/></symbol>' +
  '</defs></svg>';

  function windowsRow(x0, x1, y, step, r) {
    var s = '';
    for (var x = x0; x <= x1; x += step) {
      s += '<rect x="' + (x - r) + '" y="' + (y - r * 1.3) + '" width="' + (r * 2) + '" height="' + (r * 2.6) + '" rx="' + r + '" fill="url(#g-window)" stroke="#24324a" stroke-width="3"/>' +
           '<rect x="' + (x - r * 0.45) + '" y="' + (y - r * 1.0) + '" width="' + (r * 0.5) + '" height="' + (r * 1.1) + '" rx="' + (r * 0.25) + '" fill="#fff" opacity=".7"/>';
    }
    return s;
  }

  /* ---------- الطائرة من الخارج (المقدمة إلى اليمين) ---------- */
  function planeExterior(opts) {
    opts = opts || {};
    var gear = opts.gear ? (
      '<g class="gear">' +
      '<rect x="292" y="262" width="10" height="30" fill="#5a6b85"/><circle cx="297" cy="298" r="15" fill="#2b3442"/><circle cx="297" cy="298" r="6" fill="#9aa9bf"/>' +
      '<rect x="556" y="262" width="10" height="34" fill="#5a6b85"/><circle cx="561" cy="302" r="16" fill="#2b3442"/><circle cx="561" cy="302" r="6" fill="#9aa9bf"/>' +
      '<rect x="868" y="258" width="8" height="30" fill="#5a6b85"/><circle cx="872" cy="292" r="12" fill="#2b3442"/><circle cx="872" cy="292" r="5" fill="#9aa9bf"/>' +
      '</g>') : '';
    return '' +
    '<svg class="plane-ext" viewBox="0 0 1000 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="طائرة رحلتنا مع لغتي">' +
      '<g filter="url(#f-shadow)">' +
        /* الجناح البعيد */
        '<path d="M560 150 L640 150 L720 70 L690 66 Z" fill="#b8c9de" stroke="#7d93b2" stroke-width="3" stroke-linejoin="round"/>' +
        /* ذيل عمودي */
        '<path d="M70 140 L26 22 C23 12 30 6 40 6 L98 6 C112 6 122 13 130 24 L232 126 Z" fill="url(#g-fin)" stroke="#075c40" stroke-width="3" stroke-linejoin="round"/>' +
        '<circle cx="78" cy="58" r="24" fill="#fff" opacity=".95"/>' +
        '<g transform="translate(78 58)" fill="none" stroke="#0e9f6e" stroke-width="4" stroke-linecap="round"><path d="M0 16 C1 6 1 -2 0 -8"/><path d="M0 -8 C-8 -14 -14 -10 -17 -4"/><path d="M0 -8 C8 -14 14 -10 17 -4"/><path d="M0 -8 C-4 -16 -10 -18 -14 -16"/><path d="M0 -8 C4 -16 10 -18 14 -16"/></g>' +
        /* جسم الطائرة */
        '<path d="M150 116 L790 116 C880 116 958 160 978 205 C986 226 975 246 950 253 L902 263 C872 269 842 271 800 271 L262 271 C200 271 150 256 110 226 L32 152 C24 141 34 132 50 131 Z" fill="url(#g-body)" stroke="#8aa2c2" stroke-width="3" stroke-linejoin="round"/>' +
        /* الخط الأخضر والبرتقالي */
        '<path d="M120 214 C300 232 640 236 968 226 C966 236 958 244 946 248 L900 258 C870 264 840 266 800 266 L262 266 C205 266 160 252 126 228 Z" fill="#0e9f6e"/>' +
        '<path d="M110 205 C300 222 650 226 970 216" fill="none" stroke="#ff8a00" stroke-width="7" stroke-linecap="round"/>' +
        /* النوافذ */
        windowsRow(230, 820, 168, 40, 9) +
        /* قمرة القيادة */
        '<path d="M898 150 C920 156 940 168 954 186 L912 182 C906 172 902 162 898 150 Z" fill="url(#g-glass)" stroke="#24324a" stroke-width="3" stroke-linejoin="round"/>' +
        /* الأبواب */
        '<rect x="858" y="140" width="28" height="74" rx="8" fill="none" stroke="#8aa2c2" stroke-width="3"/>' +
        '<rect x="186" y="140" width="26" height="70" rx="8" fill="none" stroke="#8aa2c2" stroke-width="3"/>' +
        /* اسم الطائرة */
        '<text x="540" y="210" text-anchor="middle" font-family="Baloo Bhaijaan 2, Cairo, sans-serif" font-weight="800" font-size="30" fill="#0b7a55" direction="rtl">رحلتنا مع لغتي</text>' +
        /* مثبت أفقي */
        '<path d="M96 196 L196 198 L124 236 L78 236 Z" fill="url(#g-wing)" stroke="#7d93b2" stroke-width="3" stroke-linejoin="round"/>' +
        gear +
        /* الجناح القريب والمحرك */
        '<path d="M500 232 L650 232 L470 372 L412 374 Z" fill="url(#g-wing)" stroke="#6f86a6" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M412 374 L470 372 L478 362 L420 364 Z" fill="#ff8a00"/>' +
        '<rect x="470" y="276" width="130" height="50" rx="25" fill="url(#g-engine)" stroke="#6f86a6" stroke-width="3"/>' +
        '<ellipse cx="598" cy="301" rx="12" ry="25" fill="#3b4658" stroke="#6f86a6" stroke-width="3"/>' +
        '<path d="M598 284 L598 318" stroke="#9aa9bf" stroke-width="3" class="fan"/>' +
      '</g>' +
    '</svg>';
  }

  /* ---------- الشخصيات ---------- */
  function face(cx, cy, r, opts) {
    opts = opts || {};
    return '' +
      '<circle cx="' + (cx - r * 0.98) + '" cy="' + (cy + r * 0.08) + '" r="' + (r * 0.2) + '" fill="#eab08a"/>' +
      '<circle cx="' + (cx + r * 0.98) + '" cy="' + (cy + r * 0.08) + '" r="' + (r * 0.2) + '" fill="#eab08a"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#g-skin)"/>' +
      '<circle cx="' + (cx - r * 0.55) + '" cy="' + (cy + r * 0.35) + '" r="' + (r * 0.22) + '" fill="url(#g-cheek)"/>' +
      '<circle cx="' + (cx + r * 0.55) + '" cy="' + (cy + r * 0.35) + '" r="' + (r * 0.22) + '" fill="url(#g-cheek)"/>' +
      '<g class="eyes">' +
      '<ellipse cx="' + (cx - r * 0.35) + '" cy="' + (cy - r * 0.02) + '" rx="' + (r * 0.17) + '" ry="' + (r * 0.22) + '" fill="#fff"/>' +
      '<ellipse cx="' + (cx + r * 0.35) + '" cy="' + (cy - r * 0.02) + '" rx="' + (r * 0.17) + '" ry="' + (r * 0.22) + '" fill="#fff"/>' +
      '<circle cx="' + (cx - r * 0.33) + '" cy="' + (cy + r * 0.02) + '" r="' + (r * 0.11) + '" fill="#2a1d14"/>' +
      '<circle cx="' + (cx + r * 0.37) + '" cy="' + (cy + r * 0.02) + '" r="' + (r * 0.11) + '" fill="#2a1d14"/>' +
      '<circle cx="' + (cx - r * 0.3) + '" cy="' + (cy - r * 0.03) + '" r="' + (r * 0.04) + '" fill="#fff"/>' +
      '<circle cx="' + (cx + r * 0.4) + '" cy="' + (cy - r * 0.03) + '" r="' + (r * 0.04) + '" fill="#fff"/>' +
      '</g>' +
      '<path d="M' + (cx - r * 0.5) + ' ' + (cy - r * 0.32) + ' Q' + (cx - r * 0.35) + ' ' + (cy - r * 0.45) + ' ' + (cx - r * 0.18) + ' ' + (cy - r * 0.34) + '" stroke="#5a3a22" stroke-width="' + (r * 0.07) + '" fill="none" stroke-linecap="round"/>' +
      '<path d="M' + (cx + r * 0.18) + ' ' + (cy - r * 0.34) + ' Q' + (cx + r * 0.35) + ' ' + (cy - r * 0.45) + ' ' + (cx + r * 0.5) + ' ' + (cy - r * 0.32) + '" stroke="#5a3a22" stroke-width="' + (r * 0.07) + '" fill="none" stroke-linecap="round"/>' +
      (opts.mustache ? '<path d="M' + (cx - r * 0.28) + ' ' + (cy + r * 0.36) + ' Q' + cx + ' ' + (cy + r * 0.22) + ' ' + (cx + r * 0.28) + ' ' + (cy + r * 0.36) + ' Q' + cx + ' ' + (cy + r * 0.3) + ' ' + (cx - r * 0.28) + ' ' + (cy + r * 0.36) + 'Z" fill="#3a2716"/>' : '') +
      '<path d="M' + (cx - r * 0.3) + ' ' + (cy + r * 0.45) + ' Q' + cx + ' ' + (cy + r * 0.78) + ' ' + (cx + r * 0.3) + ' ' + (cy + r * 0.45) + ' Z" fill="#b8323f"/>' +
      '<path d="M' + (cx - r * 0.18) + ' ' + (cy + r * 0.47) + ' Q' + cx + ' ' + (cy + r * 0.55) + ' ' + (cx + r * 0.18) + ' ' + (cy + r * 0.47) + '" fill="#fff"/>';
  }

  function pilot() {
    return '' +
    '<svg class="pilot" viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="قائد الطائرة">' +
      '<ellipse cx="110" cy="290" rx="70" ry="8" fill="#0b2a55" opacity=".15"/>' +
      /* الجسم */
      '<path d="M48 290 C46 220 60 176 110 172 C160 176 174 220 172 290 Z" fill="url(#g-navy)"/>' +
      '<path d="M92 174 L110 230 L128 174 Z" fill="#fff"/>' +
      '<path d="M106 182 L114 182 L118 222 L110 234 L102 222 Z" fill="#0e9f6e"/>' +
      '<circle cx="80" cy="214" r="4" fill="#ffc83d"/><circle cx="80" cy="238" r="4" fill="#ffc83d"/><circle cx="140" cy="214" r="4" fill="#ffc83d"/><circle cx="140" cy="238" r="4" fill="#ffc83d"/>' +
      '<path d="M128 196 L152 196 L150 202 L128 202 Z" fill="url(#g-gold)"/>' +
      /* الذراع الملوّحة */
      '<g class="wave-arm">' +
        '<path d="M164 196 C182 184 192 160 196 132" stroke="url(#g-navy)" stroke-width="26" stroke-linecap="round" fill="none"/>' +
        '<path d="M184 150 L206 156" stroke="#ffc83d" stroke-width="5"/>' +
        '<circle cx="197" cy="120" r="16" fill="url(#g-skin)"/>' +
      '</g>' +
      '<path d="M56 200 C44 222 46 250 60 262" stroke="url(#g-navy)" stroke-width="24" stroke-linecap="round" fill="none"/>' +
      '<circle cx="62" cy="266" r="13" fill="url(#g-skin)"/>' +
      /* الرقبة والرأس */
      '<rect x="98" y="150" width="24" height="28" rx="8" fill="#e8a979"/>' +
      face(110, 112, 46, { mustache: true }) +
      /* القبعة */
      '<path d="M58 84 C58 40 162 40 162 84 Z" fill="url(#g-navy)"/>' +
      '<rect x="56" y="78" width="108" height="14" rx="6" fill="#1b2f55"/>' +
      '<path d="M70 92 C90 104 130 104 150 92 L150 90 L70 90 Z" fill="#0d1a33"/>' +
      '<path d="M96 62 C102 56 118 56 124 62 L110 72 Z" fill="url(#g-gold)"/>' +
      '<path d="M84 64 L100 62 M136 64 L120 62" stroke="#ffc83d" stroke-width="4" stroke-linecap="round"/>' +
    '</svg>';
  }

  function kid(opts) {
    opts = opts || {};
    var shirt = opts.shirt || '#ffffff';
    return '' +
    '<svg class="kid" viewBox="0 0 160 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (opts.label || 'عادل') + '">' +
      '<ellipse cx="80" cy="232" rx="50" ry="6" fill="#0b2a55" opacity=".15"/>' +
      '<path d="M36 230 C34 170 46 136 80 132 C114 136 126 170 124 230 Z" fill="' + shirt + '" stroke="#c9d6e6" stroke-width="3"/>' +
      '<path d="M80 136 L80 200" stroke="#c9d6e6" stroke-width="3"/>' +
      '<circle cx="80" cy="150" r="3" fill="#c9d6e6"/><circle cx="80" cy="166" r="3" fill="#c9d6e6"/>' +
      '<g class="wave-arm"><path d="M118 156 C134 146 140 126 142 104" stroke="' + shirt + '" stroke-width="18" stroke-linecap="round" fill="none"/><circle cx="142" cy="96" r="11" fill="url(#g-skin)"/></g>' +
      '<rect x="70" y="116" width="20" height="22" rx="7" fill="#e8a979"/>' +
      face(80, 84, 38) +
      '<path d="M44 80 C40 46 70 34 92 40 C112 44 122 58 118 80 C110 64 96 58 80 60 C64 58 52 66 44 80 Z" fill="#2a1d14"/>' +
    '</svg>';
  }

  /* ---------- مقعد في المقطع الجانبي ---------- */
  function seat(x, y, s, grad, person) {
    var p = '';
    if (person) {
      p = '<g class="pax">' +
        '<rect x="' + (x + 6 * s) + '" y="' + (y - 46 * s) + '" width="' + (26 * s) + '" height="' + (34 * s) + '" rx="' + (10 * s) + '" fill="' + person.shirt + '"/>' +
        '<circle cx="' + (x + 20 * s) + '" cy="' + (y - 58 * s) + '" r="' + (13 * s) + '" fill="url(#g-skin)"/>' +
        (person.hair ? '<path d="M' + (x + 7 * s) + ' ' + (y - 60 * s) + ' C' + (x + 8 * s) + ' ' + (y - 76 * s) + ' ' + (x + 32 * s) + ' ' + (y - 76 * s) + ' ' + (x + 33 * s) + ' ' + (y - 60 * s) + ' C' + (x + 26 * s) + ' ' + (y - 66 * s) + ' ' + (x + 14 * s) + ' ' + (y - 66 * s) + ' ' + (x + 7 * s) + ' ' + (y - 60 * s) + 'Z" fill="' + person.hair + '"/>' : '') +
        '<circle cx="' + (x + 26 * s) + '" cy="' + (y - 59 * s) + '" r="' + (2.2 * s) + '" fill="#2a1d14"/>' +
        '</g>';
    }
    return '<g class="seat">' +
      '<rect x="' + (x - 2 * s) + '" y="' + (y - 64 * s) + '" width="' + (16 * s) + '" height="' + (68 * s) + '" rx="' + (7 * s) + '" fill="url(#' + grad + ')" transform="rotate(-8 ' + x + ' ' + y + ')"/>' +
      p +
      '<rect x="' + x + '" y="' + (y - 8 * s) + '" width="' + (42 * s) + '" height="' + (16 * s) + '" rx="' + (7 * s) + '" fill="url(#' + grad + ')"/>' +
      '<rect x="' + (x + 16 * s) + '" y="' + (y + 8 * s) + '" width="' + (8 * s) + '" height="' + (18 * s) + '" fill="#7d8da6"/>' +
      '</g>';
  }

  function suitcase(x, y, w, h, color) {
    return '<g class="bag">' +
      '<rect x="' + (x + w * 0.3) + '" y="' + (y - h * 0.18) + '" width="' + (w * 0.4) + '" height="' + (h * 0.25) + '" rx="' + (h * 0.08) + '" fill="none" stroke="#2b3442" stroke-width="4"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (h * 0.16) + '" fill="' + color + '" stroke="rgba(0,0,0,.25)" stroke-width="3"/>' +
      '<rect x="' + (x + w * 0.22) + '" y="' + y + '" width="' + (w * 0.08) + '" height="' + h + '" fill="rgba(255,255,255,.35)"/>' +
      '<rect x="' + (x + w * 0.7) + '" y="' + y + '" width="' + (w * 0.08) + '" height="' + h + '" fill="rgba(255,255,255,.35)"/>' +
      '</g>';
  }

  /* ---------- المقطع الداخلي للطائرة (Cabin Cutaway) ---------- */
  var SECTIONS = [
    { id: 'gate',    num: 6, icon: '🛬', name: 'بوابة الوصول',   game: 'الوصول إلى النجومية', label: [330, 112],  box: [215, 190, 215, 220] },
    { id: 'quiz',    num: 3, icon: '💺', name: 'مقاعد الركاب',   game: 'تحدي الركاب',         label: [680, 112],  box: [430, 190, 500, 220] },
    { id: 'cards',   num: 2, icon: '🎴', name: 'الدرجة الأولى',  game: 'بطاقات المسافر الذكي', label: [1075, 112], box: [930, 190, 285, 220] },
    { id: 'cockpit', num: 1, icon: '🧑‍✈️', name: 'قمرة القيادة', game: 'مركز الانطلاق',        label: [1405, 112], box: [1215, 190, 345, 220] },
    { id: 'bags',    num: 4, icon: '🧳', name: 'قسم الأمتعة',    game: 'حقيبة الكلمات',        label: [1190, 590], box: [330, 414, 975, 92] },
    { id: 'speed',   num: 5, icon: '⚡', name: 'جناح الطائرة',   game: 'السرعة والنجوم',       label: [400, 690],  box: [560, 478, 450, 260] }
  ];

  function cabinCutaway() {
    var i, s = '';
    s += '<svg class="cutaway" viewBox="0 0 1600 820" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="خريطة الطائرة">';
    /* الذيل والجسم الخارجي */
    s += '<g filter="url(#f-shadow)">';
    s += '<path d="M120 196 L40 40 C36 28 44 20 56 20 L130 20 C148 20 160 28 170 40 L330 196 Z" fill="url(#g-fin)" stroke="#075c40" stroke-width="4" stroke-linejoin="round"/>';
    s += '<circle cx="118" cy="70" r="28" fill="#fff"/>';
    s += '<g transform="translate(118 70) scale(1.2)" fill="none" stroke="#0e9f6e" stroke-width="4" stroke-linecap="round"><path d="M0 16 C1 6 1 -2 0 -8"/><path d="M0 -8 C-8 -14 -14 -10 -17 -4"/><path d="M0 -8 C8 -14 14 -10 17 -4"/><path d="M0 -8 C-4 -16 -10 -18 -14 -16"/><path d="M0 -8 C4 -16 10 -18 14 -16"/></g>';
    s += '<path d="M160 176 L1360 176 C1480 176 1560 280 1572 362 C1578 420 1536 486 1450 506 L1320 520 L330 520 C250 520 170 440 90 330 L70 240 C66 206 100 182 160 176 Z" fill="url(#g-body)" stroke="#8aa2c2" stroke-width="5" stroke-linejoin="round"/>';
    s += '</g>';
    /* المثبت الأفقي */
    s += '<path d="M80 330 L250 336 L150 392 L70 392 Z" fill="url(#g-wing)" stroke="#7d93b2" stroke-width="4" stroke-linejoin="round"/>';
    /* الأرضية الداخلية (المقطع) */
    s += '<path d="M215 196 L1360 196 C1462 196 1534 286 1548 360 C1552 380 1550 396 1544 410 L215 410 Z" fill="#e9eef5"/>';

    /* ===== 6) بوابة الوصول ===== */
    s += sectionOpen('gate');
    s += '<rect x="215" y="196" width="215" height="214" fill="url(#g-gate)"/>';
    s += '<path d="M270 404 L270 262 C270 236 290 222 312 222 L336 222 C358 222 378 236 378 262 L378 404 Z" fill="#5a6b85"/>';
    s += '<path d="M280 404 L280 266 C280 246 294 234 312 234 L336 234 C354 234 368 246 368 266 L368 404 Z" fill="url(#g-door-light)"/>';
    s += '<path d="M368 266 L404 252 L404 404 L368 404 Z" fill="#c9d6e6" stroke="#8aa2c2" stroke-width="3"/>';
    s += '<rect x="286" y="206" width="76" height="22" rx="6" fill="#0e9f6e"/><text x="324" y="223" text-anchor="middle" font-size="16" font-weight="800" fill="#fff" font-family="Cairo, sans-serif">مخرج</text>';
    s += '<rect x="250" y="398" width="150" height="10" rx="4" fill="#d6455d"/>';
    s += '<g class="spark"><use href="#sym-star" x="236" y="244" width="26" height="26"/><use href="#sym-star" x="384" y="214" width="20" height="20"/></g>';
    s += '<g transform="translate(222 300)" opacity=".95"><rect width="40" height="56" rx="8" fill="#fff" stroke="#ffc83d" stroke-width="3"/><text x="20" y="38" text-anchor="middle" font-size="26">🏆</text></g>';
    s += sectionClose('gate');

    /* ===== 3) مقاعد الركاب ===== */
    s += sectionOpen('quiz');
    s += '<rect x="430" y="196" width="500" height="214" fill="url(#g-cabin)"/>';
    s += windowsRow(470, 900, 262, 62, 14);
    s += '<rect x="440" y="208" width="480" height="18" rx="9" fill="#d9c6a6"/>';
    var pax = [{ shirt: '#ff8a00', hair: '#2a1d14' }, { shirt: '#1e88e5', hair: '#5a3a22' }, null, { shirt: '#e2557a', hair: '#2a1d14' }, { shirt: '#0e9f6e', hair: '#1b1b1b' }, { shirt: '#8e44ad', hair: '#5a3a22' }];
    for (i = 0; i < 6; i++) s += seat(452 + i * 78, 382, 1.05, 'g-seat-blue', pax[i]);
    s += '<g transform="translate(860 300)"><rect x="0" y="40" width="44" height="60" rx="6" fill="#c9d6e6" stroke="#8aa2c2" stroke-width="3"/><rect x="6" y="50" width="32" height="8" rx="3" fill="#ff8a00"/><circle cx="10" cy="104" r="6" fill="#5a6b85"/><circle cx="34" cy="104" r="6" fill="#5a6b85"/></g>';
    s += '<g transform="translate(620 300)"><g class="qbubble"><circle r="26" fill="#fff" stroke="#1e88e5" stroke-width="4"/><text y="11" text-anchor="middle" font-size="32" font-weight="800" fill="#1e88e5" font-family="Cairo">؟</text></g></g>';
    s += sectionClose('quiz');

    /* ===== 2) الدرجة الأولى ===== */
    s += sectionOpen('cards');
    s += '<rect x="930" y="196" width="285" height="214" fill="url(#g-first)"/>';
    s += windowsRow(980, 1180, 262, 100, 15);
    s += '<rect x="940" y="208" width="265" height="18" rx="9" fill="#e0b97a"/>';
    s += seat(950, 380, 1.45, 'g-seat-red', { shirt: '#ffffff', hair: '#2a1d14' });
    s += seat(1078, 380, 1.45, 'g-seat-red', null);
    s += '<g transform="translate(1110 250)"><g class="flipdemo"><rect x="0" y="0" width="56" height="74" rx="10" fill="#ff8a00" stroke="#fff" stroke-width="4" transform="rotate(-10 28 37)"/><rect x="14" y="4" width="56" height="74" rx="10" fill="#1e88e5" stroke="#fff" stroke-width="4" transform="rotate(8 42 41)"/><text x="42" y="54" text-anchor="middle" font-size="30" fill="#fff" font-weight="800" font-family="Cairo">أ</text></g></g>';
    s += '<g transform="translate(1180 300)"><rect x="-6" y="40" width="34" height="8" rx="3" fill="#8e5a2b"/><rect x="8" y="48" width="6" height="56" fill="#8e5a2b"/><path d="M0 40 L22 40 L18 22 L4 22 Z" fill="#ffc83d"/></g>';
    s += sectionClose('cards');

    /* ===== 1) قمرة القيادة ===== */
    s += sectionOpen('cockpit');
    s += '<path d="M1215 196 L1360 196 C1462 196 1534 286 1548 360 C1552 380 1550 396 1544 410 L1215 410 Z" fill="url(#g-cockpit)"/>';
    s += '<path d="M1380 206 C1440 210 1500 262 1528 330 L1440 330 C1430 290 1410 250 1380 206 Z" fill="url(#g-glass)" stroke="#24324a" stroke-width="4" stroke-linejoin="round"/>';
    s += '<g class="sky-out"><use href="#sym-cloud" x="1430" y="250" width="70" height="35" opacity=".9"/></g>';
    s += '<path d="M1420 336 L1538 336 C1544 356 1546 372 1544 392 L1420 392 Z" fill="#2b3850"/>';
    s += '<g class="blink"><circle cx="1440" cy="352" r="5" fill="#2ee59d"/><circle cx="1458" cy="352" r="5" fill="#ffc83d"/><circle cx="1476" cy="352" r="5" fill="#ff5c7a"/><rect x="1494" y="346" width="34" height="14" rx="3" fill="#38bdf8"/><rect x="1440" y="368" width="60" height="12" rx="3" fill="#0e9f6e"/></g>';
    s += '<g transform="translate(1232 212) scale(.66)">' + pilotInner() + '</g>';
    s += seat(1360, 382, 1.3, 'g-seat-dark', null);
    s += sectionClose('cockpit');

    /* الجدار الداخلي والأرضية بين الطابقين */
    s += '<rect x="215" y="406" width="1335" height="12" fill="#9fb0c6"/>';
    for (i = 0; i < 4; i++) s += '<rect x="' + [428, 928, 1213, 215][i] + '" y="196" width="4" height="212" fill="#c9d6e6"/>';

    /* ===== 4) قسم الأمتعة ===== */
    s += sectionOpen('bags');
    s += '<path d="M330 418 L1500 418 C1490 452 1470 480 1440 500 L1320 512 L340 512 C336 480 332 448 330 418 Z" fill="url(#g-hold)"/>';
    s += '<rect x="360" y="490" width="900" height="10" rx="5" fill="#2b3442"/>';
    for (i = 0; i < 18; i++) s += '<circle cx="' + (372 + i * 50) + '" cy="495" r="4" fill="#9aa9bf"/>';
    var bagColors = ['#ff8a00', '#1e88e5', '#e2557a', '#0e9f6e', '#ffc83d', '#8e44ad', '#ff5c7a', '#38bdf8', '#ff8a00', '#2ee59d', '#1e88e5', '#e2557a'];
    for (i = 0; i < 12; i++) s += suitcase(380 + i * 74, 440 + (i % 2) * 6, 56 - (i % 3) * 6, 42 - (i % 2) * 4, bagColors[i]);
    s += sectionClose('bags');

    /* ===== 5) الجناح ===== */
    s += sectionOpen('speed');
    s += '<path d="M1010 486 L840 486 L560 742 L640 750 Z" fill="url(#g-wing)" stroke="#6f86a6" stroke-width="4" stroke-linejoin="round"/>';
    s += '<path d="M560 742 L640 750 L652 734 L574 728 Z" fill="#ff8a00"/>';
    s += '<rect x="700" y="566" width="170" height="62" rx="31" fill="url(#g-engine)" stroke="#6f86a6" stroke-width="4"/>';
    s += '<ellipse cx="868" cy="597" rx="15" ry="31" fill="#3b4658" stroke="#6f86a6" stroke-width="4"/>';
    s += '<g class="spark"><use href="#sym-star" x="640" y="660" width="34" height="34"/><use href="#sym-star" x="920" y="520" width="26" height="26"/></g>';
    s += '<g transform="translate(760 520)"><g class="bolt"><path d="M14 0 L0 24 L12 24 L6 44 L26 16 L14 16 L20 0 Z" fill="#ffc83d" stroke="#e09200" stroke-width="2"/></g></g>';
    s += sectionClose('speed');

    /* اللافتات */
    for (i = 0; i < SECTIONS.length; i++) s += sectionLabel(SECTIONS[i]);
    s += '</svg>';
    return s;
  }

  function hitShape(id) {
    switch (id) {
      case 'cockpit': return '<path d="M1215 196 L1360 196 C1462 196 1534 286 1548 360 C1552 380 1550 396 1544 410 L1215 410 Z"/>';
      case 'bags': return '<path d="M330 418 L1500 418 C1490 452 1470 480 1440 500 L1320 512 L340 512 C336 480 332 448 330 418 Z"/>';
      case 'speed': return '<path d="M1010 486 L840 486 L560 742 L640 750 Z"/><rect x="700" y="566" width="170" height="62" rx="31"/>';
      case 'gate': return '<rect x="215" y="196" width="215" height="214"/>';
      case 'quiz': return '<rect x="430" y="196" width="500" height="214"/>';
      case 'cards': return '<rect x="930" y="196" width="285" height="214"/>';
    }
    return '';
  }

  function sectionOpen(id) {
    return '<g class="sec" data-sec="' + id + '" tabindex="0" role="button">';
  }
  function sectionClose(id) {
    return '<g class="sec-glow">' + hitShape(id) + '</g><g class="sec-hit">' + hitShape(id) + '</g></g>';
  }

  function sectionLabel(sec) {
    var x = sec.label[0], y = sec.label[1], w = 250, h = 74;
    return '<g class="sec-label" data-sec="' + sec.id + '" transform="translate(' + (x - w / 2) + ' ' + (y - h / 2) + ')" tabindex="-1">' +
      '<rect width="' + w + '" height="' + h + '" rx="22" fill="#fff" filter="url(#f-soft)"/>' +
      '<rect x="3" y="3" width="' + (w - 6) + '" height="' + (h - 6) + '" rx="19" fill="none" stroke="var(--sec-' + sec.id + ')" stroke-width="5"/>' +
      '<circle cx="' + (w - 34) + '" cy="37" r="24" fill="var(--sec-' + sec.id + ')"/>' +
      '<text x="' + (w - 34) + '" y="47" text-anchor="middle" font-size="27">' + sec.icon + '</text>' +
      '<text x="' + (w - 68) + '" y="33" direction="rtl" text-anchor="start" font-size="23" font-weight="800" fill="#16294d" font-family="Baloo Bhaijaan 2, Cairo, sans-serif">' + sec.name + '</text>' +
      '<text x="' + (w - 68) + '" y="58" direction="rtl" text-anchor="start" font-size="17" font-weight="600" fill="#4a5d7c" font-family="Cairo, sans-serif">' + sec.game + '</text>' +
      '<g class="lbl-num"><circle cx="20" cy="20" r="17" fill="#16294d"/><text x="20" y="27" text-anchor="middle" font-size="18" font-weight="800" fill="#fff" font-family="Cairo">' + sec.num + '</text></g>' +
      '<g class="lbl-done"><circle cx="20" cy="20" r="17" fill="#0e9f6e"/><path d="M11 20 L18 27 L30 13" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '</g>';
  }

  /* نسخة داخلية من القائد لاستخدامها داخل SVG آخر */
  function pilotInner() {
    return pilot().replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  }

  /* ---------- الخريطة المصغرة في الشريط العلوي ---------- */
  function miniMap() {
    var order = ['gate', 'quiz', 'cards', 'cockpit'];
    var xs = { gate: [22, 40], quiz: [62, 74], cards: [136, 34], cockpit: [170, 34] };
    var s = '<svg class="minimap" viewBox="0 0 220 64" xmlns="http://www.w3.org/2000/svg" aria-label="خريطة الطائرة المصغرة">';
    s += '<path d="M10 14 L4 2 L22 2 L34 14 Z" fill="#0e9f6e"/>';
    s += '<path d="M20 12 L180 12 C200 12 214 22 216 32 C217 40 210 46 196 47 L40 47 C26 47 14 38 6 28 Z" fill="#fff" stroke="#8aa2c2" stroke-width="2"/>';
    s += '<path d="M120 47 L98 47 L76 62 L88 62 Z" fill="#dbe6f3" stroke="#8aa2c2" stroke-width="1.5" class="mm-sec" data-sec="speed"/>';
    for (var i = 0; i < order.length; i++) {
      var id = order[i], x = xs[id][0], w = xs[id][1];
      s += '<rect class="mm-sec" data-sec="' + id + '" x="' + x + '" y="15" width="' + w + '" height="17" rx="5"/>';
    }
    s += '<rect class="mm-sec" data-sec="bags" x="40" y="34" width="150" height="10" rx="4"/>';
    s += '</svg>';
    return s;
  }

  /* ---------- مشهد الهبوط ---------- */
  function landingScene() {
    var lights = '';
    for (var i = 0; i < 14; i++) lights += '<circle cx="' + (60 + i * 110) + '" cy="702" r="6" fill="#ffd54f" class="rl" style="animation-delay:' + (i * 0.12) + 's"/>';
    return '<svg class="landing-svg" viewBox="0 0 1600 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="g-sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa9f0"/><stop offset=".6" stop-color="#ffd59a"/><stop offset="1" stop-color="#ffb07a"/></linearGradient></defs>' +
      '<rect width="1600" height="800" fill="url(#g-sunset)"/>' +
      '<circle cx="1260" cy="520" r="90" fill="#fff3c4" opacity=".9"/>' +
      '<use href="#sym-cloud" x="120" y="90" width="220" height="110" class="lc1"/>' +
      '<use href="#sym-cloud" x="900" y="160" width="160" height="80" class="lc2"/>' +
      /* مبنى المطار */
      '<g transform="translate(980 520)"><rect x="0" y="40" width="520" height="130" rx="10" fill="#e9eef5" stroke="#8aa2c2" stroke-width="4"/><rect x="20" y="64" width="480" height="46" rx="6" fill="url(#g-glass)"/><rect x="420" y="-60" width="46" height="110" fill="#c9d6e6" stroke="#8aa2c2" stroke-width="4"/><rect x="404" y="-96" width="78" height="42" rx="10" fill="url(#g-glass)" stroke="#24324a" stroke-width="4"/><text x="210" y="148" text-anchor="middle" font-size="34" font-weight="800" fill="#0b7a55" font-family="Baloo Bhaijaan 2, Cairo">مطار النجوم</text></g>' +
      '<g transform="translate(150 600)" fill="#0e9f6e"><rect x="-6" y="0" width="12" height="90" fill="#8e5a2b"/><path d="M0 0 C-40 -20 -70 0 -80 20 C-50 0 -20 0 0 6 Z"/><path d="M0 0 C40 -20 70 0 80 20 C50 0 20 0 0 6 Z"/><path d="M0 0 C-20 -40 -50 -46 -66 -36 C-36 -34 -16 -20 0 0 Z"/><path d="M0 0 C20 -40 50 -46 66 -36 C36 -34 16 -20 0 0 Z"/></g>' +
      /* المدرج */
      '<rect x="0" y="690" width="1600" height="110" fill="#5e6b7d"/>' +
      '<rect x="0" y="682" width="1600" height="10" fill="#8c99ab"/>' +
      '<g fill="#fff">' + (function () { var d = ''; for (var k = 0; k < 16; k++) d += '<rect x="' + (k * 110 + 20) + '" y="740" width="60" height="10" rx="4"/>'; return d; })() + '</g>' +
      lights +
      '</svg>';
  }

  /* ---------- تصدير ---------- */
  window.ART = {
    SHARED_DEFS: SHARED_DEFS,
    SECTIONS: SECTIONS,
    planeExterior: planeExterior,
    cabinCutaway: cabinCutaway,
    pilot: pilot,
    kid: kid,
    miniMap: miniMap,
    landingScene: landingScene
  };
})();
