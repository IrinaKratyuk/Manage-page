'use strict';
panelController = (() => {
  const root = document.querySelector('.lsb');
  const list = root.querySelector('.lsb__list');
  const bookGroups = [
    {id:'start',name:'Начало',fixed:true,protected:true,add:false,sort:false,accept:false},
    {id:'core',name:'Параметры записи',fixed:true,add:true,sort:true,accept:true,leave:false},
    {id:'finish',name:'Завершение',fixed:true,protected:true,add:false,sort:false,accept:false}
  ];
  const initial = () => ({
    groups:[
      {id:'main',name:'Основные страницы',sort:true,add:true,accept:true,leave:true},
      {id:'extra',name:'Дополнительные',sort:true,add:true,accept:true,leave:true},
      {id:'locked',name:'Закреплённая группа',locked:true,sort:true,add:true,accept:true,leave:true},
      {id:'system',name:'Системные',fixed:true,protected:true,sort:false,add:false,accept:false,leave:false}
    ],
    pages:[
      {id:101,name:'Главная',group:'main',home:true},
      {id:102,name:'Каталог',group:'main'},
      {id:103,name:'О продукте',group:'main'},
      {id:104,name:'Контакты',group:'extra'},
      {id:105,name:'Акция',group:'extra',off:true},
      {id:106,name:'Условия обслуживания',group:'locked'},
      {id:107,name:'Политика конфиденциальности',group:'locked'},
      {id:108,name:'Страница не найдена — 404',group:'system',system:true},
      {id:109,name:'Ошибка сервиса',group:'system',system:true}
    ],active:101,folded:[]
  });
  const models = {booking:{pages:sidebar.pages,groups:bookGroups,active:sidebar.active,folded:[]}};
  let variant='free', modelKey='booking', pendingGroup=null, pendingSurvey=null, drag=null, drop=null, denied='';
  const preview=document.createElement('section'); preview.className='universal-preview';preview.hidden=true;
  preview.innerHTML='<span class="pe__label" data-demo-mode></span><h2></h2><p data-demo-status></p><p data-demo-explanation></p>';
  document.querySelector('main').append(preview);
  const marker=document.createElement('div');marker.className='lsb__insert';marker.hidden=true;root.append(marker);
  const menu=root.querySelector('.lsb__menu').cloneNode(true);menu.classList.add('lsb__group-menu');menu.hidden=true;root.append(menu);
  const pageMenu=root.querySelector('.lsb__menu');
  const notes=document.createElement('div');notes.className='df-options panel-demo-notes';notes.hidden=true;
  notes.innerHTML='<p>Условный продукт: здесь можно проверить возможности общей панели.</p><p>Замок справа обозначает ограничения. Нажмите на него, чтобы узнать, какие действия недоступны.</p><p>Перетаскивайте страницы и группы мышью. Alt + ↑ / ↓ — перемещение, Shift + F10 — меню.</p><p>Закрепление и удаление групп показаны как варианты для обсуждения.</p><button class="btn btn--filled btn--style-pale btn--size-m" type="button">Сбросить пример</button>';
  demoFrame.panel.append(notes);
  notes.querySelector('button').onclick=()=>{delete models[modelKey];apply('universal',variant);};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const current=()=>models[modelKey];
  const groupFor=id=>current().groups.find(g=>g.id===id);
  const pageFor=id=>sidebar.pages.find(p=>String(p.id)===String(id));
  const protect=p=>p?.system || groupFor(p?.group)?.protected;
  const reason=g=>g.protected?'Состав и порядок заданы приложением. Доступно оформление страниц.':g.fixed?'Положение группы задано приложением.':g.locked?'Положение закреплено. Страницы внутри можно изменять.':'';
  function makeModel(type){
    const m=initial();
    if(type==='plain'){m.groups=[];m.pages=m.pages.slice(0,5).map(p=>({...p,group:null}));}
    if(type==='steps'){
      m.groups=[{id:'begin',name:'Начало',fixed:true,protected:true,add:false,sort:false,accept:false},{id:'choose',name:'Выбор',fixed:true,sort:true,add:true,accept:true,leave:false},{id:'end',name:'Завершение',fixed:true,protected:true,add:false,sort:false,accept:false},{id:'system',name:'Системные',fixed:true,protected:true,add:false,sort:false,accept:false}];
      m.pages=[{id:201,name:'Приветствие',group:'begin',required:true},{id:202,name:'Выбор варианта',group:'choose'},{id:203,name:'Дополнительные параметры',group:'choose'},{id:204,name:'Подтверждение',group:'end',required:true},{id:205,name:'Ошибка',group:'system',system:true}];m.active=202;
    }
    if(type==='nested'){
      m.groups=[
        {id:'survey-start',name:'Начало',fixed:true,structural:true,add:false,sort:false,accept:false,leave:false},
        {id:'survey-main',name:'Опрос',structural:true,sort:true,add:true,accept:true,leave:false},
        {id:'survey-end',name:'Завершение',fixed:true,structural:true,add:false,sort:false,accept:false,leave:false}
      ];
      m.pages=[
        {id:300,name:'Приветствие',group:'survey-start',endpoint:true,glyph:'E656'},
        {id:301,name:'Страница 1',group:'survey-main',container:true},
        {id:311,name:'Каким ассортиментом будете торговать вы?',group:'survey-main',parentId:301,question:true,questionType:'single',questionIcon:'assets/question-single.svg'},
        {id:312,name:'Какие инструменты увеличения продаж вы хотите запустить?',group:'survey-main',parentId:301,question:true,questionType:'multiple',questionIcon:'assets/question-multiple.svg'},
        {id:302,name:'Страница 2',group:'survey-main',container:true},
        {id:313,name:'Какой формат работы вам подходит?',group:'survey-main',parentId:302,question:true,questionType:'single',questionIcon:'assets/question-single.svg'},
        {id:304,name:'Итоговая',group:'survey-end',endpoint:true,glyph:'E92C'}
      ];m.active=301;
    }
    return m;
  }
  function save(){const m=current();if(!m)return;m.pages=sidebar.pages;m.groups=sidebar.groups;m.active=sidebar.active;m.folded=sidebar.collapsedGroups;}
  function apply(scenario,type){
    menu.hidden=true;sidebar.closeSettings();pendingGroup=null;pendingSurvey=null;
    activeDemo=scenario;variant=type||'free';modelKey=scenario==='booking'?'booking':'universal-'+variant;
    if(!models[modelKey])models[modelKey]=makeModel(variant);
    const m=current();sidebar.setGroups(m.groups,m.folded);sidebar.setPages(m.pages,m.active);
    root.querySelector('.lsb__name').textContent='Страницы';
    document.querySelector('.booking-preview').hidden=scenario!=='booking';
    document.querySelector('.kiosk-preview').hidden=true;document.querySelector('.survey-preview').hidden=true;
    preview.hidden=scenario!=='universal';notes.hidden=scenario!=='universal';
    header.update({title:scenario==='booking'?'Виджет записи':'Условный продукт'});
    document.querySelector('#demo-stage').dataset.demo=scenario;
    if(scenario==='booking')showBookingPage(sidebar.pages.findIndex(p=>p.id===sidebar.active));else showPage(pageFor(sidebar.active));
    decorate();
  }
  function showPage(p){
    if(!p)return;
    preview.querySelector('h2').textContent=p.name;
    preview.querySelector('[data-demo-mode]').textContent=({free:'Свободная структура',steps:'Пошаговый сценарий',plain:'Страницы без групп',nested:'Страницы и вопросы'})[variant];
    const hidden=p.off||pageFor(p.parentId)?.off;
    preview.querySelector('[data-demo-status]').textContent=hidden?'Скрыта для посетителей, доступна для редактирования.':p.system?'Системная страница. Можно настраивать оформление.':p.home?'Главная страница.':p.question?'Вопрос: '+(p.questionType==='multiple'?'несколько вариантов ответа.':'один вариант ответа.'):p.container?'Страница опроса открыта для редактирования.':'Страница открыта для редактирования.';
    preview.querySelector('[data-demo-explanation]').textContent=variant==='steps'?'Порядок страниц задаёт последовательность шагов. Скрытые шаги пропускаются.':variant==='nested'?'Начало, опрос и завершение — группы. Страницы можно настраивать и скрывать, вопросы находятся внутри страниц. Положение начальной и конечной групп фиксировано.':'Порядок в панели помогает организовать страницы. Скрытая страница недоступна посетителям, в том числе по прямой ссылке.';
  }
  function allowed(action,p){
    if(activeDemo==='universal'&&variant==='nested'&&p){
      if(p.endpoint&&['move','delete','duplicate'].includes(action))return false;
      if(p.question&&['home','link','icon'].includes(action))return false;
      if(p.container&&action==='delete'&&sidebar.pages.filter(x=>x.container).length===1)return false;
    }
    if(action==='add')return !current().groups.length||current().groups.some(g=>g.add);
    if(action==='home')return activeDemo==='universal'&&['free','plain'].includes(variant)&&!protect(p)&&!p?.off&&!p?.home;
    if(protect(p)&&['hide','delete','duplicate','move'].includes(action))return false;
    if(p?.system&&action==='rename')return false;
    if(p?.required&&['hide','delete','duplicate','move'].includes(action))return false;
    if(p?.home&&['hide','delete'].includes(action))return false;
    if(action==='duplicate')return !p?.group||!!groupFor(p.group)?.add;
    return true;
  }
  function changed(pages){
    if(!current())return;
    current().pages=pages;
    queueMicrotask(decorate);
    if(activeDemo==='universal')showPage(pages.find(p=>p.id===sidebar.active));
  }
  function decorate(){
    if(!current())return;
    const anyIcons=sidebar.pages.some(p=>p.glyph||p.questionIcon||p.container);
    list.classList.toggle('has-page-icons',anyIcons);
    list.querySelectorAll('[data-lsb-page]').forEach(row=>{
      const p=pageFor(row.dataset.lsbPage);if(!p)return;
      row.tabIndex=0;row.setAttribute('role','button');
      row.draggable=allowed('move',p)&&(!p.group||groupFor(p.group)?.sort);
      if(activeDemo==='universal'&&variant==='nested')row.classList.add('lsb__page--survey');
      const parent=pageFor(p.parentId);
      row.classList.toggle('is-off',!!(p.off||parent?.off));
      row.setAttribute('aria-label',p.name+(p.home?', главная':'')+(p.off||parent?.off?', скрыта':'')+(protect(p)||p.required?', защищена':''));
      row.classList.toggle('lsb__page--question',!!p.question);
      row.title=p.home?'Главная страница':protect(p)?'Ограничения заданы приложением':row.draggable?(p.question?'Перетащите вопрос. Alt + ↑ / ↓ — перемещение, Shift + F10 — меню.':'Перетащите страницу. Alt + ↑ / ↓ — перемещение, Shift + F10 — меню.') : '';
      let icon=row.querySelector('.lsb__page-icon');
      if(anyIcons&&!p.container&&!icon){icon=document.createElement('span');icon.className='lsb__page-icon';icon.setAttribute('aria-hidden','true');row.querySelector('.lsb__marker').after(icon);}
      if((!anyIcons||p.container)&&icon){icon.remove();icon=null;}
      if(icon){
        if(p.questionIcon){
          if(icon.dataset.src!==p.questionIcon){const img=document.createElement('img');img.src=p.questionIcon;img.alt=p.questionType==='multiple'?'Несколько вариантов ответа':'Один вариант ответа';img.width=16;img.height=16;icon.replaceChildren(img);icon.dataset.src=p.questionIcon;}
          icon.removeAttribute('aria-hidden');
        }else icon.textContent=p.glyph?String.fromCodePoint(parseInt(p.glyph,16)):'';
      }
      let status=row.querySelector('.lsb__page-status');
      const group=groupFor(p.group);
      const inheritedLock=group&&(group.protected||group.fixed||group.locked);
      const restricted=!!(protect(p)||p.required)&&!inheritedLock;
      if(p.home||restricted){
        if(!status){status=document.createElement('span');status.className='lsb__page-status';row.append(status);}
        const kind=p.home?'home':'lock';
        if(status.dataset.kind!==kind){
          status.dataset.kind=kind;status.replaceChildren();
          const item=document.createElement('span');
          item.className='lsb__status-icon';item.textContent=p.home?'\ue64c':'\ue647';
          item.title=p.home?'Главная страница':'Ограничения заданы приложением. Нажмите, чтобы узнать подробнее.';
          if(p.home){item.setAttribute('role','img');item.setAttribute('aria-label','Главная страница');}
          else{item.dataset.pageRestriction=p.id;item.setAttribute('role','button');item.tabIndex=0;item.setAttribute('aria-label','Почему страница '+p.name+' ограничена');item.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();item.click();}};}
          status.append(item);
        }
      }else if(status)status.remove();
      let controls=row.querySelector('.lsb__row-controls');
      if(!controls){controls=document.createElement('span');controls.className='lsb__row-controls';row.append(controls);}
      const commands=row.querySelector('.lsb__cmds');if(commands&&commands.parentElement!==controls)controls.append(commands);
      if(status&&status.isConnected&&status.parentElement!==controls)controls.append(status);
      // Preserve supplied icons without showing a second copy.
      row.querySelector('.scenario-page-icon')?.remove();
    });
    list.querySelectorAll('[data-lsb-group]').forEach(h=>{
      const g=groupFor(h.dataset.lsbGroup);if(!g)return;
      h.hidden=false;
      h.draggable=!g.fixed&&!g.locked&&!g.protected&&!g.structural;
      h.title=reason(g)||(g.structural?'Группа объединяет страницы опроса.':'Перетащите группу вместе со страницами. Alt + ↑ / ↓ — перемещение.');
      h.setAttribute('aria-label',g.name+(g.protected?', защищена':g.fixed||g.locked?', закреплена':''));
      {
        if((g.protected||g.fixed||g.locked)&&!h.querySelector('.lsb__group-state')){const state=document.createElement('span');state.className='lsb__group-state';state.textContent='\ue647';state.title=reason(g);state.setAttribute('role','button');state.tabIndex=0;state.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();state.click();}};state.setAttribute('aria-label','Почему группа '+g.name+' ограничена');h.append(state);}
        if(groupItems(g).length===0){h.querySelector('.lsb__group-actions')?.remove();return;}
        if(h.querySelector('.lsb__group-actions'))return;
        const actions=document.createElement('span');actions.className='lsb__group-actions';
        actions.innerHTML='<button type="button" class="btn btn--link btn--style-label btn--size-m btn--icon" data-group-menu aria-label="Действия группы '+esc(g.name)+'"><span class="btn__icon" aria-hidden="true">&#xe9d9;</span></button>';
        h.append(actions);
      }
    });
  }
  // Same menu component for page, group, destination and icon commands.
  function openMenu(title,items,anchor){
    menu.replaceChildren();const top=document.createElement('div');top.className='lsb__menu-top';
    const caption=document.createElement('div');caption.className='lsb__menu-head';caption.textContent=title;
    const close=document.createElement('button');close.type='button';close.className='close-button close-button--link-button lsb__menu-close';close.setAttribute('aria-label','Закрыть');close.onclick=()=>menu.hidden=true;top.append(caption,close);menu.append(top);
    items.forEach(({label,run})=>{const b=document.createElement('button');b.type='button';b.className='lsb__menu-item';b.setAttribute('role','menuitem');const t=document.createElement('span');t.className='lsb__menu-text';t.textContent=label;b.append(t);b.onclick=()=>{menu.hidden=true;run();};menu.append(b);});
    menu.hidden=false;const r=anchor.getBoundingClientRect(),base=root.getBoundingClientRect();
    menu.style.left=Math.max(0,r.right-base.left-menu.offsetWidth)+'px';menu.style.top=Math.max(0,Math.min(r.top-base.top,root.clientHeight-menu.offsetHeight))+'px';
  }
  function groupItems(g){
    const items=[];
    if(!g.fixed&&!g.protected&&!g.structural){
      items.push({label:g.locked?'Разрешить перемещение':'Закрепить положение',run:()=>{g.locked=!g.locked;sync();}});
      if(activeDemo==='universal'){
        if(!sidebar.pages.some(p=>p.group===g.id&&(p.home||p.required)))items.push({label:'Удалить группу',run:()=>deleteGroup(g)});
      }
    }
    return items;
  }
  function sync(){const active=sidebar.active;sidebar.setGroups(current().groups,sidebar.collapsedGroups);sidebar.setPages(current().pages,active);decorate();save();}
  function renameGroup(g){
    const h=list.querySelector('[data-lsb-group="'+g.id+'"]');const name=h.querySelector('.lsb__group-name');const input=document.createElement('input');input.className='lsb__group-input';input.value=g.name;input.setAttribute('aria-label','Название группы');name.replaceWith(input);input.focus();input.select();
    input.onclick=e=>e.stopPropagation();let done=false;const finish=keep=>{if(done)return;done=true;if(keep&&input.value.trim())g.name=input.value.trim();sync();};
    input.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();finish(true);}if(e.key==='Escape')finish(false);};input.onblur=()=>finish(true);
  }
  async function deleteGroup(g){
    if(g.fixed||g.protected||sidebar.pages.some(p=>p.group===g.id&&(p.home||p.required)))return;
    const title='Удалить группу «'+g.name+'»?';
    const comment='Все страницы этой группы будут удалены.';
    if(!await PanelMessages.confirm(title,comment))return;
    current().pages=sidebar.pages.filter(p=>p.group!==g.id);current().groups=current().groups.filter(x=>x.id!==g.id);
    if(!current().pages.some(p=>p.id===sidebar.active))current().active=current().pages[0]?.id;
    sidebar.setGroups(current().groups,sidebar.collapsedGroups);sidebar.setPages(current().pages,current().active);decorate();showPage(pageFor(sidebar.active));save();
  }
  function canMoveGroup(id,delta){const gs=current().groups,at=gs.findIndex(g=>g.id===id),g=gs[at],other=gs[at+delta];return !!g&&!!other&&!g.fixed&&!g.locked&&!g.protected&&!other.fixed&&!other.locked&&!other.protected;}
  function moveGroup(id,delta){if(!canMoveGroup(id,delta))return false;const gs=current().groups,at=gs.findIndex(g=>g.id===id);[gs[at],gs[at+delta]]=[gs[at+delta],gs[at]];sync();notify('Группа перемещена вместе со страницами.');return true;}
  function destinationAllowed(p,gid){
    if(!allowed('move',p))return false;
    const from=groupFor(p.group),to=groupFor(gid);
    if(p.group===gid)return !to||!!to.sort;
    return (!from||from.leave!==false)&&!!to&&!!to.accept&&!to.protected;
  }
  function movePage(id,gid,targetId,after,parentId){
    const pages=sidebar.pages,p=pages.find(p=>p.id===id);
    const target=pages.find(p=>p.id===targetId);
    if(!p||!destinationAllowed(p,gid)){notify('Перенос запрещён правилами группы.');return false;}
    if(target===p)return false;
    if(p.question){
      parentId=parentId??(target?.question?target.parentId:target?.container?target.id:p.parentId);
      const parent=pages.find(x=>x.id===parentId&&x.container);
      if(!parent||parent.group!==gid)return false;
    }else if(target?.question)return false;
    const ids=new Set([p.id]);let count;
    do{count=ids.size;pages.forEach(x=>{if(ids.has(x.parentId))ids.add(x.id);});}while(count!==ids.size);
    const block=pages.filter(x=>ids.has(x.id)),rest=pages.filter(x=>!ids.has(x.id));
    block.forEach(x=>{x.group=gid;});if(p.question)p.parentId=parentId;
    let at;
    if(target&&target!==p){
      if(p.question&&target.container)at=rest.indexOf(target)+1;
      else {at=rest.indexOf(target)+(after?1:0);if(after&&!p.question){while(at<rest.length&&rest[at].parentId===target.id)at++;}}
    }else{
      const same=rest.filter(x=>p.question?x.parentId===parentId:x.group===gid);
      at=same.length?rest.indexOf(same.at(-1))+1:rest.length;
      if(p.question&&!same.length)at=rest.findIndex(x=>x.id===parentId)+1;
    }
    rest.splice(at,0,...block);current().pages=rest;
    const parent=rest.find(x=>x.id===p.parentId);if(parent)parent.collapsed=false;
    if(sidebar.collapsedGroups.includes(gid))sidebar.toggleGroup(gid);
    sidebar.setPages(rest,sidebar.active);decorate();save();notify(p.question?'Вопрос перемещён.':'Страница перемещена.');return true;
  }
  function shiftPage(id,delta){
    const pages=sidebar.pages,p=pages.find(p=>p.id===id);
    const same=pages.filter(x=>x.group===p.group&&x.parentId===p.parentId),at=same.indexOf(p),target=same[at+delta];
    return target&&movePage(id,p.group,target.id,delta>0,p.parentId);
  }
  function pageDestinations(p,anchor){
    if(p.question){const parents=sidebar.pages.filter(x=>x.container&&x.id!==p.parentId);openMenu('Переместить на страницу',parents.map(x=>({label:x.name,run:()=>movePage(p.id,x.group,undefined,false,x.id)})),anchor);return;}
    const gs=current().groups.filter(g=>destinationAllowed(p,g.id)&&g.id!==p.group);
    openMenu('Переместить в',gs.map(g=>({label:g.name,run:()=>movePage(p.id,g.id)})),anchor);
  }
  function iconMenu(p,anchor){openMenu('Иконка страницы',[['Без иконки',null],['Дом','E64C'],['Настройки','E61B'],['Ссылка','E6A7']].map(([label,glyph])=>({label,run:()=>{const pages=sidebar.pages;pages.find(x=>x.id===p.id).glyph=glyph;sidebar.setPages(pages,sidebar.active);changed(pages);decorate();}})),anchor);}
  function configurePageMenu(m,p){
    m.querySelectorAll('[data-panel-extra]').forEach(n=>n.remove());
  }

  function newPageDefaults(){
    if(activeDemo==='universal'&&variant==='nested')return pendingSurvey||{group:'survey-main',container:true};
    return {group:current().groups.find(g=>g.id===pendingGroup&&g.add)?.id||current().groups.find(g=>g.add)?.id||null};
  }
  function configureSettings(win,page){
    const entity=page||newPageDefaults(),question=!!entity.question;
    win.querySelectorAll('.pe__body>.pe__card,.pe__chips').forEach(n=>n.hidden=question);
    if(!question){win.querySelector('[data-pe-row="seo"]').hidden=!(page&&page.seo!=null);const chips=win.querySelector('.pe__chips');if(chips)chips.hidden=!!(page&&page.seo!=null);}
    let summary=win.querySelector('[data-question-summary]');
    if(question){
      if(!summary){summary=document.createElement('div');summary.className='pe__card';summary.dataset.questionSummary='';win.querySelector('.pe__body').prepend(summary);}
      summary.hidden=false;summary.textContent='Тип вопроса: '+(entity.questionType==='multiple'?'несколько вариантов ответа':'один вариант ответа');
      win.querySelector('.pe__name-input').placeholder='Новый вопрос';
    }else if(summary)summary.hidden=true;
    win.querySelector('.pe__name-input').setAttribute('aria-label',question?'Название вопроса':'Название страницы');
    win.setAttribute('aria-label',question?'Настройки вопроса':page?'Настройки страницы':'Новая страница');
  }
  function addSurveyEntity(kind){
    const anchor=root.querySelector('[data-lsb-add]');
    if(kind==='page'){pendingSurvey={group:'survey-main',container:true};sidebar.openSettings();return;}
    const parents=sidebar.pages.filter(p=>p.container);
    const choose=parent=>openMenu('Тип вопроса',[{label:'Один вариант ответа',run:()=>createQuestion(parent,'single')},{label:'Несколько вариантов ответа',run:()=>createQuestion(parent,'multiple')}],anchor);
    function createQuestion(parent,type){pendingSurvey={group:parent.group,parentId:parent.id,question:true,questionType:type,questionIcon:'assets/question-'+type+'.svg'};sidebar.openSettings();}
    if(parents.length===1)choose(parents[0]);else openMenu('Добавить вопрос на страницу',parents.map(parent=>({label:parent.name,run:()=>choose(parent)})),anchor);
  }
  function action(name,p){
    if(name==='add'&&activeDemo==='universal'){
      const gs=current().groups.filter(g=>g.add);
      const create=g=>{pendingSurvey=null;pendingGroup=g?.id||null;sidebar.createPage({group:pendingGroup,...(variant==='nested'?{container:true}:{} )});};
      const selectedGroup=pageFor(sidebar.active)?.group;
      create(gs.find(g=>g.id===selectedGroup)||gs[0]);
      return false;
    }
  }

  root.addEventListener('click',e=>{
    const pageState=e.target.closest('[data-page-restriction]');
    if(pageState){e.preventDefault();e.stopPropagation();const p=pageFor(pageState.dataset.pageRestriction);PanelMessages.info('Страница «'+p.name+'»','Страницу нельзя скрыть, удалить или переместить. Можно настраивать её оформление.');return;}
    const state=e.target.closest('.lsb__group-state');
    if(state){e.preventDefault();e.stopPropagation();const g=groupFor(state.closest('[data-lsb-group]').dataset.lsbGroup);PanelMessages.info('Группа «'+g.name+'»',reason(g));return;}
    const b=e.target.closest('[data-group-menu]');if(!b)return;
    e.preventDefault();e.stopPropagation();const g=groupFor(b.closest('[data-lsb-group]').dataset.lsbGroup);openMenu('Группа',groupItems(g),b);
  },true);
  root.addEventListener('keydown',e=>{
    if(e.target.matches('.lsb__group-state')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.click();return;}
    const h=e.target.closest('[data-lsb-group]');
    if(h&&e.target===h&&e.shiftKey&&e.key==='F10'){e.preventDefault();e.stopImmediatePropagation();const items=groupItems(groupFor(h.dataset.lsbGroup));if(items.length>0){openMenu('Группа',items,h);menu.querySelector('[role="menuitem"]')?.focus();}return;}
    if(e.altKey&&['ArrowUp','ArrowDown'].includes(e.key)&&!e.target.matches('input,textarea')){
      const delta=e.key==='ArrowDown'?1:-1;const row=e.target.closest('[data-lsb-page]');
      if(h){e.preventDefault();moveGroup(h.dataset.lsbGroup,delta);list.querySelector('[data-lsb-group="'+h.dataset.lsbGroup+'"]')?.focus();}
      else if(row){e.preventDefault();shiftPage(pageFor(row.dataset.lsbPage).id,delta);list.querySelector('[data-lsb-page="'+row.dataset.lsbPage+'"]')?.focus();}
    }
    if(!menu.hidden&&menu.contains(e.target)){
      if(e.key==='Escape'){menu.hidden=true;e.stopPropagation();}
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...menu.querySelectorAll('[role="menuitem"]')],at=items.indexOf(document.activeElement),n=e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[n]?.focus();}
    }
  });
  document.addEventListener('mousedown',e=>{if(!menu.contains(e.target)&&!e.target.closest('[data-group-menu],[data-lsb-add]'))menu.hidden=true;});
  function cleanDrag(){drag=null;drop=null;denied='';marker.hidden=true;}
  list.addEventListener('dragstart',e=>{
    if(e.target.closest('button,input')){e.preventDefault();return;}
    const row=e.target.closest('[data-lsb-page]'),h=e.target.closest('[data-lsb-group]');
    if(row?.draggable)drag={type:'page',id:pageFor(row.dataset.lsbPage).id};else if(h?.draggable)drag={type:'group',id:h.dataset.lsbGroup};else{e.preventDefault();return;}
    pageMenu.hidden=true;menu.hidden=true;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',drag.type+':'+drag.id);
  });
  function onDragOver(e){
    if(!drag)return;e.preventDefault();
    let row=e.target.closest('[data-lsb-page]'),h=e.target.closest('[data-lsb-group]');
    if(!row&&!h){
      const nodes=[...list.querySelectorAll('[data-lsb-page],[data-lsb-group]')].filter(n=>!n.hidden);
      const distance=n=>{const r=n.getBoundingClientRect();return e.clientY<r.top?r.top-e.clientY:e.clientY>r.bottom?e.clientY-r.bottom:0;};
      const nearest=nodes.sort((a,b)=>distance(a)-distance(b))[0];
      if(nearest?.hasAttribute('data-lsb-page'))row=nearest;else h=nearest;
    }
    let anchor=row||h,ok=false;
    if(drag.type==='page'){
      const p=pageFor(drag.id),target=row&&pageFor(row.dataset.lsbPage),gid=target?target.group:h?.dataset.lsbGroup;
      ok=!!anchor&&destinationAllowed(p,gid)&&target?.id!==p.id;
      if(ok&&p.question){
        if(target?.container){drop={type:'page',gid,target:target.id,after:true,parentId:target.id,header:true};}
        else if(target?.question){const r=anchor.getBoundingClientRect();drop={type:'page',gid,target:target.id,after:e.clientY>r.top+r.height/2,parentId:target.parentId};}
        else ok=false;
      }else if(ok&&target?.question){ok=false;}else if(ok){const r=anchor.getBoundingClientRect();
        const first=!target&&sidebar.pages.find(p=>p.group===gid);
        drop={type:'page',gid,target:target?.id||first?.id,after:!!target&&e.clientY>r.top+r.height/2};
        if(!target){const firstRow=first&&list.querySelector('[data-lsb-page="'+first.id+'"]');if(firstRow&&!firstRow.hidden)anchor=firstRow;else drop.header=true;}
      }
    }else if(h||row){
      const targetGroup=h?.dataset.lsbGroup||pageFor(row.dataset.lsbPage)?.group;
      const gs=current().groups,from=gs.findIndex(g=>g.id===drag.id),to=gs.findIndex(g=>g.id===targetGroup),sign=Math.sign(to-from);
      ok=to!==from&&gs.slice(Math.min(from,to),Math.max(from,to)+1).every(g=>!g.fixed&&!g.locked&&!g.protected);
      if(ok){drop={type:'group',id:drag.id,target:targetGroup,sign};
        const heads=[...list.querySelectorAll('[data-lsb-group]')];
        const head=heads.find(n=>n.dataset.lsbGroup===targetGroup);
        const members=[...list.querySelectorAll('[data-lsb-page]')].filter(n=>pageFor(n.dataset.lsbPage)?.group===targetGroup&&!n.hidden);
        anchor=sign>0?(members.at(-1)||head):head;
      }
    }
    e.dataTransfer.dropEffect=ok?'move':'none';marker.hidden=!ok;
    if(ok){denied='';const r=anchor.getBoundingClientRect(),base=root.getBoundingClientRect();const after=drop.type==='page'?(drop.after||drop.header):drop.sign>0;marker.style.top=(after?r.bottom-base.top:r.top-base.top)-2+'px';}
    else{drop=null;const message=drag.type==='group'?'Положение этой группы нельзя изменить.':'Перенос запрещён правилами группы.';if(denied!==message){notify(message);denied=message;}}
    if(e.clientY<list.getBoundingClientRect().top+32)list.scrollTop-=12;
    if(e.clientY>list.getBoundingClientRect().bottom-32)list.scrollTop+=12;
  }
  list.addEventListener('dragover',onDragOver);
  list.addEventListener('dragenter',onDragOver);
  list.addEventListener('drop',e=>{if(!drag)return;e.preventDefault();if(drop?.type==='page')movePage(drag.id,drop.gid,drop.target,drop.after,drop.parentId);else if(drop?.type==='group'){const gs=current().groups,from=gs.findIndex(g=>g.id===drag.id),to=gs.findIndex(g=>g.id===drop.target);const [g]=gs.splice(from,1);gs.splice(to,0,g);sync();notify('Группа перемещена вместе со страницами.');}cleanDrag();});
  list.addEventListener('dragend',cleanDrag);list.addEventListener('dragleave',e=>{if(!list.contains(e.relatedTarget))marker.hidden=true;});
  new MutationObserver(decorate).observe(list,{childList:true});
  sidebar.setGroups(bookGroups,sidebar.collapsedGroups);
  decorate();
  return {canAction:allowed,changed,action,newPageDefaults,configurePageMenu,configureSettings,showPage,selectScenario(s,v){save();apply(s,v);},decorate};
})();
