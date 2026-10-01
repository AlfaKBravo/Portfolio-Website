/* ==========================================================
   Akshaj Kumar Bhardwaj — Portfolio scripts
   ========================================================== */
(() => {
  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;

  /* ---------- Theme toggle ---------- */
  $('#themeToggle').addEventListener('click', () => {
    const isLight = root.dataset.theme
      ? root.dataset.theme === 'light'
      : window.matchMedia('(prefers-color-scheme: light)').matches;
    const next = isLight ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');
  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  navLinks.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', false);
    })
  );

  /* ---------- Nav border + active link ---------- */
  const nav = $('#nav');
  const sections = [...document.querySelectorAll('main section[id]')];
  const links = [...navLinks.querySelectorAll('a')];
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
    let current = '';
    sections.forEach((s) => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
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
  const canvas = $('#gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const overlay = $('#gOverlay');
  const scoreEl = $('#gScore');
  const highEl = $('#gHigh');

  let high = 0;
  try { high = +localStorage.getItem('bugDodgerHigh') || 0; } catch (e) {}
  highEl.textContent = high;

  const player = { x: W / 2 - 14, y: H - 34, w: 28, h: 20, speed: 260 };
  let items, score, running, last, spawnT, elapsed, stars;
  const keys = { left: false, right: false };

  stars = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.5 + .5 }));

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
    ctx.fillStyle = '#39ff88';
    ctx.fillRect(x + w / 2 - 3, y - 6, 6, 6);   // nose
    ctx.fillRect(x + 4, y, w - 8, h - 6);        // body
    ctx.fillRect(x, y + 8, w, 6);                // wings
    ctx.fillStyle = '#ff3d81';
    ctx.fillRect(x + 6, y + h - 6, 5, 4);        // thrusters
    ctx.fillRect(x + w - 11, y + h - 6, 5, 4);
  }

  function drawBug(b) {
    const s = b.size, x = b.x, y = b.y;
    ctx.fillStyle = '#ff3d81';
    ctx.fillRect(x + s * .25, y + s * .2, s * .5, s * .65);      // body
    ctx.fillStyle = '#ffd1e1';
    ctx.fillRect(x + s * .32, y + s * .3, s * .12, s * .12);     // eyes
    ctx.fillRect(x + s * .56, y + s * .3, s * .12, s * .12);
    ctx.fillStyle = '#ff3d81';
    const leg = Math.sin(b.wob) * 2;
    ctx.fillRect(x, y + s * .35 + leg, s * .25, 2);              // legs
    ctx.fillRect(x + s * .75, y + s * .35 - leg, s * .25, 2);
    ctx.fillRect(x, y + s * .65 - leg, s * .25, 2);
    ctx.fillRect(x + s * .75, y + s * .65 + leg, s * .25, 2);
  }

  function drawCoffee(c) {
    const x = c.x, y = c.y;
    ctx.fillStyle = '#f5d76e';
    ctx.fillRect(x + 2, y + 5, 10, 10);
    ctx.fillRect(x + 12, y + 7, 3, 5);
    ctx.fillStyle = '#7a4a1e';
    ctx.fillRect(x + 3, y + 6, 8, 3);
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.fillRect(x + 5, y, 2, 3);
    ctx.fillRect(x + 8, y + 1, 2, 3);
  }

  function drawBg(dt) {
    ctx.fillStyle = '#05040c';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    stars.forEach((st) => {
      st.y += st.s * 30 * dt;
      if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
      ctx.fillRect(st.x, st.y, st.s, st.s);
    });
  }

  function hit(a, b) {
    return a.x < b.x + b.size && a.x + a.w > b.x && a.y < b.y + b.size && a.y + a.h > b.y;
  }

  function gameOver() {
    running = false;
    if (score > high) {
      high = score; highEl.textContent = high;
      try { localStorage.setItem('bugDodgerHigh', high); } catch (e) {}
    }
    overlay.querySelector('.big').textContent = 'GAME OVER';
    overlay.querySelector('.small').textContent = 'SCORE: ' + score + (score >= high && score > 0 ? '  NEW HI!' : '');
    $('#gStart').textContent = 'PLAY AGAIN';
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
        drawPlayer(); return gameOver();
      }
      if (it.y > H) { items.splice(i, 1); if (!it.coffee) score += 1; continue; }
      it.coffee ? drawCoffee(it) : drawBug(it);
    }
    drawPlayer();
    scoreEl.textContent = score;
    requestAnimationFrame(loop);
  }

  function start() {
    reset();
    overlay.classList.add('hidden');
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  // idle screen
  drawBg(0); drawPlayer();

  $('#gStart').addEventListener('click', start);

  const isGameKey = (k) => ['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(k);
  window.addEventListener('keydown', (e) => {
    if (!running || !isGameKey(e.key)) return;
    e.preventDefault();
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = false;
  });

  // touch: press left/right half of canvas, or on-screen buttons
  const hold = (el, dir) => {
    const on = (e) => { e.preventDefault(); keys[dir] = true; };
    const off = () => { keys[dir] = false; };
    el.addEventListener('pointerdown', on);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, off));
  };
  hold($('#gLeft'), 'left');
  hold($('#gRight'), 'right');

  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const dir = e.clientX - r.left < r.width / 2 ? 'left' : 'right';
    keys[dir] = true;
    const up = () => { keys[dir] = false; window.removeEventListener('pointerup', up); };
    window.addEventListener('pointerup', up);
  });
})();
