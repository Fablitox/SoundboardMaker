'use strict';
// Soundboard Maker website navigation, screenshots and downloads.
const $ = (selector,scope=document) => scope.querySelector(selector);
const $$ = (selector,scope=document) => [...scope.querySelectorAll(selector)];
const menuButton = $('.mobile-toggle');
const menu = $('#site-nav');
function closeMenu(){ menu.classList.remove('is-open'); menuButton?.setAttribute('aria-expanded','false'); }
menuButton?.addEventListener('click',()=>{
  const next = menuButton.getAttribute('aria-expanded') !== 'true';
  menu.classList.toggle('is-open',next);
  menuButton.setAttribute('aria-expanded',String(next));
});
$$('.site-nav a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('click',e=>{if(menu?.classList.contains('is-open')&&!e.target.closest('.site-header'))closeMenu()});
window.addEventListener('resize',()=>{if(window.innerWidth>900)closeMenu()});

// Screenshots: real app screenshots in both languages; tabs update the preview.
const tabs=$$('.preview-tab');
const image=$('#preview-image');
const title=$('#preview-caption-title');
const desc=$('#preview-caption-desc');
const index=$('#preview-index');
const panel=$('#preview-panel');
const dialog=$('#preview-dialog');
const dialogImage=$('#dialog-image');
const dialogTitle=$('#dialog-title');
let currentTab=tabs[0];
function selectTab(tab){
  if(!tab)return;
  currentTab=tab;
  tabs.forEach(t=>{
    const active=t===tab;
    t.classList.toggle('is-selected',active);
    t.setAttribute('aria-selected',String(active));
    t.tabIndex=active?0:-1;
  });
  image.src=tab.dataset.image;
  image.alt=tab.dataset.label+' — Soundboard Maker';
  title.textContent=tab.dataset.label;
  desc.textContent=tab.dataset.detail;
  index.textContent=String(tabs.indexOf(tab)+1).padStart(2,'0')+' / 04';
  panel.setAttribute('aria-labelledby',tab.id);
}
tabs.forEach((tab,position)=>{
  tab.tabIndex=position===0?0:-1;
  tab.addEventListener('click',()=>selectTab(tab));
  tab.addEventListener('keydown',event=>{
    if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
    event.preventDefault();
    let next=position;
    if(event.key==='ArrowRight')next=(position+1)%tabs.length;
    if(event.key==='ArrowLeft')next=(position-1+tabs.length)%tabs.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=tabs.length-1;
    selectTab(tabs[next]);tabs[next].focus();
  });
});
function openDialog(){
  if(!dialog?.showModal)return;
  dialogImage.src=currentTab.dataset.image;
  dialogImage.alt=image.alt;
  dialogTitle.textContent=currentTab.dataset.label;
  dialog.showModal();
}
$('#open-preview')?.addEventListener('click',openDialog);
$('#open-preview-text')?.addEventListener('click',openDialog);
$('#close-dialog')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});

// Open the real Soundboard screenshot in the existing lightbox.
$('#open-soundboard')?.addEventListener('click',()=>{
  const shot=$('#soundboard-image');
  if(!dialog?.showModal||!shot)return;
  dialogImage.src=shot.src;
  dialogImage.alt=shot.alt;
  dialogTitle.textContent=shot.dataset.title||'Soundboard Maker';
  dialog.showModal();
});
// Keep accessible navigation highlight in sync without changing the URL structure.
if('IntersectionObserver' in window){
  const sectionAnchors=$$('.site-nav a[href^="#"]');
  const map=new Map(sectionAnchors.map(x=>[x.getAttribute('href').slice(1),x]));
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){sectionAnchors.forEach(x=>x.classList.toggle('is-active',x===map.get(entry.target.id)))}
    });
  },{rootMargin:'-26% 0px -66% 0px',threshold:0});
  for(const id of map.keys()) {const s=document.getElementById(id);if(s)io.observe(s)}
}


// Keep the latest stable official GitHub download assets automatically updated.
// The verified 1.0.0 HTML links stay usable if the GitHub API is unavailable.
const releaseRepo='https://api.github.com/repos/Fablitox/SoundBoardMaker/releases?per_page=20';
function isInstallerAsset(asset){return /^SoundboardMaker-Setup-.*\.exe$/i.test(asset?.name||'')}
function isPluginAsset(asset){return /\.streamDeckPlugin$/i.test(asset?.name||'')}
function isOfficialAssetUrl(value){
  if(typeof value!=='string')return false;
  try{
    const u=new URL(value);
    return u.protocol==='https:' && u.hostname.toLowerCase()==='github.com' &&
      /^\/Fablitox\/SoundboardMaker\/releases\/download\//i.test(u.pathname);
  }catch(_){return false}
}
async function updateReleaseLinks(){
  const ctrl=new AbortController();
  const cancel=setTimeout(()=>ctrl.abort(),7500);
  try{
    const response=await fetch(releaseRepo,{headers:{Accept:'application/vnd.github+json'},signal:ctrl.signal});
    if(!response.ok)return;
    const releases=await response.json();
    if(!Array.isArray(releases))return;
    const newest=releases.find(r=>r&&!r.draft&&!r.prerelease&&/^v?\d+\.\d+\.\d+(?:\.\d+)?$/.test(r.tag_name)&&Array.isArray(r.assets)&&r.assets.some(isInstallerAsset));
    if(!newest)return;
    const installer=newest.assets.find(a=>isInstallerAsset(a)&&isOfficialAssetUrl(a.browser_download_url));
    const plugin=newest.assets.find(a=>isPluginAsset(a)&&isOfficialAssetUrl(a.browser_download_url));
    if(!installer)return;
    const installerButton=document.querySelector('[data-download="installer"]');
    const pluginButton=document.querySelector('[data-download="plugin"]');
    if(installerButton)installerButton.href=installer.browser_download_url;
    if(pluginButton&&plugin)pluginButton.href=plugin.browser_download_url;
    const version=String(newest.tag_name).replace(/^v/i,'');
    document.querySelectorAll('.version-pill').forEach(x=>x.textContent='v'+version);
    const installerVersion=document.querySelector('.main-download .download-meta');
    if(installerVersion)installerVersion.textContent=installerVersion.textContent.replace(/v?\d+\.\d+\.\d+(?:\.\d+)?/,'v'+version);
    const status=document.querySelector('.status-line');
    if(status){
      const english=document.body.dataset.language==='en';
      const dot=status.querySelector('.status-dot');
      status.textContent=english?'VERSION '+version+' AVAILABLE':'VERSION '+version+' DISPONIBLE';
      if(dot)status.prepend(dot);
    }
  }catch(_){/* Keep the confirmed 1.0.0 download links. */}
  finally{clearTimeout(cancel)}
}
updateReleaseLinks();
