/* Bee Karting — start-lights reaction test, a kart that follows the scroll along the circuit, ride calculator */
(() => {
  'use strict';
  const M = window.Motion || { $: (s, r = document) => r.querySelector(s), $$: (s, r = document) => Array.from(r.querySelectorAll(s)), motion: false, fine: false, reduce: true, ready: (f) => f(), onScroll: [], toast() {} };
  const { $, $$ } = M;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  /* Reaction test */
  const lights = $('#lights'), btn = $('#react-btn'), out = $('#react-out'), bestEl = $('#react-best');
  if (lights && btn) {
    const dots = $$('i', lights);
    let state = 'idle', timers = [], t0 = 0, best = 0;
    try { best = +localStorage.getItem('bk-best') || 0; } catch (e) { /* ignore */ }
    if (best) bestEl.textContent = best + ' мс';
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const reset = () => { dots.forEach((d) => d.classList.remove('on')); lights.classList.remove('go'); };
    const start = () => {
      clear(); reset(); state = 'lights';
      btn.textContent = 'Ждите…'; btn.classList.add('is-wait');
      out.textContent = 'Огни зажигаются. Не спешите.';
      dots.forEach((d, i) => timers.push(setTimeout(() => d.classList.add('on'), 450 + i * 650)));
      const hold = 450 + dots.length * 650 + 500 + Math.random() * 1900;
      timers.push(setTimeout(() => {
        dots.forEach((d) => d.classList.remove('on'));
        lights.classList.add('go'); dots.forEach((d) => d.classList.add('on'));
        state = 'go'; t0 = performance.now();
        btn.textContent = 'Жми!'; btn.classList.remove('is-wait');
      }, hold));
    };
    const press = () => {
      if (state === 'idle' || state === 'done') { start(); return; }
      if (state === 'lights') {
        clear(); reset(); state = 'done';
        out.innerHTML = '<b>Фальстарт</b>Огни ещё горели. Попробуйте снова.';
        btn.textContent = 'Ещё раз'; btn.classList.remove('is-wait');
        return;
      }
      if (state === 'go') {
        const ms = Math.round(performance.now() - t0);
        state = 'done';
        out.innerHTML = '<b>' + ms + ' мс</b>' + (ms < 250 ? 'Как на этапе чемпионата' : ms < 400 ? 'Хорошая реакция' : 'Есть куда ускоряться');
        if (!best || ms < best) { best = ms; bestEl.textContent = ms + ' мс'; try { localStorage.setItem('bk-best', String(ms)); } catch (e) { /* ignore */ } }
        btn.textContent = 'Ещё раз';
      }
    };
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
    btn.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) press(); } });
  }

  /* Track scene */
  const scene = $('#track');
  const laps = $$('#laps li');
  const shots = $$('#shots .sh');
  const line = $('#circuit-line'), kart = $('#kart');
  if (scene && laps.length && M.motion && line && kart) {
    const len = line.getTotalLength();
    const lapN = $('#lap-n');
    line.style.strokeDasharray = '10 12';
    let idx = -1;
    const place = (p) => {
      const d = p * len;
      const a = line.getPointAtLength(d), b = line.getPointAtLength(Math.min(len, d + 2));
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      kart.setAttribute('transform', 'translate(' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
    };
    const upd = () => {
      const r = scene.getBoundingClientRect();
      const span = scene.offsetHeight - innerHeight;
      const p = clamp(span > 0 ? -r.top / span : 0);
      place(Math.min(0.9999, p));
      const i = Math.min(laps.length - 1, Math.floor(p * laps.length * 0.999));
      if (i === idx) return;
      idx = i;
      laps.forEach((l, k) => l.classList.toggle('is-on', k === i));
      shots.forEach((s, k) => s.classList.toggle('is-on', k === i));
      if (lapN) lapN.textContent = i + 1;
    };
    M.onScroll.push(upd);
    upd();
  }

  /* Calculator (prices: price boards of the club, photos in the 2GIS card) */
  const form = $('#calc');
  if (form) {
    const P = {
      gas: { n: 'Бензиновый карт', 5: 5000, 10: 9000, 15: 13000 },
      duo: { n: 'Двухместный карт', 5: 7000, 10: 11000, 15: 15000 },
      drift: { n: 'Дрифт-кар', 5: 4000, 10: 7000, 15: 10000 },
    };
    let n = 2, shown = 18000, raf = 0;
    const sumEl = $('#sum'), per = $('#per'), tl = $('#t-line'), qn = $('#qn');
    const bookN = $('#book-n'), bf = $('#book-form');
    let note = '';
    const val = (k) => (form.querySelector('input[name=' + k + ']:checked') || {}).value;
    const anim = (to) => {
      cancelAnimationFrame(raf);
      if (!M.motion) { shown = to; sumEl.textContent = fmt(to); return; }
      const from = shown, t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 460), e = 1 - Math.pow(1 - k, 3);
        shown = from + (to - from) * e; sumEl.textContent = fmt(shown);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const render = () => {
      const kind = val('kind'), min = val('min');
      const one = P[kind][min];
      qn.textContent = n;
      tl.textContent = P[kind].n + ', ' + min + ' минут × ' + n;
      per.textContent = fmt(one) + ' ₸';
      anim(one * n);
      note = 'Посчитали на сайте: ' + P[kind].n + ', ' + min + ' минут, заездов ' + n + ', ' + fmt(one * n) + ' ₸.';
    };
    form.addEventListener('change', render);
    $$('.qty button', form).forEach((b) => b.addEventListener('click', () => { n = Math.max(1, Math.min(20, n + +b.dataset.d)); render(); }));
    if (bf) { bf.waExtra = () => note; }
    render();
  }
})();
