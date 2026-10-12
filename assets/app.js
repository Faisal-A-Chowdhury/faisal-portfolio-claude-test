(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const toast = $('#toast');
  let toastTimer;
  const showToast = m => { if (!toast) return; toast.textContent = m; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 1800); };

  /* theme */
  const themeToggle = $('#theme-toggle'), themeIcon = $('.theme-icon');
  const setTheme = t => {
    root.dataset.theme = t;
    try { localStorage.setItem('faisal-theme', t); } catch (e) {}
    themeIcon.textContent = t === 'dark' ? '☀' : '☾';
    themeToggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    $('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0b1020' : '#f5f6f8');
  };
  let saved = null; try { saved = localStorage.getItem('faisal-theme'); } catch (e) {}
  setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  themeToggle?.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  /* mobile menu */
  const menuToggle = $('#menu-toggle'), nav = $('#site-nav');
  const setMenu = open => {
    nav.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };
  menuToggle?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* small bits */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  const lt = $('#local-time');
  const tick = () => { if (lt) lt.textContent = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' }).format(new Date()) + ' CT'; };
  tick(); setInterval(tick, 30000);

  /* active nav link */
  const links = $$('.nav-link[data-section]');
  const io = new IntersectionObserver(es => {
    const v = es.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (v) links.forEach(l => l.classList.toggle('active', l.dataset.section === v.target.id));
  }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, .25, .5] });
  $$('.section-anchor').forEach(s => io.observe(s));

  /* publication filter */
  $$('.filter-button').forEach(b => b.addEventListener('click', () => {
    $$('.filter-button').forEach(i => i.classList.toggle('active', i === b));
    $$('.publication-item').forEach(i => { i.hidden = b.dataset.filter !== 'all' && i.dataset.category !== b.dataset.filter; });
  }));

  /* copy email */
  $('#copy-email')?.addEventListener('click', async e => {
    const mail = e.currentTarget.dataset.email;
    try { await navigator.clipboard.writeText(mail); showToast('Email copied'); } catch { showToast(mail); }
  });

  /* remembrance clock */
  const clock = $('#injustice-clock');
  const t0 = Date.parse('2025-12-12T08:25:00Z');
  const unit = k => $(`[data-time-${k}]`);
  const tickClock = () => {
    let s = Math.max(0, Math.floor((Date.now() - t0) / 1000));
    const d = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60); s %= 60;
    unit('days').textContent = d;
    unit('hours').textContent = String(h).padStart(2, '0');
    unit('minutes').textContent = String(m).padStart(2, '0');
    unit('seconds').textContent = String(s).padStart(2, '0');
    clock.setAttribute('aria-label', `${d} days, ${h} hours, ${m} minutes and ${s} seconds of injustice`);
  };
  if (clock) { tickClock(); setInterval(tickClock, 1000); }

  /* ---- Surface-code decoder demo: distance 5, rotated layout, bit-flip errors ---- */
  const svg = $('#lattice');
  if (!svg) return;
  const D = 5, P = 64, O = 48, NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}, p = svg) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };

  // Z-type stabiliser faces (detect X errors): checkerboard bulk + weight-2 faces on top/bottom edges.
  const faces = [], xfaces = [];
  for (let i = -1; i <= D - 1; i++) for (let j = 0; j <= D - 2; j++) {
    const qs = [[i, j], [i, j + 1], [i + 1, j], [i + 1, j + 1]].filter(([r, c]) => r >= 0 && r < D && c >= 0 && c < D).map(([r, c]) => r * D + c);
    const isBulk = i >= 0 && i <= D - 2;
    if ((i + j) % 2 === 0) faces.push({ i, j, qs }); else if (isBulk) xfaces.push({ i, j });
  }
  const mask = Array(D * D).fill(0);
  faces.forEach((f, k) => f.qs.forEach(q => mask[q] |= 1 << k));

  const faceRect = (f, cls) => {
    const x = O + P * f.j, y = O + P * f.i;
    if (f.i === -1) return el('rect', { x, y: y + P / 2, width: P, height: P / 2, rx: 4, class: cls });
    if (f.i === D - 1) return el('rect', { x, y, width: P, height: P / 2, rx: 4, class: cls });
    return el('rect', { x, y, width: P, height: P, class: cls });
  };
  xfaces.forEach(f => faceRect(f, 'xf'));
  const zEls = faces.map(f => faceRect(f, 'zf'));

  const qEls = [];
  for (let r = 0; r < D; r++) for (let c = 0; c < D; c++) {
    const q = r * D + c;
    const g = el('g', { class: 'q', tabindex: 0, role: 'button', 'aria-pressed': 'false', 'aria-label': `Data qubit row ${r + 1}, column ${c + 1}` });
    el('circle', { cx: O + P * c, cy: O + P * r, r: 13, class: 'ring' }, g);
    el('circle', { cx: O + P * c, cy: O + P * r, r: 9, class: 'dot' }, g);
    const flip = () => { err[q] ^= 1; update(); };
    g.addEventListener('click', flip);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    qEls.push(g);
  }
  const err = Array(D * D).fill(0);

  const syndrome = () => err.reduce((s, e, q) => e ? s ^ mask[q] : s, 0);
  const search = (start, left, acc, target, picked) => {
    if (!left) return acc === target ? picked : null;
    for (let q = start; q <= D * D - left; q++) {
      const r = search(q + 1, left - 1, acc ^ mask[q], target, [...picked, q]);
      if (r) return r;
    }
    return null;
  };
  const decode = s => { if (!s) return []; for (let w = 1; w <= 6; w++) { const r = search(0, w, 0, s, []); if (r) return r; } return null; };

  const status = $('#lattice-status');
  function update() {
    const s = syndrome();
    const corr = decode(s);
    qEls.forEach((g, q) => { g.classList.toggle('err', !!err[q]); g.setAttribute('aria-pressed', String(!!err[q])); g.classList.toggle('fix', !!corr && corr.includes(q)); });
    zEls.forEach((z, k) => z.classList.toggle('hot', !!(s >> k & 1)));
    const n = err.reduce((a, b) => a + b, 0), defects = faces.filter((_, k) => s >> k & 1).length;
    status.className = 'lattice-status';
    if (!n) { status.textContent = 'No errors. Select a qubit to inject a bit-flip.'; return; }
    if (!corr) { status.textContent = `${n} errors, ${defects} defects: too many for this demo to decode.`; status.classList.add('bad'); return; }
    const residual = err.map((e, q) => e ^ (corr.includes(q) ? 1 : 0));
    const logical = [0, 1, 2, 3, 4].reduce((a, r) => a ^ residual[r * D], 0);
    status.classList.add(logical ? 'bad' : 'ok');
    if (!corr.length) { status.textContent = `${n} errors, no defects: the pattern is invisible to the stabilizers, so the decoder does nothing. ` + (logical ? 'It is a logical flip.' : 'It is harmless (a stabilizer).'); return; }
    status.textContent = `${n} error${n > 1 ? 's' : ''}, ${defects} defect${defects === 1 ? '' : 's'}. Decoder flips ${corr.length} qubit${corr.length === 1 ? '' : 's'} (teal rings). ` +
      (logical ? 'Residual error is a logical flip: decoding failed.' : 'Logical qubit preserved.');
  }
  $('#lat-clear')?.addEventListener('click', () => { err.fill(0); update(); });
  $('#lat-random')?.addEventListener('click', () => {
    err.fill(0);
    const k = 2 + Math.floor(Math.random() * 3);
    while (err.reduce((a, b) => a + b, 0) < k) err[Math.floor(Math.random() * D * D)] = 1;
    update();
  });
  // start with a small example so the page opens with the idea visible
  [7, 12].forEach(q => err[q] = 1);
  update();
})();
