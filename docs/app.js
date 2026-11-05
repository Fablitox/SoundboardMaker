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

// One shared lightbox for feature cards and the built-in Soundboard screenshot.
const dialog=$('#preview-dialog');
const dialogImage=$('#dialog-image');
const dialogTitle=$('#dialog-title');
let dialogOpener=null;
function openScreenshot(opener,image,title){
  if(!dialog?.showModal||!image)return;
  dialogOpener=opener;
  dialogImage.src=image.src;
  dialogImage.alt=image.alt;
  dialogTitle.textContent=title;
  dialog.showModal();
}
$$('.feature-preview').forEach(button=>{
  button.addEventListener('click',()=>openScreenshot(button,$('img',button),button.dataset.previewTitle));
});
$('#open-soundboard')?.addEventListener('click',event=>{
  const image=$('#soundboard-image');
  openScreenshot(event.currentTarget,image,image?.dataset.title||'Soundboard Maker');
});
$('#close-dialog')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',event=>{
  const bounds=dialog.getBoundingClientRect();
  if(event.target===dialog&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom))dialog.close();
});
// Native dialog handles Escape and focus trapping; restore the opening control.
dialog?.addEventListener('close',()=>{
  const opener=dialogOpener;
  dialogOpener=null;
  if(opener?.isConnected)opener.focus({preventScroll:true});
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


// Select the latest published stable release (never drafts or prereleases).
// Keep the last verified published HTML links as fallback if GitHub cannot be reached.
const latestReleaseApi='https://api.github.com/repos/Fablitox/SoundBoardMaker/releases/latest';
function isOfficialAssetUrl(asset,tag){
  if(!asset || typeof asset.browser_download_url!=='string')return false;
  try{
    const url=new URL(asset.browser_download_url);
    if(url.protocol!=='https:' || url.hostname.toLowerCase()!=='github.com' || url.search || url.hash)return false;
    const path=url.pathname.split('/').filter(Boolean);
    return path.length===6 &&
      path[0].toLowerCase()==='fablitox' &&
      path[1].toLowerCase()==='soundboardmaker' &&
      path[2]==='releases' && path[3]==='download' &&
      decodeURIComponent(path[4])===tag &&
      decodeURIComponent(path[5])===asset.name;
  }catch(_){return false}
}
function isValidAsset(asset,name,tag){
  return asset && asset.name===name && asset.state==='uploaded' &&
    Number.isFinite(asset.size) && asset.size>0 && isOfficialAssetUrl(asset,tag);
}
async function updateReleaseLinks(){
  const ctrl=new AbortController();
  const cancel=setTimeout(()=>ctrl.abort(),7500);
  try{
    const response=await fetch(latestReleaseApi,{headers:{Accept:'application/vnd.github+json'},signal:ctrl.signal});
    if(!response.ok)return;
    const release=await response.json();
    if(!release || release.draft || release.prerelease || typeof release.tag_name!=='string')return;
    const match=release.tag_name.match(/^v?(\d+\.\d+\.\d+(?:\.\d+)?)$/i);
    if(!match || !Array.isArray(release.assets))return;
    const version=match[1];
    const installerName='SoundboardMaker-Setup-'+version+'.exe';
    const pluginName='com.soundboardmaker.streamdeck.streamDeckPlugin';
    const installer=release.assets.find(a=>isValidAsset(a,installerName,release.tag_name));
    const plugin=release.assets.find(a=>isValidAsset(a,pluginName,release.tag_name));
    if(!installer || !plugin)return;

    // Only switch both downloads together, never mix plugin and app releases.
    const structured=document.querySelector('script[type="application/ld+json"]');
    let updatedStructured=null;
    if(structured){
      try{
        const data=JSON.parse(structured.textContent);
        data.softwareVersion=version;
        data.downloadUrl=installer.browser_download_url;
        updatedStructured=JSON.stringify(data);
      }catch(_){return}
    }

    const installerButton=document.querySelector('[data-download="installer"]');
    const pluginButton=document.querySelector('[data-download="plugin"]');
    if(!installerButton || !pluginButton)return;
    installerButton.href=installer.browser_download_url;
    pluginButton.href=plugin.browser_download_url;
    if(structured && updatedStructured)structured.textContent=updatedStructured;
    document.querySelectorAll('.version-pill').forEach(x=>x.textContent='v'+version);
    const meta=document.querySelector('.main-download .download-meta');
    if(meta)meta.textContent=meta.textContent.replace(/v?\d+\.\d+\.\d+(?:\.\d+)?/,'v'+version);
    const status=document.querySelector('.status-line');
    if(status){
      const en=document.body.dataset.language==='en';
      const dot=status.querySelector('.status-dot');
      status.textContent=en?'VERSION '+version+' AVAILABLE':'VERSION '+version+' DISPONIBLE';
      if(dot)status.prepend(dot);
    }
    // Release notes keep their permanent /releases/latest URL in both languages.
  }catch(_){/* Keep verified HTML download links. */}
  finally{clearTimeout(cancel)}
}
updateReleaseLinks();
