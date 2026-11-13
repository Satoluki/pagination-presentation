/* =====================================================================
   SCENES-MINI — маленькі сцени для слайдів кейсів (кнопки кроків і Play
   спільні з «живим словником»). Підключається ДО scenes.js.
   ===================================================================== */
window.EXTRA_SCENES = ({ mb, card, cat, srv }) => ({

  /* NN/g: де нескінченний скрол доречний, а де ні */
  async nng(c) {
    const { W, H } = c;
    const pw = Math.round((W - 54) / 2);
    const post = (k) => `<div class="m-post"><i></i><div><b>@friend_${k}</b><span>фото з відпочинку · ${k * 7} ♥</span></div></div>`;
    c.st.innerHTML = `
      <div class="mb-label" style="left:18px;top:10px">Стрічка соцмережі</div>
      <div class="mb-label" style="left:${pw + 36}px;top:10px">Каталог: шукаю «Ноутбук №87»</div>
      <div class="m-pane" style="left:18px;top:38px;width:${pw}px;bottom:40px"><div class="m-roll" data-r="feed">${Array.from({ length: 24 }, (_, k) => post(k + 1)).join('')}</div></div>
      <div class="m-pane" style="left:${pw + 36}px;top:38px;width:${pw}px;bottom:40px"><div class="m-roll" data-r="cat">${cat(1, 24)}</div><div class="m-bar"><i></i></div></div>
      <div class="m-verdict" data-v="1" style="left:18px;bottom:8px;width:${pw}px"></div>
      <div class="m-verdict" data-v="2" style="left:${pw + 36}px;bottom:8px;width:${pw}px"></div>`;
    const feed = c.$('[data-r="feed"]'), catalog = c.$('[data-r="cat"]'), thumb = c.$('.m-bar i');
    const v1 = c.$('[data-v="1"]'), v2 = c.$('[data-v="2"]');
    await c.cap('Підходить', 'Стрічка розваг: гортаєш без мети, нове — завжди внизу');
    feed.style.transform = 'translateY(-55%)';
    await c.wait(2600);
    v1.innerHTML = '<span class="ok">✓ Підходить</span> — гортаю без мети';
    await c.cap('Каталог', 'Тепер шукаємо конкретний товар — №87…');
    for (let k = 1; k <= 3; k++) {
      catalog.insertAdjacentHTML('beforeend', Array.from({ length: 12 }, (_, j) => card(24 + (k - 1) * 12 + j + 1)).join(''));
      catalog.style.transform = `translateY(-${18 + k * 18}%)`;
      thumb.style.height = `${60 / (k + 1)}%`; thumb.style.top = `${20 + k * 10}%`;
      await c.wait(900);
    }
    await c.cap('Не підходить', '<span class="no">✗ Повзунок «бреше»</span>, кінця не видно, а №87 загубився серед сотень карток');
    v2.innerHTML = '<span class="no">✗ Не підходить</span> — шукаю конкретне';
  },

  /* Робот Google: посилання — так, кнопка — ні */
  async bot(c) {
    const { W, H } = c;
    const pw = Math.round(W * 0.26), ph = H - 40, y = 20;
    const page = (x, title, body) => `<div class="m-page" style="left:${x}px;top:${y}px;width:${pw}px;height:${ph}px"><b>${title}</b>${body}</div>`;
    const x1 = 30, x2 = Math.round(W / 2 - pw / 2), x3 = W - pw - 30;
    c.st.innerHTML =
      page(x1, 'Каталог · сторінка 1', `<div class="m-mini">${cat(1, 3)}</div><code class="m-link">&lt;a href="?page=2"&gt;Далі&lt;/a&gt;</code><span class="m-btn">Показати ще</span>`) +
      page(x2, 'Сторінка 2', `<div class="m-mini">${cat(4, 3)}</div>`) +
      page(x3, 'Товари після «Показати ще»', `<div class="m-mini ghost">${cat(7, 3)}</div>`) +
      `<div class="m-robot" style="left:${x1 + 20}px;top:${y + ph - 70}px">🤖</div><div class="m-say"></div>`;
    const robot = c.$('.m-robot'), say = c.$('.m-say'), pages = c.$$('.m-page');
    const at = async (x, yy, text, ms = 800) => { robot.style.left = x + 'px'; robot.style.top = yy + 'px'; say.style.left = x + 40 + 'px'; say.style.top = yy - 34 + 'px'; say.innerHTML = text; await c.wait(ms); };
    pages.forEach((p) => p.classList.remove('seen', 'lost'));
    await c.cap('Сторінка 1', 'Робот читає сторінку і шукає посилання <code>&lt;a href&gt;</code>');
    pages[0].classList.add('seen');
    await at(x1 + 20, y + ph - 70, 'читаю…');
    await c.cap('Посилання', 'Бачить посилання на <code>?page=2</code> — і йде за ним');
    await at(x2 + 20, y + ph - 70, '<span class="ok">✓ знайшов</span>', 1000);
    pages[1].classList.add('seen');
    await c.cap('Кнопка', 'А кнопку «Показати ще» робот <b>не натискає</b>…');
    await at(x1 + pw - 70, y + ph - 70, 'клік? 🤷', 900);
    pages[2].classList.add('lost');
    await c.cap('Результат', '<span class="no">✗ Товари після кнопки для Google не існують</span> — їх не знайдуть у пошуку');
  },

  /* Ера #!: Gawker, Twitter, Google */
  async eras(c) {
    const { W, H } = c;
    const pw = Math.round((W - 80) / 3), ph = H - 30;
    const box = (k, title) => `<div class="m-era" data-e="${k}" style="left:${20 + k * (pw + 20)}px;top:15px;width:${pw}px;height:${ph}px"><b>${title}</b><div class="m-era__body"></div></div>`;
    c.st.innerHTML = box(0, 'Gawker · 2011') + box(1, 'Twitter · 2012') + box(2, 'Google · 2015');
    const body = (k) => c.$(`[data-e="${k}"] .m-era__body`);
    body(0).innerHTML = `<div class="m-site"><div class="m-site__url">lifehacker.com/#!/…</div><div class="m-site__view">${cat(1, 3)}</div></div>`;
    body(1).innerHTML = `<div class="m-load"><span>з #!</span><i data-l="a"></i></div><div class="m-load"><span>сервер</span><i data-l="b" class="good"></i></div><p class="m-note"></p>`;
    body(2).innerHTML = `<div class="m-doc">AJAX crawling scheme<br><code>_escaped_fragment_</code></div><div class="m-stamp">ВІДКЛИКАНО</div><p class="m-note"></p>`;
    await c.cap('Gawker, 2011', 'Сайти тримаються на JavaScript і адресах з <code>#!</code>…');
    await c.wait(900);
    c.$('[data-e="0"] .m-site__view').innerHTML = '<div class="m-empty">JavaScript впав → <b>порожньо</b></div>';
    c.$('[data-e="0"]').classList.add('bad');
    await c.cap('Gawker, 2011', '<span class="no">✗ Скрипт не завантажився — сайти порожні</span>, посилання не працюють');
    await c.wait(600);
    await c.cap('Twitter, 2012', 'Twitter повертає рендер на сервер…');
    c.$('[data-l="a"]').style.width = '100%';
    await c.wait(1300);
    c.$('[data-l="b"]').style.width = '20%';
    await c.wait(700);
    c.$('[data-e="1"] .m-note').innerHTML = '<span class="ok">У 5 разів швидше</span> перше завантаження';
    c.$('[data-e="1"]').classList.add('good');
    await c.cap('Twitter, 2012', '<span class="ok">✓ Без #! сторінка відкривається у 5 разів швидше</span>');
    await c.wait(600);
    c.$('[data-e="2"] .m-stamp').classList.add('on');
    c.$('[data-e="2"] .m-note').innerHTML = 'Рекомендація: <code>history.pushState()</code>';
    c.$('[data-e="2"]').classList.add('good');
    await c.cap('Google, 2015', '<span class="ok">✓ Google відкликає власну AJAX-схему</span> і радить звичайні адреси через pushState');
  },

  /* Як виконується SQL: OFFSET перебирає, курсор стрибає */
  async sqlrun(c) {
    const { W, H } = c;
    const N = 36, take = 6, skip = 24;
    const row = (k) => `<i data-k="${k}"></i>`;
    const lineY = (k) => 30 + k * 66;
    c.st.innerHTML = `
      <div class="m-sql" style="top:${lineY(0) - 24}px"><span class="no">OFFSET ${skip} LIMIT ${take}</span><em data-m="1">прочитано рядків: 0</em></div>
      <div class="m-rows" data-row="1" style="top:${lineY(0)}px">${Array.from({ length: N }, (_, k) => row(k)).join('')}</div>
      <div class="m-sql" style="top:${lineY(1) - 24}px"><span class="ok">WHERE id &gt; ${skip} LIMIT ${take}</span><em data-m="2">прочитано рядків: 0</em></div>
      <div class="m-rows" data-row="2" style="top:${lineY(1)}px">${Array.from({ length: N }, (_, k) => row(k)).join('')}</div>
      <div class="m-jump">🔖</div>`;
    const r1 = c.$$('[data-row="1"] i'), r2 = c.$$('[data-row="2"] i'), m1 = c.$('[data-m="1"]'), m2 = c.$('[data-m="2"]');
    await c.cap('OFFSET', 'База йде по рядках з першого і <b>викидає</b> пропущені…');
    for (let k = 0; k < skip; k++) { r1[k].className = 'skip'; m1.textContent = `прочитано рядків: ${k + 1}`; await c.wait(70); }
    for (let k = skip; k < skip + take; k++) { r1[k].className = 'take'; m1.textContent = `прочитано рядків: ${k + 1}`; await c.wait(70); }
    await c.cap('OFFSET', `<span class="no">✗ ${skip + take} прочитано, щоб віддати ${take}</span>`);
    await c.wait(500);
    await c.cap('Курсор', 'Курсор: «після id 24» — за індексом одразу на місце');
    const t = c.box(r2[skip]), jump = c.$('.m-jump');
    jump.style.left = t.x - 6 + 'px'; jump.style.top = t.y - 40 + 'px'; jump.style.opacity = 1;
    await c.wait(500);
    for (let k = skip; k < skip + take; k++) { r2[k].className = 'take'; m2.textContent = `прочитано рядків: ${k - skip + 1}`; await c.wait(70); }
    await c.cap('Курсор', `<span class="ok">✓ Прочитано лише ${take}</span> — швидкість не залежить від глибини сторінки`);
  },

  /* Зміщення даних: дубль на 2-й сторінці */
  async drift(c) {
    const { W, H } = c;
    const half = Math.round((W - 60) / 2);
    const chips = (ids, cls = () => '') => ids.map((n) => `<i class="${cls(n)}">${n}</i>`).join('');
    c.st.innerHTML = `
      <div class="m-col" style="left:20px;width:${half}px"><b class="no">OFFSET (сторінки по 5)</b>
        <span class="m-l">Стрічка зараз:</span><div class="m-feed" data-f="o"></div>
        <span class="m-l">Сторінка 2 (OFFSET 5):</span><div class="m-feed" data-p="o"></div><p class="m-note" data-n="o"></p></div>
      <div class="m-col" style="left:${half + 40}px;width:${half}px"><b class="ok">Курсор («старші за 6»)</b>
        <span class="m-l">Стрічка зараз:</span><div class="m-feed" data-f="c"></div>
        <span class="m-l">Сторінка 2 (id &lt; 6):</span><div class="m-feed" data-p="c"></div><p class="m-note" data-n="c"></p></div>`;
    const feed = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    for (const k of ['o', 'c']) c.$(`[data-f="${k}"]`).innerHTML = chips(feed, (n) => (n >= 6 ? 'pg' : ''));
    await c.cap('Сторінка 1', 'Користувач бачить пости 10…6 (виділені синім)');
    await c.wait(900);
    await c.cap('Новий пост', 'Поки він читає, з\'являється пост <b>11</b>…');
    for (const k of ['o', 'c']) c.$(`[data-f="${k}"]`).innerHTML = chips([11, ...feed], (n) => (n === 11 ? 'new' : n >= 6 ? 'pg' : ''));
    await c.wait(1200);
    await c.cap('OFFSET', 'OFFSET 5 = «пропусти 5»… але тепер п\'ятим стоїть пост 6');
    c.$('[data-p="o"]').innerHTML = chips([6, 5, 4, 3, 2], (n) => (n === 6 ? 'dup' : ''));
    c.$('[data-n="o"]').innerHTML = '<span class="no">✗ Пост 6 показано двічі</span>';
    await c.wait(900);
    await c.cap('Курсор', 'Курсор не рахує позиції — він пам\'ятає «останній був 6»');
    c.$('[data-p="c"]').innerHTML = chips([5, 4, 3, 2, 1], () => 'ok');
    c.$('[data-n="c"]').innerHTML = '<span class="ok">✓ Без дублів і пропусків</span>';
  },

  /* GitHub: 422 на глибоку сторінку, 200 з курсором */
  async http422(c) {
    const { W, H } = c;
    c.st.innerHTML = `
      <div class="m-client" style="left:24px;top:${H / 2 - 40}px">💻 Клієнт</div>
      ${srv(W - 230, H / 2 - 70, 'api.github.com')}
      <div class="m-req" data-q></div>
      <div class="m-resp" data-r></div>`;
    const req = c.$('[data-q]'), resp = c.$('[data-r]'), log = c.$('.srv .log');
    const send = async (text) => {
      req.innerHTML = text; req.style.transition = 'none'; req.style.left = '150px'; req.style.opacity = 1; void req.offsetWidth;
      req.style.transition = ''; req.style.left = (W - 560) + 'px'; await c.wait(900);
    };
    req.style.top = H / 2 - 50 + 'px'; resp.style.top = H / 2 + 6 + 'px';
    await c.cap('Запит', 'Просимо 459-ту сторінку по 100 задач');
    await send('GET …/issues?page=<b>459</b>&per_page=100');
    log.textContent = 'пропустити 45 800 записів?';
    await c.wait(900);
    await c.cap('Відповідь', '<span class="no">422 — «зрозумів, але виконувати не буду»</span>: надто дорого для бази');
    resp.className = 'm-resp bad'; resp.innerHTML = '<b>422</b> Unprocessable · use cursor (after/before)'; resp.style.opacity = 1;
    await c.wait(1300);
    await c.cap('Курсор', 'Просимо інакше: «дай записи <b>після</b> цієї закладки»');
    resp.style.opacity = 0;
    await send('GET …/issues?<b>after</b>=Y3Vyc29y…');
    log.textContent = 'за індексом → одразу на місці';
    await c.wait(700);
    resp.className = 'm-resp good'; resp.innerHTML = '<b>200 OK</b> · 100 задач + посилання на наступні'; resp.style.opacity = 1;
    await c.cap('Результат', '<span class="ok">✓ 200 OK</span> — курсор працює на будь-якій глибині');
  },

  /* Гібрид у коді: рядок за рядком + що відбувається на екрані */
  async code(c) {
    const { W, H } = c;
    const cw = Math.round(W * 0.56);
    const lines = [
      ['<span class="k">button</span>.onclick = <span class="k">async</span> () =&gt; {', 'Клік по «Показати ще»'],
      ['  <span class="k">const</span> { items, next } = <span class="k">await</span> fetch(<span class="s">`/api/products?cursor=${cursor}`</span>)…', 'AJAX-запит з курсором'],
      ['  list.append(...items.map(render));', 'Домальовуємо нові картки'],
      ['  history.pushState({ cursor: next }, <span class="s">\'\'</span>, <span class="s">\'?page=2\'</span>);', 'Оновлюємо адресу'],
      ['};', '']
    ];
    c.st.innerHTML = `<pre class="m-code" style="width:${cw}px">${lines.map((l, k) => `<div data-l="${k}">${l[0]}</div>`).join('')}</pre>` +
      mb('a', { x: cw + 40, y: 14, w: W - cw - 56, h: H - 28, back: true }) + '<div class="packet"></div>';
    const url = c.url('a'), view = c.view('a');
    url.textContent = 'shop.ua/catalog?page=1';
    view.innerHTML = cat(1, 3) + '<span class="mbtn">Показати ще</span>';
    const hl = (k) => c.$$('.m-code div').forEach((d, j) => d.classList.toggle('on', j === k));
    hl(0); await c.cap('Рядок 1', 'Людина натискає «Показати ще»');
    await c.press(c.$('.mbtn'), 500);
    hl(1); await c.cap('Рядок 2', 'AJAX: просимо в сервера наступні товари <b>за курсором</b>');
    const b = c.box(c.$('.mbtn')), pk = c.$('.packet');
    await c.fly(pk, b.x + 30, b.y, b.x + 30, 4, 600); pk.classList.add('back');
    await c.fly(pk, b.x + 30, 4, b.x + 30, b.y, 600); pk.style.opacity = 0; pk.classList.remove('back');
    hl(2); await c.cap('Рядок 3', 'Домальовуємо нові картки — без перезавантаження');
    c.$('.mcat').insertAdjacentHTML('beforeend', card(4, 'new') + card(5, 'new') + card(6, 'new'));
    await c.wait(800);
    hl(3); await c.cap('Рядок 4', '<span class="ok">pushState</span> — адреса стала <b>?page=2</b>: «Назад» і посилання працюють');
    url.innerHTML = 'shop.ua/catalog<span class="hl">?page=2</span>';
  },

  /* Віртуалізація: у DOM лише вікно перегляду */
  async virt(c) {
    const { W, H } = c;
    const rows = 26, rh = Math.max(18, Math.floor((H - 36) / 6));
    c.st.innerHTML = `
      <div class="m-vlist" style="height:${rows * rh}px">${Array.from({ length: rows }, (_, k) => `<div class="m-vrow" style="top:${k * rh}px;height:${rh - 3}px">Товар №${k + 1}</div>`).join('')}</div>
      <div class="m-vwin" style="height:${rh * 6}px"><span>екран</span></div>
      <div class="m-vcount"><b>6</b>елементів у DOM<br><small>зі ${(10000).toLocaleString('uk-UA')}</small></div>`;
    const list = c.$('.m-vlist'), rowsEl = c.$$('.m-vrow'), win = c.$('.m-vwin');
    const show = (first) => rowsEl.forEach((r, k) => r.classList.toggle('live', k >= first && k < first + 6));
    list.style.transform = 'translateY(0)'; show(0);
    await c.cap('Екран', 'Видно лише 6 товарів — і тільки вони існують у DOM');
    await c.wait(800);
    await c.cap('Гортаємо', 'Гортаємо вниз: нові рядки «народжуються», старі — перевикористовуються');
    for (let f = 1; f <= rows - 6; f++) {
      list.style.transform = `translateY(-${f * rh}px)`; show(f);
      await c.wait(160);
    }
    await c.cap('Результат', '<span class="ok">✓ У DOM завжди ~6 елементів</span>, хоч список на 10 000 — телефон не гальмує');
  }
});
