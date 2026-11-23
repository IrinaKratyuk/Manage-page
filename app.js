'use strict';
// Block command activation only: preserve pointer targeting, hover and tooltips.
for (const region of document.querySelectorAll('#builder-header, .rsb')) {
  region.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  region.addEventListener('keydown', event => {
    if (['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}
var panelController = null;
const demoTitles = {booking: 'Виджет записи', surveys: 'Мой опрос', kiosk: 'Киоск', universal: 'Условный продукт'};
// Original 600×768 screens exported by Axure; no client scenario is implemented.
const bookingPages = [
  {name: 'Заведения', image: 'u571.png'},
  {name: 'Услуги', image: 'u611.png'},
  {name: 'Специалисты', image: 'u510.png'},
  {name: 'Дата и время', image: 'u785.png'},
  {name: 'Карточка товара', image: 'u1399.png'},
  {name: 'Оформление', image: 'u814.png'},
  {name: 'Финальный экран', image: 'u1241.png'}
];
function showBookingPage(index) {
  const page = sidebar.pages[index];
  if (!page) return;
  const image = document.querySelector('#booking-page');
  image.hidden = !page.image;
  if (page.image) image.src = 'axure/' + page.image;
  image.alt = page.name + ' — статичный экран из макета Axure';
  document.querySelector('.booking-preview').setAttribute('aria-label', page.name + ' — статичная страница виджета записи');
}
// Shared rail uses the supplied command sets. Hover stays enabled.
const originalRightBar = document.querySelector('.rsb__bar').innerHTML;
const sharedRightBarFooter = document.querySelector('.rsb__dock').outerHTML + document.querySelector('.rsb__informers').outerHTML;
function drawRightTools(scenario) {
  const bar = document.querySelector('.rsb__bar');
  if (scenario === 'booking') { bar.innerHTML = originalRightBar; return; }
  const textIcon = '<svg class="rsb__reference-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M4 6V3h16v3M12 3v19M8 22h8"/></svg>';
  const commands = [['Магазин','eadd'],['Данные','ebbc'],['Слои','ebf9'],['Оформление','ebbb'],['Текст',null]];
  if (scenario === 'surveys') commands.push(['Настройки','e75d'],['Ещё','e9d9']);
  bar.innerHTML = '<div class="rsb__items">' + commands.map(([label,glyph],index) => '<button type="button" class="rsb__item'+(index===0?' rsb__item--shop':label==='Ещё'?' rsb__item--more':'')+'" aria-label="'+label+'" title="'+label+'">'+(glyph?'<span class="rsb__icon" aria-hidden="true">&#x'+glyph+';</span>':textIcon)+'</button>').join('')+'</div>' + sharedRightBarFooter;
}
const scenarioPages = {
  booking: bookingPages.map((page, index) => ({...page, id: index + 1, required: [0,4,5,6].includes(index), group: index === 0 ? 'start' : index < 4 ? 'core' : 'finish'})),
  kiosk: ['Главная','Каталог','Карточка товара','Финальный экран'].map((name, index) => ({id: index + 1, name})),
  surveys: [
    {id: 1, name: 'Приветствие', glyph: 'E656'},
    {id: 2, name: 'Страница 1', glyph: 'EB8A'},
    {id: 3, name: 'Каким ассортиментом будете торговать вы?', glyph: 'E6C8', child: true},
    {id: 4, name: 'Какие инструменты увеличения продаж вы хотите запустить?', glyph: 'E6C7', child: true},
    {id: 5, name: 'Страница 2', glyph: 'EB8A'},
    {id: 6, name: 'Дополнительные вопросы', glyph: 'EB89'},
    {id: 7, name: 'Итоговая', glyph: 'E92C'}
  ]
};
function decoratePages() {
  const list = document.querySelector('.lsb__list');
  sidebar.pages.forEach(page => {
    const row = [...list.querySelectorAll('[data-lsb-page]')].find(row => row.dataset.lsbPage === String(page.id));
    if (!row) return;
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    row.draggable = activeDemo === 'booking' && page.group === 'core';
    row.setAttribute('aria-label', page.name + (page.off ? ', скрыта' : '') + (page.required ? ', обязательный шаг' : ''));
    if (row.draggable) { row.setAttribute('aria-keyshortcuts', 'Alt+ArrowUp Alt+ArrowDown'); row.title = 'Перетащите внутри группы или нажмите Alt + ↑ / ↓'; }
    row.classList.toggle('scenario-page-child', !!page.child);
    if (page.glyph && !panelController && !row.querySelector('.scenario-page-icon')) {
      const icon = document.createElement('span');
      icon.className = 'scenario-page-icon' + (['EB8A','EB89'].includes(page.glyph) ? ' scenario-page-icon--arrow' : '');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = String.fromCodePoint(parseInt(page.glyph, 16));
      row.querySelector('.lsb__marker').after(icon);
    }
  });
  if (activeDemo === 'surveys' && !list.querySelector('.scenario-available')) {
    const caption = document.createElement('div'); caption.className = 'scenario-available'; caption.textContent = 'Также доступно';
    const available = document.createElement('div'); available.className = 'scenario-available-page';
    available.innerHTML = '<span class="scenario-page-icon" aria-hidden="true">&#xe92c;</span>Итоговая';
    list.append(caption, available);
  }
}
function drawScenarioPages(scenario, state) {
  sidebar.closeSettings();
  document.querySelector('.lsb__menu:not([hidden]) .lsb__menu-close')?.click();
  document.querySelector('.lsb__name').textContent = scenario === 'surveys' ? 'Вопросы' : 'Страницы';
  document.querySelector('.lsb__list').setAttribute('aria-label', scenario === 'surveys' ? 'Вопросы опроса' : 'Страницы '+(scenario === 'kiosk' ? 'киоска' : 'виджета'));
  sidebar.setPages(scenarioPages[scenario], state.page);
  sidebar.dock(!state.collapsed);
  decoratePages();
}
const demoStates = {};
let activeDemo = 'booking';
function selectDemo(scenario, variant) {
  if (panelController && (scenario === 'universal' || activeDemo === 'universal')) { panelController.selectScenario(scenario, variant); return; }
  if (!demoTitles[scenario]) return;
  demoStates[activeDemo] = {
    device: header.device, zoom: header.zoom,
    page: sidebar.active,
    collapsed: sidebar.floating
  };
  activeDemo = scenario;
  const state = demoStates[scenario] || {device: 'desktop', zoom: 100, page: scenario === 'booking' ? 3 : scenario === 'surveys' ? 2 : 1, collapsed: false};
  drawScenarioPages(scenario, state);
  header.update({
    title: demoTitles[scenario], icon: null,
    devices: scenario === 'kiosk' ? [{id:'desktop', label:'Вертикально', glyph:'E637'}, {id:'tablet', label:'Горизонтально', glyph:'EBF8'}] : true,
    centerZoom: scenario === 'kiosk', zoom: scenario === 'booking' ? state.zoom : false,
    publish: scenario === 'surveys',
    history: {undo: true, redo: true, reset: true, preview: scenario === 'kiosk' ? null : true, share: scenario === 'surveys' ? true : null, layout: scenario === 'kiosk' ? true : null, pages: scenario === 'kiosk' ? true : null}
  });
  header.setDevice(state.device);
  header.setZoom(state.zoom);
  feedback.classList.remove('visible');
  document.querySelector('#demo-stage').dataset.demo = scenario;
  drawRightTools(scenario);
  document.querySelector('.booking-preview').hidden = scenario !== 'booking';
  document.querySelector('.kiosk-preview').hidden = scenario !== 'kiosk';
  document.querySelector('.survey-preview').hidden = scenario !== 'surveys';
  if (scenario === 'booking') showBookingPage(sidebar.pages.findIndex(page => page.id === sidebar.active));
}
const demoFrame = DemoFrame.mount({
  stage: document.querySelector('#demo-stage'),
  responsive: true,
  width: 1600, height: 900,
  head: {title: 'Управление страницами в конструкторе', href: 'https://mariesmi.github.io/ui-kit/catalog/#demo-frame', status: 'В работе 20.11.26'},
  devices: [{id: 'monitor', icon: 'monitor', label: 'Монитор', size: '1600×900'}],
  device: 'monitor',
  scenarios: [
    {id: 'booking', title: 'Виджет записи'},
    {id: 'universal', title: 'Все механики панели', variants: [{id:'free',title:'Свободная структура'}, {id:'steps',title:'Пошаговый сценарий'}, {id:'plain',title:'Без групп'}, {id:'nested',title:'Страницы и вопросы'}]},
    {id: 'surveys', title: 'Опросы', disabled: true},
    {id: 'kiosk', title: 'Киоск', disabled: true}
  ],
  value: {scenario: 'booking'},
  onChange: ({scenario, variant}) => selectDemo(scenario, variant),
  team: [{label: 'Design', name: 'Пахтусова Ирина'}, {label: 'Develop'}]
});
const feedback = document.querySelector('#feedback');
let feedbackTimer;
function notify(message) {
  clearTimeout(feedbackTimer);
  feedback.textContent = message;
  feedback.classList.add('visible');
  feedbackTimer = setTimeout(() => feedback.classList.remove('visible'), 5000);
}
const header = BuilderHeader.mount(document.querySelector('#builder-header'), {
  title: 'Виджет записи',
  icon: null,
  mode: 'edit',
  history: {undo: true, redo: true, reset: true, preview: true},
  onSave() {
    try {
      localStorage.setItem(activeDemo + '-widget-header', JSON.stringify({device: header.device, zoom: header.zoom}));
      notify('Настройки шапки сохранены в этом браузере.');
    } catch { notify('Не удалось сохранить настройки в браузере.'); }
    return false;
  },
  onPreview() { notify('Предпросмотр появится на следующем этапе демо.'); },
  onClose() { notify('Вы находитесь в демо конструктора.'); }
});
try {
  const saved = JSON.parse(localStorage.getItem('booking-widget-header'));
  if (saved && ['desktop', 'tablet', 'more'].includes(saved.device)) header.setDevice(saved.device);
  if (saved && Number.isFinite(saved.zoom)) header.setZoom(saved.zoom);
} catch { /* Первый запуск или недоступное локальное хранилище. */ }
// Радиогруппа доступна с клавиатуры, как и остальные элементы шапки.
const group = document.querySelector('[role="radiogroup"]');
const sidebar = LeftSidebar.mount(document.querySelector('.lsb'), {
  pages: scenarioPages.booking,
  groups: [{id: 'start', name: 'Начало'}, {id: 'core', name: 'Параметры записи'}, {id: 'finish', name: 'Завершение'}],
  collapsible: true,
  showEmptyGroups: true,
  newPageDefaults: () => panelController ? panelController.newPageDefaults() : ({group: 'core'}),
  onSettings(win, page) { if (panelController) panelController.configureSettings(win, page); },
  onMenu(menu, page) { if (panelController) panelController.configurePageMenu(menu, page); },
  active: 3,
  onSelect(page) {
    if (panelController && activeDemo === 'universal') { panelController.showPage(page); return; }
    if (activeDemo === 'booking') showBookingPage(sidebar.pages.findIndex(item => item.id === page.id));
  },
  onChange(pages) {
    if (panelController) panelController.changed(pages);
    scenarioPages[activeDemo] = pages;
    decoratePages();
    if (activeDemo === 'booking') showBookingPage(pages.findIndex(page => page.id === sidebar.active));
  },
  confirmDelete(page, remove) {
    PanelMessages.confirm('Удалить '+(page.question?'вопрос':'страницу')+' «' + page.name + '»?', page.question?'Вопрос будет удалён.':'Страница и её содержимое будут удалены.').then(ok => { if (ok) remove(); });
  },
  canAction(action, page) {
    if (panelController) return panelController.canAction(action, page);
    if (activeDemo !== 'booking') return true;
    if (action === 'home') return false;
    return !(page?.required && ['hide', 'delete', 'duplicate'].includes(action));
  },
  onAction(action, page) {
    if (panelController && panelController.action(action, page) === false) return false;
    if (activeDemo === 'booking' && ((page?.required && ['hide','delete'].includes(action)) || action === 'home')) {
      notify('Обязательные шаги и их порядок в виджете записи фиксированы.');
      return false;
    }
  }
});
decoratePages();
// Preserve scenario icons and keyboard access after library-driven row renders.
new MutationObserver(decoratePages).observe(document.querySelector('.lsb__list'), {childList: true});
document.querySelectorAll('.rsb button').forEach(button => button.addEventListener('click', () => notify('Панели инструментов добавим на следующем этапе демо.')));
group.addEventListener('keydown', event => {
  const buttons = [...group.querySelectorAll('[role="radio"]')];
  const current = buttons.indexOf(document.activeElement);
  if (current < 0) return;
  let next;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % buttons.length;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current + buttons.length - 1) % buttons.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = buttons.length - 1;
  if (next === undefined) return;
  event.preventDefault();
  buttons[next].click();
  buttons[next].focus();
});

document.querySelector('.lsb__list').addEventListener('keydown', event => {
  const row = event.target.closest('.lsb__page');
  if (!row || event.target !== row || !['Enter', ' '].includes(event.key)) return;
  event.preventDefault(); row.click();
});

// Fit only the static Axure canvas; editor controls stay at their original size.
const preview = document.querySelector('.booking-preview');
const previewObserver = new ResizeObserver(() => {
  if (preview.hidden || !preview.clientWidth) return;
  const available = preview.clientWidth - parseFloat(getComputedStyle(preview).paddingLeft);
  preview.style.setProperty('--preview-scale', Math.min(1, available / 874));
});
previewObserver.observe(preview);
