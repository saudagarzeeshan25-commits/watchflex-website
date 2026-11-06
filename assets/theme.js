/* Watch Flex theme.js: vanilla JS, no dependencies */
(function () {
  'use strict';
  var WF = window.WF || { routes: {}, currency: 'USD' };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var scrim = $('#scrim');

  /* ---------- safe storage ---------- */
  function lsGet(k, fallback) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  function ssFlag(k) { try { if (sessionStorage.getItem(k)) return true; sessionStorage.setItem(k, '1'); return false; } catch (e) { return false; } }

  /* ---------- helpers ---------- */
  function money(cents) {
    try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: WF.currency, maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100); }
    catch (e) { return (cents / 100).toFixed(2); }
  }
  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  /* ---------- overlays ---------- */
  function closeAll() {
    $$('.ov.open, .drawer.open, .pop.open').forEach(function (e) { e.classList.remove('open'); });
    if (scrim) scrim.classList.remove('open');
    document.body.style.overflow = '';
  }
  function openEl(id) {
    var el = document.getElementById(id); if (!el) return false;
    closeAll(); el.classList.add('open');
    if (el.matches('.drawer, .pop') && scrim) scrim.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (id === 'search') setTimeout(function () { var q = $('#sq'); if (q) q.focus(); }, 300);
    return true;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

  /* ---------- wishlist ---------- */
  function markWish() {
    var w = lsGet('wf_wish', []);
    $$('[data-heart]').forEach(function (b) { b.classList.toggle('on', w.indexOf(b.dataset.heart) > -1); });
  }

  /* ---------- cart (Section Rendering API) ---------- */
  function renderCartSection(sections) {
    if (!sections || !sections['cart-drawer']) return;
    var doc = new DOMParser().parseFromString(sections['cart-drawer'], 'text/html');
    var fresh = $('#cart', doc), cur = $('#cart');
    if (fresh && cur) cur.innerHTML = fresh.innerHTML;
  }
  function setCount(n) {
    var c = $('#cnt'); if (!c) return;
    c.textContent = n;
    if (c.animate) c.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 350 });
  }
  function addForm(form) {
    var fd = new FormData(form);
    fd.append('sections', 'cart-drawer');
    fd.append('sections_url', window.location.pathname);
    var btns = $$('[type=submit], [data-sticky-add]', form.ownerDocument);
    btns.forEach(function (b) { b.classList.add('busy'); });
    fetch(WF.routes.cartAdd + '.js', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/javascript' }, body: fd })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.status && d.status !== 200) { toast(d.description || d.message || 'Could not add this item'); return; }
        renderCartSection(d.sections);
        return fetch(WF.routes.cart + '.js').then(function (r) { return r.json(); }).then(function (c) {
          setCount(c.item_count); openEl('cart');
        });
      })
      .catch(function () { toast('Something went wrong. Try again.'); })
      .then(function () { btns.forEach(function (b) { b.classList.remove('busy'); }); });
  }
  function changeLine(line, qty) {
    fetch(WF.routes.cartChange + '.js', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: line, quantity: qty, sections: 'cart-drawer', sections_url: window.location.pathname })
    }).then(function (r) { return r.json(); }).then(function (d) {
      renderCartSection(d.sections); setCount(d.item_count);
    });
  }
  document.addEventListener('submit', function (e) {
    var f = e.target.closest && e.target.closest('form[data-ajax]');
    if (!f) return;
    e.preventDefault(); addForm(f);
  });

  /* ---------- global click delegation ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var o = t.closest('[data-open]');
    if (o) { if (openEl(o.dataset.open)) e.preventDefault(); return; }
    if (t.closest('[data-close]') || t === scrim) { closeAll(); return; }

    var h = t.closest('[data-heart]');
    if (h) {
      e.preventDefault();
      var w = lsGet('wf_wish', []), k = h.dataset.heart, i = w.indexOf(k);
      if (i > -1) w.splice(i, 1); else w.push(k);
      lsSet('wf_wish', w); markWish(); toast(i > -1 ? 'Removed from wishlist' : 'Saved to wishlist');
      return;
    }
    var q = t.closest('[data-line]');
    if (q) { changeLine(+q.dataset.line, +q.dataset.qty); return; }

    var ab = t.closest('.acc > button');
    if (ab) { var p = ab.parentNode; var on = p.classList.toggle('open'); ab.setAttribute('aria-expanded', on); return; }

    var z = t.closest('#pgal > div');
    if (z && !t.closest('video')) z.classList.toggle('z');

    if (t.closest('[data-sticky-add]')) {
      var pf = $('#product-form');
      if (pf) { if (pf.requestSubmit) pf.requestSubmit(); else addForm(pf); }
    }
  });

  /* ---------- product page ---------- */
  function initProduct() {
    var form = $('#product-form'), data = $('[data-variants]');
    if (!form || !data) return;
    var variants = JSON.parse(data.textContent);
    var groups = $$('.pills', form);
    var sel = groups.map(function (g) { var on = $('.pill.on', g); return on ? on.dataset.value : null; });

    function current() {
      if (!groups.length) return variants[0];
      return variants.filter(function (v) { return v.options.every(function (o, i) { return o === sel[i]; }); })[0];
    }
    function update() {
      var v = current();
      var add = $('[data-add-btn]'), sadd = $('[data-sticky-add]');
      var stock = $('[data-stock]');
      if (!v) {
        [add, sadd].forEach(function (b) { if (b) { b.disabled = true; b.textContent = 'Unavailable'; } });
        return;
      }
      $('[data-variant-id]', form).value = v.id;
      $('[data-price]').textContent = v.price;
      $('[data-sticky-price]').textContent = v.price;
      var cmp = $('[data-compare]'), sv = $('[data-save]');
      cmp.hidden = sv.hidden = !v.onSale;
      if (v.onSale) { cmp.textContent = v.compare; sv.textContent = 'Save ' + v.save + '%'; }
      [add, sadd].forEach(function (b) { if (b) { b.disabled = !v.available; b.textContent = v.available ? 'Add to cart' : 'Sold out'; } });
      if (stock) {
        if (v.available && v.inventory > 0 && v.inventory <= 5) { stock.hidden = false; stock.textContent = 'Only ' + v.inventory + ' left'; }
        else stock.hidden = true;
      }
      if (window.history.replaceState) window.history.replaceState({}, '', '?variant=' + v.id);
    }
    groups.forEach(function (g, gi) {
      g.addEventListener('click', function (e) {
        var b = e.target.closest('.pill'); if (!b) return;
        $$('.pill', g).forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('on'); b.setAttribute('aria-checked', 'true');
        sel[gi] = b.dataset.value; update();
      });
    });
    update();

    /* gallery dots */
    var gal = $('#pgal'), dots = $$('#dots i');
    if (gal) gal.addEventListener('scroll', function () {
      var i = Math.round(gal.scrollLeft / gal.clientWidth);
      dots.forEach(function (d, n) { d.classList.toggle('on', n === i); });
    }, { passive: true });

    /* remember for "recently viewed" */
    var pg = $('[data-product-handle]');
    if (pg) {
      var r = lsGet('wf_recent', []), h = pg.dataset.productHandle;
      r = [h].concat(r.filter(function (x) { return x !== h; })).slice(0, 8);
      lsSet('wf_recent', r);
    }
  }

  /* ---------- recently viewed ---------- */
  function initRecent() {
    var box = $('[data-recent]'); if (!box) return;
    var ex = box.dataset.exclude, list = lsGet('wf_recent', []).filter(function (h) { return h !== ex; }).slice(0, 6);
    if (!list.length) return;
    var rail = $('[data-recent-rail]', box);
    Promise.all(list.map(function (h) {
      return fetch(WF.routes.root + 'products/' + h + '.js').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    })).then(function (items) {
      items = items.filter(Boolean); if (!items.length) return;
      items.forEach(function (p) {
        var art = document.createElement('article'); art.className = 'card';
        var a = document.createElement('a'); a.className = 'img'; a.href = p.url;
        var inner = document.createElement('div'); inner.className = 'a';
        if (p.featured_image) {
          var im = document.createElement('img');
          im.src = p.featured_image + (p.featured_image.indexOf('?') > -1 ? '&' : '?') + 'width=600';
          im.alt = p.title; im.loading = 'lazy'; im.width = 600; im.height = 600; inner.appendChild(im);
        }
        a.appendChild(inner); art.appendChild(a);
        var info = document.createElement('div'); info.className = 'info';
        var br = document.createElement('div'); br.className = 'br'; br.textContent = p.vendor;
        var h4 = document.createElement('h4'), l = document.createElement('a'); l.href = p.url; l.textContent = p.title; h4.appendChild(l);
        var pr = document.createElement('div'); pr.className = 'price'; pr.textContent = money(p.price);
        info.appendChild(br); info.appendChild(h4); info.appendChild(pr); art.appendChild(info);
        rail.appendChild(art);
      });
      box.hidden = false;
    });
  }

  /* ---------- predictive search ---------- */
  function initSearch() {
    var q = $('#sq'), out = $('#sres'); if (!q || !out) return;
    var timer, ctrl;
    q.addEventListener('input', function () {
      clearTimeout(timer);
      var term = q.value.trim();
      if (term.length < 2) { out.textContent = ''; return; }
      timer = setTimeout(function () {
        if (ctrl && ctrl.abort) ctrl.abort();
        ctrl = window.AbortController ? new AbortController() : null;
        var url = WF.routes.suggest + '.json?q=' + encodeURIComponent(term) + '&resources[type]=product&resources[limit]=6&resources[options][unavailable_products]=last';
        fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (r) { return r.json(); }).then(function (d) {
          var items = (d.resources && d.resources.results && d.resources.results.products) || [];
          out.textContent = '';
          if (!items.length) { var p = document.createElement('p'); p.style.color = '#aaa'; p.textContent = 'No matches'; out.appendChild(p); return; }
          items.forEach(function (p) {
            var a = document.createElement('a'); a.className = 'sr'; a.href = p.url;
            if (p.featured_image && p.featured_image.url) {
              var im = document.createElement('img'); im.src = p.featured_image.url + (p.featured_image.url.indexOf('?') > -1 ? '&' : '?') + 'width=128';
              im.alt = ''; im.width = 64; im.height = 64; a.appendChild(im);
            }
            var box = document.createElement('div'), b = document.createElement('b'), s = document.createElement('small');
            b.textContent = p.title; s.textContent = money(Math.round(parseFloat(p.price) * 100));
            box.appendChild(b); box.appendChild(s); a.appendChild(box); out.appendChild(a);
          });
        }).catch(function () { /* aborted or offline */ });
      }, 200);
    });
  }

  /* ---------- countdown ---------- */
  function initCountdown() {
    $$('[data-countdown]').forEach(function (el) {
      var target = new Date(el.dataset.countdown).getTime();
      if (isNaN(target)) { el.textContent = ''; return; }
      function tick() {
        var s = Math.max(0, Math.floor((target - Date.now()) / 1000));
        var parts = [[Math.floor(s / 86400), 'Days'], [Math.floor(s % 86400 / 3600), 'Hrs'], [Math.floor(s % 3600 / 60), 'Min'], [s % 60, 'Sec']];
        el.innerHTML = parts.map(function (x) { return '<div>' + String(x[0]).padStart(2, '0') + '<small>' + x[1] + '</small></div>'; }).join('');
      }
      tick(); setInterval(tick, 1000);
    });
  }

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top > window.innerHeight) { el.classList.add('pre'); io.observe(el); }
    });
  }

  /* ---------- discount popup (timed + exit intent) ---------- */
  function initPopup() {
    if (!WF.popupOn || !$('#pop')) return;
    function show() { if ($('.ov.open, .drawer.open')) return; if (ssFlag('wf_pop')) return; openEl('pop'); }
    setTimeout(show, (WF.popupDelay || 9) * 1000);
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY <= 0) show(); });
  }

  /* ---------- boot ---------- */
  function boot() {
    markWish(); initProduct(); initRecent(); initSearch(); initCountdown(); initReveal(); initPopup();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
