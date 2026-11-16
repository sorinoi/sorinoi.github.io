/* =========================================================
   Sorin — Portfolio interactions
   ========================================================= */
(function () {
  'use strict';

  var DEVICON = 'https://cdn.jsdelivr.net/npm/devicon@2.16.0/icons/';

  // ---------- Config: tech icons on each orbit ----------
  // icon: devicon path, txt: text logo, svg: inline svg, invert: white-ify dark logos in dark theme
  var ORBITS = [
    {
      // outer ring (cyan)
      radius: 0.455,      // ring radius as fraction of stage width
      flatten: 0.36,      // vertical squash (cos of tilt angle) — smaller = flatter ellipse
      tilt: -4,           // screen-space tilt (deg)
      centerY: 0.53,      // ring center as fraction of stage height
      period: 70,         // seconds per full turn (slow, but visibly moving)
      direction: 1,
      startAngle: 200,
      items: [
        { name: 'React', icon: 'react/react-original.svg' },
        { name: 'Next.js', icon: 'nextjs/nextjs-original.svg', invert: true },
        { name: 'Node.js', icon: 'nodejs/nodejs-original.svg' },
        { name: 'Express', icon: 'express/express-original.svg', invert: true },
        { name: 'PHP', icon: 'php/php-original.svg' },
        { name: 'MariaDB', icon: 'mariadb/mariadb-original.svg' },
        { name: 'CrewAI', svg: 'crewai' },
        { name: 'PM2', txt: 'PM2' },
        { name: 'Nginx', icon: 'nginx/nginx-original.svg' },
        { name: 'Docker', icon: 'docker/docker-original.svg' },
        { name: 'TypeScript', icon: 'typescript/typescript-original.svg' },
        { name: 'SvelteKit', icon: 'svelte/svelte-original.svg' },
        { name: 'Vue 3', icon: 'vuejs/vuejs-original.svg' }
      ]
    },
    {
      // inner ring (purple) — turns the other way
      radius: 0.30,
      flatten: 0.34,
      tilt: 3,
      centerY: 0.52,
      period: 50,
      direction: -1,
      startAngle: 160,
      items: [
        { name: 'MySQL', icon: 'mysql/mysql-original.svg' },
        { name: 'Oracle', icon: 'oracle/oracle-original.svg' },
        { name: 'GitHub', icon: 'github/github-original.svg', invert: true },
        { name: 'Git', icon: 'git/git-original.svg' }
      ]
    }
  ];

  var CREWAI_SVG =
    '<svg viewBox="0 0 64 40" width="54%" height="40%" aria-hidden="true">' +
    '<defs><linearGradient id="cg" x1="0" x2="1"><stop offset="0" stop-color="#ff2d8a"/><stop offset="1" stop-color="#ff5ad1"/></linearGradient></defs>' +
    '<path d="M18 8c-7 0-12 5-12 12s5 12 12 12c9 0 19-24 28-24 7 0 12 5 12 12s-5 12-12 12c-9 0-19-24-28-24z" ' +
    'fill="none" stroke="url(#cg)" stroke-width="6" stroke-linecap="round"/></svg>';

  var stage = document.getElementById('orbitStage');
  var list = document.getElementById('techList');
  var portrait = document.getElementById('portrait');
  var planesBack = stage.querySelectorAll('.layer-back .ring-plane');
  var planesFront = stage.querySelectorAll('.layer-front .ring-plane');

  // ---------- Build tech cards ----------
  ORBITS.forEach(function (orbit, oi) {
    orbit.angle = orbit.startAngle * Math.PI / 180;
    orbit.planes = [planesBack[oi], planesFront[oi]];
    orbit.rings = orbit.planes.map(function (p) { return p.querySelector('.ring'); });
    orbit.els = orbit.items.map(function (item) {
      var el = document.createElement('div');
      el.className = 'tech';
      el.setAttribute('title', item.name);
      var logo;
      if (item.icon) {
        logo = '<img src="' + DEVICON + item.icon + '" alt="" loading="lazy"' + (item.invert ? ' class="invert"' : '') + '>';
      } else if (item.svg === 'crewai') {
        logo = CREWAI_SVG;
      } else {
        logo = '<span class="txt-logo">' + item.txt + '</span>';
      }
      el.innerHTML = logo + '<span class="label">' + item.name + '</span>';
      list.appendChild(el);
      return el;
    });

    // spread light beads evenly around the ring
    orbit.rings.forEach(function (ring) {
      var beads = ring.querySelectorAll('i');
      beads.forEach(function (b, bi) {
        var a = (bi / beads.length) * 360 + 15;
        b.style.transform = 'rotate(' + a + 'deg) translateX(var(--r))';
      });
    });
  });

  // ---------- Layout ----------
  var W = 0, H = 0;
  function layout() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    var mobile = W < 640;

    ORBITS.forEach(function (o, oi) {
      var R = o.radius * W;
      if (mobile) R = W * (oi === 0 ? 0.45 : 0.29);
      o.R = R;
      o.flat = mobile ? o.flatten + 0.16 : o.flatten;
      o.cx = W / 2;
      o.cy = H * (mobile ? o.centerY + 0.03 : o.centerY);
      var tiltX = Math.acos(o.flat) * 180 / Math.PI;
      o.planes.forEach(function (p) {
        p.style.width = p.style.height = (2 * R) + 'px';
        p.style.transform =
          'translate(' + (o.cx - R) + 'px,' + (o.cy - R) + 'px) rotate(' + o.tilt + 'deg) rotateX(' + tiltX + 'deg)';
        p.style.setProperty('--r', R + 'px');
      });
    });

    // portrait sits a little above the ring center
    var size = Math.min(W * (mobile ? 0.52 : 0.33), H * (mobile ? 0.66 : 0.86));
    portrait.style.width = portrait.style.height = size + 'px';
    portrait.style.left = (W / 2 - size / 2) + 'px';
    portrait.style.top = (ORBITS[0].cy - size * 0.62) + 'px';
  }

  // ---------- Animation ----------
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var speed = reduceMotion ? 0.35 : 1;   // current speed factor
  var targetSpeed = speed;
  var last = performance.now();

  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    speed += (targetSpeed - speed) * Math.min(dt * 4, 1);

    ORBITS.forEach(function (o) {
      o.angle += o.direction * (2 * Math.PI / o.period) * dt * speed;
      var deg = o.angle * 180 / Math.PI;
      o.rings.forEach(function (r) { r.style.transform = 'rotate(' + deg + 'deg)'; });

      var n = o.els.length;
      var tilt = o.tilt * Math.PI / 180;
      var ct = Math.cos(tilt), st = Math.sin(tilt);
      for (var i = 0; i < n; i++) {
        var a = o.angle + (i / n) * Math.PI * 2;
        var lx = o.R * Math.cos(a);
        var ly = o.R * Math.sin(a) * o.flat;
        var x = o.cx + lx * ct - ly * st;
        var y = o.cy + lx * st + ly * ct;
        var depth = Math.sin(a);                 // -1 = back, 1 = front
        var scale = 0.8 + 0.22 * (depth + 1) / 2;
        var el = o.els[i];
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
        el.style.zIndex = depth > 0 ? 8 : 2;
        el.style.opacity = (0.72 + 0.28 * (depth + 1) / 2).toFixed(2);
      }
    });
    requestAnimationFrame(frame);
  }

  // slow down while hovering a tech card
  list.addEventListener('mouseover', function (e) {
    if (e.target.closest('.tech')) targetSpeed = 0.12;
  });
  list.addEventListener('mouseout', function (e) {
    if (e.target.closest('.tech') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.tech'))) {
      targetSpeed = reduceMotion ? 0.35 : 1;
    }
  });

  layout();
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(stage);
  else window.addEventListener('resize', layout);
  requestAnimationFrame(frame);

  // ---------- Background city ----------
  function buildCity(container, side) {
    var colors = ['#ff3df2', '#38f3ff', '#a855f7', '#4f7bff', '#ff4fa3'];
    var html = '';
    var count = 14;
    for (var i = 0; i < count; i++) {
      var far = i % 2 === 0;
      var w = 30 + Math.random() * (far ? 50 : 70);
      var h = (far ? 45 : 25) + Math.random() * (far ? 50 : 55);
      var pos = (i / count) * 100 + (Math.random() * 6 - 3);
      var c = colors[(Math.random() * colors.length) | 0];
      var c2 = colors[(Math.random() * colors.length) | 0];
      var style =
        side + ':' + pos.toFixed(1) + '%;' +
        'width:' + w.toFixed(0) + 'px;height:' + h.toFixed(0) + '%;' +
        '--win:' + hexA(c, far ? 0.12 : 0.2) + ';' +
        '--gap:' + (12 + ((Math.random() * 12) | 0)) + 'px;' +
        '--edge:' + hexA(c2, 0.6) + ';' +
        '--sign:' + c2 + ';' +
        '--sx:' + (15 + Math.random() * 60).toFixed(0) + '%;' +
        '--sy:' + (8 + Math.random() * 40).toFixed(0) + '%;' +
        '--sh:' + (8 + Math.random() * 25).toFixed(0) + '%;' +
        '--so:' + (Math.random() > 0.45 ? 0.9 : 0) + ';' +
        '--d:' + (Math.random() * -8).toFixed(2) + 's;' +
        '--fd:' + (5 + Math.random() * 6).toFixed(1) + 's;' +
        'z-index:' + (far ? 1 : 2) + ';';
      html += '<div class="building' + (far ? ' far' : '') + '" style="' + style + '"></div>';
    }
    container.innerHTML = html;
  }
  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  buildCity(document.querySelector('.city-left'), 'left');
  buildCity(document.querySelector('.city-right'), 'right');

  // ---------- Particles ----------
  var canvas = document.getElementById('particles');
  var ctx = canvas.getContext('2d');
  var dots = [];
  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.round(Math.min(110, innerWidth / 12));
    dots = [];
    for (var i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        r: Math.random() * 1.6 + 0.3,
        vy: -(Math.random() * 0.15 + 0.03),
        vx: (Math.random() - 0.5) * 0.08,
        c: Math.random() > 0.5 ? '56,243,255' : '200,120,255',
        p: Math.random() * Math.PI * 2
      });
    }
  }
  function drawParticles(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      if (!reduceMotion) { d.x += d.vx; d.y += d.vy; }
      if (d.y < -5) { d.y = innerHeight + 5; d.x = Math.random() * innerWidth; }
      var a = 0.35 + 0.35 * Math.sin(t / 900 + d.p);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + d.c + ',' + a.toFixed(2) + ')';
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(' + d.c + ',1)';
      ctx.fill();
    }
    requestAnimationFrame(drawParticles);
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);
  requestAnimationFrame(drawParticles);

  // ---------- Theme toggle ----------
  var root = document.documentElement;
  document.getElementById('themeToggle').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();
