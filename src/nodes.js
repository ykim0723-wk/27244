/* 27244 node graph: still nodes (canvas effects) feed "Image out"; motion nodes (GPU passes) feed "Video out". */
(()=>{
const NG=window.NG={};
const ICONS={nodes:'<svg class="i" viewBox="0 0 24 24"><rect x="2.5" y="4" width="7" height="6" rx="1.5"/><rect x="14.5" y="14" width="7" height="6" rx="1.5"/><path d="M9.5 7h3a2 2 0 0 1 2 2v6a2 2 0 0 0 2 2"/></svg>',
  x:'<svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  plus:'<svg class="i" viewBox="0 0 24 24" style="width:15px;height:15px"><path d="M12 5v14M5 12h14"/></svg>',
  tidy:'<svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M4 6h6M4 12h10M4 18h16"/></svg>',
  fit:'<svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'};

/* ---------------- node types ---------------- */
const TYPES={};
TYPES.src={fam:'io',name:'Source',desc:'Your image, or a video clip loaded in Motion.',params:[],outs:1,ins:0};
TYPES.sout={fam:'io',name:'Image out',desc:'Everything wired into this becomes your still. Motion nodes start from here.',params:[],outs:1,ins:1};
TYPES.mout={fam:'io',name:'Video out',desc:'Everything wired into this plays in Motion and gets recorded.',params:[],outs:0,ins:1};
FX.forEach(f=>{TYPES['fx:'+f.id]={fam:'still',name:f.name,group:f.g,desc:(typeof DESC!=='undefined'&&DESC[f.id])||'',params:f.params,fx:f,ins:1,outs:1}});
TYPES.blend={fam:'still',name:'Blend',group:'Combine',desc:'Lay input B over input A.',ins:2,outs:1,params:[S('mode','mode',['normal','multiply','screen','overlay','difference','lighten','darken']),R('mix','B amount %',0,100,50)]};

/* motion shaders share this header */
const HEAD=`precision highp float;
uniform sampler2D T,T2,F,HS;uniform vec2 R;uniform float P,TM,BASS,KICK,HIDX,HN,Q0,Q1,Q2,Q3,Q4,Q5;varying vec2 v;
#define PI 3.14159265
#define TAU 6.2831853
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
vec2 h22(vec2 p){float n=h21(p);return vec2(n,h21(p+n+3.1));}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+1.),f.x),f.y);}
float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.03+1.7;a*=.5;}return s;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float L(vec3 c){return dot(c,vec3(.299,.587,.114));}
vec3 hrot(vec3 c,float a){const mat3 toY=mat3(.299,.596,.211,.587,-.274,-.523,.114,-.322,.312);const mat3 toR=mat3(1.,1.,1.,.956,-.272,-1.106,.621,-.647,1.703);vec3 y=toY*c;float cs=cos(a),sn=sin(a);y.yz=vec2(y.y*cs-y.z*sn,y.y*sn+y.z*cs);return toR*y;}
float mr(float x){return 1.-abs(1.-mod(x,2.));}
vec2 AS(){return vec2(R.x/R.y,1.);}
vec3 hist(float i,vec2 u){i=mod(i,32.);vec2 t=vec2(mod(i,8.),floor(i/8.));u=clamp(u,.004,.996);return texture2D(HS,(t+u)/vec2(8.,4.)).rgb;}
`;
const M=(id,o)=>{TYPES['m:'+id]=Object.assign({fam:'motion',ins:1,outs:1},o)};
M('feedback',{name:'Feedback trails',group:'Feedback',fb:1,desc:'Each frame is fed back into itself, zoomed and turned, so movement leaves trails.',
 params:[R('decay','trail length',50,99,90),R('zoom','zoom',-60,60,14),R('spin','spin',-60,60,8),R('wob','wobble',0,100,25),S('mix','combine',['lighten','add','mix']),R('hue','hue drift',0,100,0)],
 frag:`void main(){vec2 a=AS();vec2 c=(v-.5)*a;float z=1.+Q1*.0015+KICK*.012;c=rot(Q2*.0008)*c/z;c+=(vec2(fb(c*3.+TM*.2),fb(c*3.+7.-TM*.2))-.5)*Q3*.0007;
 vec3 f=texture2D(F,c/a+.5).rgb*(Q0*.01);f=hrot(f,Q5*.004);vec3 s=texture2D(T,v).rgb;vec3 col=Q4<.5?max(s,f):Q4<1.5?s*.55+f*.75:mix(s,f,Q0*.01);gl_FragColor=vec4(clamp(col,0.,1.),1.);}`});
M('edgefb',{name:'Edge feedback',group:'Feedback',fb:1,desc:'Outlines of the image glow and stream outward in a feedback loop.',
 params:[R('decay','trail length',50,99,93),R('zoom','zoom',-60,60,-18),R('spin','spin',-60,60,4),R('hue','hue shift',0,100,35),R('gain','edge strength',10,100,60),R('src','show image %',0,100,15)],
 frag:`void main(){vec2 a=AS(),e=1.5/R;float tl=L(texture2D(T,v+vec2(-e.x,e.y)).rgb),t=L(texture2D(T,v+vec2(0,e.y)).rgb),tr=L(texture2D(T,v+e).rgb),l=L(texture2D(T,v-vec2(e.x,0)).rgb),r=L(texture2D(T,v+vec2(e.x,0)).rgb),bl=L(texture2D(T,v-e).rgb),b=L(texture2D(T,v-vec2(0,e.y)).rgb),br=L(texture2D(T,v+vec2(e.x,-e.y)).rgb);
 float gx=tr+2.*r+br-tl-2.*l-bl,gy=tl+2.*t+tr-bl-2.*b-br,ed=clamp(length(vec2(gx,gy))*Q4*.03,0.,1.);vec3 s=texture2D(T,v).rgb;
 vec2 c=(v-.5)*a;c=rot(Q2*.0008)*c/(1.+Q1*.0015+KICK*.01);vec3 f=hrot(texture2D(F,c/a+.5).rgb,Q3*.004)*(Q0*.01);vec3 col=max(f,mix(vec3(ed),s,.6)*ed*1.4);col=max(col,s*Q5*.01);gl_FragColor=vec4(clamp(col,0.,1.),1.);}`});
M('kfb',{name:'Kaleido feedback',group:'Feedback',fb:1,desc:'A mirrored kaleidoscope that keeps folding back into itself.',
 params:[R('seg','segments',3,16,6),R('turn','turn speed',-50,50,10),R('decay','trail length',0,98,80),R('zoom','zoom',30,250,100),R('depth','fall',-40,40,12)],
 frag:`void main(){vec2 a=AS();vec2 c=(v-.5)*a;float r=length(c),an=atan(c.y,c.x)+TM*Q1*.02;float sg=TAU/floor(Q0);float b=mod(an,sg);b=min(b,sg-b);vec2 k=r*vec2(cos(b),sin(b))*(100./Q3);
 vec3 s=texture2D(T,vec2(mr(k.x/a.x+.5),mr(k.y+.5))).rgb;vec2 q=rot(.01)*c/(1.+Q4*.002+KICK*.01);vec3 f=texture2D(F,q/a+.5).rgb*(Q2*.01);gl_FragColor=vec4(clamp(max(s*smoothstep(.0,.06,r),f),0.,1.),1.);}`});
M('slit',{name:'Slit-scan',group:'Time',hist:1,desc:'Every row or ring shows a different moment, so motion stretches through time.',
 params:[S('dir','direction',['top to bottom','left to right','radial','noise']),R('spread','time spread (frames)',2,31,24),S('flip','order',['normal','reverse'])],
 frag:`void main(){vec2 a=AS();float d=Q0<.5?1.-v.y:Q0<1.5?v.x:Q0<2.5?clamp(length((v-.5)*a)*1.4,0.,1.):fb(v*3.+TM*.15);if(Q2>.5)d=1.-d;
 float fr=min(d*Q1,max(HN-2.,0.));float i0=floor(fr),t=fr-i0;gl_FragColor=vec4(mix(hist(HIDX-i0,v),hist(HIDX-i0-1.,v),t),1.);}`});
M('echo',{name:'Time echo',group:'Time',hist:1,desc:'Copies of earlier frames stacked on the live one. Difference mode gives strobing outlines.',
 params:[R('n','copies',2,8,5),R('delay','frames apart',1,6,3),R('fade','fade %',0,90,35),S('mode','mode',['average','lighten','difference']),R('grow','grow each copy',0,60,10)],
 frag:`void main(){vec3 acc=hist(HIDX,v);float ws=1.;for(int i=1;i<8;i++){float fi=float(i);if(fi>=Q0)break;float idx=min(fi*Q1,max(HN-1.,0.));vec2 u=(v-.5)/(1.+fi*Q4*.004)+.5;vec3 c=hist(HIDX-idx,u);float w=pow(1.-Q2*.01,fi);
  if(Q3<.5){acc+=c*w;ws+=w;}else if(Q3<1.5)acc=max(acc,c*w);else acc=abs(acc-c*w);}gl_FragColor=vec4(Q3<.5?acc/ws:acc,1.);}`});
M('displace',{name:'Noise displace',group:'Distort',desc:'Flowing noise pushes the pixels around, like heat or water.',
 params:[R('amt','amount',0,100,35),R('scale','noise scale',5,100,30),R('speed','speed',0,100,30),S('kind','noise',['flow','turbulence','ridged'])],
 frag:`void main(){vec2 c=v*AS()*Q1*.08;float t=TM*Q2*.01;vec2 d=vec2(fb(c+t),fb(c+5.2-t))-.5;if(Q3>.5&&Q3<1.5)d=vec2(fb(c+d*4.+t),fb(c+d*4.+3.-t))-.5;if(Q3>1.5)d=(.5-abs(d))*sign(d);
 vec2 u=v+d*Q0*.004*(1.+BASS*.8);gl_FragColor=vec4(texture2D(T,vec2(mr(u.x),mr(u.y))).rgb,1.);}`});
M('tile',{name:'Tile scroll',group:'Distort',desc:'Repeats the image in a grid that scrolls in a seamless loop.',
 params:[R('nx','tiles across',1,8,3),R('ny','tiles down',1,8,3),R('sx','scroll across (per loop)',-4,4,1),R('sy','scroll down (per loop)',-4,4,0),S('mir','edges',['mirror','repeat'])],
 frag:`void main(){vec2 u=v*vec2(Q0,Q1)+vec2(Q2,Q3)*P;u=Q4<.5?vec2(mr(u.x),mr(u.y)):fract(u);gl_FragColor=vec4(texture2D(T,u).rgb,1.);}`});
M('rutt',{name:'Rutt-Etra lines',group:'Generative',desc:'Scanlines lifted by brightness, the classic video-synth look.',
 params:[R('lines','lines',20,160,70),R('height','lift',0,100,45),R('thick','line weight',1,10,3),R('wave','wave',0,100,20),S('look','colors',['image on black','white on black','black on white'])],
 frag:`void main(){float N=floor(Q0),amp=Q1*.01*7./N,th=Q2*.0005+.6/R.y;float b=floor(v.y*N);vec3 bg=Q4>1.5?vec3(1.):vec3(0.);vec3 col=bg;
 for(int j=-9;j<=9;j++){float row=b+float(j);float yb=(row+.5)/N;vec3 s=texture2D(T,vec2(v.x,yb)).rgb;float yd=yb+(L(s)-.3)*amp+sin(v.x*7.+TM*2.+row*.4)*Q3*.00015*7.;
  float m=smoothstep(th,th*.4,abs(v.y-yd));vec3 lc=Q4<.5?s*1.25:Q4<1.5?vec3(1.):vec3(0.);col=mix(col,lc,m);}gl_FragColor=vec4(col,1.);}`});
M('rd',{name:'Reaction-diffusion',group:'Generative',rd:1,desc:'Two virtual chemicals grow living patterns out of the dark parts of the image.',
 params:[R('steps','growth speed',2,16,8),S('kind','pattern',['coral','mitosis','worms','spots']),R('seed','seed from image',0,100,40),S('look','colors',['image colors','ink','heat'])],
 sim:`void main(){vec2 e=1./R;vec2 c=texture2D(F,v).rg;vec2 lap=-c+.2*(texture2D(F,v+vec2(e.x,0)).rg+texture2D(F,v-vec2(e.x,0)).rg+texture2D(F,v+vec2(0,e.y)).rg+texture2D(F,v-vec2(0,e.y)).rg)+.05*(texture2D(F,v+e).rg+texture2D(F,v-e).rg+texture2D(F,v+vec2(e.x,-e.y)).rg+texture2D(F,v+vec2(-e.x,e.y)).rg);
 float fe=Q1<.5?.0545:Q1<1.5?.0367:Q1<2.5?.078:.035,ki=Q1<.5?.062:Q1<1.5?.0649:Q1<2.5?.061:.065;float uv2=c.x*c.y*c.y;vec2 n=c+vec2(lap.x-uv2+fe*(1.-c.x),.5*lap.y+uv2-(fe+ki)*c.y);
 float s=L(texture2D(T,v).rgb);if(s<.35&&h21(v*R+HIDX)<Q2*.002)n.y=.9;gl_FragColor=vec4(clamp(n,0.,1.),0.,1.);}`,
 frag:`void main(){float t=smoothstep(.12,.38,texture2D(F,v).g);vec3 s=texture2D(T,v).rgb;vec3 col=Q3<.5?mix(s*.12,min(s*1.3,1.),t):Q3<1.5?vec3(1.-t):hrot(vec3(1.,.25,.1),t*3.+TM*.2)*t+vec3(.03,.0,.08)*(1.-t);gl_FragColor=vec4(col,1.);}`});
M('dissolve',{name:'Particle dissolve',group:'Generative',desc:'The image breaks into grains that drift away and come back each loop.',
 params:[R('amt','how far',0,100,70),S('dir','drift',['up','outward','wind']),R('grain','grain',5,100,45),R('spread','scatter',0,100,40),S('bg','background',['black','white','transparent'])],
 frag:`void main(){vec2 a=AS();float prog=(.5-.5*cos(TAU*P))*Q0*.012;float n=fb(v*a*Q2*.12)*.85+h21(floor(v*R/2.))*.15;float d=max(0.,prog-n);
 vec2 dv=Q1<.5?vec2(0.,1.):Q1<1.5?normalize((v-.5)*a+1e-4)/a:vec2(1.,.3);vec2 j=(h22(floor(v*R/3.)+floor(TM*6.))-.5)*Q3*.004;vec2 u=v-dv*d*.7-j*d*10.;
 vec3 bg=Q4<.5?vec3(0.):vec3(1.);vec3 s=texture2D(T,u).rgb;float k=1.-smoothstep(0.,.3,d);gl_FragColor=vec4(mix(bg,s,k),1.);}`});
M('bloom',{name:'Bloom glow',group:'Light & color',desc:'Bright areas bleed light, and can pulse on the beat.',
 params:[R('th','threshold',0,95,55),R('rad','radius',1,60,18),R('amt','intensity',0,100,55),R('beat','pulse on beat',0,100,40)],
 frag:`void main(){vec3 s=texture2D(T,v).rgb;vec3 acc=vec3(0);float w=0.;for(int i=0;i<28;i++){float fi=float(i);float r=sqrt(fi/28.)*Q1/R.y*12.;float an=fi*2.39996;vec2 o=vec2(cos(an),sin(an))*r*vec2(R.y/R.x,1.);vec3 c=texture2D(T,v+o).rgb;acc+=max(c-Q0*.01,0.);w+=1.;}
 gl_FragColor=vec4(clamp(s+acc/w*Q2*.06*(1.+KICK*Q3*.03),0.,1.),1.);}`});
M('rgb',{name:'RGB drift',group:'Light & color',desc:'Color channels slide apart and orbit, harder on the beat.',
 params:[R('amt','offset',0,100,30),R('speed','orbit speed',0,100,30),R('beat','beat kick',0,100,50)],
 frag:`void main(){float an=TM*Q1*.05;vec2 o=vec2(cos(an),sin(an))*Q0*.0003*(1.+KICK*Q2*.04)*vec2(R.y/R.x,1.);gl_FragColor=vec4(texture2D(T,v+o).r,texture2D(T,v).g,texture2D(T,v-o).b,1.);}`});
M('color',{name:'Color cycle',group:'Light & color',desc:'Hue turns through the loop; saturation, contrast and a beat flash.',
 params:[R('cyc','hue turns per loop',0,4,1),R('sat','saturation %',0,200,110),R('con','contrast %',50,200,110),R('flash','invert on beat',0,100,0)],
 frag:`void main(){vec3 c=texture2D(T,v).rgb;c=hrot(c,TAU*P*floor(Q0));float l=L(c);c=mix(vec3(l),c,Q1*.01);c=(c-.5)*Q2*.01+.5;c=mix(c,1.-c,clamp(KICK*Q3*.012,0.,1.));gl_FragColor=vec4(clamp(c,0.,1.),1.);}`});
M('mosaic',{name:'Mosaic pulse',group:'Light & color',desc:'Pixel blocks that grow and shrink with the loop or the beat.',
 params:[R('min','smallest block',1,40,2),R('max','largest block',4,120,36),R('beat','follow the beat %',0,100,50)],
 frag:`void main(){float env=mix(.5-.5*cos(TAU*P),KICK,Q2*.01);float cs=max(1.,mix(Q0,Q1,env));vec2 u=(floor(v*R/cs)+.5)*cs/R;gl_FragColor=vec4(texture2D(T,u).rgb,1.);}`});
M('loop',{name:'Classic loop',group:'Distort',classic:1,desc:'Any of the 18 original Motion loops (Droste, tunnel, melt, VHS…) as a node.',
 params:[S('mode','loop',MMODES.map(m=>m.name)),R('amt','amount',0,100,55),R('cyc','cycles',1,4,1),R('sym','symmetry',1,12,1),R('tiles','tiles',1,4,1)]});
M('mblend',{name:'Blend',group:'Combine',ins:2,desc:'Mix two motion branches.',
 params:[S('mode','mode',['screen','add','multiply','difference','lighten']),R('mix','B amount %',0,100,50)],
 frag:`void main(){vec3 a=texture2D(T,v).rgb,b=texture2D(T2,v).rgb;vec3 c=Q0<.5?1.-(1.-a)*(1.-b):Q0<1.5?a+b:Q0<2.5?a*b:Q0<3.5?abs(a-b):max(a,b);gl_FragColor=vec4(clamp(mix(a,c,Q1*.01),0.,1.),1.);}`});

const STILL_GROUPS=[...(typeof CAT_ORDER!=='undefined'?CAT_ORDER:[]),...new Set(FX.map(f=>f.g))].filter((g,i,a)=>a.indexOf(g)===i);STILL_GROUPS.push('Combine');
const MOTION_GROUPS=['Feedback','Time','Distort','Generative','Light & color','Combine'];

/* ---------------- graph ---------------- */
let seq=1;const G={nodes:[],links:[]};
const node=id=>G.nodes.find(n=>n.id===id);
const inputOf=(id,port=0)=>{const l=G.links.find(l=>l.b===id&&l.port===port);return l?l.a:null};
const outsOf=id=>G.links.filter(l=>l.a===id);
function mkNode(type,x,y,p){const T=TYPES[type],n={id:type==='src'||type==='sout'||type==='mout'?type:'n'+(seq++),type,x,y,p:{},bypass:false,mix:{amt:100,mode:'normal'}};T.params.forEach(q=>n.p[q.k]=q.v);if(p)Object.assign(n.p,p);G.nodes.push(n);return n}
mkNode('src',40,120);mkNode('sout',460,120);mkNode('mout',880,120);
G.links.push({a:'src',b:'sout',port:0},{a:'sout',b:'mout',port:0});
const fam=id=>TYPES[node(id).type].fam;
function stage(id){const n=node(id);if(n.type==='src')return 0;if(n.type==='sout')return 1;if(n.type==='mout')return 2;return fam(id)==='still'?0.5:1.5}
function canLink(a,b){if(a===b)return'A node can’t feed itself.';const sa=stage(a),sb=stage(b);
  if(sb<=sa&&!(sa===0&&sb===0.5)&&!(sa===0.5&&sb===0.5)&&!(sa===1.5&&sb===1.5))return'Still nodes run before Image out and motion nodes after it.';
  if(sb===0.5&&sa>0.5)return'Still nodes can only take still inputs.';if(sb===1&&sa>0.5)return'Image out takes a still input.';if(sb===1.5&&sa<1)return'Motion nodes start from Image out.';if(sb===2&&sa<1)return'Video out takes Image out or a motion node.';
  let s=[a],seen=new Set();while(s.length){const x=s.pop();if(x===b)return'That would make a loop.';if(seen.has(x))continue;seen.add(x);G.links.filter(l=>l.b===x).forEach(l=>s.push(l.a))}return null}
function link(a,b,port=0){const why=canLink(a,b);if(why){snack(why);return false}G.links=G.links.filter(l=>!(l.b===b&&l.port===port));G.links.push({a,b,port});changed(b);return true}
const isActive=()=>G.nodes.some(n=>n.type!=='src'&&n.type!=='sout'&&n.type!=='mout');
NG.stillActive=()=>inputOf('sout')!=='src'&&isActive();
NG.motionActive=()=>{const i=inputOf('mout');return!!i&&i!=='sout'};
NG.graph=G;

function changed(id){const f=id?fam(id):'still';if(f!=='motion'||!id){schedule()}if(f==='motion'||id==='mout'){mDirty=true;if(typeof mKick==='function')mKick()}draw();inspect()}

/* ---------------- still engine ---------------- */
const pool={};const blank=document.createElement('canvas');
function tmpFor(W,H){const k=W+'x'+H;if(!pool[k]){const c=document.createElement('canvas');c.width=W;c.height=H;pool[k]={c,x:c.getContext('2d',{willReadFrequently:true})}}return pool[k]}
function srcStamp(){const c=tmpFor(12,12);c.x.clearRect(0,0,12,12);c.x.drawImage(src,0,0,12,12);return src.width+'x'+src.height+':'+Array.from(c.x.getImageData(0,0,12,12).data.filter((_,i)=>i%7===0)).join('.')}
function runFx(f,p,inp,out){const W=inp.width,H=inp.height;out.width=W;out.height=H;const ctx=out.getContext('2d',{willReadFrequently:true});ctx.clearRect(0,0,W,H);ctx.drawImage(inp,0,0);
  const t=tmpFor(W,H),c={W,H,ctx,view:out,tmp:t.c,tctx:t.x,s:p,get:()=>ctx.getImageData(0,0,W,H),put:d=>ctx.putImageData(d,0,0),snap:()=>{t.x.clearRect(0,0,W,H);t.x.drawImage(out,0,0)},lum:px=>{const l=new Float32Array(W*H);for(let i=0;i<W*H;i++)l[i]=L(px,i*4);return l}};
  ctx.save();try{f.run(c)}catch(e){console.error(f.id,e)}ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
const outCan={};let stamp='';
function evalStill(id,memo){if(memo[id])return memo[id];const n=node(id),T=TYPES[n.type];let r;
  if(n.type==='src')r={c:src,k:stamp};
  else{const ins=[];for(let i=0;i<(T.ins||0);i++){const a=inputOf(id,i);ins.push(a?evalStill(a,memo):null)}
    if(n.type==='sout'||n.bypass){r=ins[0]||{c:blankOf(),k:'blank'}}
    else{const key=n.type+JSON.stringify(n.p)+JSON.stringify(n.mix)+'|'+ins.map(x=>x?x.k:'-').join('|');const oc=outCan[id]||(outCan[id]={c:document.createElement('canvas'),k:''});
      if(oc.k!==key){const a=ins[0]?ins[0].c:blankOf();
        if(T.fx){runFx(T.fx,n.p,a,oc.c);if(n.mix.amt<100||n.mix.mode!=='normal'){const t=tmpFor(a.width,a.height);t.x.globalAlpha=1;t.x.globalCompositeOperation='source-over';t.x.clearRect(0,0,a.width,a.height);t.x.drawImage(a,0,0);t.x.globalAlpha=n.mix.amt/100;t.x.globalCompositeOperation=GCO[n.mix.mode]||'source-over';t.x.drawImage(oc.c,0,0);t.x.globalAlpha=1;t.x.globalCompositeOperation='source-over';const ox=oc.c.getContext('2d');ox.clearRect(0,0,a.width,a.height);ox.drawImage(t.c,0,0)}}
        else if(n.type==='blend'){oc.c.width=a.width;oc.c.height=a.height;const x=oc.c.getContext('2d');x.clearRect(0,0,a.width,a.height);x.drawImage(a,0,0);if(ins[1]){x.globalAlpha=n.p.mix/100;x.globalCompositeOperation=n.p.mode==='normal'?'source-over':n.p.mode;x.drawImage(ins[1].c,0,0,a.width,a.height);x.globalAlpha=1;x.globalCompositeOperation='source-over'}}
        oc.k=key}r={c:oc.c,k:key}}}
  memo[id]=r;return r}
function blankOf(){if(blank.width!==src.width||blank.height!==src.height){blank.width=src.width;blank.height=src.height}return blank}
NG.renderStill=out=>{stamp=srcStamp();const memo={};const r=evalStill('sout',memo);out.width=r.c.width;out.height=r.c.height;const x=out.getContext('2d');x.clearRect(0,0,out.width,out.height);x.drawImage(r.c,0,0);NG.lastMemo=memo;requestAnimationFrame(drawThumbs)};

/* ---------------- motion engine (WebGL passes on the Motion canvas) ---------------- */
const progs={};let vbuf=null,frame=null,copyP=null,histI=0,histN=0,fext=null;const fbos={};
function compile(fs){const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(o))}return o};
  const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0,1);}'));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.bindAttribLocation(p,0,'p');gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){console.error(gl.getProgramInfoLog(p));return null}const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const a=gl.getActiveUniform(p,i);u[a.name]=gl.getUniformLocation(p,a.name)}return{p,u}}
function tex(w,h,type,filter){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,type||gl.UNSIGNED_BYTE,null);
  const fl=filter||gl.LINEAR;[[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE],[gl.TEXTURE_MIN_FILTER,fl],[gl.TEXTURE_MAG_FILTER,fl]].forEach(([k,x])=>gl.texParameteri(gl.TEXTURE_2D,k,x));return t}
function fbo(w,h,type,filter){const t=tex(w,h,type,filter),f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
  const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;return{t,f,w,h,ok}}
function freeF(o){if(!o)return;gl.deleteTexture(o.t);gl.deleteFramebuffer(o.f)}
function halfType(){if(fext!==null)return fext;const e=gl.getExtension('OES_texture_half_float');gl.getExtension('EXT_color_buffer_half_float');fext=e?e.HALF_FLOAT_OES:0;
  if(fext){const t=fbo(4,4,fext,gl.NEAREST);if(!t.ok)fext=0;freeF(t)}return fext}
function bufs(id,W,H,kind){let b=fbos[id];if(b&&b.W===W&&b.H===H&&b.kind===kind)return b;if(b)Object.values(b).forEach(x=>x&&x.t&&freeF(x));b=fbos[id]={W,H,kind,out:fbo(W,H)};
  if(kind==='fb'){b.prev=fbo(W,H);clearF(b.prev,0,0,0,1)}
  if(kind==='hist'){const tw=Math.min(Math.round(W/3),Math.floor(4096/8)),th=Math.min(Math.round(H/3),Math.floor(4096/4));b.atlas=fbo(tw*8,th*4);b.tw=tw;b.th=th;clearF(b.atlas,0,0,0,1);b.n=0}
  if(kind==='rd'){const ht=halfType()||gl.UNSIGNED_BYTE;b.s1=fbo(W>>1,H>>1,ht,gl.NEAREST);b.s2=fbo(W>>1,H>>1,ht,gl.NEAREST);clearF(b.s1,1,0,0,1);clearF(b.s2,1,0,0,1)}return b}
function clearF(o,r,g,bb,a){gl.bindFramebuffer(gl.FRAMEBUFFER,o.f);gl.viewport(0,0,o.w,o.h);gl.clearColor(r,g,bb,a);gl.clear(gl.COLOR_BUFFER_BIT)}
function quad(){if(!vbuf){vbuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vbuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW)}gl.bindBuffer(gl.ARRAY_BUFFER,vbuf);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLES,0,3)}
function prog(key,fs){if(!(key in progs))progs[key]=compile(fs);return progs[key]}
function bindT(unit,t){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t)}
function run(pr,target,texs,U,vp){gl.useProgram(pr.p);gl.bindFramebuffer(gl.FRAMEBUFFER,target?target.f:null);const v=vp||[0,0,target?target.w:mv.width,target?target.h:mv.height];gl.viewport(...v);
  ['T','T2','F','HS'].forEach((n,i)=>{if(pr.u[n]!==undefined){bindT(i,texs[n]||null);gl.uniform1i(pr.u[n],i)}});
  for(const k in U){const l=pr.u[k];if(l===undefined)continue;const x=U[k];Array.isArray(x)?(x.length===2?gl.uniform2f(l,...x):gl.uniform3f(l,...x)):gl.uniform1f(l,x)}quad()}
const FRAME_FS=`precision highp float;uniform sampler2D T;uniform vec2 R;uniform float A,K,FIT;uniform vec3 BG;varying vec2 v;float mr(float x){return 1.-abs(1.-mod(x,2.));}
void main(){vec2 c=(v-.5)*vec2(R.x/R.y,1.);vec2 u=c/(vec2(A,1.)*K)+.5;if(FIT>.5&&(u.x<0.||u.x>1.||u.y<0.||u.y>1.)){gl_FragColor=vec4(BG,1.);return;}gl_FragColor=vec4(texture2D(T,vec2(mr(u.x),mr(u.y))).rgb,1.);}`;
const COPY_FS=`precision highp float;uniform sampler2D T;varying vec2 v;void main(){gl_FragColor=vec4(texture2D(T,v).rgb,1.);}`;
const MIXM=['normal','multiply','screen','overlay','soft light','difference','add','lighten','darken'];
const GCO={normal:'source-over',multiply:'multiply',screen:'screen',overlay:'overlay','soft light':'soft-light',difference:'difference',add:'lighter',lighten:'lighten',darken:'darken'};
const MIX_FS=`precision highp float;uniform sampler2D T,T2;uniform float AMT,MODE;varying vec2 v;
void main(){vec3 a=texture2D(T,v).rgb,b=texture2D(T2,v).rgb;vec3 c=b;if(MODE>.5&&MODE<1.5)c=a*b;else if(MODE>1.5&&MODE<2.5)c=1.-(1.-a)*(1.-b);else if(MODE>2.5&&MODE<3.5)c=mix(2.*a*b,1.-2.*(1.-a)*(1.-b),step(.5,a));else if(MODE>3.5&&MODE<4.5)c=mix(2.*a*b+a*a*(1.-2.*b),sqrt(a)*(2.*b-1.)+2.*a*(1.-b),step(.5,b));else if(MODE>4.5&&MODE<5.5)c=abs(a-b);else if(MODE>5.5&&MODE<6.5)c=min(a+b,1.);else if(MODE>6.5&&MODE<7.5)c=max(a,b);else if(MODE>7.5)c=min(a,b);gl_FragColor=vec4(mix(a,c,AMT),1.);}`;
NG.thumbTex=(t,cvs)=>{const w=cvs.width,h=cvs.height;const f=bufs('__thumb',w,h,'plain');run(prog('copy',COPY_FS),f.out,{T:t},{});const px=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  const id=new ImageData(w,h);for(let y=0;y<h;y++)id.data.set(px.subarray((h-1-y)*w*4,(h-y)*w*4),y*w*4);cvs.getContext('2d').putImageData(id,0,0)};
function qv(n){const T=TYPES[n.type];return T.params.map(p=>p.type==='select'?p.opts.indexOf(n.p[p.k]):+n.p[p.k])}
NG.drawMotion=o=>{const W=mv.width,H=mv.height;const fr=bufs('__frame',W,H,'plain');const bg=hex(ms.bg);
  run(prog('frame',FRAME_FS),fr.out,{T:mTex},{R:[W,H],A:o.A,K:ms.fit==='fill'?Math.max(1,o.oa/o.A):Math.min(1,o.oa/o.A),FIT:ms.fit==='fit'?1:0,BG:[bg[0]/255,bg[1]/255,bg[2]/255]});
  histI=(histI+1)%32;const memo={};const base={R:[W,H],P:o.P,TM:o.now/1000,BASS:o.b,KICK:o.k};
  const ev=id=>{if(memo[id])return memo[id];const n=node(id);let r,A;
    if(id==='sout')r=fr.out.t;
    else{const T=TYPES[n.type],a=inputOf(id,0);A=a?ev(a):fr.out.t;
      if(n.bypass)r=A;
      else if(T.classic){const b=bufs(id,W,H,'plain');gl.useProgram(mProg);gl.bindFramebuffer(gl.FRAMEBUFFER,b.out.f);gl.viewport(0,0,W,H);bindT(0,A);gl.uniform1i(mU.T,0);const f=(k,x)=>gl.uniform1f(mU[k],x);
        gl.uniform2f(mU.R,W,H);gl.uniform3f(mU.BG,bg[0]/255,bg[1]/255,bg[2]/255);f('A',W/H);f('K',1);f('FIT',0);f('P',o.P);f('TM',o.now/1000);f('MODE',MMODES.findIndex(m=>m.name===n.p.mode));f('AMT',n.p.amt/100);f('WET',1);f('SYM',n.p.sym);f('TILES',n.p.tiles);f('CYC',n.p.cyc);f('BASS',o.b);f('MID',o.m);f('HIGH',o.h);f('KICK',o.k);f('HUE',0);quad();r=b.out.t}
      else{const q=qv(n),U=Object.assign({},base,{Q0:q[0]||0,Q1:q[1]||0,Q2:q[2]||0,Q3:q[3]||0,Q4:q[4]||0,Q5:q[5]||0});const pr=prog(n.type,HEAD+T.frag);if(!pr){r=A}
        else if(T.fb){const b=bufs(id,W,H,'fb');run(pr,b.out,{T:A,F:b.prev.t},U);[b.out,b.prev]=[b.prev,b.out];r=b.prev.t}
        else if(T.hist){const b=bufs(id,W,H,'hist');const ix=b.n%32;run(prog('copy',COPY_FS),b.atlas,{T:A},{},[(ix%8)*b.tw,Math.floor(ix/8)*b.th,b.tw,b.th]);b.n++;
          run(pr,b.out,{T:A,HS:b.atlas.t},Object.assign(U,{HIDX:ix,HN:Math.min(b.n,32)}));r=b.out.t}
        else if(T.rd){const b=bufs(id,W,H,'rd');const sp=prog(n.type+':sim',HEAD+T.sim);const steps=Math.round(n.p.steps);for(let i=0;i<steps;i++){run(sp,b.s2,{T:A,F:b.s1.t},Object.assign({},U,{R:[b.s1.w,b.s1.h],HIDX:i+histI*17}));[b.s1,b.s2]=[b.s2,b.s1]}
          run(pr,b.out,{T:A,F:b.s1.t},U);r=b.out.t}
        else if(n.type==='m:mblend'){const b2=inputOf(id,1);const B=b2?ev(b2):A;const b=bufs(id,W,H,'plain');run(pr,b.out,{T:A,T2:B},U);r=b.out.t}
        else{const b=bufs(id,W,H,'plain');run(pr,b.out,{T:A},U);r=b.out.t}}}
    if(A&&!n.bypass&&n.mix&&(n.mix.amt<100||n.mix.mode!=='normal')&&n.type!=='m:mblend'){const b=bufs(id+':mix',W,H,'plain');run(prog('mix',MIX_FS),b.out,{T:A,T2:r},{AMT:n.mix.amt/100,MODE:MIXM.indexOf(n.mix.mode)});r=b.out.t}
    memo[id]=r;return r};
  const last=ev(inputOf('mout'));if(NG.onMotion)NG.onMotion(memo,o.now);run(prog('copy',COPY_FS),null,{T:last},{});
  gl.useProgram(mProg);bindT(0,mTex);gl.uniform1i(mU.T,0);gl.bindFramebuffer(gl.FRAMEBUFFER,null)};

/*UI*/
})();
