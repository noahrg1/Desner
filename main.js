(() => {
  const S = window.SITE || {};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Config into the page ---------- */
  if (S.priceLabel) $$('[data-price]').forEach(el => (el.textContent = S.priceLabel));
  if (S.viewingLocation) $$('[data-location]').forEach(el => (el.textContent = S.viewingLocation));
  const direct = $('[data-direct]');
  if (direct) {
    const parts = [];
    if (S.phone) parts.push(`<a href="tel:${S.phone.replace(/\s+/g, '')}">${S.phone}</a>`);
    if (S.email) parts.push(`<a href="mailto:${S.email}">${S.email}</a>`);
    direct.innerHTML = parts.join('<br>');
  }

  /* ---------- Gallery (optional, from config) ---------- */
  const gallery = $('#gallery');
  if (gallery && Array.isArray(S.gallery) && S.gallery.length) {
    gallery.innerHTML = S.gallery
      .map(p => `<figure><img src="${p.src}" alt="${(p.alt || '').replace(/"/g, '&quot;')}" loading="lazy"></figure>`)
      .join('');
    gallery.hidden = false;
  }

  /* ---------- Stagger the line drawings ---------- */
  $$('svg .lines').forEach(g => [...g.children].forEach((el, i) => el.style.setProperty('--i', i)));

  const heroSvg = $('.profile .draw');
  const xSvg = $('.section-x svg');

  if (reduce) {
    heroSvg && heroSvg.classList.add('is-drawn');
    xSvg && xSvg.classList.add('is-drawn');
    $$('.dim').forEach(d => d.classList.add('is-on'));
    $$('[data-count]').forEach(el => (el.textContent = el.dataset.count));
  } else {
    // One orchestrated moment: the hero drawing sketches itself on load.
    requestAnimationFrame(() => setTimeout(() => heroSvg && heroSvg.classList.add('is-drawn'), 250));
    if (xSvg && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { xSvg.classList.add('is-drawn'); io.disconnect(); }
      }), { threshold: .35 });
      io.observe(xSvg);
    } else if (xSvg) xSvg.classList.add('is-drawn');
  }

  /* ---------- Hero features stagger ---------- */
  $$('.profile__features li').forEach((li, i) => li.style.setProperty('--i', i));

  /* ---------- Capability reveal ---------- */
  const caps = $$('.cap');
  caps.forEach((c, i) => {
    const d = (i % 2) * 140;
    c.style.setProperty('--d', d);
    $$('path, circle', c).forEach((el, k) => el.style.setProperty('--d', d + k * 120));
  });
  if (reduce || !('IntersectionObserver' in window)) caps.forEach(c => c.classList.add('is-in'));
  else {
    const cio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); cio.unobserve(e.target); }
    }), { threshold: .3, rootMargin: '0px 0px -10% 0px' });
    caps.forEach(c => cio.observe(c));
  }

  /* ---------- Statement: split into words ---------- */
  const words = $('[data-words]');
  let wordEls = [];
  if (words) {
    const txt = words.textContent.trim();
    words.innerHTML = txt.split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    wordEls = $$('.w', words);
    words.setAttribute('aria-label', txt);
  }

  /* ---------- Scroll-driven tracks ---------- */
  const nav = $('#nav');
  const profile = $('.profile');
  const statement = $('.statement');
  const section = $('.section-x');
  const counter = $('[data-count]');
  const engine = $('.engine');
  const ratio = $('[data-ratio]');
  const craft = $('.craft');
  if (craft) {
    if (reduce || !('IntersectionObserver' in window)) craft.classList.add('is-in');
    else {
      const kio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { craft.classList.add('is-in'); kio.disconnect(); } }), { threshold: .35 });
      kio.observe(craft);
    }
  }

  const progress = el => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const travel = r.height - vh;
    if (travel > 40) return clamp(-r.top / travel);
    // Not pinned (small screens): progress across the viewport instead.
    return clamp((vh - r.top) / (vh * .9));
  };

  const setDims = (root, p) => $$('.dim', root).forEach(d => d.classList.toggle('is-on', p >= parseFloat(d.dataset.at || 0)));

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;

    if (profile) {
      const pr = profile.getBoundingClientRect();
      nav.classList.toggle('is-solid', pr.bottom < 64);
      if (!reduce) {
        const p = progress(profile);
        profile.style.setProperty('--p', p.toFixed(4));
        setDims(profile, p);
      }
    }

    if (!reduce && statement && wordEls.length) {
      const p = progress(statement);
      const lit = Math.round(clamp(p * 1.2) * wordEls.length);
      wordEls.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    }

    if (!reduce && engine) {
      const e = clamp((progress(engine) - .05) / .45);
      engine.style.setProperty('--e', e.toFixed(3));
      if (ratio) ratio.textContent = (2.07 + .31 * e).toFixed(2);
    }

    if (!reduce && section) {
      const p = progress(section);
      const a = clamp((p - .1) / .5);
      section.style.setProperty('--a', a.toFixed(3));
      if (counter) counter.textContent = Math.round(a * parseFloat(counter.dataset.count));
      setDims(section, p);
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* ---------- Helm tabs ---------- */
  const tabs = $$('.helm__tabs [role=tab]');
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const k = e.key;
      let n = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (k === 'ArrowUp' || k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (k === 'Home') n = tabs[0];
      if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); select(n, true); }
    });
  });

  /* ---------- Helm dash focus follows tabs ---------- */
  const dashSvg = $('.dash svg');
  const focusFor = { 't-nav': 'nav', 't-steer': 'steer', 't-gauges': 'engine' };
  tabs.forEach(t => t.addEventListener('click', () => dashSvg && dashSvg.setAttribute('data-focus', focusFor[t.id])));
  tabs.forEach(t => t.addEventListener('keyup', () => {
    const sel = tabs.find(x => x.getAttribute('aria-selected') === 'true');
    if (sel && dashSvg) dashSvg.setAttribute('data-focus', focusFor[sel.id]);
  }));

  /* ---------- Layout plan ---------- */
  const plan = $('.plan');
  if (plan) {
    if (reduce || !('IntersectionObserver' in window)) plan.classList.add('is-in');
    else {
      const pio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { plan.classList.add('is-in'); pio.disconnect(); } }), { threshold: .3 });
      pio.observe(plan);
    }
    const hot = k => {
      $$('[data-mk]', plan).forEach(el => el.classList.toggle('is-hot', el.dataset.mk === k));
    };
    $$('[data-mk]', plan).forEach(el => {
      el.addEventListener('mouseenter', () => hot(el.dataset.mk));
      el.addEventListener('click', () => hot(el.dataset.mk));
      el.addEventListener('mouseleave', () => hot(null));
    });
  }

  /* ---------- Fit-out hotspots ---------- */
  const SPOTS = {
    bow: ['Bow sundeck', 'A cushioned sundeck across the bow, suited to time at anchor.'],
    console: ['Console', 'SES800 aluminium console with windscreen and cushions, housing the Simrad GO9, engine gauges, custom wheel and hydraulic helm.'],
    seat: ['Helm seat', 'SWF950 aluminium helm seat with leather-effect, diamond-stitched upholstery. A fold-out table is mounted on the back.'],
    deck: ['Decking', 'Teak-effect EVA foam in brown and white. Comfortable and secure underfoot, and it requires no oiling.'],
    stern: ['Stern lounge', 'A cushioned lounge across the stern, close to the freshwater shower.'],
    arch: ['Arch', 'Aluminium stern arch carrying the light mast. A marine stereo, deck lights and an underwater light are fitted as standard.'],
    platform: ['Platforms', 'Twin stern platforms either side of the outboard, with a boarding ladder for swimmers and divers.'],
    tubes: ['Tubes', 'ORCA 828 Hypalon tubes in Neptune Grey, 52 cm in diameter, with a heavy-duty rubbing strake. Hypalon is widely used on commercial and rescue RIBs.']
  };
  const spotBtns = $$('.spot');
  const sTitle = $('[data-spot-title]');
  const sBody = $('[data-spot-body]');
  spotBtns.forEach(b => {
    const d = SPOTS[b.dataset.spot];
    if (d) b.setAttribute('aria-label', `Show ${d[0]}`);
    b.addEventListener('click', () => {
      if (!d) return;
      spotBtns.forEach(x => x.classList.toggle('is-active', x === b));
      sTitle.textContent = d[0];
      sBody.textContent = d[1];
    });
  });
  const seat = spotBtns.find(b => b.dataset.spot === 'seat');
  seat && seat.classList.add('is-active');

  /* ---------- Enquiry form (opens the visitor's email app) ---------- */
  const form = $('#enquiry');
  if (form) {
    const status = $('.form__status', form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const phone = form.phone.value.trim();
      const intent = (form.querySelector('[name=intent]:checked') || {}).value || 'Enquiry';
      const msg = form.message.value.trim();

      let bad = null;
      form.name.setAttribute('aria-invalid', !name);
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      form.email.setAttribute('aria-invalid', !emailOk);
      if (!name) bad = 'Add your name so we know who to reply to.';
      else if (!emailOk) bad = 'Enter an email address like name@example.co.nz.';
      if (bad) {
        status.textContent = bad;
        status.classList.add('is-error');
        (!name ? form.name : form.email).focus();
        return;
      }

      const subject = `Sport 580: ${intent} (${name})`;
      const body = [
        `Name: ${name}`, `Email: ${email}`, phone ? `Phone: ${phone}` : null,
        `Request: ${intent}`, '', msg || ''
      ].filter(v => v !== null).join('\n');

      window.location.href = `mailto:${S.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.classList.remove('is-error');
      status.textContent = 'Your email app has opened with the enquiry prepared. Send it from there to complete your enquiry.';
    });
  }
})();
