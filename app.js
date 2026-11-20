'use strict';
const demoTitles = {booking: 'Виджет записи', surveys: 'Опросы', kiosk: 'Киоск'};
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
  const state = demoStates[scenario] || {device: 'desktop', zoom: 100, page: 2, collapsed: false};
  header.setTitle(demoTitles[scenario]);
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
  document.querySelector('.booking-preview').hidden = scenario !== 'booking';
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
  mode: 'edit',
  history: {undo: false, redo: false, reset: false, preview: true},
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
document.querySelectorAll('.lsb__page').forEach(button => button.addEventListener('click', event => {
  if (event.target.closest('.lsb__cmds')) { notify('Действия со страницами добавим на следующем этапе демо.'); return; }
  document.querySelectorAll('.lsb__page').forEach(item => {
    item.classList.toggle('is-active', item === button);
    if (item === button) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  if (activeDemo === 'booking') showBookingPage([...document.querySelectorAll('.lsb__page')].indexOf(button));
}));
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
document.querySelectorAll('.lsb__page').forEach(row => row.addEventListener('keydown', event => {
  if (event.target !== row || !['Enter', ' '].includes(event.key)) return;
  event.preventDefault(); row.click();
}));

// Fit only the static Axure canvas; editor controls stay at their original size.
const preview = document.querySelector('.booking-preview');
const previewObserver = new ResizeObserver(() => {
  if (preview.hidden || !preview.clientWidth) return;
  const available = preview.clientWidth - parseFloat(getComputedStyle(preview).paddingLeft);
  preview.style.setProperty('--preview-scale', Math.min(1, available / 874));
});
previewObserver.observe(preview);
