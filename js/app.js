/* ══════════════════════════════════════════════════════════
   DOLCEFRAN — app.js v5
   • Canvas: frames WebP scrubbing
   • Productos: cargados desde Supabase
   • Carrito: localStorage, cantidades, checkout modal
   • Pedidos: guardados en Supabase + WhatsApp
══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── SUPABASE CONFIG ──────────────────────────────── */
  const SUPABASE_URL     = 'https://dgsbeahwcruisvyuufcq.supabase.co';
  const SUPABASE_ANON    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc2JlYWh3Y3J1aXN2eXV1ZmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTEzMDQsImV4cCI6MjA4ODA4NzMwNH0.lhM3Uqn4U2PeO3TtuRzlgKRGtsHPx6RgRrkFC5DUwj0';
  const WA_NUMBER        = '5493416667128';
  const STORAGE_BUCKET   = 'images';

  let sb; // supabase client

  function initSupabase() {
    return new Promise(resolve => {
      (function try_() {
        if (window.supabase && window.supabase.createClient) {
          sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
          resolve();
        } else {
          setTimeout(try_, 80);
        }
      })();
    });
  }

  /* ── 0. CURSOR ────────────────────────────────────── */
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });
  (function ringLoop() {
    rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(ringLoop);
  })();
  function attachCursorHover() {
    document.querySelectorAll('a, button, .pcard, .cta-button, .sec-cta').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  /* ── 1. CANVAS + FRAMES ───────────────────────────── */
  const canvas  = document.getElementById('main-canvas');
  const ctx     = canvas.getContext('2d');
  const FRAMES  = 186;
  const SCALE   = 0.87;
  const imgs    = new Array(FRAMES);
  let   loaded  = 0;
  let   curFrame = 0;
  let   dirty   = true;
  let   canvasW, canvasH, dpr;

  function resizeCanvas() {
    dpr     = window.devicePixelRatio || 1;
    canvasW = window.innerWidth;
    canvasH = window.innerHeight;
    canvas.width  = Math.round(canvasW * dpr);
    canvas.height = Math.round(canvasH * dpr);
    canvas.style.width  = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  const frameSrc = i => `frames/frame_${String(i + 1).padStart(4, '0')}.webp`;

  /* ── 2. LOADER ────────────────────────────────────── */
  const loaderEl  = document.getElementById('loader');
  const loaderBar = document.getElementById('loader-bar');
  const loaderNum = document.getElementById('loader-num');

  function setProgress(p) {
    const pct = Math.round(p * 100);
    loaderBar.style.width = pct + '%';
    loaderNum.textContent = pct + '%';
  }

  function onImgLoad() {
    loaded++;
    setProgress(loaded / FRAMES);
    if (loaded === FRAMES) {
      setTimeout(() => {
        loaderEl.classList.add('hidden');
        initSite();
      }, 400);
    }
  }

  /* Fase 1: primeros 10 */
  for (let i = 0; i < Math.min(10, FRAMES); i++) {
    const img = new Image();
    img.src = frameSrc(i);
    img.onload = img.onerror = onImgLoad;
    imgs[i] = img;
  }
  /* Fase 2: lotes de 20 cada 50ms */
  let batch = 10;
  (function loadBatch() {
    const end = Math.min(batch + 20, FRAMES);
    for (let i = batch; i < end; i++) {
      const img = new Image();
      img.src = frameSrc(i);
      img.onload = img.onerror = onImgLoad;
      imgs[i] = img;
    }
    batch = end;
    if (batch < FRAMES) setTimeout(loadBatch, 50);
  })();

  /* ── 3. RENDER RAF ────────────────────────────────── */
  function drawFrame() {
    const img = imgs[curFrame];
    if (!img || !img.complete || !img.naturalWidth) return;
    ctx.fillStyle = '#050302';
    ctx.fillRect(0, 0, canvasW, canvasH);
    const r  = Math.max(canvasW / img.naturalWidth, canvasH / img.naturalHeight) * SCALE;
    const sx = (canvasW - img.naturalWidth  * r) / 2;
    const sy = (canvasH - img.naturalHeight * r) / 2;
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
                  sx, sy, img.naturalWidth * r, img.naturalHeight * r);
  }
  (function renderLoop() {
    if (dirty) { drawFrame(); dirty = false; }
    requestAnimationFrame(renderLoop);
  })();

  /* ── 4. INIT SITE ─────────────────────────────────── */
  async function initSite() {
    resizeCanvas();
    dirty = true;

    window.addEventListener('resize', () => {
      resizeCanvas();
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });

    /* Hero inmediato */
    const secHero = document.getElementById('sec-hero');
    if (secHero) {
      secHero.style.display = 'flex';
      gsap.fromTo(secHero,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, delay: 0.3, ease: 'power3.out' }
      );
    }

    gsap.registerPlugin(ScrollTrigger);
    initLenis();
    initHeader();
    initFrameScrub();
    initScrollSections();
    initMarquee();
    initPageAnims();
    initCart();
    initCheckout();
    attachCursorHover();

    /* Supabase + productos (en paralelo, no bloquea el canvas) */
    await initSupabase();
    await loadProducts();
  }

  /* ── 5. LENIS ─────────────────────────────────────── */
  let lenis;
  function initLenis() {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ── 6. HEADER ────────────────────────────────────── */
  function initHeader() {
    const header = document.getElementById('header');
    ScrollTrigger.create({
      start: 'top -60px',
      onEnter:     () => header.classList.add('scrolled'),
      onLeaveBack: () => header.classList.remove('scrolled'),
    });
  }

  /* ── 7. FRAME SCRUBBING ───────────────────────────── */
  function initFrameScrub() {
    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top', end: 'bottom bottom',
      onUpdate: self => {
        const progress  = Math.min(self.progress / 0.85, 1);
        const newFrame  = Math.round(progress * (FRAMES - 1));
        if (newFrame !== curFrame) { curFrame = newFrame; dirty = true; }
      },
    });
  }

  /* ── 8. SCROLL SECTIONS ───────────────────────────── */
  const activeSections = new Set();
  function initScrollSections() {
    const sections = document.querySelectorAll('.scroll-section');
    const overlay  = document.getElementById('canvas-overlay');
    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top', end: 'bottom bottom',
      onUpdate: self => {
        const p = self.progress;
        sections.forEach(sec => {
          const enter = parseFloat(sec.dataset.enter);
          const leave = parseFloat(sec.dataset.leave);
          const isIn  = (p >= enter && p <= leave);
          if (isIn && !activeSections.has(sec)) showSection(sec, sec.dataset.animation);
          else if (!isIn && activeSections.has(sec)) hideSection(sec);
        });
        const stats = document.getElementById('sec-stats');
        const sE = parseFloat(stats.dataset.enter) - 0.04;
        const sL = parseFloat(stats.dataset.leave) + 0.04;
        overlay.style.background = (p >= sE && p <= sL)
          ? 'rgba(5,3,2,0.90)' : 'rgba(5,3,2,0)';
      },
    });
  }

  function showSection(el, anim) {
    activeSections.add(el);
    el.style.display = 'flex';
    gsap.killTweensOf(el);
    gsap.fromTo(el,
      { opacity: 0, ...animFrom(anim) },
      { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, duration: 0.85, ease: 'power3.out' }
    );
    if (el.id === 'sec-stats') {
      el.querySelectorAll('.stat-num').forEach(n => animCounter(n, parseInt(n.dataset.target)));
    }
  }

  function hideSection(el) {
    activeSections.delete(el);
    gsap.killTweensOf(el);
    gsap.to(el, { opacity: 0, duration: 0.4, ease: 'power2.in',
      onComplete: () => { el.style.display = 'none'; }
    });
  }

  function animFrom(anim) {
    return ({
      'slide-left':  { x: -90 },
      'slide-right': { x:  90 },
      'scale-up':    { scale: 0.84 },
      'rotate-in':   { y: 45, rotation: 3 },
      'fade-up':     { y: 55 },
    })[anim] || { y: 40 };
  }

  /* ── 9. MARQUEE ───────────────────────────────────── */
  function initMarquee() {
    const m1 = document.getElementById('marquee1');
    const m2 = document.getElementById('marquee2');
    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top', end: 'bottom bottom',
      onUpdate: self => {
        const p = self.progress;
        m1.classList.toggle('visible', p >= 0.05 && p <= 0.25);
        m2.classList.toggle('visible', p >= 0.38 && p <= 0.62);
        m1.querySelector('.marquee-track').style.transform = `translateX(${-p * 3800}px)`;
        m2.querySelector('.marquee-track').style.transform = `translateX(${p * 3800 - 1900}px)`;
      },
    });
  }

  /* ── 10. ANIMS PÁGINA ─────────────────────────────── */
  function initPageAnims() {
    document.querySelectorAll('[data-anim]').forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el, start: 'top 87%', once: true,
        onEnter: () => { el.style.animationDelay = (i * 0.07) + 's'; el.classList.add('animated'); },
      });
    });
  }

  /* ── 11. CONTADOR ─────────────────────────────────── */
  function animCounter(el, target) {
    const t0 = performance.now(), dur = 2200;
    (function tick(now) {
      const prog  = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      el.textContent = Math.round(target * eased);
      if (prog < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ── 12. PRODUCTOS DESDE SUPABASE ─────────────────── */
  const ANIMS = ['fade-up', 'slide-left', 'scale-up', 'slide-right', 'rotate-in', 'fade-up'];

  function formatMoney(n) {
    if (n == null || isNaN(n)) return '0.00';
    return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async function loadProducts() {
    const loadingEl = document.getElementById('products-loading');
    const grid      = document.getElementById('products-grid');
    if (!sb) return;

    try {
      const { data, error } = await sb.from('products')
        .select('*').eq('active', true).order('created_at', { ascending: false });

      if (error) throw error;
      loadingEl.style.display = 'none';

      if (!data || data.length === 0) {
        grid.innerHTML = '<p style="color:var(--muted);padding:2rem 5vw;font-family:var(--font-mono);font-size:.8rem;">No hay productos disponibles.</p>';
        return;
      }

      data.forEach((p, i) => {
        let imgSrc = p.image_url || '';
        // Si es path relativo de storage, construir URL pública
        if (imgSrc && !/^https?:\/\//i.test(imgSrc)) {
          const { data: urlData } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(imgSrc);
          imgSrc = urlData?.publicUrl || imgSrc;
        }

        const card = document.createElement('article');
        card.className = 'pcard';
        card.dataset.anim = ANIMS[i % ANIMS.length];
        card.innerHTML = `
          <div class="pcard-img">
            ${imgSrc
              ? `<img src="${imgSrc}" alt="${p.name}" loading="lazy" class="pcard-photo"/>`
              : `<div class="pcard-swatch" style="background:linear-gradient(145deg,#1a0800,#5c2200)"></div>`
            }
          </div>
          <div class="pcard-body">
            <h3 class="pcard-name">${p.name}</h3>
            <p class="pcard-desc">${p.description || ''}</p>
            <div class="pcard-foot">
              <span class="pcard-price">$ ${formatMoney(p.price)}</span>
              <button class="pcard-add"
                data-id="${p.id}"
                data-product="${p.name}"
                data-price="${p.price}"
                data-img="${imgSrc}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          </div>`;
        grid.appendChild(card);
      });

      /* Animar con GSAP */
      grid.querySelectorAll('.pcard').forEach((card, i) => {
        const from = animFrom(card.dataset.anim);
        ScrollTrigger.create({
          trigger: card, start: 'top 91%', once: true,
          onEnter: () => {
            gsap.fromTo(card,
              { opacity: 0, ...from },
              { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0,
                duration: 1, delay: i * 0.08, ease: 'power3.out' }
            );
          },
        });
      });

      /* Botones agregar al carrito */
      grid.querySelectorAll('.pcard-add').forEach(btn => {
        btn.addEventListener('click', () => {
          addToCart({
            id:    btn.dataset.id,
            name:  btn.dataset.product,
            price: parseFloat(btn.dataset.price),
            img:   btn.dataset.img,
          });
          btn.style.transform = 'scale(1.4)';
          setTimeout(() => btn.style.transform = '', 220);
        });
      });

      attachCursorHover();

    } catch (err) {
      console.error('Error cargando productos:', err);
      loadingEl.style.display = 'none';
      grid.innerHTML = '<p style="color:var(--muted);padding:2rem 5vw;font-family:var(--font-mono);font-size:.8rem;">Error cargando productos. Recargá la página.</p>';
    }
  }

  /* ── 13. CARRITO ──────────────────────────────────── */
  let cart = [];

  function saveCart() { localStorage.setItem('dolcefran_cart', JSON.stringify(cart)); }
  function loadCart() {
    try { cart = JSON.parse(localStorage.getItem('dolcefran_cart') || '[]'); } catch (_) { cart = []; }
  }

  function addToCart(product) {
    const ex = cart.find(c => c.id === product.id);
    if (ex) { ex.qty += 1; } else { cart.push({ ...product, qty: 1 }); }
    saveCart();
    renderCart();
    showNotif(`✓ ${product.name} agregado`);
  }

  function renderCart() {
    const itemsEl  = document.getElementById('cartItems');
    const totalEl  = document.getElementById('cartTotal');
    const countEl  = document.getElementById('cartCount');

    const totalQty = cart.reduce((s, x) => s + x.qty, 0);
    if (countEl) countEl.textContent = totalQty;

    if (!cart.length) {
      itemsEl.innerHTML = '<p class="cart-empty">Tu carrito está vacío</p>';
      totalEl.textContent = '$ 0';
      return;
    }

    itemsEl.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        ${item.img ? `<img src="${item.img}" alt="${item.name}" class="cart-item-img"/>` : ''}
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$ ${formatMoney(item.price)}</div>
          <div class="cart-item-qty">
            <button data-action="dec" data-i="${i}">−</button>
            <span>${item.qty}</span>
            <button data-action="inc" data-i="${i}">+</button>
          </div>
        </div>
        <button class="cart-item-rm" data-i="${i}">×</button>
      </div>`).join('');

    const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
    totalEl.textContent = '$ ' + formatMoney(total);

    /* Listeners botones qty */
    itemsEl.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i   = +btn.dataset.i;
        const act = btn.dataset.action;
        if (act === 'inc') { cart[i].qty += 1; }
        else { cart[i].qty -= 1; if (cart[i].qty < 1) cart.splice(i, 1); }
        saveCart(); renderCart();
      });
    });
    itemsEl.querySelectorAll('.cart-item-rm').forEach(btn => {
      btn.addEventListener('click', () => {
        cart.splice(+btn.dataset.i, 1);
        saveCart(); renderCart();
        showNotif('Producto eliminado');
      });
    });
  }

  function initCart() {
    loadCart();
    renderCart();
    document.getElementById('cartBtn').addEventListener('click', () => {
      const t = document.getElementById('contacto');
      if (t && lenis) lenis.scrollTo(t, { offset: -80 });
    });
    document.getElementById('sendWA')?.addEventListener('click', openCheckout);
  }

  /* ── 14. CHECKOUT ─────────────────────────────────── */
  function openCheckout() {
    if (!cart.length) { showNotif('Tu carrito está vacío'); return; }

    const modal    = document.getElementById('checkout-modal');
    const summary  = document.getElementById('checkoutSummary');
    const total    = cart.reduce((s, x) => s + x.price * x.qty, 0);

    summary.innerHTML = `
      <div class="co-items">
        ${cart.map(x => `
          <div class="co-item">
            <span class="co-qty">${x.qty}×</span>
            <span class="co-name">${x.name}</span>
            <span class="co-price">$ ${formatMoney(x.price * x.qty)}</span>
          </div>`).join('')}
      </div>
      <div class="co-total"><span>Total</span><span>$ ${formatMoney(total)}</span></div>`;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckout() {
    document.getElementById('checkout-modal').classList.remove('open');
    document.body.style.overflow = '';
  }

  function initCheckout() {
    document.getElementById('checkoutWA')?.addEventListener('click', openCheckout);
    document.getElementById('checkoutClose')?.addEventListener('click', closeCheckout);
    document.getElementById('checkoutBackdrop')?.addEventListener('click', closeCheckout);

    document.getElementById('checkout-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const name    = document.getElementById('co-name').value;
      const phone   = document.getElementById('co-phone').value;
      const address = document.getElementById('co-address').value;
      const notes   = document.getElementById('co-notes').value;
      const total   = cart.reduce((s, x) => s + x.price * x.qty, 0);

      /* Guardar pedido en Supabase */
      if (sb) {
        try {
          const orderId = crypto.randomUUID();
          await sb.from('orders').insert([{
            id: orderId, customer_name: name, phone, address,
            notes: notes || '', total, status: 'pendiente',
            created_at: new Date().toISOString()
          }]);
          await sb.from('order_items').insert(
            cart.map(x => ({
              id: crypto.randomUUID(), order_id: orderId,
              product_name: x.name, quantity: x.qty, price: x.price
            }))
          );
        } catch (err) { console.error('Error guardando pedido:', err); }
      }

      /* Abrir WhatsApp */
      const msg = `🧁 *NUEVO PEDIDO - Dolcefran* 🧁\n\n👤 *Cliente:* ${name}\n📱 *Teléfono:* ${phone}\n📍 *Dirección:* ${address}${notes ? `\n📝 *Notas:* ${notes}` : ''}\n\n🛒 *Productos:*\n${cart.map(x => `• ${x.qty}x ${x.name} - $ ${formatMoney(x.price * x.qty)}`).join('\n')}\n\n💰 *TOTAL:* $ ${formatMoney(total)}\n─────────────────────`;
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');

      cart = []; saveCart(); renderCart();
      closeCheckout();
      showNotif('¡Pedido enviado! Te contactaremos pronto 🎂');
    });
  }

  /* ── 15. NOTIFICACIÓN ─────────────────────────────── */
  function showNotif(msg, dur = 2500) {
    const el = document.getElementById('notif');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), dur);
  }

  /* ── 16. SCROLL SUAVE ─────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a =>
    a.addEventListener('click', e => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute('href'));
      if (t && lenis) lenis.scrollTo(t, { offset: -80 });
    })
  );

})();
