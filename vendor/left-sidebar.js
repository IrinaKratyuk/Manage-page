/*!
 * left-sidebar — поведение левого сайдбара конструктора «Страницы»: список страниц и групп строится по данным,
 * режимы «Вписан / По ховеру / Закреплен» и кнопка разворота — как у right-sidebar, переименование двойным кликом,
 * меню «⋮» страницы, окно настройки и создания страницы.
 * Без зависимостей, CSS компонента подключается отдельно. Слоты — разметка кнопок кита button.
 * https://github.com/MarieSmi/ui-kit/tree/main/components/left-sidebar
 *
 * Разметка: .lsb с .lsb__lines, .lsb__panel (.lsb__head, .lsb__list), по желанию .lsb__menu и .pe.lsb__settings. См. README.
 */
(function () {
  'use strict';

  const CLOSE_DELAY = 200;    // мс: пауза перед закрытием панели, открытой наведением
  const NEW_NAME = 'Новая страница';
  const GROUP_LOCKED = ['home', 'duplicate', 'hide', 'delete']; // страница группы принадлежит ей: этих действий у неё нет
  const DEFAULTS = { addr: '', access: 'public', noindex: false, mode: 'page', seo: null, seoDescription: null };

  const TRANSLIT = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  function slug(name) {
    return Array.from(String(name).trim().toLowerCase()).map(function (c) { return c in TRANSLIT ? TRANSLIT[c] : c; })
      .join('').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  }
  const BTN_MORE = '<button type="button" class="btn btn--link btn--style-label btn--size-m btn--icon" data-lsb-cmd="more" aria-label="Ещё"><span class="btn__icon">&#xE9D9;</span></button>';
  const BTN_SAVE = '<button type="button" class="btn btn--filled btn--style-pale btn--size-m btn--icon lsb__save-ok" data-lsb-save="ok" aria-label="Сохранить"><span class="btn__icon">&#xE75E;</span></button>' +
    '<button type="button" class="btn btn--ghost btn--style-label btn--size-m btn--icon lsb__save-cancel" data-lsb-save="cancel" aria-label="Отменить"><span class="btn__icon">&#xE66C;</span></button>';

  function mount(root, options) {
    const opts = options || {};
    const q = function (s, box) { return (box || root).querySelector(s); };
    const list = q('.lsb__list');
    const lines = q('.lsb__lines');
    const menu = q('.lsb__menu');
    const win = q('.lsb__settings');
    const addBtn = q('[data-lsb-add]');

    let pages = (opts.pages || []).map(function (p) { return Object.assign({}, p); });
    let groups = (opts.groups || []).map(g => ({...g}));
    let active = opts.active != null ? opts.active : (pages[0] && pages[0].id);
    const collapsed = new Set(); // id свёрнутых групп
    let byHover = root.classList.contains('lsb--hover');
    let timer = null;
    let menuPage = null;   // страница с открытым меню «⋮»
    let editing = null;    // { page, input } — идёт переименование
    let winPage = undefined; // в окне: undefined — окно закрыто, null — новая страница, иначе — настраиваемая

    const byId = function (id) { return pages.find(function (p) { return p.id === id; }); };
    const floating = function () { return root.classList.contains('lsb--hover') || root.classList.contains('lsb--pinned'); };
    const allowed = function (name, page) { return !opts.canAction || opts.canAction(name, page) !== false; };
    const changed = function () { if (opts.onChange) opts.onChange(pages.slice()); };
    function nextId() {
      const nums = pages.map(function (p) { return p.id; }).filter(function (id) { return typeof id === 'number'; });
      return (nums.length ? Math.max.apply(null, nums) : 0) + 1;
    }
    function relRect(node, box) {
      const r = node.getBoundingClientRect();
      const b = (box || root).getBoundingClientRect();
      return { left: r.left - b.left, top: r.top - b.top, width: r.width, height: r.height };
    }

    // ---------- Список и линии ----------
    // Порядок: страницы без группы, потом группы в порядке groups
    function ordered() {
      const own = pages.filter(function (p) { return p.group == null && p.parentId == null; });
      return [own].concat(groups.map(function (g) { return pages.filter(function (p) { return p.group === g.id && p.parentId == null; }); }));
    }
    function row(p) {
      const r = el('div', 'lsb__page' + (p.id === active ? ' is-active' : '') + (p.off ? ' is-off' : ''),
        '<span class="lsb__marker"></span><span class="lsb__page-name"></span>' + (menu ? '<span class="lsb__cmds">' + BTN_MORE + '</span>' : ''));
      r.dataset.lsbPage = p.id;
      r.setAttribute('aria-selected', String(p.id === active));
      q('.lsb__page-name', r).textContent = p.name;
      if (p.container) {
        r.setAttribute('aria-expanded', String(!p.collapsed));
        const toggle = el('button', 'lsb__page-expand'); toggle.type = 'button';
        toggle.dataset.lsbExpand = p.id;
        toggle.setAttribute('aria-label', (p.collapsed ? 'Раскрыть страницу ' : 'Свернуть страницу ') + p.name);
        toggle.innerHTML = '<span aria-hidden="true">' + (p.collapsed ? '\ueb89' : '\ueb8a') + '</span>';
        q('.lsb__marker', r).after(toggle);
      }
      return r;
    }
    function groupHead(g) {
      const h = el('div', 'lsb__group');
      h.dataset.lsbGroup = g.id;
      if (opts.collapsible) { h.tabIndex = 0; h.setAttribute('role', 'button'); }
      if (g.icon) { const img = el('img', 'lsb__group-icon'); img.src = g.icon; img.alt = ''; h.append(img); }
      const name = el('span', 'lsb__group-name');
      name.textContent = g.name;
      h.append(name);
      if (opts.collapsible) h.setAttribute('aria-expanded', String(!collapsed.has(g.id)));
      return h;
    }
    function render() {
      const focusedRow = list && list.contains(document.activeElement) && document.activeElement.closest('[data-lsb-page]');
      const focusedId = focusedRow && focusedRow.dataset.lsbPage;
      const parts = ordered();
      const nodes = [];
      function appendPage(p, hidden) {
        const r = row(p); r.hidden = !!hidden; nodes.push(r);
        pages.filter(child => child.parentId === p.id).forEach(child => appendPage(child, hidden || p.collapsed));
      }
      parts[0].forEach(p => appendPage(p, false));
      let hasGroups = false;
      groups.forEach(function (g, i) {
        const own = parts[i + 1];
        if (!own.length && !opts.showEmptyGroups) return;
        hasGroups = true;
        nodes.push(groupHead(g));
        own.forEach(function (p) { appendPage(p, collapsed.has(g.id)); });
      });
      if (list) { list.classList.toggle('has-groups', hasGroups); list.replaceChildren.apply(list, nodes); }
      renderLines();
      if (focusedId) { const row2 = list.querySelector('[data-lsb-page="' + focusedId + '"]'); if (row2 && !row2.hidden) { row2.tabIndex = 0; row2.focus(); } }
    }
    function renderLines() {
      if (!lines) return;
      let activePage = byId(active);
      while (activePage && activePage.parentId != null) activePage = byId(activePage.parentId);
      const activeLine = activePage ? activePage.id : active;
      lines.replaceChildren.apply(lines, [].concat.apply([], ordered()).map(function (p) {
        return el('span', 'lsb__line' + (p.id === activeLine ? ' is-active' : ''));
      }));
    }

    // Выбор только переставляет классы: строки остаются на месте, иначе двойной клик не дойдёт до строки
    function select(id) {
      if (!byId(id)) return;
      const was = active;
      active = id;
      if (list) Array.prototype.forEach.call(list.querySelectorAll('.lsb__page'), function (r) {
        const on = String(r.dataset.lsbPage) === String(id);
        r.classList.toggle('is-active', on);
        r.setAttribute('aria-selected', String(on));
      });
      renderLines();
      if (was !== id && opts.onSelect) opts.onSelect(byId(id));
    }

    // ---------- Режимы ----------
    function setOpen(on) { root.classList.toggle('is-open', on && floating()); }
    // Закрепление — только из кода: открытая по наведению панель закрывает линии, кликнуть по ним нельзя
    function setPinned(on) {
      if (!floating()) return; // вписанный сайдбар не закрепляется
      root.classList.toggle('lsb--pinned', on);
      root.classList.toggle('lsb--hover', !on);
      setOpen(on);
    }
    // Кнопка разворота: вписанный уходит в «По ховеру» с закрытой панелью, висящий становится вписанным
    function setDocked(on) {
      if (on === !floating()) return;
      clearTimeout(timer);
      closeMenu(); closeSettings();
      // Смена режима без анимации: выезд панели — только при открытии и закрытии
      root.classList.add('is-switching');
      root.classList.remove('lsb--pinned', 'is-open');
      root.classList.toggle('lsb--hover', !on);
      void root.offsetWidth; // применить новое положение панели до снятия .is-switching
      root.classList.remove('is-switching');
      byHover = !on;
      syncToggle();
      if (opts.onDock) opts.onDock(on);
    }
    // Глиф и подпись кнопки разворота: «Свернуть» (U+EBFA) у вписанного, «Закрепить» (U+EBFB) у висящего
    function syncToggle() {
      const btn = q('.lsb__toggle button');
      if (!btn) return;
      const label = floating() ? 'Закрепить панель' : 'Свернуть панель';
      btn.setAttribute('aria-label', label);
      const icon = q('.btn__icon', btn);
      if (icon) icon.textContent = floating() ? '' : '';
    }
    // Панель по ховеру закрывается, когда курсор ушёл, а меню, переименование и окно закрыты
    function closeIfLeft() {
      clearTimeout(timer);
      if (!root.classList.contains('lsb--hover') || !root.classList.contains('is-open')) return;
      timer = setTimeout(function () {
        if (menuPage == null && !editing && winPage === undefined && !root.matches(':hover')) setOpen(false);
      }, CLOSE_DELAY);
    }

    // ---------- Переименование ----------
    function startRename(id) {
      if (!allowed('rename', byId(id))) return;
      finishRename(true);
      select(id);
      const page = byId(id);
      const r = list && list.querySelector('[data-lsb-page="' + id + '"]');
      if (!r) return;
      const input = el('input', 'lsb__input');
      input.value = page.name;
      input.setAttribute('aria-label', 'Название страницы');
      r.classList.add('is-edit');
      q('.lsb__page-name', r).replaceWith(input);
      const save = el('span', 'lsb__save', BTN_SAVE);
      const cmds = q('.lsb__cmds', r);
      r.append(save);
      editing = { page: page, input: input, row: r };
      input.focus();
      input.select();
    }
    // apply — сохранить название; пустое не сохраняется
    function finishRename(apply) {
      if (!editing) return;
      const page = editing.page;
      const name = editing.input.value.trim();
      editing = null;
      const renamed = apply && name && name !== page.name;
      if (renamed) page.name = name;
      render();
      if (renamed) changed();
      closeIfLeft();
    }

    // ---------- Действия со страницей ----------
    function descendantIds(id) {
      const ids = new Set([id]);
      let size;
      do { size = ids.size; pages.forEach(p => { if (ids.has(p.parentId)) ids.add(p.id); }); } while (ids.size !== size);
      return ids;
    }
    function remove(id) {
      const removed = byId(id); if (!removed) return;
      const siblings = pages.filter(p => p.group === removed.group && p.parentId === removed.parentId);
      const at = siblings.findIndex(p => p.id === id);
      const ids = descendantIds(id);
      const next = siblings[at - 1] || siblings[at + 1] || byId(removed.parentId);
      const activeRemoved = ids.has(active);
      pages = pages.filter(p => !ids.has(p.id));
      if (!pages.length) pages.push(Object.assign({ id: nextId(), name: 'Страница 1', off: false }, DEFAULTS));
      if (activeRemoved) select((next && byId(next.id) ? next : pages[0]).id);
      if (!pages.some(p => !p.off)) byId(active).off = false;
      render(); changed();
    }
    function duplicate(id) {
      const source = byId(id); if (!source) return;
      const ids = descendantIds(id), block = pages.filter(p => ids.has(p.id));
      let seq = nextId();
      const mapping = new Map(block.map(p => [p.id, seq++]));
      const copies = block.map(p => Object.assign({}, p, {
        id: mapping.get(p.id), parentId: mapping.has(p.parentId) ? mapping.get(p.parentId) : p.parentId,
        name: p.id === id ? p.name + ' (копия)' : p.name,
        addr: slug(p.name) + '_copy_' + mapping.get(p.id), home: false, required: false,
        collapsed: p.id === id ? false : p.collapsed
      }));
      const at = Math.max(...block.map(p => pages.indexOf(p)));
      pages.splice(at + 1, 0, ...copies);
      const parent = byId(source.parentId); if (parent) parent.collapsed = false;
      collapsed.delete(source.group); render(); select(mapping.get(id)); changed();
    }
    function act(name, page) {
      if (!allowed(name, page)) return;
      if (opts.onAction && opts.onAction(name, page) === false) return;
      if (name === 'delete' && opts.confirmDelete) {
        opts.confirmDelete(page, function () { if (byId(page.id) && allowed('delete', byId(page.id))) remove(page.id); });
        return;
      }
      if (name === 'delete' && !window.confirm('Удалить страницу «' + page.name + '»?')) return;
      if (name === 'settings') openSettings(page.id);
      else if (name === 'duplicate') duplicate(page.id);
      else if (name === 'delete') remove(page.id);
      else if (name === 'hide') {
        if (!page.off && pages.filter(function (p) { return !p.off; }).length < 2) return; // последнюю видимую не прячем
        page.off = !page.off; render(); changed();
      } else if (name === 'home') {
        pages.forEach(function (p) { p.home = p === page; }); changed();
      } else if (name === 'link') {
        const href = '/' + (page.addr || slug(page.name));
        try { navigator.clipboard.writeText(href); } catch (e) { /* буфер обмена недоступен */ }
      }
    }

    // ---------- Меню «⋮» ----------
    function closeMenu() {
      if (menuPage == null) return;
      menu.hidden = true;
      const r = list && list.querySelector('.is-menu');
      if (r) r.classList.remove('is-menu');
      menuPage = null;
      closeIfLeft();
    }
    // Крестик меню встаёт на место «⋮»: его центр — в 26px от правого края меню и в 24px от верхнего
    function openMenu(id, btn) {
      closeSettings();
      menuPage = id;
      btn.closest('.lsb__page').classList.add('is-menu');
      const page = byId(id);
      if (opts.onMenu) opts.onMenu(menu, page);
      Array.prototype.forEach.call(menu.querySelectorAll('[data-lsb-act]'), function (it) {
        it.hidden = !allowed(it.dataset.lsbAct, page) || (page.group != null && GROUP_LOCKED.indexOf(it.dataset.lsbAct) >= 0 && !opts.canAction);
        if (it.dataset.lsbAct === 'hide') {
          const text = q('.lsb__menu-text', it);
          if (text) text.textContent = page.off ? 'Показать' : 'Скрыть';
        }
      });
      menu.hidden = false;
      const r = relRect(btn);
      menu.style.left = Math.round(Math.max(0, r.left + r.width / 2 + 26 - menu.offsetWidth)) + 'px';
      menu.style.top = Math.round(Math.max(0, Math.min(r.top + r.height / 2 - 24, root.clientHeight - menu.offsetHeight))) + 'px';
    }

    // ---------- Окно настройки страницы ----------
    const f = function (name) { return win && q('[data-lsb-field="' + name + '"]', win); };
    const nameInput = win && q('.pe__name-input', win);
    const seoRow = win && q('[data-pe-row="seo"]', win);
    const seoChip = win && q('[data-pe-chip="seo"]', win);
    const descAdd = win && q('[data-lsb-description-add]', win);
    const descField = win && q('[data-lsb-description]', win);
    let seoEdited = false;

    function pickValue(key) {
      const it = q('[data-lsb-pick-menu="' + key + '"] [aria-checked="true"]', win);
      return it ? it.dataset.value : DEFAULTS[key];
    }
    function pickSet(key, value) {
      const m = q('[data-lsb-pick-menu="' + key + '"]', win);
      const btn = q('[data-lsb-pick="' + key + '"]', win);
      if (!m) return;
      Array.prototype.forEach.call(m.querySelectorAll('[data-value]'), function (it) {
        const on = it.dataset.value === value;
        it.classList.toggle('is-selected', on);
        it.setAttribute('aria-checked', String(on));
        if (on && btn) btn.textContent = it.textContent.trim();
      });
    }
    function closePicks() {
      if (!win) return;
      Array.prototype.forEach.call(win.querySelectorAll('[data-lsb-pick-menu]'), function (m) { m.hidden = true; });
      Array.prototype.forEach.call(win.querySelectorAll('[data-lsb-pick]'), function (b) { b.setAttribute('aria-expanded', 'false'); });
    }
    // Прямоугольник текста узла, без отступов: у ссылки значения текст лежит прямо в кнопке
    function textRect(node, box) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      return { left: r.left - b.left, top: r.top - b.top, width: r.width, height: r.height };
    }
    // Меню значения: текст выбранного пункта ложится на текст ссылки
    function openPick(btn) {
      const m = q('[data-lsb-pick-menu="' + btn.dataset.lsbPick + '"]', win);
      const open = m && m.hidden;
      closePicks();
      if (!open) return;
      m.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      const r = textRect(btn, win);
      const sel = q('[aria-checked="true"]', m) || q('[data-value]', m);
      const s = textRect(q('.lsb__pick-text', sel) || sel, m);
      m.style.left = Math.round(r.left - s.left) + 'px';
      m.style.top = Math.round(r.top + r.height / 2 - s.top - s.height / 2) + 'px';
    }
    function fitSettings() {
      if (win && !win.hidden) win.style.top = Math.max(0, Math.min(parseFloat(win.style.top) || 0, root.clientHeight - win.offsetHeight)) + 'px';
    }
    function showSeo(on) {
      if (seoRow) seoRow.hidden = !on;
      if (seoChip) {
        seoChip.hidden = on;
        const chips = seoChip.closest('.pe__chips');
        if (chips) chips.hidden = on;
      }
      fitSettings();
    }
    function showDescription(on) {
      if (descField) descField.hidden = !on;
      if (descAdd) { descAdd.hidden = on; descAdd.setAttribute('aria-expanded', String(on)); }
      fitSettings();
    }
    // Адрес и SEO-заголовок идут за названием, пока их не меняли вручную
    function syncName() {
      const name = nameInput.value.trim() || NEW_NAME;
      if (f('addr')) f('addr').placeholder = slug(name);
      if (!seoEdited && f('seo')) f('seo').value = name;
    }
    function fill(page) {
      const v = Object.assign({}, DEFAULTS, page || {});
      nameInput.value = page ? page.name : '';
      if (f('addr')) f('addr').value = v.addr || '';
      if (f('noindex')) f('noindex').checked = !!v.noindex;
      pickSet('access', v.access);
      pickSet('mode', v.mode);
      seoEdited = v.seo != null;
      showSeo(v.seo != null);
      if (f('seo')) f('seo').value = v.seo || '';
      if (f('seoDescription')) f('seoDescription').value = v.seoDescription || '';
      showDescription(v.seoDescription != null);
      win.setAttribute('aria-label', page ? 'Настройки страницы' : 'Новая страница');
      closePicks();
      syncName();
    }
    function openSettings(id, at) {
      if (!win) return;
      closeMenu();
      finishRename(true);
      const page = id == null ? null : byId(id);
      winPage = page;
      fill(page);
      win.hidden = false;
      nameInput.placeholder = NEW_NAME;
      if (opts.onSettings) opts.onSettings(win, page);
      let left = 0, top = 0;
      if (at) { left = at.left; top = at.top; }
      else if (!page && addBtn) { const r = relRect(addBtn); left = r.left - 12; top = r.top + r.height / 2 - 22; } // окно — поверх «+»
      else if (page && list) {
        const r = list.querySelector('[data-lsb-page="' + page.id + '"]');
        if (r) { const rr = relRect(r); left = rr.left + rr.width - win.offsetWidth; top = rr.top; }
      }
      win.style.left = Math.round(Math.max(0, left)) + 'px';
      win.style.top = Math.round(Math.max(0, Math.min(top, root.clientHeight - win.offsetHeight))) + 'px';
      // У новой страницы название пустое: «Новая страница» — плейсхолдер, каретка сразу в поле
      nameInput.focus();
    }
    function closeSettings() {
      if (!win || winPage === undefined) return;
      closePicks();
      win.hidden = true;
      winPage = undefined;
      closeIfLeft();
    }
    function saveSettings() {
      const fields = {
        name: nameInput.value.trim() || nameInput.placeholder || NEW_NAME,
        addr: f('addr') ? f('addr').value.trim() : '',
        noindex: f('noindex') ? f('noindex').checked : false,
        access: pickValue('access'),
        mode: pickValue('mode'),
        seo: seoRow && !seoRow.hidden && f('seo') ? f('seo').value : null,
        seoDescription: seoRow && !seoRow.hidden && descField && !descField.hidden && f('seoDescription') ? f('seoDescription').value : null
      };
      const page = winPage;
      closeSettings();
      if (page) Object.assign(page, fields);
      else {
        const defaults = opts.newPageDefaults ? opts.newPageDefaults() : {};
        const created = Object.assign({ off: false }, defaults, fields, {id: nextId()});
        const last = pages.reduce(function (at, p, i) { return p.group === created.group && p.parentId === created.parentId ? i : at; }, -1);
        pages.splice(last < 0 ? pages.length : last + 1, 0, created);
        active = created.id;
        const parent = byId(created.parentId); if (parent) parent.collapsed = false;
        collapsed.delete(created.group);
      }
      render();
      if (!page && opts.onSelect) opts.onSelect(byId(active));
      changed();
    }
    function resetSettings() {
      fill(null);
      nameInput.value = winPage ? winPage.name : '';
      syncName();
      if (opts.onSettings) opts.onSettings(win, winPage);
    }

    // ---------- События ----------
    function onClick(e) {
      const t = e.target;
      if (t.closest('.lsb__toggle')) { setDocked(floating()); return; }
      if (addBtn && addBtn.contains(t)) { if (!allowed('add', null) || (opts.onAction && opts.onAction('add', null) === false)) return; openSettings(null); return; }

      if (menu && menu.contains(t)) {
        const it = t.closest('[data-lsb-act]');
        if (it || t.closest('.lsb__menu-close')) {
          const page = byId(menuPage);
          const at = { left: menu.offsetLeft, top: menu.offsetTop };
          closeMenu();
          if (it && page) {
            if (it.dataset.lsbAct === 'settings' && !(opts.onAction && opts.onAction('settings', page) === false)) openSettings(page.id, at);
            else if (it.dataset.lsbAct !== 'settings') act(it.dataset.lsbAct, page);
          }
        }
        return;
      }

      if (win && win.contains(t)) { onWinClick(e); return; }

      const r = t.closest('.lsb__page');
      if (r && list && list.contains(r)) {
        const id = byId(Number(r.dataset.lsbPage)) ? Number(r.dataset.lsbPage) : r.dataset.lsbPage;
        if (t.closest('[data-lsb-expand]')) {
          const page = byId(id); page.collapsed = !page.collapsed; render(); changed();
          const row2 = list.querySelector('[data-lsb-page="' + id + '"]'); if (row2) row2.focus();
          return;
        }
        const save = t.closest('[data-lsb-save]');
        if (save) { finishRename(save.dataset.lsbSave === 'ok'); return; }
        if (r.classList.contains('is-edit')) return;
        const more = t.closest('[data-lsb-cmd="more"]');
        if (more && menu) { if (menuPage === id) closeMenu(); else openMenu(id, more); return; }
        select(id);
        return;
      }
      const g = t.closest('.lsb__group[aria-expanded]');
      if (g && !t.closest('input, button')) {
        const gid = groups.find(function (x) { return String(x.id) === g.dataset.lsbGroup; }).id;
        if (collapsed.has(gid)) collapsed.delete(gid); else collapsed.add(gid);
        render();
        const head = list.querySelector('[data-lsb-group="' + gid + '"]');
        if (head) head.focus();
      }
    }
    function onWinClick(e) {
      const t = e.target;
      if (t.closest('.pe__done')) { saveSettings(); return; }
      if (t.closest('.pe__close')) { closeSettings(); return; }
      if (t.closest('.pe__reset')) { resetSettings(); return; }
      const pick = t.closest('[data-lsb-pick]');
      if (pick) { openPick(pick); return; }
      const pm = t.closest('[data-lsb-pick-menu]');
      if (pm) {
        const it = t.closest('[data-value]');
        if (it) pickSet(pm.dataset.lsbPickMenu, it.dataset.value);
        if (it || t.closest('.lsb__pick-close')) {
          closePicks();
          const b = q('[data-lsb-pick="' + pm.dataset.lsbPickMenu + '"]', win);
          if (b) b.focus();
        }
        return;
      }
      if (t.closest('[data-pe-chip="seo"]')) { showSeo(true); if (f('seo')) f('seo').focus(); return; }
      if (t.closest('[data-pe-clear]')) { showSeo(false); showDescription(false); if (f('seoDescription')) f('seoDescription').value = ''; return; }
      if (descAdd && t.closest('[data-lsb-description-add]')) { showDescription(true); if (f('seoDescription')) f('seoDescription').focus(); }
    }
    function onDblClick(e) {
      const r = e.target.closest('.lsb__page');
      if (!r || !list || !list.contains(r) || e.target.closest('[data-lsb-cmd], [data-lsb-save]') || r.classList.contains('is-edit')) return;
      startRename(byId(Number(r.dataset.lsbPage)) ? Number(r.dataset.lsbPage) : r.dataset.lsbPage);
    }
    function onKey(e) {
      const pageRow = e.target.closest('.lsb__page');
      if (pageRow && e.target === pageRow && ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu')) {
        e.preventDefault();
        const id = byId(Number(pageRow.dataset.lsbPage)) ? Number(pageRow.dataset.lsbPage) : pageRow.dataset.lsbPage;
        const btn = pageRow.querySelector('[data-lsb-cmd="more"]');
        if (btn && menu) { openMenu(id, btn); const item = menu.querySelector('[data-lsb-act]:not([hidden])'); if (item) item.focus(); }
        return;
      }
      if (pageRow && e.target === pageRow && !e.altKey && ['ArrowRight', 'ArrowLeft'].includes(e.key)) {
        const page = byId(Number(pageRow.dataset.lsbPage)) || byId(pageRow.dataset.lsbPage);
        if (page && page.container) { e.preventDefault(); page.collapsed = e.key === 'ArrowLeft'; render(); changed(); const row2 = list.querySelector('[data-lsb-page="' + page.id + '"]'); if (row2) row2.focus(); return; }
      }
      if (menu && !menu.hidden && menu.contains(e.target) && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        const items = Array.from(menu.querySelectorAll('.lsb__menu-item:not([hidden])'));
        const at = items.indexOf(document.activeElement);
        const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        if (items[next]) items[next].focus();
        return;
      }
      const head = e.target.closest('.lsb__group[aria-expanded]');
      if (head && ['Enter', ' '].includes(e.key)) { e.preventDefault(); head.click(); return; }
      if (editing && e.target === editing.input) {
        if (e.key === 'Enter') finishRename(true);
        else if (e.key === 'Escape') finishRename(false);
        return;
      }
      if (win && e.target === nameInput && e.key === 'Enter') { saveSettings(); return; }
      if (e.key !== 'Escape') return;
      if (win && winPage !== undefined) {
        const open = win.querySelector('[data-lsb-pick-menu]:not([hidden])');
        if (open) { closePicks(); const b = q('[data-lsb-pick="' + open.dataset.lsbPickMenu + '"]', win); if (b) b.focus(); }
        else closeSettings();
      } else {
        const id = menuPage; closeMenu();
        const row2 = list && list.querySelector('[data-lsb-page="' + id + '"]');
        if (row2) row2.focus();
      }
    }
    // Клик мимо: меню закрывается, переименование сохраняется, окно закрывается без сохранения, меню значения — тоже
    function onDocDown(e) {
      const t = e.target;
      if (menuPage != null && !menu.contains(t) && !t.closest('[data-lsb-cmd="more"]')) closeMenu();
      if (editing && !editing.row.contains(t)) finishRename(true);
      if (win && winPage !== undefined) {
        if (!win.contains(t) && !(addBtn && addBtn.contains(t)) && !(menu && menu.contains(t))) closeSettings();
        else if (!t.closest('[data-lsb-pick-menu], [data-lsb-pick]')) closePicks();
      }
    }
    function onInput(e) {
      if (!win || !win.contains(e.target)) return;
      if (e.target === nameInput) syncName();
      else if (e.target === f('seo')) seoEdited = true;
    }
    function onLinesEnter() {
      if (!root.classList.contains('lsb--hover')) return;
      clearTimeout(timer);
      setOpen(true);
    }
    function onEnter() { clearTimeout(timer); }

    root.addEventListener('click', onClick);
    root.addEventListener('dblclick', onDblClick);
    root.addEventListener('keydown', onKey);
    root.addEventListener('input', onInput);
    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', closeIfLeft);
    if (lines) lines.addEventListener('mouseenter', onLinesEnter);
    document.addEventListener('mousedown', onDocDown);

    if (menu) menu.hidden = true;
    if (win) win.hidden = true;
    render();
    syncToggle();

    return {
      get pages() { return pages.slice(); },
      get groups() { return groups.map(g => ({...g})); },
      get collapsedGroups() { return [...collapsed]; },
      setGroups: function (value, folded) {
        closeMenu(); closeSettings();
        groups = value.map(g => ({...g})); collapsed.clear();
        (folded || []).forEach(id => collapsed.add(id)); render();
      },
      toggleGroup: function (id) { if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id); render(); },
      get active() { return active; },
      get floating() { return floating(); },
      setPages: function (list2, act2) {
        pages = list2.map(function (p) { return Object.assign({}, p); });
        if (act2 != null) active = act2;
        else if (!byId(active) && pages[0]) active = pages[0].id;
        render();
      },
      createPage: function (defaults) {
        if (!allowed('add', null)) return;
        closeMenu(); closeSettings();
        const id = nextId();
        const created = Object.assign({name: NEW_NAME, off: false, addr: 'page-' + id}, defaults, {id: id});
        let last = -1;
        pages.forEach(function (p, i) { if (p.group === created.group) last = i; });
        pages.splice(last < 0 ? pages.length : last + 1, 0, created);
        active = id; collapsed.delete(created.group);
        render();
        if (opts.onSelect) opts.onSelect(created);
        changed();
        return created;
      },
      select: select,
      rename: startRename,
      openSettings: function (id) { openSettings(id == null ? null : id); },
      closeSettings: closeSettings,
      dock: function (on) { setDocked(on !== false); },
      pin: function (on) { setPinned(on !== false); },
      destroy: function () {
        clearTimeout(timer);
        root.removeEventListener('click', onClick);
        root.removeEventListener('dblclick', onDblClick);
        root.removeEventListener('keydown', onKey);
        root.removeEventListener('input', onInput);
        root.removeEventListener('mouseenter', onEnter);
        root.removeEventListener('mouseleave', closeIfLeft);
        if (lines) lines.removeEventListener('mouseenter', onLinesEnter);
        document.removeEventListener('mousedown', onDocDown);
      }
    };
  }

  window.LeftSidebar = { mount: mount, slug: slug };
})();
