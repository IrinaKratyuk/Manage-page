'use strict';
window.PanelMessages = (() => {
  const dialog=document.createElement('dialog');dialog.className='panel-message';
  dialog.setAttribute('aria-labelledby','panel-message-title');dialog.setAttribute('aria-describedby','panel-message-comment');
  dialog.innerHTML='<div class="panel-message__head"><img alt="" width="40" height="3"></div><div class="panel-message__content"><p id="panel-message-title"></p><p id="panel-message-comment"></p></div><div class="panel-message__buttons"></div>';
  document.body.append(dialog);
  let finish=null,previous=null;
  const gradient=rgb=>`url("data:image/svg+xml;utf8,<svg viewBox='0 0 350 182' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%25' width='100%25' fill='url(%23grad)' opacity='0.07999999821186066'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(30.15 44.65 44.907 -30.323 87.5 -27.5)'><stop stop-color='rgba(${rgb},0)' offset='0'/><stop stop-color='rgba(${rgb},1)' offset='1'/></radialGradient></defs></svg>"), linear-gradient(90deg, rgb(255,255,255) 0%,rgb(255,255,255) 100%)`;
  function close(result){if(!finish)return;const resolve=finish;finish=null;dialog.close();if(previous?.isConnected)previous.focus();resolve(result);}
  dialog.addEventListener('cancel',e=>{e.preventDefault();close(false);});
  function show({title,comment='',confirm=false}){
    if(finish)close(false);
    previous=document.activeElement;
    dialog.setAttribute('role',confirm?'alertdialog':'dialog');dialog.dataset.kind=confirm?'danger':'info';
    dialog.style.backgroundImage=gradient(confirm?'220,34,25':'103,87,183');
    dialog.querySelector('img').src='assets/message-'+(confirm?'danger':'info')+'.svg';
    dialog.querySelector('#panel-message-title').textContent=title;
    dialog.querySelector('#panel-message-comment').textContent=comment;
    const buttons=dialog.querySelector('.panel-message__buttons');buttons.replaceChildren();
    const add=(text,style,result)=>{const b=document.createElement('button');b.type='button';b.className='btn btn--outlined btn--style-'+style+' btn--size-m';b.textContent=text;b.onclick=()=>close(result);buttons.append(b);return b;};
    if(confirm){add('Удалить','danger',true);add('Отмена','default',false);}else add('ОК','info',true);
    return new Promise(resolve=>{finish=resolve;dialog.showModal();buttons.lastElementChild.focus();});
  }
  return {confirm:(title,comment)=>show({title,comment,confirm:true}),info:(title,comment)=>show({title,comment})};
})();
