<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Christmas Hero 2027 — Saanify</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(ellipse at 50% 25%, #111d32 0%, #080e1a 55%, #030508 100%);
    overflow: hidden;
    font-family: 'Outfit', sans-serif;
  }

  /* ── Main Card ── */
  .hero {
    position: relative;
    width: 380px;
    height: 560px;
    border-radius: 20px;
    background: rgba(255,255,255,0.015);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.05);
    box-shadow:
      0 0 80px rgba(251,191,36,0.04),
      0 30px 80px rgba(0,0,0,0.55),
      inset 0 1px 0 rgba(255,255,255,0.04);
    overflow: hidden;
  }

  /* ── Background Bokeh ── */
  .bokeh {
    position: absolute;
    border-radius: 50%;
    filter: blur(35px);
    opacity: 0.07;
    animation: bokehDrift 10s ease-in-out infinite alternate;
    z-index: 1;
  }
  @keyframes bokehDrift {
    0%   { transform: translateY(0) scale(1); }
    100% { transform: translateY(-18px) scale(1.12); }
  }

  /* ── God Rays ── */
  .god-ray {
    position: absolute;
    clip-path: polygon(50% 0%, 15% 100%, 85% 100%);
    background: linear-gradient(to bottom, rgba(251,191,36,0.18), rgba(251,191,36,0.02) 60%, transparent);
    transform-origin: top center;
    z-index: 3;
    animation: rayPulse 5s ease-in-out infinite;
  }
  @keyframes rayPulse {
    0%, 100% { opacity: 0.5; }
    50%      { opacity: 1; }
  }

  /* ── Star ── */
  .star-wrap {
    position: absolute;
    top: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 22;
    animation: starFloat 3.5s ease-in-out infinite;
  }
  @keyframes starFloat {
    0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
    50%      { transform: translateX(-50%) translateY(-7px) scale(1.06); }
  }
  .star-halo {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 110px;
    height: 110px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(251,191,36,0.22) 0%, rgba(251,191,36,0.04) 50%, transparent 72%);
    animation: haloPulse 3s ease-in-out infinite;
    z-index: 21;
    pointer-events: none;
  }
  @keyframes haloPulse {
    0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.7; }
    50%      { transform: translate(-50%,-50%) scale(1.25); opacity: 1; }
  }

  /* ── Tree Breathe ── */
  .tree-wrap {
    position: absolute;
    top: 42px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    animation: treeBreathe 5s ease-in-out infinite;
    transform-origin: center bottom;
  }
  @keyframes treeBreathe {
    0%, 100% { transform: translateX(-50%) scale(1); }
    50%      { transform: translateX(-50%) scale(1.018); }
  }

  /* ── Lights ── */
  .light {
    position: absolute;
    border-radius: 50%;
    z-index: 15;
    transform: translate(-50%, -50%);
    animation: lightBlink var(--dur) ease-in-out infinite;
    animation-delay: var(--del);
    will-change: opacity, transform;
  }
  @keyframes lightBlink {
    0%, 100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
    40%      { opacity: 0.15; transform: translate(-50%,-50%) scale(0.55); }
    60%      { opacity: 0.9; transform: translate(-50%,-50%) scale(1.05); }
  }

  /* ── Ornaments ── */
  .ornament {
    position: absolute;
    border-radius: 50%;
    z-index: 16;
    transform: translate(-50%, -50%);
    border: 1px solid rgba(255,255,255,0.25);
  }

  /* ── Snow Particles ── */
  .snow {
    position: absolute;
    background: white;
    border-radius: 50%;
    z-index: 6;
    opacity: 0;
    animation: snowfall var(--fd) linear infinite;
    animation-delay: var(--fsd);
    will-change: transform, opacity;
  }
  @keyframes snowfall {
    0%   { transform: translateY(-10px) translateX(0); opacity: 0; }
    8%   { opacity: var(--sop); }
    50%  { transform: translateY(270px) translateX(calc(var(--sdx) * 1px)); }
    92%  { opacity: var(--sop); }
    100% { transform: translateY(560px) translateX(calc(var(--sdx) * 0.5px)); opacity: 0; }
  }

  /* ── Sparkles ── */
  .sparkle {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #fbbf24;
    z-index: 19;
    pointer-events: none;
    animation: sparklePop var(--spkd) ease-in-out infinite;
    animation-delay: var(--spkdel);
  }
  @keyframes sparklePop {
    0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
    50%      { opacity: 1; transform: scale(1.2) rotate(180deg); }
  }

  /* ── Ground Snow ── */
  .ground-glow {
    position: absolute;
    bottom: 78px;
    left: 50%;
    transform: translateX(-50%);
    width: 310px;
    height: 55px;
    background: radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, transparent 68%);
    filter: blur(10px);
    z-index: 8;
  }
  .ground-surface {
    position: absolute;
    bottom: 72px;
    left: 50%;
    transform: translateX(-50%);
    width: 290px;
    height: 20px;
    background: radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.12) 0%, transparent 70%);
    border-radius: 50%;
    z-index: 9;
  }

  /* ── Gift Boxes ── */
  .gift {
    position: absolute;
    z-index: 12;
    border-radius: 3px;
  }
  .gift-lid {
    position: absolute;
    top: -5px;
    left: -3px;
    right: -3px;
    height: 7px;
    border-radius: 2px 2px 0 0;
    filter: brightness(1.15);
  }
  .gift-ribbon-v {
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #fde68a, #b45309);
    border-radius: 1px;
  }
  .gift-ribbon-h {
    position: absolute;
    top: 50%; left: 0;
    transform: translateY(-50%);
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #fde68a, #b45309);
    border-radius: 1px;
  }
  .gift-bow {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 18px;
    height: 10px;
  }
  .gift-bow::before, .gift-bow::after {
    content: '';
    position: absolute;
    top: 0;
    width: 9px;
    height: 9px;
    background: radial-gradient(circle at 30% 30%, #fde68a, #d97706);
    border-radius: 50% 50% 10% 50%;
  }
  .gift-bow::before { left: -1px; transform: rotate(-25deg); }
  .gift-bow::after  { right: -1px; transform: rotate(25deg) scaleX(-1); }

  /* ── Text ── */
  .title {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    font-size: 30px;
    background: linear-gradient(120deg, #92400e, #f59e0b, #fde68a, #f59e0b, #92400e);
    background-size: 250% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: goldShimmer 5s ease-in-out infinite;
    letter-spacing: 0.5px;
    line-height: 1.2;
  }
  @keyframes goldShimmer {
    0%, 100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }
  .divider {
    width: 70px;
    height: 1px;
    margin: 8px auto;
    background: linear-gradient(90deg, transparent, rgba(245,158,11,0.45), transparent);
  }
  .subtitle {
    font-family: 'Outfit', sans-serif;
    font-weight: 300;
    font-size: 10px;
    color: rgba(148,163,184,0.7);
    letter-spacing: 4.5px;
    text-transform: uppercase;
  }

  /* ── Vignette ── */
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(0,0,0,0.45) 100%);
    pointer-events: none;
    z-index: 24;
    border-radius: inherit;
  }

  /* ── Noise Texture ── */
  .hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.5;
    z-index: 25;
    pointer-events: none;
    border-radius: inherit;
  }

  /* ── Accessibility ── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
</style>
</head>
<body>

<div class="hero" id="hero">

  <!-- ── Background Bokeh ── -->
  <div class="bokeh" style="width:130px;height:130px;background:#dc2626;top:8%;left:2%;animation-delay:0s;"></div>
  <div class="bokeh" style="width:90px;height:90px;background:#2563eb;top:55%;right:-2%;animation-delay:2.5s;"></div>
  <div class="bokeh" style="width:110px;height:110px;background:#059669;bottom:12%;left:5%;animation-delay:5s;"></div>
  <div class="bokeh" style="width:70px;height:70px;background:#f59e0b;top:25%;right:8%;animation-delay:1.2s;"></div>
  <div class="bokeh" style="width:95px;height:95px;background:#7c3aed;bottom:28%;right:10%;animation-delay:3.8s;"></div>

  <!-- ── God Rays (from star downward) ── -->
  <div id="rays-container"></div>

  <!-- ── Star Halo ── -->
  <div class="star-halo"></div>

  <!-- ── The Star (64px) ── -->
  <div class="star-wrap">
    <svg width="64" height="64" viewBox="0 0 24 24" fill="#fbbf24"
         style="filter:drop-shadow(0 0 14px rgba(251,191,36,0.95)) drop-shadow(0 0 40px rgba(251,191,36,0.35));">
      <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"/>
    </svg>
  </div>

  <!-- ── 7-Layer SVG Tree ── -->
  <div class="tree-wrap">
    <svg width="240" height="280" viewBox="0 0 240 280" aria-label="Christmas Tree">
      <defs>
        <!-- Upper layers: brighter green -->
        <linearGradient id="tg1" x1="25%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stop-color="#4ade80" stop-opacity="0.92"/>
          <stop offset="100%" stop-color="#16a34a"/>
        </linearGradient>
        <!-- Mid layers: rich green -->
        <linearGradient id="tg2" x1="25%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stop-color="#22c55e" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#15803d"/>
        </linearGradient>
        <!-- Lower layers: deep forest -->
        <linearGradient id="tg3" x1="25%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stop-color="#16a34a" stop-opacity="0.88"/>
          <stop offset="100%" stop-color="#14532d"/>
        </linearGradient>
        <!-- Gold edge (stronger on right = light source) -->
        <linearGradient id="gEdge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="rgba(251,191,36,0)"/>
          <stop offset="55%"  stop-color="rgba(251,191,36,0.15)"/>
          <stop offset="85%"  stop-color="rgba(251,191,36,0.4)"/>
          <stop offset="100%" stop-color="rgba(251,191,36,0.55)"/>
        </linearGradient>
        <!-- Trunk -->
        <linearGradient id="trunk" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3b1508"/>
          <stop offset="100%" stop-color="#78350f"/>
        </linearGradient>
        <!-- Tree shadow -->
        <filter id="tShadow" x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>

      <g filter="url(#tShadow)">
        <!-- Layer 7: Bottom Wide -->
        <path d="M120 195 Q18 221,18 248 L222 248 Q222 221,120 195Z" fill="url(#tg3)"/>
        <path d="M120 195 Q18 221,18 248 L222 248 Q222 221,120 195Z" fill="none" stroke="url(#gEdge)" stroke-width="1.5"/>

        <!-- Layer 6: Bottom -->
        <path d="M120 165 Q34 191,34 218 L206 218 Q206 191,120 165Z" fill="url(#tg3)"/>
        <path d="M120 165 Q34 191,34 218 L206 218 Q206 191,120 165Z" fill="none" stroke="url(#gEdge)" stroke-width="1.4"/>

        <!-- Layer 5: Lower Mid -->
        <path d="M120 138 Q46 163,46 188 L194 188 Q194 163,120 138Z" fill="url(#tg2)"/>
        <path d="M120 138 Q46 163,46 188 L194 188 Q194 163,120 138Z" fill="none" stroke="url(#gEdge)" stroke-width="1.3"/>

        <!-- Layer 4: Mid -->
        <path d="M120 110 Q60 134,60 158 L180 158 Q180 134,120 110Z" fill="url(#tg2)"/>
        <path d="M120 110 Q60 134,60 158 L180 158 Q180 134,120 110Z" fill="none" stroke="url(#gEdge)" stroke-width="1.2"/>

        <!-- Layer 3: Upper Mid -->
        <path d="M120 82 Q74 105,74 128 L166 128 Q166 105,120 82Z" fill="url(#tg1)"/>
        <path d="M120 82 Q74 105,74 128 L166 128 Q166 105,120 82Z" fill="none" stroke="url(#gEdge)" stroke-width="1.1"/>

        <!-- Layer 2: Upper -->
        <path d="M120 55 Q88 76,88 98 L152 98 Q152 76,120 55Z" fill="url(#tg1)"/>
        <path d="M120 55 Q88 76,88 98 L152 98 Q152 76,120 55Z" fill="none" stroke="url(#gEdge)" stroke-width="1"/>

        <!-- Layer 1: Top Branch -->
        <path d="M120 28 Q102 48,102 68 L138 68 Q138 48,120 28Z" fill="url(#tg1)"/>
        <path d="M120 28 Q102 48,102 68 L138 68 Q138 48,120 28Z" fill="none" stroke="url(#gEdge)" stroke-width="0.8"/>
      </g>

      <!-- Trunk -->
      <rect x="100" y="244" width="40" height="30" rx="3" fill="url(#trunk)"/>
    </svg>
  </div>

  <!-- ── Lights Container ── -->
  <div id="lights-box" style="position:absolute;inset:0;z-index:15;pointer-events:none;"></div>

  <!-- ── Ornaments ── -->
  <div class="ornament" style="top:44%;left:34%;width:11px;height:11px;
    background:radial-gradient(circle at 35% 30%, #ff8080, #dc2626, #7f1d1d);
    box-shadow:0 3px 10px rgba(220,38,38,0.65);"></div>
  <div class="ornament" style="top:36%;left:59%;width:10px;height:10px;
    background:radial-gradient(circle at 35% 30%, #fde68a, #f59e0b, #92400e);
    box-shadow:0 3px 10px rgba(245,158,11,0.65);"></div>
  <div class="ornament" style="top:56%;left:54%;width:10px;height:10px;
    background:radial-gradient(circle at 35% 30%, #93c5fd, #3b82f6, #1e3a8a);
    box-shadow:0 3px 10px rgba(59,130,246,0.65);"></div>
  <div class="ornament" style="top:64%;left:30%;width:9px;height:9px;
    background:radial-gradient(circle at 35% 30%, #c4b5fd, #8b5cf6, #4c1d95);
    box-shadow:0 3px 10px rgba(139,92,246,0.6);"></div>

  <!-- ── Sparkles Container ── -->
  <div id="sparkle-box" style="position:absolute;inset:0;z-index:19;pointer-events:none;"></div>

  <!-- ── Snow Container ── -->
  <div id="snow-box" style="position:absolute;inset:0;z-index:6;pointer-events:none;overflow:hidden;border-radius:inherit;"></div>

  <!-- ── Ground Snow ── -->
  <div class="ground-glow"></div>
  <div class="ground-surface"></div>

  <!-- ── Gift Boxes ── -->
  <!-- Left: Red -->
  <div class="gift" style="bottom:80px;left:72px;width:38px;height:32px;
    background:linear-gradient(145deg,#f87171,#dc2626);
    box-shadow:0 4px 14px rgba(220,38,38,0.4);">
    <div class="gift-lid" style="background:linear-gradient(145deg,#fca5a5,#ef4444);"></div>
    <div class="gift-ribbon-v"></div>
    <div class="gift-ribbon-h"></div>
    <div class="gift-bow"></div>
  </div>
  <!-- Center: Emerald -->
  <div class="gift" style="bottom:74px;left:50%;transform:translateX(-50%);width:42px;height:38px;
    background:linear-gradient(145deg,#34d399,#059669);
    box-shadow:0 4px 14px rgba(5,150,105,0.4);">
    <div class="gift-lid" style="background:linear-gradient(145deg,#6ee7b7,#10b981);"></div>
    <div class="gift-ribbon-v"></div>
    <div class="gift-ribbon-h"></div>
    <div class="gift-bow"></div>
  </div>
  <!-- Right: Blue -->
  <div class="gift" style="bottom:80px;right:72px;width:35px;height:30px;
    background:linear-gradient(145deg,#60a5fa,#2563eb);
    box-shadow:0 4px 14px rgba(37,99,235,0.4);">
    <div class="gift-lid" style="background:linear-gradient(145deg,#93c5fd,#3b82f6);"></div>
    <div class="gift-ribbon-v"></div>
    <div class="gift-ribbon-h"></div>
    <div class="gift-bow"></div>
  </div>

  <!-- ── Text Section ── -->
  <div style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);text-align:center;z-index:22;width:90%;">
    <h1 class="title">Merry Christmas</h1>
    <div class="divider"></div>
    <p class="subtitle">Warm Wishes from Saanify</p>
  </div>

  <!-- ── Vignette ── -->
  <div class="vignette"></div>

</div>

<script>
/* ═══════════════════════════════════════════
   GOD RAYS — 7 golden rays from star downward
   ═══════════════════════════════════════════ */
(function initRays() {
  const box = document.getElementById('rays-container');
  const rays = [
    { angle: -32, w: 22, h: 200, del: 0 },
    { angle: -20, w: 16, h: 250, del: 0.7 },
    { angle: -9,  w: 28, h: 290, del: 1.4 },
    { angle:  0,  w: 34, h: 320, del: 2.1 },
    { angle:  9,  w: 28, h: 290, del: 2.8 },
    { angle:  20, w: 16, h: 250, del: 3.5 },
    { angle:  32, w: 22, h: 200, del: 4.2 },
  ];
  rays.forEach(r => {
    const el = document.createElement('div');
    el.className = 'god-ray';
    el.style.cssText = `
      top:52px;
      left:calc(50% - ${r.w / 2}px);
      width:${r.w}px;
      height:${r.h}px;
      transform:rotate(${r.angle}deg);
      animation-delay:${r.del}s;
    `;
    box.appendChild(el);
  });
})();

/* ═══════════════════════════════════════════
   25 BLINKING LIGHTS — 5 colors, unique timing
   ═══════════════════════════════════════════ */
(function initLights() {
  const box = document.getElementById('lights-box');
  const colors = {
    red:    { bg: '#f87171', glow: 'rgba(248,113,113,' },
    blue:   { bg: '#60a5fa', glow: 'rgba(96,165,250,' },
    gold:   { bg: '#fbbf24', glow: 'rgba(251,191,36,' },
    green:  { bg: '#4ade80', glow: 'rgba(74,222,128,' },
    purple: { bg: '#c084fc', glow: 'rgba(192,132,252,' },
  };
  /* Har light ka position tree ke 7 layers ke andar hai */
  const lights = [
    /* Layer 1 */ { t:14, l:49, c:'red',    s:5, d:1.4, dl:0 },
    /* Layer 1 */ { t:17, l:52, c:'gold',   s:4, d:2.1, dl:0.3 },
    /* Layer 2 */ { t:21, l:44, c:'blue',   s:5, d:1.9, dl:0.6 },
    /* Layer 2 */ { t:23, l:56, c:'green',  s:4, d:2.7, dl:0.1 },
    /* Layer 2 */ { t:19, l:50, c:'purple', s:4, d:3.3, dl:0.8 },
    /* Layer 3 */ { t:27, l:40, c:'gold',   s:6, d:1.6, dl:0.2 },
    /* Layer 3 */ { t:29, l:51, c:'red',    s:5, d:2.3, dl:0.9 },
    /* Layer 3 */ { t:28, l:61, c:'blue',   s:4, d:1.8, dl:0.4 },
    /* Layer 4 */ { t:34, l:36, c:'green',  s:5, d:2.5, dl:0.5 },
    /* Layer 4 */ { t:35, l:48, c:'purple', s:6, d:3.1, dl:0.15 },
    /* Layer 4 */ { t:36, l:58, c:'gold',   s:5, d:1.5, dl:0.85 },
    /* Layer 4 */ { t:33, l:65, c:'red',    s:4, d:2.9, dl:0.35 },
    /* Layer 5 */ { t:40, l:32, c:'blue',   s:5, d:2.0, dl:0.7 },
    /* Layer 5 */ { t:41, l:45, c:'gold',   s:6, d:1.7, dl:0.25 },
    /* Layer 5 */ { t:42, l:57, c:'green',  s:5, d:3.4, dl:0.55 },
    /* Layer 5 */ { t:39, l:67, c:'red',    s:4, d:2.2, dl:0.75 },
    /* Layer 6 */ { t:47, l:29, c:'purple', s:5, d:2.8, dl:0.1 },
    /* Layer 6 */ { t:45, l:41, c:'red',    s:6, d:1.3, dl:0.6 },
    /* Layer 6 */ { t:48, l:52, c:'blue',   s:5, d:2.6, dl:0.3 },
    /* Layer 6 */ { t:46, l:63, c:'gold',   s:5, d:1.9, dl:0.9 },
    /* Layer 6 */ { t:44, l:72, c:'green',  s:4, d:3.0, dl:0.45 },
    /* Layer 7 */ { t:52, l:25, c:'gold',   s:5, d:2.4, dl:0.7 },
    /* Layer 7 */ { t:53, l:38, c:'purple', s:6, d:1.6, dl:0.2 },
    /* Layer 7 */ t:51, l:51, c:'red',    s:5, d:3.2, dl:0.5 },
    /* Layer 7 */ { t:54, l:63, c:'blue',   s:4, d:2.1, dl:0.8 },
  ];
  lights.forEach(l => {
    const col = colors[l.c];
    const el = document.createElement('div');
    el.className = 'light';
    const glowSize = l.s * 2.5;
    el.style.cssText = `
      top:${l.t}%;
      left:${l.l}%;
      width:${l.s}px;
      height:${l.s}px;
      background:${col.bg};
      box-shadow:0 0 ${glowSize}px ${glowSize * 0.6}px ${col.glow}0.55);
      --dur:${l.d}s;
      --del:${l.dl}s;
    `;
    box.appendChild(el);
  });
})();

/* ═══════════════════════════════════════════
   SPARKLES around the star
   ═══════════════════════════════════════════ */
(function initSparkles() {
  const box = document.getElementById('sparkle-box');
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 25 + Math.random() * 30;
    const x = 50 + Math.cos(angle) * (radius / 3.8);
    const y = 9.5 + Math.sin(angle) * (radius / 5.6);
    const el = document.createElement('div');
    el.className = 'sparkle';
    el.style.cssText = `
      left:${x}%;
      top:${y}%;
      --spkd:${2 + Math.random() * 3}s;
      --spkdel:${Math.random() * 4}s;
      width:${2 + Math.random() * 2}px;
      height:${2 + Math.random() * 2}px;
    `;
    box.appendChild(el);
  }
})();

/* ═══════════════════════════════════════════
   SNOW PARTICLES — 22 flakes, varying size/speed
   ═══════════════════════════════════════════ */
(function initSnow() {
  const box = document.getElementById('snow-box');
  for (let i = 0; i < 22; i++) {
    const size = 1.5 + Math.random() * 3;
    const left = Math.random() * 100;
    const fallDur = 7 + Math.random() * 9;
    const delay = Math.random() * 12;
    const drift = -25 + Math.random() * 50;
    const opacity = 0.25 + Math.random() * 0.45;
    const el = document.createElement('div');
    el.className = 'snow';
    el.style.cssText = `
      left:${left}%;
      width:${size}px;
      height:${size}px;
      --fd:${fallDur}s;
      --fsd:${delay}s;
      --sdx:${drift};
      --sop:${opacity};
    `;
    box.appendChild(el);
  }
})();
</script>

</body>
</html>
