/* ==========================================================
   Akshaj Kumar Bhardwaj — Portfolio scripts
   ========================================================== */
(() => {
  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;

  /* ---------- Day / night edition ---------- */
  $('#themeToggle').addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Mobile contents menu ---------- */
  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');
  const closeMenu = () => { navLinks.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Active link in the contents ---------- */
  const sections = [...document.querySelectorAll('main section[id]')];
  const links = [...navLinks.querySelectorAll('a')];
  const onScroll = () => {
    let current = '';
    sections.forEach((s) => { if (window.scrollY >= s.offsetTop - 140) current = s.id; });
    links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  $('#year').textContent = new Date().getFullYear();

  /* ==========================================================
     BUG DODGER — mini game for the Game Dev Corner
     ========================================================== */
  const INK = '#0c0a08';      // screen
  const PAPER = '#f0e7d3';    // player, stars
  const SPOT = '#ff5b3d';     // bugs, thrusters
  const GOLD = '#f2c230';     // coffee

  const canvas = $('#gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const overlay = $('#gOverlay');
  const ovTitle = overlay.querySelector('.ov-title');
  const ovSub = overlay.querySelector('.ov-sub');
  const startTxt = $('#gStartTxt');
  const scoreEl = $('#gScore');
  const highEl = $('#gHigh');

  let high = 0;
  try { high = +localStorage.getItem('bugDodgerHigh') || 0; } catch (e) {}
  highEl.textContent = high;

  const player = { x: W / 2 - 14, y: H - 34, w: 28, h: 20, speed: 260 };
  let items = [], score = 0, running = false, last = 0, spawnT = 0, elapsed = 0;
  const keys = { left: false, right: false };
  const stars = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.5 + .5 }));

  function reset() {
    items = []; score = 0; spawnT = 0; elapsed = 0;
    player.x = W / 2 - player.w / 2;
    scoreEl.textContent = 0;
  }

  function spawn() {
    const isCoffee = Math.random() < 0.18;
    const size = isCoffee ? 16 : 14 + Math.random() * 8;
    items.push({
      x: Math.random() * (W - size), y: -size, size,
      vy: (90 + Math.random() * 80) * (1 + elapsed / 40),
      coffee: isCoffee, wob: Math.random() * Math.PI * 2,
    });
  }

  function drawPlayer() {
    const { x, y, w, h } = player;
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + w / 2 - 3, y - 6, 6, 6);   // nose
    ctx.fillRect(x + 4, y, w - 8, h - 6);        // body
    ctx.fillRect(x, y + 8, w, 6);                // wings
    ctx.fillStyle = SPOT;
    ctx.fillRect(x + 6, y + h - 6, 5, 4);        // thrusters
    ctx.fillRect(x + w - 11, y + h - 6, 5, 4);
  }

  function drawBug(b) {
    const s = b.size, x = b.x, y = b.y;
    ctx.fillStyle = SPOT;
    ctx.fillRect(x + s * .25, y + s * .2, s * .5, s * .65);      // body
    const leg = Math.sin(b.wob) * 2;
    ctx.fillRect(x, y + s * .35 + leg, s * .25, 2);              // legs
    ctx.fillRect(x + s * .75, y + s * .35 - leg, s * .25, 2);
    ctx.fillRect(x, y + s * .65 - leg, s * .25, 2);
    ctx.fillRect(x + s * .75, y + s * .65 + leg, s * .25, 2);
    ctx.fillStyle = INK;
    ctx.fillRect(x + s * .32, y + s * .3, s * .12, s * .12);     // eyes
    ctx.fillRect(x + s * .56, y + s * .3, s * .12, s * .12);
  }

  function drawCoffee(c) {
    const x = c.x, y = c.y;
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 2, y + 5, 10, 10);   // cup
    ctx.fillRect(x + 12, y + 7, 3, 5);    // handle
    ctx.fillStyle = INK;
    ctx.fillRect(x + 3, y + 6, 8, 3);     // coffee
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + 5, y, 2, 3);         // steam
    ctx.fillRect(x + 8, y + 1, 2, 3);
  }

  function drawBg(dt) {
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = .45;
    ctx.fillStyle = PAPER;
    stars.forEach((st) => {
      st.y += st.s * 30 * dt;
      if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
      ctx.fillRect(st.x, st.y, st.s, st.s);
    });
    ctx.globalAlpha = 1;
  }

  function hit(a, b) {
    return a.x < b.x + b.size && a.x + a.w > b.x && a.y < b.y + b.size && a.y + a.h > b.y;
  }

  function gameOver() {
    running = false;
    const isNewHigh = score > high;
    if (isNewHigh) {
      high = score; highEl.textContent = high;
      try { localStorage.setItem('bugDodgerHigh', high); } catch (e) {}
    }
    ovTitle.textContent = 'GAME OVER';
    ovSub.textContent = 'Score: ' + score + (isNewHigh ? '. New high score!' : '');
    startTxt.textContent = 'Play again';
    overlay.classList.remove('hidden');
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    elapsed += dt;

    if (keys.left) player.x -= player.speed * dt;
    if (keys.right) player.x += player.speed * dt;
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = Math.max(0.22, 0.75 - elapsed / 60); }

    drawBg(dt);
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.vy * dt;
      it.wob += dt * 12;
      if (hit(player, it)) {
        if (it.coffee) { score += 10; items.splice(i, 1); continue; }
        drawBug(it); drawPlayer(); scoreEl.textContent = score; return gameOver();
      }
      if (it.y > H) { items.splice(i, 1); if (!it.coffee) score += 1; continue; }
      if (it.coffee) drawCoffee(it); else drawBug(it);
    }
    drawPlayer();
    scoreEl.textContent = score;
    requestAnimationFrame(loop);
  }

  function start() {
    reset();
    overlay.classList.add('hidden');
    keys.left = keys.right = false;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  // idle screen
  drawBg(0); drawPlayer();

  $('#gStart').addEventListener('click', start);

  const dirOf = (k) => (k === 'ArrowLeft' || k === 'a' || k === 'A') ? 'left'
    : (k === 'ArrowRight' || k === 'd' || k === 'D') ? 'right' : null;
  window.addEventListener('keydown', (e) => {
    const dir = dirOf(e.key);
    if (!running || !dir) return;
    e.preventDefault();
    keys[dir] = true;
  });
  window.addEventListener('keyup', (e) => {
    const dir = dirOf(e.key);
    if (dir) keys[dir] = false;
  });
  window.addEventListener('blur', () => { keys.left = keys.right = false; });

  // touch: on-screen buttons, or hold the left / right half of the screen
  const hold = (el, dir) => {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); keys[dir] = true; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, () => { keys[dir] = false; }));
  };
  hold($('#gLeft'), 'left');
  hold($('#gRight'), 'right');

  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const dir = e.clientX - r.left < r.width / 2 ? 'left' : 'right';
    keys[dir] = true;
    const up = () => {
      keys[dir] = false;
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });
})();
