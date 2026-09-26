// Yellow Cat Loves Mars — boot entry (SIÊU NHẸ, không import three)
// Landing hiện tức thì; thế giới 3D chỉ tải khi người dùng tương tác (dynamic import).
const LOAD_LABEL = 'Đang tải thế giới Sao Hỏa (~140KB gzip)...';
let worldPromise = null;
let worldReady = false;

// ẩn màn loading ngay — landing là HTML/CSS thuần
const loadingEl = document.getElementById('loading');
if(loadingEl) loadingEl.classList.add('out');

function worldLoad(){
  if(!worldPromise){
    const b=document.getElementById('btn-start');
    if(b) b.disabled=true, b.textContent='🛰️ '+LOAD_LABEL;
    worldPromise = import('./main.js').then(m=>{
      worldReady=true;
      const b2=document.getElementById('btn-start');
      if(b2){ b2.disabled=false; b2.textContent='🚀 Bắt đầu hành trình →'; }
      return m;
    }).catch(err=>{
      console.error('world load fail', err);
      worldReady=false; worldPromise=null;
      const b3=document.getElementById('btn-start');
      if(b3){ b3.disabled=false; b3.textContent='⚠️ Tải lại thử nhé →'; }
      throw err;
    });
  }
  return worldPromise;
}

// gate: mọi click vào control trước khi world sẵn sàng → tải world rồi replay click
const GATE_IDS = ['btn-start','btn-trailer','btn-audio','btn-journal','btn-gallery','btn-map','btn-photo','btn-light','btn-help','btn-pick-go','btn-pick-cancel','btn-vehicle-close'];
for(const id of GATE_IDS){
  const el=document.getElementById(id);
  if(!el) continue;
  el.addEventListener('click', async (e)=>{
    if(worldReady) return;
    e.stopImmediatePropagation(); e.preventDefault();
    await worldLoad();
    el.click();
  }, true);
}
// hover/press sớm = preload song song (module graph tải trước, parse khi click)
const bs=document.getElementById('btn-start');
if(bs){ bs.addEventListener('pointerenter', worldLoad, {once:true}); bs.addEventListener('touchstart', worldLoad, {once:true, passive:true}); }
// hoặc rảnh 4s thì âm thầm tải
('requestIdleCallback' in window) ? requestIdleCallback(worldLoad, {timeout:6000}) : setTimeout(worldLoad, 4000);

// Service Worker
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
