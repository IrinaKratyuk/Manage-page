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
const demoTitles = {booking: 'Виджет записи', surveys: 'Мой опрос', kiosk: 'Киоск'};
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
  const page = bookingPages[index];
  if (!page) return;
  const image = document.querySelector('#booking-page');
  image.src = 'axure/' + page.image;
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
const originalBookingList = document.querySelector('.lsb__list').innerHTML;
function scenarioPage(name, glyph, child = false) {
  return '<div class="lsb__page'+(child?' scenario-page-child':'')+'" role="button" tabindex="0"><span class="lsb__marker"></span>'+(glyph?'<span class="scenario-page-icon'+(['EB8A','EB89'].includes(glyph)?' scenario-page-icon--arrow':'')+'" aria-hidden="true">&#x'+glyph+';</span>':'')+'<span class="lsb__page-name">'+name+'</span></div>';
}
function drawScenarioPages(scenario) {
  const list = document.querySelector('.lsb__list');
  document.querySelector('.lsb__name').textContent = scenario === 'surveys' ? 'Вопросы' : 'Страницы';
  list.setAttribute('aria-label', scenario === 'surveys' ? 'Вопросы опроса' : 'Страницы '+(scenario === 'kiosk' ? 'киоска' : 'виджета'));
  if (scenario === 'booking') { list.innerHTML = originalBookingList; return; }
  if (scenario === 'kiosk') {
    list.innerHTML = ['Главная','Каталог','Карточка товара','Финальный экран'].map(name => scenarioPage(name)).join('');
    return;
  }
  list.innerHTML = scenarioPage('Приветствие','E656') + scenarioPage('Страница 1','EB8A') +
    scenarioPage('Каким ассортиментом будете торговать вы?','E6C8',true) +
    scenarioPage('Какие инструменты увеличения продаж вы хотите запустить?','E6C7',true) +
    scenarioPage('Страница 2','EB8A') + scenarioPage('Дополнительные вопросы','EB89') +
    scenarioPage('Итоговая','E92C') + '<div class="scenario-available">Также доступно</div><div class="scenario-available-page"><span class="scenario-page-icon" aria-hidden="true">&#xe92c;</span>Итоговая</div>';
}
const demoStates = {};
let activeDemo = 'booking';
function selectDemo(scenario) {
  if (!demoTitles[scenario]) return;
  demoStates[activeDemo] = {
    device: header.device, zoom: header.zoom,
    page: [...document.querySelectorAll('.lsb__page')].findIndex(item => item.classList.contains('is-active')),
    collapsed: pagesPanel.hidden
  };
  activeDemo = scenario;
  const state = demoStates[scenario] || {device: 'desktop', zoom: 100, page: scenario === 'booking' ? 2 : scenario === 'surveys' ? 1 : 0, collapsed: false};
  drawScenarioPages(scenario);
  header.update({
    title: demoTitles[scenario], icon: null,
    devices: scenario === 'kiosk' ? [{id:'desktop', label:'Вертикально', glyph:'E637'}, {id:'tablet', label:'Горизонтально', glyph:'EBF8'}] : true,
    centerZoom: scenario === 'kiosk', zoom: scenario === 'booking' ? state.zoom : false,
    publish: scenario === 'surveys',
    history: {undo: true, redo: true, reset: true, preview: scenario === 'kiosk' ? null : true, share: scenario === 'surveys' ? true : null, layout: scenario === 'kiosk' ? true : null, pages: scenario === 'kiosk' ? true : null}
  });
  header.setDevice(state.device);
  header.setZoom(state.zoom);
  document.querySelectorAll('.lsb__page').forEach((item, index) => {
    item.classList.toggle('is-active', index === state.page);
    if (index === state.page) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  pagesPanel.hidden = state.collapsed;
  reopen.hidden = !state.collapsed;
  feedback.classList.remove('visible');
  document.querySelector('#demo-stage').dataset.demo = scenario;
  drawRightTools(scenario);
  document.querySelector('.booking-preview').hidden = scenario !== 'booking';
  document.querySelector('.kiosk-preview').hidden = scenario !== 'kiosk';
  document.querySelector('.survey-preview').hidden = scenario !== 'surveys';
  if (scenario === 'booking') showBookingPage(state.page);
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
    {id: 'surveys', title: 'Опросы'},
    {id: 'kiosk', title: 'Киоск'}
  ],
  value: {scenario: 'booking'},
  onChange: ({scenario}) => selectDemo(scenario),
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
document.querySelector('.lsb__list').addEventListener('click', event => {
  const button = event.target.closest('.lsb__page');
  if (!button) return;
  if (event.target.closest('.lsb__cmds')) { notify('Действия со страницами добавим на следующем этапе демо.'); return; }
  document.querySelectorAll('.lsb__page').forEach(item => {
    item.classList.toggle('is-active', item === button);
    if (item === button) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  if (activeDemo === 'booking') showBookingPage([...document.querySelectorAll('.lsb__page')].indexOf(button));
});
const pagesPanel = document.querySelector('.lsb__panel');
const reopen = document.querySelector('.pages-reopen');
document.querySelector('.lsb__toggle button').addEventListener('click', () => {
  pagesPanel.hidden = true; reopen.hidden = false; reopen.focus();
});
reopen.addEventListener('click', () => {
  pagesPanel.hidden = false; reopen.hidden = true;
  document.querySelector('.lsb__toggle button').focus();
});
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

document.querySelector('[data-lsb-add]').addEventListener('click', () => notify('Добавление страниц настроим на следующем этапе демо.'));
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
