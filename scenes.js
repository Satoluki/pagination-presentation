/* =====================================================================
   SCENES — «живий словник»: 10 анімованих сцен + смужка «4 сторони» + квіз
   Кожна сцена — async-функція з кроками. При відкритті слайда сцена
   програється; кнопка «Повторити» запускає її знову. Для PDF/друку при
   завантаженні кожна сцена миттєво малюється у фінальному стані.
   ===================================================================== */
(() => {
  const STOP = Symbol('stop');

  /* ---------- Спільні шматки розмітки ---------- */
  const mb = (id, { x, y, w, h, back = true }) => `
    <div class="mb" data-id="${id}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
      <div class="mb__bar"><i></i><i></i><i></i>${back ? '<span class="mb__back">←</span>' : ''}<div class="mb__url"></div></div>
      <div class="mb__view"></div><div class="mb__flash"></div>
    </div>`;
  const card = (n, cls = '') => `<div class="mcard ${cls}" data-n="${n}"><i style="--hue:${(n * 47) % 360}deg"></i>Ноутбук №${n}<b>${(18000 + n * 731).toLocaleString('uk-UA')} ₴</b></div>`;
  const cat = (from, count = 6, cls = () => '') => `<div class="mcat">${Array.from({ length: count }, (_, k) => card(from + k, cls(from + k))).join('')}</div>`;
  const pager = (cur) => `<div class="mpager">${[1, 2, 3, 4, '…', 9].map((p) => `<span class="${p === cur ? 'on' : ''}" data-p="${p}">${p}</span>`).join('')}</div>`;
  const SRV_ICON = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffd200" stroke-width="2"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></svg>';
  const srv = (x, y, title = 'Сервер') => `<div class="srv" style="left:${x}px;top:${y}px">${SRV_ICON}<b>${title}</b><div class="log"></div></div>`;

  /* ---------- Контролер одного запуску ---------- */
  /* mode: 'instant' — одразу фінальний кадр; 'auto' — програти все; 'manual' — до кроку target і пауза */
  function makeCtl(root, mode, target = 1) {
    const stage = root.querySelector('.scene-stage');
    const capEl = root.querySelector('.scene-cap');
    const cntEl = root.querySelector('.sc-count');
    const c = {
      mode, target, dead: false, st: stage, stepNo: 0, shown: 0, resume: null, finished: false,
      get instant() { return c.mode === 'instant' || c.fast; }, fast: false,
      W: stage.clientWidth || 780, H: stage.clientHeight || 580,
      $: (sel) => stage.querySelector(sel),
      $$: (sel) => [...stage.querySelectorAll(sel)],
      wait: (ms) => new Promise((res, rej) => {
        if (c.dead) return rej(STOP);
        if (c.instant) return res();
        setTimeout(() => (c.dead ? rej(STOP) : res()), ms);
      }),
      /* Кожен підпис = крок. У ручному режимі тут зупиняємось і чекаємо «крок ▶» */
      async cap(step, text) {
        if (c.dead) throw STOP;
        c.stepNo++;
        if (c.mode === 'manual') {
          if (c.stepNo < c.target) c.fast = true;
          else if (c.stepNo === c.target) c.fast = false;
          else {
            root.classList.add('is-waiting');
            await new Promise((res) => { c.resume = res; });
            root.classList.remove('is-waiting');
            c.resume = null;
            if (c.dead) throw STOP;
            c.fast = false;
          }
        }
        capEl.innerHTML = `<small>${step}</small>${text}`; c.shown = c.stepNo;
        if (cntEl) cntEl.textContent = `${c.stepNo} / ${root.dataset.steps || '?'}`;
      },
      async type(el, text, per = 45) {
        if (c.instant) { el.textContent = text; return; }
        el.textContent = '';
        for (const ch of text) { el.textContent += ch; await c.wait(per); }
      },
      async press(el, ms = 380) { el.classList.add('press'); await c.wait(ms); el.classList.remove('press'); },
      async fly(el, x1, y1, x2, y2, ms = 750) {
        el.style.transition = 'none'; el.style.left = x1 + 'px'; el.style.top = y1 + 'px'; el.style.opacity = 1;
        void el.offsetWidth; el.style.transition = '';
        el.style.left = x2 + 'px'; el.style.top = y2 + 'px';
        await c.wait(ms);
      },
      view: (id) => stage.querySelector(`.mb[data-id="${id}"] .mb__view`),
      url: (id) => stage.querySelector(`.mb[data-id="${id}"] .mb__url`),
      back: (id) => stage.querySelector(`.mb[data-id="${id}"] .mb__back`),
      flash: (id) => stage.querySelector(`.mb[data-id="${id}"] .mb__flash`),
      box: (el) => { const a = el.getBoundingClientRect(), b = stage.getBoundingClientRect(), s = b.width / stage.clientWidth || 1; return { x: (a.left - b.left) / s, y: (a.top - b.top) / s, w: a.width / s, h: a.height / s }; }
    };
    return c;
  }

  /* ===================== СЦЕНИ ===================== */
  const SCENES = {

    /* 1. URL */
    async url(c) {
      const { W, H } = c;
      const bw = Math.round(W * 0.6);
      c.st.innerHTML = mb('a', { x: 18, y: 18, w: bw, h: H - 36 }) +
        `<div class="mb-label" style="left:${bw + 44}px;top:${Math.round(H * 0.24) - 28}px">Телефон друга</div>` +
        mb('b', { x: bw + 44, y: Math.round(H * 0.24), w: W - bw - 62, h: Math.round(H * 0.62), back: false }) +
        '<div class="chip">🔗 Поділитися</div>';
      const friend = c.$('.mb[data-id="b"]'); friend.style.opacity = .35;
      await c.cap('Крок 1', 'Вводимо адресу — браузер знаходить саме цю сторінку');
      await c.wait(400);
      await c.type(c.url('a'), 'rozetka.com.ua/ua/notebooks/');
      await c.wait(250);
      c.view('a').innerHTML = cat(1, 9);
      await c.wait(1100);
      await c.cap('Крок 2', 'Копіюємо адресу і надсилаємо другу');
      const u = c.box(c.url('a')), f = c.box(c.url('b'));
      await c.fly(c.$('.chip'), u.x + 30, u.y + 30, f.x + 10, f.y - 6, 900);
      friend.style.opacity = 1;
      c.url('b').innerHTML = '<span class="hl">rozetka.com.ua/ua/notebooks/</span>';
      c.$('.chip').style.opacity = 0;
      await c.wait(350);
      c.view('b').innerHTML = cat(1, 6);
      await c.cap('Крок 3', 'У друга відкривається <span class="ok">та сама сторінка ✓</span> — адреса однозначно її описує');
    },

    /* 2. ?page=2 */
    async page(c) {
      const { W, H } = c;
      const bw = Math.round(W * 0.62);
      c.st.innerHTML = mb('a', { x: 18, y: 18, w: bw, h: H - 36 }) + srv(bw + 60, Math.round(H * 0.3)) + '<div class="packet"></div>';
      const setPage = (p) => {
        c.url('a').innerHTML = `shop.ua/catalog<span class="hl">?page=${p}</span>`;
        c.view('a').innerHTML = cat((p - 1) * 6 + 1, 6) + pager(p);
      };
      setPage(1);
      await c.cap('Сторінка 1', 'Довгий список ріжемо на частини, як книжку');
      await c.wait(1200);
      const log = c.$('.srv .log'), pk = c.$('.packet');
      for (const p of [2, 3]) {
        const btn = c.$(`.mpager span[data-p="${p}"]`);
        await c.press(btn);
        await c.cap(`Сторінка ${p}`, `Браузер просить у сервера <code>?page=${p}</code>`);
        const a = c.box(btn), s = c.box(c.$('.srv'));
        await c.fly(pk, a.x, a.y, s.x + 70, s.y + 40);
        log.textContent = `page=${p} → товари ${(p - 1) * 6 + 1}–${p * 6}`;
        pk.classList.add('back');
        await c.fly(pk, s.x + 70, s.y + 40, a.x, a.y);
        pk.style.opacity = 0; pk.classList.remove('back');
        setPage(p);
        await c.wait(900);
      }
      await c.cap('Висновок', 'Кожна частина — <b>окрема сторінка з власною адресою</b>: її можна відкрити, надіслати, проіндексувати <span class="ok">✓</span>');
    },

    /* 3. AJAX */
    async ajax(c) {
      const { W, H } = c;
      const bw = Math.round((W - 54) / 2), bh = Math.round(H * 0.6);
      c.st.innerHTML =
        `<div class="mb-label" style="left:18px;top:10px">Без AJAX</div><div class="mb-label" style="left:${bw + 36}px;top:10px">З AJAX</div>` +
        mb('a', { x: 18, y: 36, w: bw, h: bh, back: false }) + mb('b', { x: bw + 36, y: 36, w: bw, h: bh, back: false }) +
        srv(Math.round(W / 2 - 85), bh + 60) + '<div class="packet"></div>';
      for (const id of ['a', 'b']) { c.url(id).textContent = 'shop.ua/catalog'; c.view(id).innerHTML = cat(1, 6) + '<span class="mbtn">Показати ще</span>'; }
      await c.cap('Старт', 'Обидва сайти показують 6 товарів');
      await c.wait(1000);

      await c.cap('Без AJAX', 'Натискаємо «Показати ще» — сторінка <span class="no">зникає й вантажиться заново цілком</span>');
      await c.press(c.$('.mb[data-id="a"] .mbtn'));
      c.flash('a').classList.add('on');
      await c.wait(900);
      c.view('a').innerHTML = cat(1, 9) + '<span class="mbtn">Показати ще</span>';
      c.flash('a').classList.remove('on');
      await c.wait(900);

      await c.cap('З AJAX', 'JavaScript просить у сервера <b>лише нові дані</b>…');
      const btn = c.$('.mb[data-id="b"] .mbtn');
      await c.press(btn);
      const b = c.box(btn), s = c.box(c.$('.srv')), pk = c.$('.packet');
      await c.fly(pk, b.x + 30, b.y, s.x + 75, s.y + 20);
      c.$('.srv .log').textContent = '→ 3 нові товари (JSON)';
      pk.classList.add('back');
      await c.fly(pk, s.x + 75, s.y + 20, b.x + 30, b.y);
      pk.style.opacity = 0; pk.classList.remove('back');
      c.$('.mb[data-id="b"] .mcat').insertAdjacentHTML('beforeend', card(7, 'new') + card(8, 'new') + card(9, 'new'));
      await c.cap('Результат', '…і домальовує <span class="ok">тільки 3 нові картки</span> — без перезавантаження, решта сторінки на місці');
    },

    /* 4. DOM */
    async dom(c) {
      const { H } = c;
      c.st.innerHTML = `
        <div class="dom-card">
          <div class="dc-img"></div>
          <div class="dc-title">Ноутбук ASUS Vivobook 15</div>
          <div><span class="dc-price">35 999 ₴</span> <span class="dc-old">41 999 ₴</span></div>
          <div class="dc-btn">Купити</div>
        </div>
        <div class="dom-tree"></div>
        <div class="dcount" style="top:${H - 70}px">Вузлів у цієї картки: <b>0</b></div>`;
      const root = c.$('.dom-card'), tree = c.$('.dom-tree');
      const pairs = [];
      (function walk(el, depth) {
        const cls = el.className ? `.${String(el.className).split(' ')[0]}` : '';
        const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
        const line = document.createElement('div');
        line.innerHTML = `${'&nbsp;&nbsp;'.repeat(depth)}<span class="tg">&lt;${el.tagName.toLowerCase()}${cls}&gt;</span>${own ? ' ' + own.slice(0, 24) : ''}`;
        tree.appendChild(line); pairs.push([el, line]);
        [...el.children].forEach((ch) => walk(ch, depth + 1));
      })(root, 0);
      const light = (k) => pairs.forEach(([el, ln], j) => { el.classList.toggle('lit', j === k); ln.classList.toggle('lit', j === k); });
      pairs.forEach(([el, ln], k) => { el.onmouseenter = ln.onmouseenter = () => light(k); });
      c.$('.dcount b').textContent = pairs.length;
      await c.cap('Що бачить людина', 'Звичайна картка товару…');
      await c.wait(1100);
      await c.cap('Що бачить браузер', '…а браузер тримає в пам\'яті <b>дерево вузлів</b> — DOM');
      for (let k = 0; k < pairs.length; k++) { light(k); await c.wait(420); }
      light(pairs.length - 1);
      await c.cap('Висновок', `Одна картка = <b>${pairs.length} вузлів</b>. 1 000 карток = десятки тисяч — і телефон починає гальмувати. Наведіть мишку на будь-який елемент`);
    },

    /* 5. pushState */
    async push(c) {
      const { W, H } = c;
      c.st.innerHTML = `<div class="mb-label" style="left:24px;top:10px" data-mode></div>` + mb('a', { x: 18, y: 36, w: W - 36, h: H - 54 });
      const mode = c.$('[data-mode]'), url = c.url('a'), view = c.view('a');
      const catalog = (n, cls) => cat(1, n, cls) + '<span class="mbtn">Показати ще</span>';

      // Фаза A: без pushState
      mode.innerHTML = '<span class="no">Без pushState</span>';
      url.textContent = 'shop.ua/catalog'; view.innerHTML = catalog(6);
      await c.cap('Без pushState · 1', 'Натискаємо «Показати ще» — товари додались…');
      await c.wait(900);
      await c.press(c.$('.mbtn'));
      c.$('.mcat').insertAdjacentHTML('beforeend', card(7, 'new') + card(8, 'new') + card(9, 'new'));
      await c.wait(700);
      await c.cap('Без pushState · 2', '…але адреса <span class="no">не змінилась</span>: браузер не знає, що ми «далі»');
      url.innerHTML = '<span class="hl">shop.ua/catalog</span>';
      await c.wait(1300);
      await c.cap('Без pushState · 3', 'Тиснемо «Назад»…');
      await c.press(c.back('a'), 500);
      url.textContent = 'google.com/search?q=ноутбук';
      view.innerHTML = '<div class="mpage"><h4>Google</h4>Результати пошуку: «ноутбук»…</div>';
      await c.cap('Результат', '<span class="no">❌ «Назад» викинув із сайту</span> — 9 товарів і місце в списку втрачено');
      await c.wait(2200);

      // Фаза B: з pushState
      mode.innerHTML = '<span class="ok">З pushState</span>';
      url.textContent = 'shop.ua/catalog?page=1'; view.innerHTML = catalog(6);
      await c.cap('З pushState · 1', '«Показати ще» — і JavaScript <b>змінює адресу</b> без перезавантаження');
      await c.wait(800);
      await c.press(c.$('.mbtn'));
      c.$('.mcat').insertAdjacentHTML('beforeend', card(7, 'new') + card(8, 'new') + card(9, 'new target'));
      url.innerHTML = 'shop.ua/catalog<span class="hl">?page=2</span>';
      await c.wait(1300);
      await c.cap('З pushState · 2', 'Відкриваємо товар №9…');
      await c.press(c.$('.mcard.target'));
      url.textContent = 'shop.ua/product/9';
      view.innerHTML = '<div class="mpage"><h4>Ноутбук №9</h4>Фото · характеристики · відгуки</div>';
      await c.wait(1100);
      await c.cap('З pushState · 3', 'Тиснемо «Назад»…');
      await c.press(c.back('a'), 500);
      url.innerHTML = 'shop.ua/catalog<span class="hl">?page=2</span>';
      view.innerHTML = catalog(9, (n) => (n === 9 ? 'target' : ''));
      await c.cap('Результат', '<span class="ok">✅ Повернулись на ?page=2</span> — усі 9 товарів і місце в списку на місці');
    },

    /* 6. #! */
    async hash(c) {
      const { W, H } = c;
      c.st.innerHTML = `
        <div class="split-url"><span class="p1">site.com/</span><span class="p2">#!/catalog/page/2</span></div>
        ${srv(30, Math.round(H * 0.38), 'Сервер')}
        <div class="lock" style="left:${Math.round(W * 0.5)}px;top:96px;width:${Math.round(W * 0.44)}px">🔒 лишається в браузері — бачить лише JavaScript</div>
        <div class="switch" style="left:${Math.round(W * 0.46)}px;top:${Math.round(H * 0.33)}px"><i></i><span>JavaScript увімкнено</span></div>
        ${mb('a', { x: Math.round(W * 0.42), y: Math.round(H * 0.42), w: Math.round(W * 0.54), h: Math.round(H * 0.5), back: false })}
        <div class="packet"></div>`;
      const p1 = c.$('.p1'), p2 = c.$('.p2'), log = c.$('.srv .log'), pk = c.$('.packet'), sw = c.$('.switch');
      c.url('a').textContent = 'site.com/#!/catalog/page/2';
      c.view('a').innerHTML = cat(7, 6);
      await c.cap('Крок 1', 'Адреса з <code>#!</code> складається з двох частин');
      await c.wait(1100);
      p1.classList.add('on');
      await c.cap('Крок 2', 'На сервер іде <b>тільки частина до #</b>');
      const a = c.box(p1), s = c.box(c.$('.srv'));
      await c.fly(pk, a.x + 40, a.y + 30, s.x + 70, s.y + 20);
      pk.style.opacity = 0; log.textContent = 'отримав: site.com/';
      await c.wait(700);
      p2.classList.add('on'); c.$('.lock').style.opacity = 1;
      await c.cap('Крок 3', 'Решту бачить лише JavaScript — сторінку «збирає» скрипт');
      await c.wait(1600);
      sw.classList.add('off'); sw.querySelector('span').textContent = 'JavaScript вимкнено (або впав)';
      c.view('a').innerHTML = '<div class="mpage" style="padding-top:30px;text-align:center"><h4>Порожньо</h4>Без JavaScript адреса з #! нічого не показує</div>';
      await c.cap('Проблема', '<span class="no">❌ Скрипт не спрацював — сайт порожній</span>. Так у 2011 «лягли» сайти Gawker');
      await c.wait(2200);
      p2.textContent = 'catalog/page/2'; p2.classList.remove('on'); p1.classList.add('on'); p2.classList.add('on'); p2.style.background = p1.style.background = '';
      c.$('.lock').style.opacity = 0;
      c.url('a').textContent = 'site.com/catalog/page/2';
      p2.style.background = 'color-mix(in srgb, var(--good) 22%, transparent)';
      await c.cap('Рішення', 'Звичайна адреса через <code>pushState</code> — <b>уся</b> йде на сервер');
      const b = c.box(c.$('.split-url'));
      await c.fly(pk, b.x + b.w / 2, b.y + 30, s.x + 70, s.y + 20);
      pk.style.opacity = 0; log.textContent = '/catalog/page/2 → віддаю сторінку';
      await c.wait(500);
      c.view('a').innerHTML = cat(7, 6);
      await c.cap('Результат', '<span class="ok">✅ Сторінка є навіть без JavaScript</span> — і для людей, і для пошукових роботів');
    },

    /* 7. SEO і Googlebot */
    async seo(c) {
      const { W, H } = c;
      const nodes = [{ x: 70, y: H / 2, t: 'Головна' }];
      const cols = 4, gx = (W - 220) / (cols - 1);
      for (let k = 0; k < 8; k++) {
        const row = Math.floor(k / cols), col = row === 0 ? k % cols : cols - 1 - (k % cols);
        nodes.push({ x: 190 + col * gx, y: row === 0 ? H * 0.3 : H * 0.72, t: `Стор. ${k + 1}` });
      }
      const edges = nodes.slice(1).map((n, k) => [k, k + 1]);
      const robot = '<g class="robot"><rect x="-17" y="-16" width="34" height="28" rx="8" fill="#0b4fb3"/><circle cx="-7" cy="-3" r="4" fill="#fff"/><circle cx="7" cy="-3" r="4" fill="#fff"/><circle cx="-7" cy="-3" r="2" fill="#0e1a33"/><circle cx="7" cy="-3" r="2" fill="#0e1a33"/><path d="M0 -16v-8" stroke="#0b4fb3" stroke-width="3"/><circle cx="0" cy="-26" r="4" fill="#ffd200"/></g>';
      c.st.innerHTML = `<svg class="seo-svg" viewBox="0 0 ${W} ${H}">
          ${edges.map(([a, b], k) => `<path class="edge" data-e="${k}" d="M${nodes[a].x} ${nodes[a].y} L${nodes[b].x} ${nodes[b].y}"/>`).join('')}
          ${nodes.map((n, k) => `<g class="node" data-n="${k}"><circle cx="${n.x}" cy="${n.y}" r="${k ? 30 : 38}"/><text x="${n.x}" y="${n.y}">${n.t}</text></g>`).join('')}
          ${robot}
        </svg>
        <div class="seo-meter">У Google<b>0 / ${nodes.length}</b></div>
        <div class="bubble">?? далі немає посилань</div>`;
      const rob = c.$('.robot'), meter = c.$('.seo-meter b');
      const goTo = async (k, ms = 480) => { rob.setAttribute('transform', `translate(${nodes[k].x} ${nodes[k].y - 52})`); await c.wait(ms); };
      const seen = (k) => { c.$(`.node[data-n="${k}"]`).classList.add('seen'); meter.textContent = `${c.$$('.node.seen').length} / ${nodes.length}`; };

      await c.cap('Звичайні посилання', 'Робот Google ходить <b>тільки за посиланнями &lt;a href&gt;</b> і запам\'ятовує сторінки');
      rob.style.transition = 'none'; await goTo(0, 50); rob.style.transition = '';
      seen(0);
      for (let k = 1; k < nodes.length; k++) { await goTo(k); seen(k); }
      await c.cap('Результат', `<span class="ok">✅ Усі ${nodes.length} сторінок у Google</span> — кожен товар можна знайти через пошук`);
      await c.wait(2000);

      c.$$('.node').forEach((n) => n.classList.remove('seen')); meter.textContent = `0 / ${nodes.length}`;
      c.$$('.edge').forEach((e, k) => e.classList.toggle('js', k > 0));
      await c.cap('Лише нескінченний скрол', 'Тепер далі першої порції товари <b>довантажуються скролом</b>, а не посиланнями…');
      rob.style.transition = 'none'; await goTo(0, 50); rob.style.transition = '';
      seen(0); await goTo(1, 600); seen(1);
      const r = nodes[1];
      Object.assign(c.$('.bubble').style, { left: r.x + 30 + 'px', top: r.y - 96 + 'px', opacity: 1 });
      c.$$('.node').forEach((n, k) => { if (k > 1) n.classList.add('lost'); });
      await c.cap('Результат', `<span class="no">❌ Робот не скролить — зупинився.</span> ${nodes.length - 2} сторінок не потраплять у Google, і покупці їх не знайдуть`);
    },

    /* 8. rel=prev/next */
    async rel(c) {
      const { W, H } = c;
      const n = 5, bw = Math.min(92, W / 8), gap = (W - 80 - n * bw) / (n - 1), y = H * 0.42, A = Math.min(130, H * 0.3), bh = Math.min(72, H * 0.2);
      const xs = Array.from({ length: n }, (_, k) => 40 + k * (bw + gap));
      const arcs = xs.slice(0, -1).map((x, k) => {
        const x1 = x + bw / 2 + 14, x2 = xs[k + 1] + bw / 2 - 14;
        return `<path class="arc next" d="M${x1} ${y - bh / 2} Q${(x1 + x2) / 2} ${y - A} ${x2} ${y - bh / 2}"/>
                <text class="lbl" x="${(x1 + x2) / 2}" y="${y - A * 0.74}" text-anchor="middle" fill="var(--blue)">next</text>
                <path class="arc prev" d="M${x2} ${y + bh / 2} Q${(x1 + x2) / 2} ${y + A} ${x1} ${y + bh / 2}"/>
                <text class="lbl" x="${(x1 + x2) / 2}" y="${y + A * 0.82}" text-anchor="middle" fill="#b8860b">prev</text>`;
      }).join('');
      c.st.innerHTML = `<svg class="rel-svg" viewBox="0 0 ${W} ${H}">
          ${arcs}
          ${xs.map((x, k) => `<g class="box"><rect x="${x}" y="${y - bh / 2}" width="${bw}" height="${bh}" rx="12"/><text x="${x + bw / 2}" y="${y + 6}">page=${k + 1}</text></g>`).join('')}
          <path class="link" d="M${xs[0] + bw / 2} ${H * 0.86} L${xs[n - 1] + bw / 2} ${H * 0.86}"/>
          <text class="lbl" x="${W / 2}" y="${H * 0.86 - 14}" text-anchor="middle" fill="#1f9d6b" style="opacity:0" data-linklbl>звичайні посилання &lt;a href&gt; «Далі»</text>
        </svg>
        <div class="stamp">2019 · Google:<small>«We don't use link-rel-next/prev at all»</small></div>`;
      await c.cap('Ідея (з 2011)', 'Підказки в коді: <b>rel="next"</b> — «наступна тут», <b>rel="prev"</b> — «попередня тут»');
      await c.wait(500);
      for (const a of c.$$('.arc.next')) { a.classList.add('drawn'); await c.wait(260); }
      for (const a of c.$$('.arc.prev')) { a.classList.add('drawn'); await c.wait(260); }
      await c.wait(1400);
      c.$('.stamp').classList.add('on');
      await c.cap('21 березня 2019', 'Google: <span class="no">«ми їх взагалі не використовуємо»</span> — і вже кілька років');
      await c.wait(1800);
      c.$$('.arc').forEach((a) => a.classList.add('dead'));
      c.$('.stamp').classList.remove('on');
      c.$('.link').classList.add('drawn'); c.$('[data-linklbl]').style.opacity = 1;
      await c.cap('Що працює', '<span class="ok">✅ Звичайні посилання</span> і самостійні сторінки: свій заголовок, свої товари, посилання «Далі»');
    },

    /* 9. OFFSET проти курсора */
    async offset(c) {
      const { W, H } = c;
      const N = 50, T = 40;
      const colors = ['#0b4fb3', '#1f9d6b', '#d4405a', '#7a4fd0', '#b8860b', '#1d6fd1'];
      const books = (id) => `<div class="shelf" data-s="${id}">${Array.from({ length: N }, (_, k) => `<div class="book" style="height:${70 + ((k * 37) % 45)}px;background:${colors[k % colors.length]}"></div>`).join('')}</div>`;
      const y1 = H * 0.2, y2 = H * 0.66;
      c.st.innerHTML = `
        <div class="shelf-lbl" style="top:${y1 - 50}px"><span class="no">OFFSET 39</span> — «пропусти 39 книжок»</div>
        <div class="shelf-meter" style="top:${y1 - 50}px" data-m="1">перераховано: 0</div>
        <div style="position:absolute;left:0;right:0;top:${y1}px;height:130px">${books(1)}</div>
        <div class="shelf-lbl" style="top:${y2 - 50}px"><span class="ok">Курсор</span> — «після книжки №39»</div>
        <div class="shelf-meter" style="top:${y2 - 50}px" data-m="2">перераховано: 0</div>
        <div style="position:absolute;left:0;right:0;top:${y2}px;height:130px">${books(2)}</div>
        <div class="finger">👆</div><div class="bookmark"></div>`;
      const s1 = c.$$('.shelf[data-s="1"] .book'), s2 = c.$$('.shelf[data-s="2"] .book');
      const finger = c.$('.finger'), m1 = c.$('[data-m="1"]'), m2 = c.$('[data-m="2"]');
      await c.cap('OFFSET', 'Щоб знайти 40-ву книжку, база <b>рахує всі з першої</b>…');
      await c.wait(700);
      for (let k = 0; k < T - 1; k++) {
        const b = c.box(s1[k]);
        finger.style.left = b.x + 'px'; finger.style.top = b.y + b.h + 4 + 'px';
        s1[k].classList.add('count'); m1.textContent = `перераховано: ${k + 1}`;
        await c.wait(55);
      }
      s1[T - 1].classList.add('target'); finger.style.opacity = 0;
      await c.cap('OFFSET', `<span class="no">39 зайвих кроків</span> — а на мільйонній сторінці їх мільйон`);
      await c.wait(1500);
      await c.cap('Курсор', 'Курсор — це <b>закладка</b>: «продовж після №39»…');
      const t = c.box(s2[T - 1]), bm = c.$('.bookmark');
      bm.style.transition = 'none'; bm.style.left = t.x + t.w / 2 - 9 + 'px'; bm.style.top = t.y - 140 + 'px'; bm.style.opacity = 1;
      void bm.offsetWidth; bm.style.transition = '';
      bm.style.top = t.y - 30 + 'px';
      await c.wait(600);
      s2[T - 1].classList.add('target'); m2.innerHTML = 'перераховано: <span class="ok">0</span>';
      await c.cap('Результат', '<span class="ok">✅ Одразу на місці</span> — за індексом база стрибає до закладки за мілісекунди');
    },

    /* 10. Індекс */
    async index(c) {
      const { H } = c;
      const N = 1000, T = 737;
      const y1 = H * 0.24, y2 = H * 0.62;
      c.st.innerHTML = `
        <div class="trk-lbl" style="top:${y1 - 52}px"><span class="no">Без індексу</span> — перебір підряд</div>
        <div class="trk-meter" style="top:${y1 - 52}px" data-m="1">кроків: 0</div>
        <div class="track" style="top:${y1}px" data-t="1"><div class="goal" style="left:${T / N * 100}%"></div><div class="scan" style="left:0"></div></div>
        <div class="trk-lbl" style="top:${y2 - 52}px"><span class="ok">З індексом</span> — ділимо навпіл</div>
        <div class="trk-meter" style="top:${y2 - 52}px" data-m="2">кроків: 0</div>
        <div class="track" style="top:${y2}px" data-t="2"><div class="goal" style="left:${T / N * 100}%"></div><div class="win" style="left:0;width:100%"></div></div>
        <div class="steps-log" style="top:${y2 + 56}px"></div>`;
      const scan = c.$('.scan'), m1 = c.$('[data-m="1"]'), m2 = c.$('[data-m="2"]'), win = c.$('.win'), log = c.$('.steps-log');
      await c.cap('Задача', `Знайти запис <b>№${T}</b> серед ${N.toLocaleString('uk-UA')}`);
      await c.wait(900);
      await c.cap('Без індексу', 'Перебираємо по одному…');
      const steps = 40;
      for (let k = 1; k <= steps; k++) { const v = Math.round(T * k / steps); scan.style.left = v / N * 100 + '%'; m1.textContent = `кроків: ${v}`; await c.wait(45); }
      await c.cap('Без індексу', `<span class="no">${T} кроків</span>`);
      await c.wait(900);
      await c.cap('З індексом', 'Записи відсортовані, як покажчик у підручнику — щоразу відкидаємо половину');
      let lo = 1, hi = N, n = 0;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (T <= mid) hi = mid; else lo = mid + 1;
        n++;
        win.style.left = (lo - 1) / N * 100 + '%'; win.style.width = Math.max(0.6, (hi - lo + 1) / N * 100) + '%';
        log.insertAdjacentHTML('beforeend', `<span>${lo}–${hi}</span>`);
        m2.textContent = `кроків: ${n}`;
        await c.wait(380);
      }
      await c.cap('Результат', `<span class="ok">✅ ${n} кроків замість ${T}</span> — саме так курсор «стрибає» до потрібного місця`);
    }
  };

  /* Додаткові міні-сцени з scenes-mini.js (отримують спільні шматки розмітки) */
  if (typeof window.EXTRA_SCENES === 'function') Object.assign(SCENES, window.EXTRA_SCENES({ mb, card, cat, srv, pager }));

  /* ---------- Запуск сцен ---------- */
  /* data-auto: once (за замовчуванням) — програти при відкритті слайда;
                loop — програвати по колу, поки слайд відкритий; none — тільки кнопками */
  const runs = new WeakMap();
  const activeSlide = () => document.querySelector('.slide.is-active');
  async function play(root, mode = 'auto', target = 1) {
    const prev = runs.get(root);
    if (prev) { prev.dead = true; if (prev.resume) prev.resume(); }
    root.classList.remove('is-waiting');
    root.dataset.mode = mode;
    const c = makeCtl(root, mode, target); runs.set(root, c);
    try {
      await SCENES[root.dataset.scene](c);
      c.finished = true;
      if (mode === 'instant') {
        root.dataset.steps = c.stepNo;
        const cnt = root.querySelector('.sc-count'); if (cnt) cnt.textContent = `${c.stepNo} / ${c.stepNo}`;
      }
      const slide = root.closest('.slide');
      if (mode === 'auto' && root.dataset.auto === 'loop' && slide === activeSlide()) {
        await c.wait(2200);
        if (runs.get(root) === c && slide === activeSlide()) play(root, 'auto');
      }
    } catch (e) { if (e !== STOP) console.error(e); }
  }
  const stepNext = (root) => {
    const c = runs.get(root);
    if (c && c.mode === 'manual' && c.resume) { c.target++; c.resume(); return; }
    if (c && c.mode === 'manual' && c.finished) return;
    const cur = c && c.mode === 'auto' && !c.finished ? c.shown : 0;
    play(root, 'manual', Math.min(+root.dataset.steps || 99, cur + 1));
  };
  const stepBack = (root) => {
    const c = runs.get(root);
    const shown = c ? (c.mode === 'instant' || (c.finished && c.mode !== 'manual') ? +root.dataset.steps : c.shown) : 1;
    play(root, 'manual', Math.max(1, shown - 1));
  };

  const scenes = [...document.querySelectorAll('.scene[data-scene]')];
  scenes.forEach((root) => {
    /* Панель керування: ◀ крок · 2 / 5 · крок ▶ · ⏵ Play */
    let foot = root.querySelector('.scene-foot');
    if (!foot) { root.insertAdjacentHTML('beforeend', '<div class="scene-foot"><div class="scene-cap"></div></div>'); foot = root.querySelector('.scene-foot'); }
    foot.querySelector('.replay')?.remove();
    foot.insertAdjacentHTML('beforeend', `
      <div class="sc-ctl">
        <button type="button" class="sc-b" data-a="back" title="Попередній крок">◀</button>
        <span class="sc-count">– / –</span>
        <button type="button" class="sc-b" data-a="next" title="Наступний крок">▶</button>
        <button type="button" class="sc-b sc-play" data-a="play" title="Програти все">⏵ Play</button>
      </div>`);
    foot.querySelector('[data-a="back"]').onclick = () => stepBack(root);
    foot.querySelector('[data-a="next"]').onclick = () => stepNext(root);
    foot.querySelector('[data-a="play"]').onclick = () => play(root, 'auto');
    play(root, 'instant');                  // фінальний кадр одразу (для PDF і першого показу)
  });
  document.addEventListener('slide:enter', (e) => {
    e.detail.slide.querySelectorAll('.scene[data-scene]').forEach((root) => {
      const auto = root.dataset.auto || 'once';
      if (auto !== 'none') play(root, 'auto');
    });
  });

  /* ---------- Смужка «4 сторони» ---------- */
  const ICONS = {
    h: ['Людина', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/></svg>'],
    g: ['Пошуковик', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="8" width="14" height="11" rx="3"/><circle cx="9.5" cy="13" r="1.3"/><circle cx="14.5" cy="13" r="1.3"/><path d="M12 4v4"/></svg>'],
    s: ['Сервер', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></svg>'],
    b: ['Браузер', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/></svg>']
  };
  window.SIDE_ICONS = ICONS;
  document.querySelectorAll('.slide[data-sides]').forEach((slide) => {
    const map = Object.fromEntries(slide.dataset.sides.split(' ').filter(Boolean).map((p) => p.split(':')));
    slide.insertAdjacentHTML('beforeend', `<div class="sides" aria-label="Кому це добре чи погано">${
      Object.entries(ICONS).map(([k, [name, svg]]) => `<span class="sd ${map[k] || ''}" title="${name}">${svg}${name}</span>`).join('')}</div>`);
  });
  document.querySelectorAll('[data-side-icon]').forEach((el) => { el.innerHTML = ICONS[el.dataset.sideIcon][1]; });

  /* ---------- Квіз ---------- */
  document.querySelectorAll('.q').forEach((q) => {
    q.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || q.classList.contains('done')) return;
      q.querySelectorAll('button').forEach((x) => { if (x.dataset.right !== undefined) x.classList.add('right'); });
      if (b.dataset.right === undefined) b.classList.add('wrong');
      q.classList.add('done');
    });
  });
})();

/* ---------- «4 сторони»: квест з галочками ---------- */
(() => {
  const quest = document.getElementById('quest');
  if (!quest) return;
  const cards = [...quest.querySelectorAll('.card')];
  const n = document.getElementById('quest-n'), done = document.getElementById('quest-done');
  let k = 0;
  const render = () => {
    cards.forEach((c, i) => c.classList.toggle('done', i < k));
    n.textContent = `${k} / ${cards.length}`;
    done.classList.toggle('on', k === cards.length);
  };
  document.querySelector('#quest-ctl [data-q="next"]').onclick = () => { k = Math.min(cards.length, k + 1); render(); };
  document.querySelector('#quest-ctl [data-q="back"]').onclick = () => { k = Math.max(0, k - 1); render(); };
  cards.forEach((c, i) => c.addEventListener('click', () => { k = i + 1; render(); }));
  render();
})();
