/* =====================================================================
   art.js — رسومات SVG الأصلية: المستكشف، المعالم، المشاهد، الأختام، الكنز
   كلها مولّدة برمجيًا ولا تحتاج إلى أي ملف خارجي أو اتصال بالإنترنت.
   ===================================================================== */
(function () {
  'use strict';

  var DEFS = '' +
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<linearGradient id="g-land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4dfa8"/><stop offset=".55" stop-color="#e9c983"/><stop offset="1" stop-color="#d9ae62"/></linearGradient>' +
    '<linearGradient id="g-land-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98a45"/><stop offset="1" stop-color="#8f6630"/></linearGradient>' +
    '<linearGradient id="g-sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6cc7e8"/><stop offset="1" stop-color="#2f8fc4"/></linearGradient>' +
    '<linearGradient id="g-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fc77a"/><stop offset="1" stop-color="#1f8a4c"/></linearGradient>' +
    '<linearGradient id="g-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset=".5" stop-color="#f5c430"/><stop offset="1" stop-color="#c98a00"/></linearGradient>' +
    '<linearGradient id="g-mud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2b77a"/><stop offset="1" stop-color="#b98447"/></linearGradient>' +
    '<linearGradient id="g-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#3b82c4"/></linearGradient>' +
    '<linearGradient id="g-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a5662e"/><stop offset="1" stop-color="#6b3c16"/></linearGradient>' +
    '<radialGradient id="g-skin" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#ffdcbc"/><stop offset="1" stop-color="#d99a6c"/></radialGradient>' +
    '<radialGradient id="g-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c4" stop-opacity=".95"/><stop offset="1" stop-color="#ffd54f" stop-opacity="0"/></radialGradient>' +
    '<filter id="f-sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#3a2a10" flood-opacity=".3"/></filter>' +
    '<filter id="f-sm" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#3a2a10" flood-opacity=".35"/></filter>' +
    '<symbol id="s-cloud" viewBox="0 0 220 110"><path d="M40 95 C10 95 5 60 32 55 C30 30 62 18 82 34 C92 8 140 6 150 36 C175 26 205 44 196 70 C215 78 210 98 190 98 Z" fill="#fff"/><path d="M40 95 C24 95 16 84 18 74 C40 86 160 92 196 80 C204 90 200 98 190 98 Z" fill="#dcebf7"/></symbol>' +
    '<symbol id="s-star" viewBox="0 0 100 100"><path d="M50 4 L62 36 L96 38 L69 59 L79 93 L50 73 L21 93 L31 59 L4 38 L38 36 Z" fill="url(#g-gold)" stroke="#b47a00" stroke-width="4" stroke-linejoin="round"/></symbol>' +
    '<symbol id="s-palm" viewBox="0 0 100 160"><path d="M48 160 C50 120 46 80 52 48" stroke="#8a5a2b" stroke-width="9" fill="none" stroke-linecap="round"/><g fill="#2e9e55"><path d="M52 48 C30 30 10 38 0 52 C22 40 38 44 52 52Z"/><path d="M52 48 C74 30 94 38 100 54 C80 42 64 44 52 52Z"/><path d="M52 48 C40 22 20 14 8 18 C30 24 42 34 52 50Z"/><path d="M52 48 C66 22 86 14 96 20 C74 24 62 34 52 50Z"/><path d="M52 48 C50 24 56 6 62 0 C60 20 58 34 54 50Z"/></g><circle cx="50" cy="54" r="5" fill="#a0522d"/><circle cx="56" cy="56" r="5" fill="#8b4513"/></symbol>' +
  '</defs></svg>';

  /* ---------------- المستكشف ---------------- */
  function face(cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#g-skin)"/>' +
      '<ellipse cx="' + (cx - r * .36) + '" cy="' + (cy) + '" rx="' + (r * .16) + '" ry="' + (r * .22) + '" fill="#fff"/>' +
      '<ellipse cx="' + (cx + r * .36) + '" cy="' + (cy) + '" rx="' + (r * .16) + '" ry="' + (r * .22) + '" fill="#fff"/>' +
      '<circle class="eye" cx="' + (cx - r * .34) + '" cy="' + (cy + r * .04) + '" r="' + (r * .1) + '" fill="#2b1d12"/>' +
      '<circle class="eye" cx="' + (cx + r * .38) + '" cy="' + (cy + r * .04) + '" r="' + (r * .1) + '" fill="#2b1d12"/>' +
      '<circle cx="' + (cx - r * .3) + '" cy="' + (cy - r * .02) + '" r="' + (r * .035) + '" fill="#fff"/>' +
      '<circle cx="' + (cx + r * .42) + '" cy="' + (cy - r * .02) + '" r="' + (r * .035) + '" fill="#fff"/>' +
      '<ellipse cx="' + (cx - r * .58) + '" cy="' + (cy + r * .36) + '" rx="' + (r * .17) + '" ry="' + (r * .1) + '" fill="#ff8f9e" opacity=".55"/>' +
      '<ellipse cx="' + (cx + r * .58) + '" cy="' + (cy + r * .36) + '" rx="' + (r * .17) + '" ry="' + (r * .1) + '" fill="#ff8f9e" opacity=".55"/>' +
      '<path d="M' + (cx - r * .28) + ' ' + (cy + r * .42) + ' Q' + cx + ' ' + (cy + r * .72) + ' ' + (cx + r * .28) + ' ' + (cy + r * .42) + ' Z" fill="#b8323f"/>' +
      '<path d="M' + (cx - r * .17) + ' ' + (cy + r * .44) + ' Q' + cx + ' ' + (cy + r * .52) + ' ' + (cx + r * .17) + ' ' + (cy + r * .44) + '" fill="#fff"/>';
  }

  function explorer(kind) {
    var girl = kind === 'girl';
    var body = girl
      ? '<path d="M44 236 C40 186 52 150 90 146 C128 150 140 186 136 236 Z" fill="#1f8a4c"/><path d="M58 236 L62 200 L118 200 L122 236Z" fill="#17703d"/>'
      : '<path d="M46 236 C44 184 56 150 90 146 C124 150 136 184 134 236 Z" fill="#fbfbf7" stroke="#d8d6cc" stroke-width="3"/><path d="M90 150 L90 196" stroke="#d8d6cc" stroke-width="3"/><circle cx="90" cy="166" r="2.6" fill="#c9c6b8"/><circle cx="90" cy="180" r="2.6" fill="#c9c6b8"/>';
    var head = girl
      ? '<path d="M44 104 C40 52 140 52 136 104 L138 150 C120 162 60 162 42 150 Z" fill="#2a9d5c"/>' + face(90, 102, 34) + '<path d="M54 92 C58 64 122 64 126 92 C112 78 68 78 54 92Z" fill="#2a9d5c"/><path d="M58 74 C76 66 104 66 122 74" stroke="#9be3b8" stroke-width="3" fill="none"/>'
      : face(90, 102, 34) + '<path d="M46 98 C40 58 140 58 134 98 L140 140 C130 128 124 104 122 96 C104 84 76 84 58 96 C56 104 50 128 40 140 Z" fill="#fff"/><g fill="#d63a3a" opacity=".85"><circle cx="64" cy="76" r="3"/><circle cx="78" cy="70" r="3"/><circle cx="92" cy="68" r="3"/><circle cx="106" cy="70" r="3"/><circle cx="120" cy="76" r="3"/><circle cx="56" cy="110" r="2.6"/><circle cx="124" cy="110" r="2.6"/><circle cx="50" cy="126" r="2.6"/><circle cx="130" cy="126" r="2.6"/></g><path d="M52 82 C70 72 110 72 128 82" stroke="#222" stroke-width="7" fill="none" stroke-linecap="round"/>';
    return '<svg class="explorer" viewBox="0 0 180 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="المستكشف">' +
      '<ellipse cx="90" cy="242" rx="54" ry="7" fill="#3a2a10" opacity=".18"/>' +
      '<rect x="36" y="150" width="34" height="58" rx="12" fill="#ff8a00" stroke="#c96a00" stroke-width="3"/><rect x="40" y="162" width="26" height="12" rx="4" fill="#ffb347"/>' +
      body +
      '<path d="M60 150 L56 210" stroke="#7a4a1c" stroke-width="5"/><path d="M120 150 L124 210" stroke="#7a4a1c" stroke-width="5"/>' +
      '<g class="wave"><path d="M128 168 C146 156 152 134 154 112" stroke="' + (girl ? '#1f8a4c' : '#fbfbf7') + '" stroke-width="18" stroke-linecap="round" fill="none"/><circle cx="154" cy="104" r="11" fill="url(#g-skin)"/></g>' +
      '<g transform="translate(32 190)"><circle r="14" fill="#f5c430" stroke="#b47a00" stroke-width="3"/><circle r="9" fill="#fff"/><path d="M0 -7 L3 0 L0 7 L-3 0Z" fill="#d63a3a"/></g>' +
      '<rect x="66" y="128" width="48" height="22" rx="10" fill="url(#g-skin)"/>' +
      head +
      '<rect x="68" y="232" width="18" height="10" rx="5" fill="#6b3c16"/><rect x="94" y="232" width="18" height="10" rx="5" fill="#6b3c16"/>' +
      '</svg>';
  }

  /* ---------------- معالم صغيرة على الخريطة ---------------- */
  var LANDMARK = {
    riyadh: function () { // حصن المصمك + أبراج
      return '<g><rect x="-10" y="-58" width="12" height="58" rx="2" fill="url(#g-glass)" stroke="#2b4f74" stroke-width="2"/><rect x="5" y="-74" width="10" height="74" rx="3" fill="#7fb4dd" stroke="#2b4f74" stroke-width="2"/>' +
        '<path d="M-34 0 L-34 -26 L-26 -26 L-26 -34 L-14 -34 L-14 -26 L-6 -26 L-6 0Z" fill="url(#g-mud)" stroke="#8a5a2b" stroke-width="2"/><rect x="-24" y="-16" width="6" height="16" fill="#6b3c16"/><g fill="#8a5a2b"><rect x="-32" y="-30" width="3" height="4"/><rect x="-11" y="-30" width="3" height="4"/></g></g>';
    },
    taif: function () { // جبل وعربة معلقة
      return '<g><path d="M-38 0 L-14 -46 L4 -20 L18 -40 L40 0Z" fill="url(#g-green)" stroke="#156b3a" stroke-width="2"/><path d="M-36 -54 L36 -22" stroke="#333" stroke-width="1.6"/><rect x="-6" y="-46" width="14" height="11" rx="3" fill="#ff8a00" stroke="#a85a00" stroke-width="1.5"/></g>';
    },
    asir: function () { // قرية جبلية ملونة
      return '<g><path d="M-40 0 L-10 -50 L10 -30 L22 -44 L42 0Z" fill="url(#g-green)" stroke="#156b3a" stroke-width="2"/><rect x="-18" y="-26" width="10" height="10" fill="#f7c6d9" stroke="#a04b6b" stroke-width="1.4"/><rect x="-4" y="-34" width="10" height="12" fill="#bfe0ff" stroke="#3b6ea5" stroke-width="1.4"/><rect x="10" y="-22" width="10" height="10" fill="#fff3b0" stroke="#a88a20" stroke-width="1.4"/></g>';
    },
    jazan: function () { // نخلة وبحر
      return '<g><path d="M-36 0 C-24 -8 -12 -8 0 0 C12 8 24 8 36 0" stroke="#2f8fc4" stroke-width="5" fill="none"/><use href="#s-palm" x="-22" y="-62" width="36" height="58"/><path d="M14 -4 L24 -26 L32 -4Z" fill="#fff" stroke="#2f8fc4" stroke-width="2"/></g>';
    },
    najran: function () { // بيت طيني وكنز
      return '<g><path d="M-26 0 L-24 -56 L2 -56 L4 0Z" fill="url(#g-mud)" stroke="#8a5a2b" stroke-width="2"/><g fill="#fff"><rect x="-20" y="-50" width="18" height="3"/><rect x="-20" y="-34" width="18" height="3"/></g><rect x="-16" y="-44" width="5" height="7" fill="#5a3412"/><rect x="-8" y="-28" width="5" height="7" fill="#5a3412"/><g transform="translate(18 -2)"><rect x="-12" y="-14" width="24" height="14" rx="2" fill="url(#g-wood)"/><path d="M-12 -14 C-12 -26 12 -26 12 -14Z" fill="#8b4a1c"/><rect x="-2" y="-16" width="4" height="7" fill="url(#g-gold)"/></g></g>';
    }
  };

  /* ---------------- خريطة المملكة ---------------- */
  function saudiMap(stations) {
    var M = window.MAP_DATA, s = '';
    s += '<svg class="ksa-map" viewBox="0 0 ' + M.W + ' ' + M.H + '" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="خريطة المملكة العربية السعودية">';
    s += '<rect x="-400" y="-300" width="' + (M.W + 800) + '" height="' + (M.H + 600) + '" fill="url(#g-sea)"/>';
    s += '<g class="waves" opacity=".35" stroke="#fff" stroke-width="3" fill="none">' +
      '<path d="M60 560 q12 -8 24 0 t24 0"/><path d="M120 640 q12 -8 24 0 t24 0"/><path d="M780 240 q12 -8 24 0 t24 0"/><path d="M840 300 q12 -8 24 0 t24 0"/><path d="M200 720 q12 -8 24 0 t24 0"/></g>';
    s += '<path d="' + M.others + '" fill="#d9cfb7" stroke="#b9ab8b" stroke-width="1.4" opacity=".75"/>';
    /* عمق 2.5D: نسخة سفلية داكنة */
    s += '<path d="' + M.sau + '" fill="url(#g-land-side)" transform="translate(0 16)"/>';
    s += '<path d="' + M.sau + '" fill="url(#g-land)" stroke="#9a6d2f" stroke-width="3" stroke-linejoin="round" filter="url(#f-sh)"/>';
    /* كثبان وتضاريس زخرفية */
    s += '<g opacity=".5" fill="none" stroke="#c9a05a" stroke-width="3" stroke-linecap="round">' +
      '<path d="M600 520 q30 -16 60 0"/><path d="M640 560 q30 -16 60 0"/><path d="M700 500 q30 -16 60 0"/><path d="M500 300 q30 -16 60 0"/><path d="M420 240 q30 -16 60 0"/><path d="M760 440 q30 -16 60 0"/></g>';
    /* جبال السروات (زخرفية) */
    s += '<g fill="#8fbf6a" stroke="#4f8a3a" stroke-width="2" opacity=".9">' +
      '<path d="M200 330 l16 -28 l16 28z"/><path d="M226 300 l14 -24 l14 24z"/><path d="M330 560 l14 -24 l14 24z"/></g>';
    s += '<text x="700" y="590" text-anchor="middle" class="map-title-text">الْمَمْلَكَةُ الْعَرَبِيَّةُ السُّعودِيَّةُ</text>';
    s += '<text x="150" y="640" class="sea-text" transform="rotate(48 150 640)">الْبَحْرُ الْأَحْمَرُ</text>';
    s += '<text x="790" y="190" class="sea-text" transform="rotate(-38 790 190)">الْخَليجُ الْعَرَبِيُّ</text>';
    /* مدن مرجعية صغيرة (زخرفية) */
    [['madinah', 'المدينة المنورة', 1], ['dammam', 'الدمام', 1], ['tabuk', 'تبوك', 1]].forEach(function (c) {
      var p = M.pts[c[0]];
      s += '<g class="ref-city"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="#fff" stroke="#6b5a3a" stroke-width="2"/><text x="' + (p[0] + (c[2] > 0 ? 10 : -10)) + '" y="' + (p[1] + 5) + '" text-anchor="' + (c[2] > 0 ? 'start' : 'end') + '">' + c[1] + '</text></g>';
    });
    /* الطرق المنقطة بين المحطات */
    var order = stations.map(function (x) { return M.pts[x.geo]; });
    var d = 'M' + order[0][0] + ' ' + order[0][1];
    for (var i = 1; i < order.length; i++) {
      var a = order[i - 1], b = order[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - 30;
      d += ' Q' + mx + ' ' + my + ' ' + b[0] + ' ' + b[1];
    }
    s += '<path class="route-shadow" d="' + d + '"/><path class="route" d="' + d + '"/>';
    /* المحطات */
    stations.forEach(function (st) {
      var p = M.pts[st.geo];
      s += '<g class="station" data-st="' + st.id + '" tabindex="0" role="button" aria-label="' + st.city + ' – ' + st.game + '" transform="translate(' + p[0] + ' ' + p[1] + ')">' +
        '<circle class="st-glow" r="58" fill="url(#g-glow)"/>' +
        '<ellipse rx="34" ry="12" fill="#3a2a10" opacity=".2" cy="4"/>' +
        '<g class="st-land" transform="translate(' + st.lm[0] + ' ' + st.lm[1] + ') scale(' + st.lm[2] + ')">' + LANDMARK[st.id]() + '</g>' +
        '<g class="pin" transform="translate(0 -6)"><path d="M0 0 C-14 -18 -18 -26 -18 -34 A18 18 0 1 1 18 -34 C18 -26 14 -18 0 0Z" fill="' + st.color + '" stroke="#fff" stroke-width="3" filter="url(#f-sm)"/><text y="-28" text-anchor="middle" class="pin-num">' + st.num + '</text></g>' +
        '<g class="st-label" transform="translate(' + st.lbl[0] + ' ' + st.lbl[1] + ')"><rect x="-70" y="-20" width="140" height="40" rx="20" fill="#fff" stroke="' + st.color + '" stroke-width="4" filter="url(#f-sm)"/><text y="9" text-anchor="middle">' + st.icon + ' ' + st.city + '</text></g>' +
        '<g class="st-stars" transform="translate(0 -76)"><use href="#s-star" x="-34" y="-12" width="22" height="22"/><use href="#s-star" x="-12" y="-20" width="26" height="26"/><use href="#s-star" x="12" y="-12" width="22" height="22"/></g>' +
        '<circle class="st-hit" r="50" fill="transparent"/>' +
        '</g>';
    });
    s += '<g id="map-walker" class="map-walker"><g class="walker-inner"></g></g>';
    s += '</svg>';
    return s;
  }

  /* ---------------- مشاهد خلفيات المحطات ---------------- */
  function hills(color, y, amp, seed) {
    var d = 'M0 ' + 500 + ' L0 ' + y;
    for (var x = 0; x <= 1600; x += 100) d += ' Q' + (x + 50) + ' ' + (y - amp * (0.5 + 0.5 * Math.sin(x * 0.01 + seed))) + ' ' + (x + 100) + ' ' + y;
    return '<path d="' + d + ' L1600 500Z" fill="' + color + '"/>';
  }
  function scene(id) {
    var s = '<svg class="scene-svg" viewBox="0 0 1600 500" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    if (id === 'riyadh') {
      s += hills('#ecd29a', 400, 30, 1);
      var tw = [[1150, 140, 60], [1230, 90, 50], [1300, 170, 70], [1390, 120, 46], [1460, 200, 64]];
      tw.forEach(function (t) { s += '<rect x="' + t[0] + '" y="' + t[1] + '" width="' + t[2] + '" height="' + (420 - t[1]) + '" rx="6" fill="url(#g-glass)" stroke="#2b4f74" stroke-width="3" opacity=".85"/>'; });
      s += '<path d="M1270 90 L1280 40 L1290 90Z" fill="#2b4f74"/>';
      s += '<g transform="translate(160 260)"><path d="M0 160 L0 40 L40 40 L40 0 L120 0 L120 40 L240 40 L240 0 L300 0 L300 160Z" fill="url(#g-mud)" stroke="#8a5a2b" stroke-width="4"/><rect x="130" y="80" width="44" height="80" rx="4" fill="url(#g-wood)"/><g fill="#8a5a2b">' +
        '<rect x="12" y="56" width="10" height="16"/><rect x="60" y="20" width="10" height="16"/><rect x="200" y="56" width="10" height="16"/><rect x="260" y="20" width="10" height="16"/></g></g>';
      s += '<use href="#s-palm" x="40" y="250" width="110" height="180"/><use href="#s-palm" x="500" y="270" width="90" height="150"/>';
      s += hills('#d9b46e', 450, 16, 3);
    } else if (id === 'taif') {
      s += hills('#9fd38a', 300, 140, 0.5) + hills('#5fb36f', 360, 110, 2) + hills('#2e8f52', 430, 60, 4);
      s += '<path d="M200 120 L1400 300" stroke="#444" stroke-width="3"/><g class="cable"><rect x="680" y="200" width="56" height="40" rx="10" fill="#ff8a00" stroke="#a85a00" stroke-width="3"/><rect x="690" y="208" width="36" height="14" rx="3" fill="#bfe6ff"/><path d="M708 200 L712 188" stroke="#444" stroke-width="3"/></g>';
      s += '<g transform="translate(1220 330)"><rect x="0" y="0" width="160" height="120" fill="#f6efe3" stroke="#8a7a5a" stroke-width="3"/><g fill="#3b4658">' + [10, 46, 82, 118].map(function (x) { return '<rect x="' + x + '" y="14" width="22" height="34"/><rect x="' + x + '" y="66" width="22" height="34"/>'; }).join('') + '</g></g>';
    } else if (id === 'asir') {
      s += hills('#a6d996', 260, 170, 1.4) + hills('#59b26d', 340, 120, 3.2);
      var cols = ['#f7c6d9', '#bfe0ff', '#fff3b0', '#c8f0c8', '#ffd2a8'];
      for (var i = 0; i < 14; i++) { var x = 520 + i * 40, y = 250 + Math.abs(i - 7) * 14; s += '<rect x="' + x + '" y="' + y + '" width="34" height="30" fill="' + cols[i % 5] + '" stroke="#555" stroke-width="2"/><rect x="' + (x + 12) + '" y="' + (y + 14) + '" width="10" height="16" fill="#555"/>'; }
      s += hills('#2e8f52', 430, 50, 5);
    } else if (id === 'jazan') {
      s += '<rect x="0" y="300" width="1600" height="200" fill="url(#g-sea)"/>' + '<path d="M1100 320 C1180 290 1300 290 1380 320Z" fill="#e9d29a"/><use href="#s-palm" x="1200" y="210" width="60" height="100"/>';
      s += '<path d="M0 500 L0 410 C300 380 500 380 800 400 C1100 420 1300 400 1600 380 L1600 500Z" fill="#7bc47f"/>';
      s += '<path class="race-road" d="M0 470 C400 430 900 450 1600 420 L1600 500 L0 500Z" fill="#6b6f78"/>';
      s += '<use href="#s-palm" x="80" y="280" width="90" height="150"/><use href="#s-palm" x="320" y="300" width="70" height="120"/>';
    } else if (id === 'najran') {
      s += hills('#d7b07a', 330, 120, 2.2) + hills('#c08a4c', 400, 70, 0.8);
      var tw2 = [[220, 150, 110], [360, 200, 90], [1180, 170, 100], [1310, 220, 86]];
      tw2.forEach(function (t) { s += '<path d="M' + t[0] + ' 460 L' + (t[0] + 6) + ' ' + t[1] + ' L' + (t[0] + t[2] - 6) + ' ' + t[1] + ' L' + (t[0] + t[2]) + ' 460Z" fill="url(#g-mud)" stroke="#8a5a2b" stroke-width="4"/><g fill="#fff">' + [0, 1, 2].map(function (k) { return '<rect x="' + (t[0] + 8) + '" y="' + (t[1] + 24 + k * 70) + '" width="' + (t[2] - 16) + '" height="8"/>'; }).join('') + '</g>'; });
      s += '<g opacity=".55" stroke="#7a4a1c" stroke-width="4" fill="none"><path d="M620 300 l20 -30 l20 30"/><circle cx="700" cy="280" r="16"/><path d="M760 300 h40 M780 280 v40"/></g>';
    }
    s += '</svg>';
    return s;
  }

  /* ---------------- صندوق الكنز ---------------- */
  function chest() {
    return '<svg class="chest" viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" aria-label="صندوق الكنز">' +
      '<ellipse cx="120" cy="188" rx="96" ry="10" fill="#3a2a10" opacity=".25"/>' +
      '<g class="chest-glow"><circle cx="120" cy="96" r="90" fill="url(#g-glow)"/></g>' +
      '<g class="chest-coins"><circle cx="96" cy="100" r="14" fill="url(#g-gold)" stroke="#b47a00" stroke-width="3"/><circle cx="124" cy="92" r="14" fill="url(#g-gold)" stroke="#b47a00" stroke-width="3"/><circle cx="148" cy="102" r="14" fill="url(#g-gold)" stroke="#b47a00" stroke-width="3"/><use href="#s-star" x="104" y="56" width="32" height="32"/></g>' +
      '<rect x="30" y="100" width="180" height="84" rx="10" fill="url(#g-wood)" stroke="#4a2a0e" stroke-width="4"/>' +
      '<rect x="30" y="118" width="180" height="12" fill="url(#g-gold)"/><rect x="104" y="112" width="32" height="40" rx="6" fill="url(#g-gold)" stroke="#b47a00" stroke-width="3"/><circle cx="120" cy="130" r="5" fill="#4a2a0e"/>' +
      '<g class="chest-lid"><path d="M30 104 C30 50 210 50 210 104 Z" fill="url(#g-wood)" stroke="#4a2a0e" stroke-width="4"/><path d="M60 66 C60 60 180 60 180 66" stroke="url(#g-gold)" stroke-width="10" fill="none"/><rect x="104" y="80" width="32" height="24" rx="5" fill="url(#g-gold)" stroke="#b47a00" stroke-width="3"/></g>' +
      '</svg>';
  }

  /* ---------------- الختم ---------------- */
  function stamp(st, done) {
    return '<svg class="stamp-svg' + (done ? ' done' : '') + '" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="60" cy="60" r="54" fill="none" stroke="' + st.color + '" stroke-width="5" stroke-dasharray="' + (done ? '0' : '6 6') + '"/>' +
      '<circle cx="60" cy="60" r="44" fill="none" stroke="' + st.color + '" stroke-width="2"/>' +
      '<text x="60" y="58" text-anchor="middle" font-size="30">' + st.icon + '</text>' +
      '<text x="60" y="86" text-anchor="middle" class="stamp-txt" fill="' + st.color + '">' + st.stampShort + '</text>' +
      '</svg>';
  }

  window.ART = { DEFS: DEFS, explorer: explorer, saudiMap: saudiMap, scene: scene, chest: chest, stamp: stamp };
})();
