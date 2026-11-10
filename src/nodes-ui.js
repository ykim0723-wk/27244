/* ---------------- window UI ---------------- */
const css=document.createElement('style');css.textContent=`
.ngwin{position:fixed;z-index:45;left:calc(var(--railw) + 12px);bottom:12px;width:calc(100vw - var(--railw) - var(--sidew) - 24px);height:min(500px,50vh);min-width:640px;min-height:320px;background:var(--surface);border-radius:14px;box-shadow:0 0 0 1px var(--line-2),0 30px 80px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;resize:both}
.ngwin.big{left:calc(var(--railw) + 12px)!important;top:calc(var(--top) + 12px)!important;bottom:12px!important;right:12px!important;width:auto!important;height:auto!important;resize:none}
.ng-head{display:flex;align-items:center;gap:4px;padding:6px 6px 6px 14px;border-bottom:1px solid var(--line);cursor:grab;user-select:none;touch-action:none;min-height:46px}
.ng-head b{font:900 13px var(--display);font-stretch:125%;letter-spacing:-.01em}
.ng-head .crumb{font:600 11px var(--ui);color:var(--mute);margin-left:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ng-head .sp{flex:1}
.ng-head .icon-btn{width:32px;height:32px;border-radius:8px}
.ng-body{flex:1;display:grid;grid-template-columns:232px minmax(0,1fr) 268px;min-height:0}
/* library */
.ng-lib{border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0;background:var(--surface)}
.ng-lib .fam{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:10px 10px 6px}
.ng-lib .fam button{height:34px;border-radius:9px;border:1px solid var(--line-2);background:var(--surface);font:700 12px var(--ui);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1}
.ng-lib .fam button small{font:600 9px var(--ui);letter-spacing:.06em;color:var(--mute)}
.ng-lib .fam button[aria-pressed="true"]{background:var(--ink);color:#fff;border-color:var(--ink)}
.ng-lib .fam button[aria-pressed="true"] small{color:#bdbcb6}
.ng-lib .search{margin:0 10px 8px;height:34px}
.ng-lib .cats{display:flex;gap:4px;flex-wrap:wrap;padding:0 10px 8px}
.ng-lib .cats button{height:24px;border-radius:6px;border:1px solid var(--line-2);background:transparent;font:600 10.5px var(--ui);color:var(--mute);padding:0 7px}
.ng-lib .cats button[aria-pressed="true"]{border-color:var(--ink);color:var(--ink);background:var(--surface-2)}
.ng-lib .list{flex:1;overflow:auto;padding:0 6px 10px;border-top:1px solid var(--line)}
.ng-lib h4{margin:12px 6px 4px;font:700 9.5px var(--ui);letter-spacing:.14em;text-transform:uppercase;color:var(--mute);display:flex;justify-content:space-between}
.ng-it{display:flex;gap:8px;align-items:flex-start;width:100%;border:0;background:none;text-align:left;padding:7px 6px;border-radius:8px;cursor:grab;touch-action:none}
.ng-it:hover{background:var(--surface-2)}
.ng-it i{flex:none;width:8px;height:8px;border-radius:2px;margin-top:4px;box-shadow:0 0 0 1.5px var(--ink)}
.ng-it.m i{background:var(--ink)}
.ng-it div{min-width:0}
.ng-it b{display:block;font:700 12px var(--ui)}
.ng-it small{display:block;color:var(--mute);font-size:10.5px;line-height:1.35;margin-top:1px}
.ng-lib .where{padding:8px 12px;border-top:1px solid var(--line);font:600 10.5px var(--ui);color:var(--mute);line-height:1.4}
.ng-lib .where b{color:var(--ink)}
/* canvas */
.ng-canvas{position:relative;overflow:hidden;outline:none;background:var(--bg);background-image:radial-gradient(var(--line-2) 1px,transparent 1.2px);background-size:22px 22px;touch-action:none}
.ng-layer{position:absolute;left:0;top:0;transform-origin:0 0}
.ng-zone{position:absolute;border-radius:18px;pointer-events:none}
.ng-zone.s{background:rgba(255,255,255,.55);box-shadow:inset 0 0 0 1px var(--line)}
.ng-zone.m{background:rgba(11,11,11,.035);box-shadow:inset 0 0 0 1px var(--line)}
.ng-zone span{position:absolute;left:16px;top:12px;font:700 10px var(--ui);letter-spacing:.16em;color:var(--mute);white-space:nowrap}
.ng-zone span b{color:var(--ink);letter-spacing:.16em}
.ng-wires{position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible;pointer-events:none}
.ng-wires path{fill:none;stroke:var(--ink);stroke-width:1.8}
.ng-wires path.m{stroke-dasharray:6 4}
.ng-wires path.hit{stroke:transparent;stroke-width:14;pointer-events:stroke;cursor:pointer}
.ng-wires path.hit:hover + path{stroke:#b0aea7;stroke-width:3}
.ng-wires path.drop{stroke:var(--ink);stroke-width:4}
.ng-wires path.tmp{stroke:#9a9994;stroke-dasharray:4 4}
.nd{position:absolute;width:160px;border-radius:11px;background:var(--surface);box-shadow:0 0 0 1.5px var(--ink),0 6px 16px rgba(0,0,0,.06);font:600 11px var(--ui);user-select:none}
.nd.motion{background:#151514;color:#fff}
.nd.io{background:var(--surface);box-shadow:0 0 0 1.5px var(--line-2),0 6px 16px rgba(0,0,0,.04)}
.nd.sel{box-shadow:0 0 0 3px var(--ink),0 0 0 6px rgba(11,11,11,.12),0 12px 28px rgba(0,0,0,.14)}
.nd.byp{opacity:.4}
.nd-h{display:flex;align-items:center;gap:6px;padding:8px 10px 6px;cursor:grab}
.nd-h b{flex:1;min-width:0;font:700 11.5px var(--ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nd-h small{font:700 8.5px var(--ui);letter-spacing:.12em;opacity:.5}
.nd canvas{display:block;width:144px;height:72px;margin:0 8px 6px;border-radius:7px;background:var(--surface-2)}
.nd.motion canvas{background:#262624}
.nd .ft{display:flex;justify-content:space-between;padding:0 10px 8px;font:600 9.5px var(--ui);opacity:.55}
.pt{position:absolute;width:16px;height:16px;border-radius:50%;background:var(--surface);box-shadow:0 0 0 1.5px var(--ink);top:57px;cursor:crosshair;z-index:2}
.nd.motion .pt{background:#151514;box-shadow:0 0 0 1.5px #fff}
.pt.in{left:-8px}.pt.out{right:-8px}.pt.in.a2{top:44px}.pt.in.b{top:76px}
.pt:hover,.pt.hot{transform:scale(1.3);background:var(--ink)}
.pt-l{position:absolute;left:12px;font:700 8.5px var(--ui);opacity:.6}
.nd .hov{position:absolute;top:-12px;right:-12px;display:none;gap:4px;z-index:3}
.nd:hover .hov,.nd.sel .hov{display:flex}
.nd .hov button{width:24px;height:24px;border-radius:50%;border:0;background:var(--ink);color:#fff;display:grid;place-items:center;padding:0;box-shadow:0 0 0 2px var(--surface)}
.nd .hov button.x{background:var(--surface);color:var(--ink);box-shadow:0 0 0 1.5px var(--ink)}
.nd .hov svg{width:13px;height:13px}
.ng-guide{position:absolute;left:12px;top:12px;z-index:4;width:min(320px,calc(100% - 24px));background:var(--surface);border-radius:12px;box-shadow:0 0 0 1px var(--line-2),0 14px 40px rgba(0,0,0,.1);padding:14px 14px 12px;font-size:11.5px;line-height:1.5}
.ng-guide b{display:block;font:900 14px var(--display);font-stretch:125%;margin-bottom:8px}
.ng-guide ol{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px}
.ng-guide .r{display:flex;justify-content:flex-end;margin-top:10px}
.ng-guide button{height:28px;border-radius:7px;border:0;background:var(--ink);color:#fff;font:700 11px var(--ui);padding:0 12px}
.ng-ghost{position:fixed;z-index:80;pointer-events:none;padding:7px 10px;border-radius:8px;background:var(--ink);color:#fff;font:700 11.5px var(--ui);box-shadow:0 10px 30px rgba(0,0,0,.25)}
.ng-quick{position:absolute;z-index:6;width:280px;max-height:320px;display:flex;flex-direction:column;background:var(--surface);border-radius:12px;box-shadow:0 0 0 1px var(--line-2),0 20px 50px rgba(0,0,0,.18);overflow:hidden}
.ng-quick .search{margin:8px;height:34px}.ng-quick .list{overflow:auto;padding:0 4px 6px}
/* inspector */
.ng-insp{border-left:1px solid var(--line);overflow:auto;background:var(--surface)}
.ng-insp .phead{padding:14px 16px 10px}.ng-insp .phead b{font-size:17px}
.ng-insp .params{padding:12px 16px 16px}
.ng-insp h5{margin:0;padding:12px 16px 0;font:700 9.5px var(--ui);letter-spacing:.14em;text-transform:uppercase;color:var(--mute);border-top:1px solid var(--line)}
.ng-insp .acts{display:flex;gap:6px;flex-wrap:wrap;padding:12px 16px 16px;border-top:1px solid var(--line)}
.ng-insp .acts button{height:30px;border-radius:8px;border:1px solid var(--line-2);background:var(--surface);font:700 11px var(--ui);padding:0 10px}
.ng-insp .acts button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.ng-insp .tip{padding:16px;color:var(--mute);font-size:11.5px;line-height:1.55}
.ng-insp .tip b{display:block;color:var(--ink);font:900 15px var(--display);font-stretch:125%;margin-bottom:6px}
.ng-insp .tip kbd{font:600 10px var(--ui);border:1px solid var(--line-2);border-bottom-width:2px;border-radius:4px;padding:0 4px}
.ng-banner{margin:12px 18px 0;padding:10px 12px;border-radius:10px;background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line-2);font-size:12px;display:flex;flex-direction:column;gap:6px}
.ng-banner .row{display:flex;gap:6px;flex-wrap:wrap}
.ng-banner button{height:28px;border-radius:7px;border:1px solid var(--ink);background:var(--ink);color:#fff;font:700 11px var(--ui);padding:0 10px}
.ng-banner button.g{background:transparent;color:var(--ink)}
#nodesBtn[aria-pressed="true"]{background:var(--ink);color:#fff}
.ng-libtoggle{display:none}
@media (max-width:1180px){.ng-body{grid-template-columns:210px minmax(0,1fr) 240px}}
@media (max-width:960px){.ngwin,.ngwin.big{left:6px!important;right:6px!important;top:auto!important;width:auto!important;bottom:calc(72px + env(safe-area-inset-bottom,0px))!important;height:min(70vh,600px)!important;min-width:0;resize:none}
  .ng-body{grid-template-columns:1fr;position:relative}.ng-lib{position:absolute;inset:0 30% 0 0;z-index:7;box-shadow:10px 0 30px rgba(0,0,0,.1)}.ng-lib.closed{display:none}
  .ng-insp{position:absolute;left:0;right:0;bottom:0;max-height:52%;border-left:0;border-top:1px solid var(--line);box-shadow:0 -10px 30px rgba(0,0,0,.08);z-index:6}.ng-insp.empty{display:none}.ng-libtoggle{display:inline-flex}}`;
document.head.appendChild(css);

const I={nodes:ICONS.nodes,x:ICONS.x,plus:ICONS.plus,tidy:ICONS.tidy,fit:ICONS.fit,
  big:'<svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
  help:'<svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/></svg>',
  lib:'<svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M4 5h16M4 12h16M4 19h10"/></svg>'};
const win=document.createElement('div');win.className='ngwin';win.id='ngWin';win.hidden=true;win.setAttribute('role','dialog');win.setAttribute('aria-label','Node graph');
win.innerHTML=`<div class="ng-head" id="ngHead"><button class="icon-btn ng-libtoggle" type="button" id="ngLibT" title="Show effects">${I.lib}</button><b>Nodes</b><span class="crumb" id="ngCrumb"></span><span class="sp"></span>
<button class="icon-btn" type="button" id="ngHelp" title="How nodes work">${I.help}</button><button class="icon-btn" type="button" id="ngTidy" title="Tidy layout">${I.tidy}</button><button class="icon-btn" type="button" id="ngFit" title="Fit everything in view">${I.fit}</button><button class="icon-btn" type="button" id="ngBig" title="Expand">${I.big}</button><button class="icon-btn" type="button" id="ngClose" title="Close (N)" aria-label="Close nodes">${I.x}</button></div>
<div class="ng-body">
 <aside class="ng-lib" id="ngLib">
  <div class="fam" role="tablist"><button type="button" data-f="still" aria-pressed="true">Still<small>EDITS IMAGE</small></button><button type="button" data-f="motion" aria-pressed="false">Motion<small>ANIMATES</small></button></div>
  <label class="search"><svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="text" id="ngQ" placeholder="Search effects" aria-label="Search effects"></label>
  <div class="cats" id="ngCats"></div><div class="list" id="ngList"></div><div class="where" id="ngWhere"></div>
 </aside>
 <div class="ng-canvas" id="ngCanvas" tabindex="0"><div class="ng-layer" id="ngLayer"><svg class="ng-wires" id="ngWires"></svg></div></div>
 <aside class="ng-insp" id="ngInsp"></aside>
</div>`;
document.body.appendChild(win);
const cv=win.querySelector('#ngCanvas'),layer=win.querySelector('#ngLayer'),wires=win.querySelector('#ngWires'),insp=win.querySelector('#ngInsp'),lib=win.querySelector('#ngLib');
let view={x:20,y:30,z:.85},sel=null,libFam='still',libCat='All';
function applyView(){layer.style.transform=`translate(${view.x}px,${view.y}px) scale(${view.z})`}
const store={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};

// topbar button
const nb=document.createElement('button');nb.className='btn tonal';nb.id='nodesBtn';nb.type='button';nb.title='Node graph (N)';nb.setAttribute('aria-pressed','false');nb.innerHTML=I.nodes+'<span class="lbl">Nodes</span>';
$('#undo').before(nb);nb.onclick=()=>toggle();
function toggle(on){on=on===undefined?win.hidden:on;win.hidden=!on;nb.setAttribute('aria-pressed',String(on));if(on){importStack();draw();renderLib();inspect();requestAnimationFrame(()=>{fit();if(!store.get('ng-guide'))guide(true)});cv.focus({preventScroll:true})}}
NG.open=()=>toggle(true);
win.querySelector('#ngClose').onclick=()=>toggle(false);
win.querySelector('#ngBig').onclick=()=>{win.classList.toggle('big');requestAnimationFrame(fit)};
win.querySelector('#ngLibT').onclick=()=>lib.classList.toggle('closed');
if(matchMedia('(max-width:960px)').matches)lib.classList.add('closed');
addEventListener('keydown',e=>{const t=e.target;if(t.closest&&t.closest('input,textarea,[contenteditable]'))return;if((e.key==='n'||e.key==='N')&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();toggle()}});

function importStack(){if(isActive()||importStack.done)return;importStack.done=true;const on=FX.filter(f=>state[f.id].on&&!state[f.id].hide);if(!on.length)return;let prev='src',x=260;
  on.forEach(f=>{const p={};f.params.forEach(q=>p[q.k]=state[f.id][q.k]);const n=mkNode('fx:'+f.id,x,120,p);G.links.push({a:prev,b:n.id,port:0});prev=n.id;x+=210});
  G.links=G.links.filter(l=>!(l.b==='sout'));G.links.push({a:prev,b:'sout',port:0});tidy();snack(`Your ${on.length} stacked effect${on.length>1?'s are':' is'} now nodes`);schedule()}

// window drag
(()=>{const h=win.querySelector('#ngHead');let d=null;h.addEventListener('pointerdown',e=>{if(e.target.closest('button')||win.classList.contains('big'))return;const r=win.getBoundingClientRect();d={x:e.clientX-r.left,y:e.clientY-r.top};h.setPointerCapture(e.pointerId)});
  h.addEventListener('pointermove',e=>{if(!d)return;win.style.left=Math.max(0,Math.min(innerWidth-160,e.clientX-d.x))+'px';win.style.top=Math.max(0,Math.min(innerHeight-46,e.clientY-d.y))+'px';win.style.bottom='auto'});
  h.addEventListener('pointerup',()=>d=null)})();

/* guide */
function guide(on){const old=cv.querySelector('.ng-guide');if(old){old.remove();if(on!==true)return}if(on===false)return;const g=document.createElement('div');g.className='ng-guide';
  g.innerHTML=`<b>How nodes work</b><ol><li>Your image flows left to right: <u>Source</u> → effects → <u>Image out</u> → motion → <u>Video out</u>.</li><li>Pick an effect on the left. It's added right after the selected node. Drag it onto a wire to drop it in there instead.</li><li>Adjust it on the right. <b style="display:inline;font:inherit">Amount</b> and <b style="display:inline;font:inherit">Blend</b> mix it with what came before.</li><li>Drag between dots to rewire. Click a wire to cut it. Hover a node for <u>+</u> and <u>×</u>.</li></ol><div class="r"><button type="button">Got it</button></div>`;
  g.querySelector('button').onclick=()=>{store.set('ng-guide','1');g.remove()};g.addEventListener('pointerdown',e=>e.stopPropagation());cv.appendChild(g)}
win.querySelector('#ngHelp').onclick=()=>guide();

/* library */
const famGroups=f=>f==='still'?STILL_GROUPS:MOTION_GROUPS;
function itemsOf(f){return Object.entries(TYPES).filter(([k,T])=>T.fam===f)}
function renderLib(){win.querySelectorAll('.fam button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.f===libFam)));
  const cats=win.querySelector('#ngCats');const groups=famGroups(libFam).filter(g=>itemsOf(libFam).some(([,T])=>T.group===g));
  cats.innerHTML='';['All',...groups].forEach(g=>{const b=document.createElement('button');b.type='button';b.textContent=g;b.setAttribute('aria-pressed',String(g===libCat));b.onclick=()=>{libCat=g;renderLib()};cats.appendChild(b)});
  const q=win.querySelector('#ngQ').value.trim().toLowerCase(),list=win.querySelector('#ngList');list.innerHTML='';
  groups.forEach(g=>{if(libCat!=='All'&&g!==libCat&&!q)return;const its=itemsOf(libFam).filter(([k,T])=>T.group===g&&(!q||(T.name+' '+(T.desc||'')+' '+g).toLowerCase().includes(q)));if(!its.length)return;
    const h=document.createElement('h4');h.innerHTML=`<span>${g}</span><span>${its.length}</span>`;list.appendChild(h);
    its.forEach(([k,T])=>{const b=document.createElement('button');b.type='button';b.className='ng-it'+(T.fam==='motion'?' m':'');b.innerHTML='<i></i><div><b></b><small></small></div>';b.querySelector('b').textContent=T.name;b.querySelector('small').textContent=T.desc||'';b.title='Click to add · drag onto a wire to insert';dragAdd(b,k);list.appendChild(b)})});
  if(!list.children.length)list.innerHTML=`<div class="tnone">Nothing matches “${q.replace(/[<>&]/g,'')}”. ${libFam==='still'?'Try the Motion tab.':'Try the Still tab.'}</div>`;
  whereText()}
win.querySelectorAll('.fam button').forEach(b=>b.onclick=()=>{libFam=b.dataset.f;libCat='All';renderLib()});
win.querySelector('#ngQ').addEventListener('input',()=>{libCat='All';renderLib()});
win.querySelector('#ngQ').addEventListener('keydown',e=>{if(e.key==='Enter'){const k=win.querySelector('.ng-it');if(k)k.click()}});
function anchorFor(f){const s=sel&&node(sel);if(s){if(f==='still'&&stage(sel)<1)return sel;if(f==='motion'&&stage(sel)>=1&&sel!=='mout')return sel}return f==='still'?inputOf('sout')||'src':inputOf('mout')||'sout'}
function whereText(){const a=anchorFor(libFam),n=node(a);win.querySelector('#ngWhere').innerHTML=`New ${libFam} nodes go after <b>${TYPES[n.type].name}</b>.${sel?'':' Select a node to change that.'}`}

// click to add, drag to drop on a wire or canvas
function dragAdd(el,type){el.addEventListener('pointerdown',e=>{if(e.button)return;const sx=e.clientX,sy=e.clientY;let ghost=null,over=null;
  const mv_=ev=>{if(!ghost&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<6)return;if(!ghost){ghost=document.createElement('div');ghost.className='ng-ghost';ghost.textContent=TYPES[type].name;document.body.appendChild(ghost)}
    ghost.style.left=ev.clientX+12+'px';ghost.style.top=ev.clientY+12+'px';const t=document.elementFromPoint(ev.clientX,ev.clientY);wires.querySelectorAll('.drop').forEach(p=>p.classList.remove('drop'));over=null;
    if(t&&t.classList&&t.classList.contains('hit')){over=+t.dataset.i;t.nextSibling&&t.nextSibling.classList.add('drop')}};
  const up=ev=>{removeEventListener('pointermove',mv_);removeEventListener('pointerup',up);wires.querySelectorAll('.drop').forEach(p=>p.classList.remove('drop'));
    if(!ghost){addNode(type);return}ghost.remove();const t=document.elementFromPoint(ev.clientX,ev.clientY);
    if(over!==null)insertOn(G.links[over],type);else if(t&&cv.contains(t))addNode(type,{at:toGraph(ev)})};
  addEventListener('pointermove',mv_);addEventListener('pointerup',up)})}
function insertOn(l,type){if(!l)return;const T=TYPES[type],sa=stage(l.a),sb=stage(l.b);
  if(T.fam==='still'&&!(sa<1&&sb<=1))return snack('Still effects go on the wires before Image out.');if(T.fam==='motion'&&!(sa>=1))return snack('Motion effects go on the wires after Image out.');
  const a=node(l.a),b=node(l.b),n=mkNode(type,(a.x+b.x)/2,(a.y+b.y)/2);G.links.push({a:l.a,b:n.id,port:0});l.a=n.id;tidyIfCrowded(n);select(n.id);changed(n.id);motionNudge(T)}

/* canvas */
const els={};
function draw(){if(win.hidden)return;const ids=new Set(G.nodes.map(n=>n.id));Object.keys(els).forEach(k=>{if(!ids.has(k)){els[k].remove();delete els[k]}});
  G.nodes.forEach(n=>{const T=TYPES[n.type];let el=els[n.id];
    if(!el){el=els[n.id]=document.createElement('div');el.dataset.id=n.id;const f=T.fam;el.className='nd '+f;
      el.innerHTML=`<div class="nd-h"><b></b><small>${f==='io'?'':f==='still'?'STILL':'MOTION'}</small></div><canvas width="288" height="144"></canvas><div class="ft"><span class="fi">${T.ins?'in':''}</span><span>${T.outs?'out':''}</span></div>`+
        (T.ins>=1?`<span class="pt in${T.ins>1?' a2':''}" data-port="0" title="Input"></span>`:'')+(T.ins>1?'<span class="pt in b" data-port="1" title="Input B"></span><span class="pt-l" style="top:30px">A</span><span class="pt-l" style="top:94px">B</span>':'')+(T.outs?'<span class="pt out" title="Output: drag to connect"></span>':'')+
        (f!=='io'?`<div class="hov"><button type="button" class="ad" title="Add after this">${I.plus}</button><button type="button" class="x" title="Delete">${I.x}</button></div>`:(n.type!=='mout'?`<div class="hov"><button type="button" class="ad" title="Add after this">${I.plus}</button></div>`:''));
      el.querySelector('b').textContent=T.name;layer.appendChild(el);bindNode(el,n)}
    el.style.left=n.x+'px';el.style.top=n.y+'px';el.classList.toggle('sel',sel===n.id);el.classList.toggle('byp',n.bypass)});
  drawWires();zones();crumb();drawThumbs()}
function crumb(){const chain=[];let id=inputOf('mout');while(id&&chain.length<30){chain.unshift(id);id=inputOf(id)}win.querySelector('#ngCrumb').textContent=chain.map(i=>TYPES[node(i).type].name).join(' → ')+' → Video out'}
function portPos(id,side,port=0){const n=node(id),T=TYPES[n.type];const y=side==='out'?65:T.ins>1?(port?84:52):65;return[n.x+(side==='out'?160:0),n.y+y]}
function curve(a,b){const dx=Math.max(50,Math.abs(b[0]-a[0])*.5);return`M${a[0]},${a[1]} C${a[0]+dx},${a[1]} ${b[0]-dx},${b[1]} ${b[0]},${b[1]}`}
let tmpWire=null;
function drawWires(){let h='';G.links.forEach((l,i)=>{const d=curve(portPos(l.a,'out'),portPos(l.b,'in',l.port));const m=stage(l.a)>=1;h+=`<path class="hit" d="${d}" data-i="${i}"><title>Click to cut · drop an effect here to insert it</title></path><path class="${m?'m':''}" d="${d}"/>`});
  if(tmpWire)h+=`<path class="tmp" d="${tmpWire}"/>`;wires.innerHTML=h;wires.querySelectorAll('.hit').forEach(p=>p.onclick=e=>{e.stopPropagation();const l=G.links[+p.dataset.i];if(!l)return;
    G.links.splice(+p.dataset.i,1);changed(l.b);snack('Connection cut','Undo',()=>{G.links.push(l);changed(l.b)})})}
function zones(){layer.querySelectorAll('.ng-zone').forEach(x=>x.remove());const s=node('sout'),xs=G.nodes.map(n=>n.x),ys=G.nodes.map(n=>n.y);const y0=Math.min(...ys)-70,y1=Math.max(...ys)+190,x0=Math.min(...xs)-40,x1=Math.max(...xs)+200;
  const mid=s.x+80;[['s',x0,mid-10,'<b>STILL</b> · CHANGES THE IMAGE'],['m',mid+10,Math.max(x1,mid+260),'<b>MOTION</b> · MAKES IT MOVE']].forEach(([c,a,b,t])=>{const z=document.createElement('div');z.className='ng-zone '+c;z.style.left=a+'px';z.style.top=y0+'px';z.style.width=(b-a)+'px';z.style.height=(y1-y0)+'px';z.innerHTML=`<span>${t}</span>`;layer.prepend(z)})}
function drawThumbs(){if(win.hidden)return;G.nodes.forEach(n=>{const el=els[n.id];const c=el&&el.querySelector('canvas');if(!c||TYPES[n.type].fam==='motion'||n.id==='mout')return;
  const m=NG.lastMemo;const s=n.id==='src'?(userImage?src:null):n.id==='sout'?(userImage?processed:null):m&&m[n.id]&&m[n.id].c;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);if(!s||!s.width)return;
  const k=Math.min(c.width/s.width,c.height/s.height),w=s.width*k,h=s.height*k;x.drawImage(s,(c.width-w)/2,(c.height-h)/2,w,h)})}
NG.thumbs=drawThumbs;
let lastMT=0;NG.onMotion=(memo,now)=>{if(win.hidden||now-lastMT<400)return;lastMT=now;Object.keys(memo).forEach(id=>{const el=els[id];const c=el&&el.querySelector('canvas');if(c&&id!=='sout'&&memo[id])NG.thumbTex(memo[id],c)});
  const out=els.mout&&els.mout.querySelector('canvas');const li=inputOf('mout');if(out&&li&&memo[li])NG.thumbTex(memo[li],out)};

function toGraph(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left-view.x)/view.z,(e.clientY-r.top-view.y)/view.z]}
function bindNode(el,n){
  el.querySelector('.nd-h').addEventListener('pointerdown',e=>{e.stopPropagation();select(n.id);const st=toGraph(e),ox=n.x,oy=n.y;let moved=false;
    const mv_=ev=>{const p=toGraph(ev);n.x=ox+p[0]-st[0];n.y=oy+p[1]-st[1];moved=true;el.style.left=n.x+'px';el.style.top=n.y+'px';drawWires()};
    const up=()=>{removeEventListener('pointermove',mv_);removeEventListener('pointerup',up);if(moved)zones()};addEventListener('pointermove',mv_);addEventListener('pointerup',up)});
  el.addEventListener('pointerdown',e=>{if(!e.target.classList.contains('pt')&&!e.target.closest('.hov'))select(n.id)});
  const ad=el.querySelector('.ad');if(ad)ad.onclick=e=>{e.stopPropagation();select(n.id);libFam=stage(n.id)>=1?'motion':'still';libCat='All';lib.classList.remove('closed');renderLib();const q=win.querySelector('#ngQ');q.value='';q.focus()};
  const x=el.querySelector('.x');if(x)x.onclick=e=>{e.stopPropagation();del(n.id)};
  const out=el.querySelector('.pt.out');if(out)out.addEventListener('pointerdown',e=>{e.stopPropagation();const a=portPos(n.id,'out');
    const mv_=ev=>{tmpWire=curve(a,toGraph(ev));drawWires();layer.querySelectorAll('.pt.in').forEach(p=>p.classList.remove('hot'));const t=document.elementFromPoint(ev.clientX,ev.clientY);if(t&&t.classList.contains('pt')&&t.classList.contains('in'))t.classList.add('hot')};
    const up=ev=>{removeEventListener('pointermove',mv_);removeEventListener('pointerup',up);tmpWire=null;const t=document.elementFromPoint(ev.clientX,ev.clientY);layer.querySelectorAll('.pt.hot').forEach(p=>p.classList.remove('hot'));
      if(t&&t.classList.contains('pt')&&t.classList.contains('in')){link(n.id,t.closest('.nd').dataset.id,+t.dataset.port)}
      else if(t&&t.closest&&t.closest('.nd')&&t.closest('.nd')!==el){const b=t.closest('.nd').dataset.id;if(TYPES[node(b).type].ins)link(n.id,b,0)}
      else if(t&&cv.contains(t)&&!t.closest('.nd')){quick(ev,stage(n.id)>=1?'motion':'still',{from:n.id,at:toGraph(ev)})}drawWires()};
    addEventListener('pointermove',mv_);addEventListener('pointerup',up)})}
function select(id){sel=id;draw();inspect();whereText();const n=id&&node(id);if(n&&TYPES[n.type].fam==='motion'&&!mOn&&userImage)selectTab('motion')}
cv.addEventListener('pointerdown',e=>{if(e.target.closest('.nd,.ng-quick,.ng-guide'))return;closeQuick();select(null);const sx=e.clientX,sy=e.clientY,vx=view.x,vy=view.y;cv.setPointerCapture(e.pointerId);
  const mv_=ev=>{view.x=vx+ev.clientX-sx;view.y=vy+ev.clientY-sy;applyView()};const up=()=>{cv.removeEventListener('pointermove',mv_);cv.removeEventListener('pointerup',up)};cv.addEventListener('pointermove',mv_);cv.addEventListener('pointerup',up)});
cv.addEventListener('dblclick',e=>{if(e.target.closest('.nd,.ng-quick,.ng-guide'))return;quick(e,libFam,{at:toGraph(e)})});
cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;if(!e.ctrlKey&&Math.abs(e.deltaX)>Math.abs(e.deltaY)){view.x-=e.deltaX;applyView();return}
  const z=Math.min(1.6,Math.max(.3,view.z*Math.exp(-e.deltaY*.0015)));view.x=mx-(mx-view.x)*z/view.z;view.y=my-(my-view.y)*z/view.z;view.z=z;applyView()},{passive:false});
win.addEventListener('keydown',e=>{if(e.target.closest('input,textarea'))return;if((e.key==='Delete'||e.key==='Backspace')&&sel){e.preventDefault();del(sel)}else if((e.key==='b'||e.key==='B')&&sel){bypass(sel)}else if(e.key==='Escape'){closeQuick();select(null)}else if(e.key==='/'){e.preventDefault();win.querySelector('#ngQ').focus()}});
function fit(){const r=cv.getBoundingClientRect();if(!r.width)return;const xs=G.nodes.map(n=>n.x),ys=G.nodes.map(n=>n.y);const gl_=cv.querySelector('.ng-guide');const top=gl_?0:0;
  const x0=Math.min(...xs)-50,x1=Math.max(...xs)+220,y0=Math.min(...ys)-80,y1=Math.max(...ys)+200;view.z=Math.min(1,Math.max(.3,Math.min(r.width/(x1-x0),(r.height-top)/(y1-y0))));
  view.x=(r.width-(x1-x0)*view.z)/2-x0*view.z;view.y=top+(r.height-top-(y1-y0)*view.z)/2-y0*view.z;applyView()}
win.querySelector('#ngFit').onclick=fit;
win.querySelector('#ngTidy').onclick=()=>{tidy();draw();fit()};
function tidy(){const depth={};const walk=(id,d)=>{if(depth[id]!==undefined&&depth[id]>=d)return;depth[id]=d;outsOf(id).forEach(l=>walk(l.b,d+1))};walk('src',0);let extra=0;G.nodes.forEach(n=>{if(depth[n.id]===undefined)depth[n.id]=++extra});
  const col={};G.nodes.slice().sort((a,b)=>a.y-b.y).forEach(n=>{const d=depth[n.id];col[d]=(col[d]||0)+1;n.x=40+d*196;n.y=140+(col[d]-1)*170})}
function tidyIfCrowded(n){const hit=G.nodes.some(o=>o!==n&&Math.abs(o.x-n.x)<170&&Math.abs(o.y-n.y)<140);if(hit){tidy();requestAnimationFrame(fit)}}
applyView();

/* add / delete */
function motionNudge(T){if(T.fam==='motion'&&!mOn){if(userImage||mHasSrc())selectTab('motion');else snack('Import an image to see motion nodes play.')}}
function addNode(type,opt={}){const T=TYPES[type];const from=opt.from||anchorFor(T.fam);const n=mkNode(type,0,0);
  const downstream=outsOf(from).filter(l=>{const sb=stage(l.b);return T.fam==='still'?sb<=1:sb>=1.5});
  G.links.push({a:from,b:n.id,port:0});downstream.forEach(l=>{l.a=n.id});
  if(opt.at){n.x=opt.at[0]-80;n.y=opt.at[1]-40;tidyIfCrowded(n)}else{tidy();requestAnimationFrame(fit)}
  select(n.id);changed(n.id);motionNudge(T);return n}
NG.add=addNode;
function del(id){if(['src','sout','mout'].includes(id))return snack('Source and outputs stay. Cut their wires instead.');const n=node(id),inp=inputOf(id,0),outs=outsOf(id);G.links=G.links.filter(l=>l.a!==id&&l.b!==id);
  if(inp)outs.forEach(l=>G.links.push({a:inp,b:l.b,port:l.port}));G.nodes=G.nodes.filter(x=>x!==n);delete outCan[id];[id,id+':mix'].forEach(k=>{if(fbos[k]){Object.values(fbos[k]).forEach(x=>x&&x.t&&freeF(x));delete fbos[k]}});
  sel=null;changed(outs[0]?.b||'sout');snack(`${TYPES[n.type].name} removed`)}
function bypass(id){const n=node(id);if(!n||TYPES[n.type].fam==='io')return;n.bypass=!n.bypass;changed(id)}

/* quick search popover (double-click canvas, or drop a wire on empty space) */
let qp=null;function closeQuick(){if(qp){qp.remove();qp=null}}
function quick(e,f,opt){closeQuick();qp=document.createElement('div');qp.className='ng-quick';const r=cv.getBoundingClientRect();qp.style.left=Math.min(r.width-290,Math.max(8,e.clientX-r.left))+'px';qp.style.top=Math.min(r.height-200,Math.max(8,e.clientY-r.top))+'px';
  qp.innerHTML=`<label class="search"><svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="text" placeholder="Add a ${f} effect…" aria-label="Search effects"></label><div class="list"></div>`;cv.appendChild(qp);
  const q=qp.querySelector('input'),list=qp.querySelector('.list');const fill=()=>{const s=q.value.trim().toLowerCase();list.innerHTML='';itemsOf(f).filter(([k,T])=>!s||(T.name+' '+T.group+' '+(T.desc||'')).toLowerCase().includes(s)).slice(0,40).forEach(([k,T])=>{const b=document.createElement('button');b.type='button';b.className='ng-it'+(f==='motion'?' m':'');b.innerHTML='<i></i><div><b></b><small></small></div>';b.querySelector('b').textContent=T.name;b.querySelector('small').textContent=T.group;b.onclick=()=>{closeQuick();addNode(k,opt)};list.appendChild(b)})};
  q.oninput=fill;q.onkeydown=ev=>{if(ev.key==='Enter')list.querySelector('.ng-it')?.click();if(ev.key==='Escape')closeQuick()};qp.addEventListener('pointerdown',ev=>ev.stopPropagation());fill();q.focus()}

/* inspector */
function nctl(p,s,cb){const w=genCtl(p,s,cb);w.querySelectorAll('[id]').forEach(el=>{const o=el.id;el.id='nd-'+o;const lb=w.querySelector(`[for="${o}"]`);if(lb)lb.htmlFor='nd-'+o});return w}
function inspect(){insp.innerHTML='';insp.classList.toggle('empty',!sel);
  if(!sel||!node(sel)){insp.innerHTML=`<div class="tip"><b>Nothing selected</b>Click a node to adjust it here.<br><br>Pick effects from the list on the left. Each one is added after the node you have selected, so you can build a chain one click at a time.<br><br><kbd>N</kbd> open or close · <kbd>/</kbd> search · <kbd>Del</kbd> delete · <kbd>B</kbd> bypass · double-click the grid to add</div>`;return}
  const n=node(sel),T=TYPES[n.type];
  const h=document.createElement('div');h.className='phead';h.innerHTML='<b></b><p></p>';h.querySelector('b').textContent=T.name;h.querySelector('p').textContent=(T.fam==='io'?'':T.fam==='still'?'Still · ':'Motion · ')+(T.desc||'');insp.appendChild(h);
  const upd=()=>{if(T.fam==='still')schedule();else{mDirty=true}};
  if(T.params.length){const ps=document.createElement('div');ps.className='params';T.params.forEach(p=>ps.appendChild(nctl(p,n.p,upd)));insp.appendChild(ps)}
  if(T.fam!=='io'&&!n.type.endsWith('blend')){const t=document.createElement('h5');t.textContent='Mix with what comes in';insp.appendChild(t);const ps=document.createElement('div');ps.className='params';
    ps.appendChild(nctl(R('amt','amount %',0,100,100),n.mix,upd));ps.appendChild(nctl(S('mode','blend',MIXM),n.mix,upd));insp.appendChild(ps)}
  if(T.fam!=='io'){const a=document.createElement('div');a.className='acts';a.innerHTML=`<button type="button" class="${n.bypass?'on':''}">${n.bypass?'Bypassed':'Bypass'}</button><button type="button">Duplicate</button><button type="button">Delete</button>`;
    const[b1,b2,b3]=a.children;b1.onclick=()=>bypass(n.id);b2.onclick=()=>{const c=addNode(n.type,{from:n.id});c.p=JSON.parse(JSON.stringify(n.p));c.mix=Object.assign({},n.mix);changed(c.id)};b3.onclick=()=>del(n.id);insp.appendChild(a)}
  else if(n.id!=='mout'){const t=document.createElement('div');t.className='tip';t.textContent=n.id==='src'?'This is where your image enters. Everything to its right changes it.':'Everything wired in here is your finished still. Motion nodes pick up from here.';insp.appendChild(t)}}

/* banners in Stack + Motion panes */
const _ra=renderActive;renderActive=function(){_ra.apply(this,arguments);if(!NG.stillActive())return;const b=document.createElement('div');b.className='ng-banner';
  b.innerHTML='<span><b>Nodes are driving the image.</b> This stack is ignored until you go back to it.</span><div class="row"><button type="button">Open nodes</button><button type="button" class="g">Use the stack again</button></div>';
  b.querySelector('button').onclick=()=>toggle(true);b.querySelector('.g').onclick=()=>{G.links=G.links.filter(l=>l.b!=='sout');G.links.push({a:'src',b:'sout',port:0});changed('sout');renderActive()};paneA.prepend(b)};
const _rm=renderMotion;renderMotion=function(){_rm.apply(this,arguments);if(!NG.motionActive())return;const p=$('#paneMotion');const b=document.createElement('div');b.className='ng-banner';
  b.innerHTML='<span><b>Motion nodes are driving the video.</b> The loop picker below is ignored. Size, length, audio and recording still apply.</span><div class="row"><button type="button">Open nodes</button></div>';
  b.querySelector('button').onclick=()=>toggle(true);p.prepend(b)};
