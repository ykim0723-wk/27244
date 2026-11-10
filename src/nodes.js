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
function mkNode(type,x,y,p){const T=TYPES[type],n={id:type==='src'||type==='sout'||type==='mout'?type:'n'+(seq++),type,x,y,p:{},bypass:false};T.params.forEach(q=>n.p[q.k]=q.v);if(p)Object.assign(n.p,p);G.nodes.push(n);return n}
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
    else{const key=n.type+JSON.stringify(n.p)+'|'+ins.map(x=>x?x.k:'-').join('|');const oc=outCan[id]||(outCan[id]={c:document.createElement('canvas'),k:''});
      if(oc.k!==key){const a=ins[0]?ins[0].c:blankOf();
        if(T.fx)runFx(T.fx,n.p,a,oc.c);
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
function qv(n){const T=TYPES[n.type];return T.params.map(p=>p.type==='select'?p.opts.indexOf(n.p[p.k]):+n.p[p.k])}
NG.drawMotion=o=>{const W=mv.width,H=mv.height;const fr=bufs('__frame',W,H,'plain');const bg=hex(ms.bg);
  run(prog('frame',FRAME_FS),fr.out,{T:mTex},{R:[W,H],A:o.A,K:ms.fit==='fill'?Math.max(1,o.oa/o.A):Math.min(1,o.oa/o.A),FIT:ms.fit==='fit'?1:0,BG:[bg[0]/255,bg[1]/255,bg[2]/255]});
  histI=(histI+1)%32;const memo={};const base={R:[W,H],P:o.P,TM:o.now/1000,BASS:o.b,KICK:o.k};
  const ev=id=>{if(memo[id])return memo[id];const n=node(id);let r;
    if(id==='sout')r=fr.out.t;
    else{const T=TYPES[n.type],a=inputOf(id,0),A=a?ev(a):fr.out.t;
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
    memo[id]=r;return r};
  const last=ev(inputOf('mout'));run(prog('copy',COPY_FS),null,{T:last},{});
  gl.useProgram(mProg);bindT(0,mTex);gl.uniform1i(mU.T,0);gl.bindFramebuffer(gl.FRAMEBUFFER,null)};

/* ---------------- window UI ---------------- */
const css=document.createElement('style');css.textContent=`
.ngwin{position:fixed;z-index:45;left:calc(var(--railw) + 16px);bottom:16px;width:min(860px,calc(100vw - var(--railw) - var(--sidew) - 32px));height:min(400px,52vh);min-width:420px;min-height:260px;background:var(--surface);border-radius:14px;box-shadow:0 0 0 1px var(--line-2),0 30px 80px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;resize:both}
.ng-head{display:flex;align-items:center;gap:6px;padding:6px 6px 6px 14px;border-bottom:1px solid var(--line);cursor:grab;user-select:none;touch-action:none}
.ng-head b{font:900 13px var(--display);font-stretch:125%;letter-spacing:-.01em;margin-right:6px}
.ng-head .sp{flex:1}
.ng-add-btn{height:30px;border-radius:8px;border:1px solid var(--line-2);background:var(--surface);padding:0 10px 0 7px;font:700 11.5px var(--ui);display:inline-flex;align-items:center;gap:5px;color:var(--ink)}
.ng-add-btn.m{background:var(--ink);color:#fff;border-color:var(--ink)}
.ng-add-btn:hover{filter:brightness(.96)}
.ng-head .icon-btn{width:30px;height:30px;border-radius:8px}
.ng-body{flex:1;display:grid;grid-template-columns:minmax(0,1fr) 250px;min-height:0}
.ng-canvas{position:relative;overflow:hidden;outline:none;background:var(--bg);background-image:radial-gradient(var(--line-2) 1px,transparent 1.2px);background-size:22px 22px;cursor:default;touch-action:none}
.ng-layer{position:absolute;left:0;top:0;transform-origin:0 0}
.ng-wires{position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible;pointer-events:none}
.ng-wires path{fill:none;stroke:var(--ink);stroke-width:1.6}
.ng-wires path.m{stroke-dasharray:5 4}
.ng-wires path.hit{stroke:transparent;stroke-width:12;pointer-events:stroke;cursor:pointer}
.ng-wires path.hit:hover + path,.ng-wires path.tmp{stroke:#9a9994}
.ng-lane{position:absolute;top:-4000px;height:8000px;width:0;border-left:1.5px dashed var(--line-2);pointer-events:none}
.ng-lane span{position:absolute;top:4000px;font:700 10px var(--ui);letter-spacing:.16em;color:var(--mute);white-space:nowrap;transform:translateY(-34px)}
.ng-lane .l{right:12px}.ng-lane .r{left:12px}
.nd{position:absolute;width:150px;border-radius:10px;background:var(--surface);box-shadow:0 0 0 1.5px var(--ink),0 6px 16px rgba(0,0,0,.06);font:600 11px var(--ui);user-select:none}
.nd.motion{background:var(--ink);color:#fff}
.nd.io{background:var(--surface-2);box-shadow:0 0 0 1.5px var(--line-2)}
.nd.sel{box-shadow:0 0 0 3px var(--ink),0 0 0 5px var(--surface),0 10px 26px rgba(0,0,0,.16)}
.nd.motion.sel{box-shadow:0 0 0 3px var(--ink),0 0 0 5px #9a9994,0 10px 26px rgba(0,0,0,.2)}
.nd.byp{opacity:.45}
.nd-h{display:flex;align-items:center;gap:6px;padding:7px 9px 5px;cursor:grab}
.nd-h b{flex:1;min-width:0;font:700 11.5px var(--ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nd-h small{font:700 8.5px var(--ui);letter-spacing:.12em;opacity:.55}
.nd canvas{display:block;width:134px;height:64px;margin:0 8px 8px;border-radius:6px;background:var(--surface-2);object-fit:contain}
.nd.motion .gly{height:64px;margin:0 8px 8px;border-radius:6px;background:repeating-linear-gradient(90deg,#1d1d1d 0 6px,#262626 6px 12px);display:grid;place-items:center;font:700 9px var(--ui);letter-spacing:.14em;color:#9a9994}
.pt{position:absolute;width:14px;height:14px;border-radius:50%;background:var(--surface);box-shadow:0 0 0 1.5px var(--ink);top:44px;cursor:crosshair}
.nd.motion .pt{background:var(--ink);box-shadow:0 0 0 1.5px #fff}
.pt.in{left:-7px}.pt.out{right:-7px}.pt.in.b{top:66px}.pt.in.a2{top:30px}
.pt:hover{transform:scale(1.25)}
.pt-l{position:absolute;left:10px;font:700 8.5px var(--ui);opacity:.6}
.ng-insp{border-left:1px solid var(--line);overflow:auto;background:var(--surface)}
.ng-insp .phead{padding:14px 14px 10px}.ng-insp .phead b{font-size:17px}
.ng-insp .params{padding:12px 14px 16px}
.ng-insp .acts{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 14px}
.ng-insp .acts button{height:30px;border-radius:8px;border:1px solid var(--line-2);background:var(--surface);font:700 11px var(--ui);padding:0 10px}
.ng-insp .acts button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.ng-empty{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;color:var(--mute);font-size:12px;pointer-events:none;max-width:34ch;line-height:1.5}
.ng-empty b{display:block;color:var(--ink);font:900 18px var(--display);font-stretch:125%;margin-bottom:6px}
.ng-menu{position:absolute;z-index:5;width:300px;max-height:min(360px,80%);display:flex;flex-direction:column;background:var(--surface);border-radius:12px;box-shadow:0 0 0 1px var(--line-2),0 20px 50px rgba(0,0,0,.18);overflow:hidden}
.ng-menu .search{margin:8px;height:34px}
.ng-menu .tabs2{display:flex;gap:4px;padding:0 8px 6px}
.ng-menu .tabs2 button{flex:1;height:28px;border-radius:7px;border:1px solid var(--line-2);background:var(--surface);font:700 11px var(--ui)}
.ng-menu .tabs2 button[aria-pressed="true"]{background:var(--ink);color:#fff;border-color:var(--ink)}
.ng-menu .list{overflow:auto;padding:0 4px 6px}
.ng-menu h4{margin:8px 8px 2px;font:700 9.5px var(--ui);letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
.ng-menu .it{display:flex;flex-direction:column;align-items:flex-start;width:100%;border:0;background:none;text-align:left;padding:6px 8px;border-radius:7px}
.ng-menu .it:hover,.ng-menu .it.k{background:var(--surface-2)}
.ng-menu .it b{font:700 12px var(--ui)}.ng-menu .it small{color:var(--mute);font-size:10.5px;line-height:1.35}
.ng-banner{margin:12px 18px 0;padding:10px 12px;border-radius:10px;background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line-2);font-size:12px;color:var(--ink);display:flex;flex-direction:column;gap:6px}
.ng-banner .row{display:flex;gap:6px;flex-wrap:wrap}
.ng-banner button{height:28px;border-radius:7px;border:1px solid var(--ink);background:var(--ink);color:#fff;font:700 11px var(--ui);padding:0 10px}
.ng-banner button.g{background:transparent;color:var(--ink)}
#nodesBtn[aria-pressed="true"]{background:var(--ink);color:#fff}
@media (max-width:960px){.ngwin{left:8px;right:8px;width:auto;bottom:calc(76px + env(safe-area-inset-bottom,0px));height:min(62vh,520px);min-width:0;resize:none}.ng-body{grid-template-columns:1fr}.ng-insp{position:absolute;left:0;right:0;bottom:0;max-height:55%;border-left:0;border-top:1px solid var(--line);box-shadow:0 -10px 30px rgba(0,0,0,.08)}.ng-insp:empty{display:none}}`;
document.head.appendChild(css);

const win=document.createElement('div');win.className='ngwin';win.id='ngWin';win.hidden=true;win.setAttribute('role','dialog');win.setAttribute('aria-label','Node graph');
win.innerHTML=`<div class="ng-head" id="ngHead"><b>Nodes</b><button class="ng-add-btn" type="button" data-f="still">${ICONS.plus}Still</button><button class="ng-add-btn m" type="button" data-f="motion">${ICONS.plus}Motion</button><span class="sp"></span>
<button class="icon-btn" type="button" id="ngTidy" title="Tidy layout">${ICONS.tidy}</button><button class="icon-btn" type="button" id="ngFit" title="Fit to window">${ICONS.fit}</button><button class="icon-btn" type="button" id="ngClose" title="Close (N)" aria-label="Close nodes">${ICONS.x}</button></div>
<div class="ng-body"><div class="ng-canvas" id="ngCanvas" tabindex="0"><div class="ng-layer" id="ngLayer"><svg class="ng-wires" id="ngWires"></svg></div><div class="ng-empty" id="ngEmpty"><b>Wire up effects</b>Add a <u>Still</u> node to change the image, or a <u>Motion</u> node to make it move. Drag from a dot to connect.</div></div><aside class="ng-insp" id="ngInsp"></aside></div>`;
document.body.appendChild(win);
const cv=win.querySelector('#ngCanvas'),layer=win.querySelector('#ngLayer'),wires=win.querySelector('#ngWires'),insp=win.querySelector('#ngInsp');
let view={x:20,y:30,z:.8},sel=null;
function applyView(){layer.style.transform=`translate(${view.x}px,${view.y}px) scale(${view.z})`}

// topbar button
const nb=document.createElement('button');nb.className='btn tonal';nb.id='nodesBtn';nb.type='button';nb.title='Node graph (N)';nb.setAttribute('aria-pressed','false');nb.innerHTML=ICONS.nodes+'<span class="lbl">Nodes</span>';
$('#undo').before(nb);nb.onclick=()=>toggle();
function toggle(on){on=on===undefined?win.hidden:on;win.hidden=!on;nb.setAttribute('aria-pressed',String(on));if(on){importStack();draw();if(!toggle.fitted){fit();toggle.fitted=1}cv.focus({preventScroll:true})}}
NG.open=()=>toggle(true);
win.querySelector('#ngClose').onclick=()=>toggle(false);
addEventListener('keydown',e=>{const t=e.target;if(t.closest&&t.closest('input,textarea,[contenteditable]'))return;if((e.key==='n'||e.key==='N')&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();toggle()}});

// carry the existing stack over the first time
function importStack(){if(isActive()||importStack.done)return;importStack.done=true;const on=FX.filter(f=>state[f.id].on&&!state[f.id].hide);if(!on.length)return;let prev='src',x=220;
  on.forEach(f=>{const p={};f.params.forEach(q=>p[q.k]=state[f.id][q.k]);const n=mkNode('fx:'+f.id,x,120,p);G.links.push({a:prev,b:n.id,port:0});prev=n.id;x+=190});
  G.links=G.links.filter(l=>!(l.b==='sout'));G.links.push({a:prev,b:'sout',port:0});node('sout').x=x;node('mout').x=x+420;snack(`Your ${on.length} stacked effect${on.length>1?'s are':' is'} now nodes`);schedule()}

// header drag
(()=>{const h=win.querySelector('#ngHead');let d=null;h.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=win.getBoundingClientRect();d={x:e.clientX-r.left,y:e.clientY-r.top};h.setPointerCapture(e.pointerId)});
  h.addEventListener('pointermove',e=>{if(!d)return;win.style.left=Math.max(0,Math.min(innerWidth-120,e.clientX-d.x))+'px';win.style.top=Math.max(0,Math.min(innerHeight-40,e.clientY-d.y))+'px';win.style.bottom='auto';win.style.right='auto'});
  h.addEventListener('pointerup',()=>d=null)})();

// render nodes + wires
const els={};
function draw(){if(win.hidden)return;win.querySelector('#ngEmpty').hidden=isActive();
  const ids=new Set(G.nodes.map(n=>n.id));Object.keys(els).forEach(k=>{if(!ids.has(k)){els[k].remove();delete els[k]}});
  G.nodes.forEach(n=>{const T=TYPES[n.type];let el=els[n.id];
    if(!el){el=els[n.id]=document.createElement('div');el.dataset.id=n.id;const f=T.fam;el.className='nd '+f;
      el.innerHTML=`<div class="nd-h"><b></b><small>${f==='io'?'':f==='still'?'STILL':'MOTION'}</small></div>${f==='motion'?`<div class="gly">${(T.group||'').toUpperCase()}</div>`:'<canvas width="268" height="128"></canvas>'}`+
        (T.ins>=1?`<span class="pt in${T.ins>1?' a2':''}" data-port="0"></span>`:'')+(T.ins>1?'<span class="pt in b" data-port="1"></span><span class="pt-l" style="top:26px;left:4px">A</span><span class="pt-l" style="top:62px;left:4px">B</span>':'')+(T.outs?'<span class="pt out"></span>':'');
      el.querySelector('b').textContent=T.name;layer.appendChild(el);bindNode(el,n)}
    el.style.left=n.x+'px';el.style.top=n.y+'px';el.classList.toggle('sel',sel===n.id);el.classList.toggle('byp',n.bypass)});
  drawWires();lanes()}
function portPos(id,side,port=0){const n=node(id),T=TYPES[n.type];const y=side==='out'?51:T.ins>1?(port?73:37):51;return[n.x+(side==='out'?150:0),n.y+y]}
function curve(a,b){const dx=Math.max(40,Math.abs(b[0]-a[0])*.5);return`M${a[0]},${a[1]} C${a[0]+dx},${a[1]} ${b[0]-dx},${b[1]} ${b[0]},${b[1]}`}
let tmpWire=null;
function drawWires(){let h='';G.links.forEach((l,i)=>{const d=curve(portPos(l.a,'out'),portPos(l.b,'in',l.port));const m=stage(l.a)>=1&&stage(l.b)>1;h+=`<path class="hit" d="${d}" data-i="${i}"/><path class="${m?'m':''}" d="${d}"/>`});
  if(tmpWire)h+=`<path class="tmp" d="${tmpWire}"/>`;wires.innerHTML=h;wires.querySelectorAll('.hit').forEach(p=>p.onclick=e=>{e.stopPropagation();const l=G.links[+p.dataset.i];if(!l)return;
    G.links.splice(+p.dataset.i,1);changed(l.b);snack('Connection removed','Undo',()=>{G.links.push(l);changed(l.b)})})}
function lanes(){layer.querySelectorAll('.ng-lane').forEach(x=>x.remove());const s=node('sout');const l=document.createElement('div');l.className='ng-lane';l.style.left=(s.x+75)+'px';l.innerHTML='<span class="l">← STILL</span><span class="r">MOTION →</span>';layer.prepend(l)}
function thumbOf(id){const m=NG.lastMemo;if(!m)return null;if(id==='src')return src;const r=m[id];return r&&r.c}
function drawThumbs(){if(win.hidden)return;G.nodes.forEach(n=>{const el=els[n.id];const c=el&&el.querySelector('canvas');if(!c)return;const s=n.id==='src'?(userImage?src:null):n.id==='sout'?(userImage?processed:null):thumbOf(n.id);const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);if(!s||!s.width)return;
  const k=Math.min(c.width/s.width,c.height/s.height),w=s.width*k,h=s.height*k;x.drawImage(s,(c.width-w)/2,(c.height-h)/2,w,h)})}
NG.thumbs=drawThumbs;

// node interactions
function toGraph(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left-view.x)/view.z,(e.clientY-r.top-view.y)/view.z]}
function bindNode(el,n){
  el.querySelector('.nd-h').addEventListener('pointerdown',e=>{e.stopPropagation();select(n.id);const st=toGraph(e),ox=n.x,oy=n.y;const mv_=ev=>{const p=toGraph(ev);n.x=ox+p[0]-st[0];n.y=oy+p[1]-st[1];el.style.left=n.x+'px';el.style.top=n.y+'px';drawWires();if(n.id==='sout')lanes()};
    const up=()=>{removeEventListener('pointermove',mv_);removeEventListener('pointerup',up)};addEventListener('pointermove',mv_);addEventListener('pointerup',up)});
  el.addEventListener('pointerdown',e=>{if(!e.target.classList.contains('pt'))select(n.id)});
  const out=el.querySelector('.pt.out');if(out)out.addEventListener('pointerdown',e=>{e.stopPropagation();const a=portPos(n.id,'out');
    const mv_=ev=>{tmpWire=curve(a,toGraph(ev));drawWires()};
    const up=ev=>{removeEventListener('pointermove',mv_);removeEventListener('pointerup',up);tmpWire=null;const t=document.elementFromPoint(ev.clientX,ev.clientY);
      if(t&&t.classList.contains('pt')&&t.classList.contains('in')){link(n.id,t.closest('.nd').dataset.id,+t.dataset.port)}
      else if(t&&cv.contains(t)&&!t.closest('.nd')){const p=toGraph(ev);openMenu(stage(n.id)>=1?'motion':'still',ev,{from:n.id,at:p})}drawWires()};
    addEventListener('pointermove',mv_);addEventListener('pointerup',up)});
  el.addEventListener('dblclick',()=>{if(TYPES[n.type].fam==='motion'&&!mOn)selectTab('motion')})}
function select(id){sel=id;draw();inspect();const n=id&&node(id);if(n&&TYPES[n.type].fam==='motion'&&!mOn&&userImage)selectTab('motion')}
cv.addEventListener('pointerdown',e=>{if(e.target.closest('.nd,.ng-menu'))return;closeMenu();select(null);const sx=e.clientX,sy=e.clientY,vx=view.x,vy=view.y;cv.setPointerCapture(e.pointerId);
  const mv_=ev=>{view.x=vx+ev.clientX-sx;view.y=vy+ev.clientY-sy;applyView()};const up=()=>{cv.removeEventListener('pointermove',mv_);cv.removeEventListener('pointerup',up)};cv.addEventListener('pointermove',mv_);cv.addEventListener('pointerup',up)});
cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;const z=Math.min(1.6,Math.max(.35,view.z*Math.exp(-e.deltaY*.0015)));view.x=mx-(mx-view.x)*z/view.z;view.y=my-(my-view.y)*z/view.z;view.z=z;applyView()},{passive:false});
cv.addEventListener('keydown',e=>{if(e.target!==cv&&!e.target.classList.contains('nd'))return;if((e.key==='Delete'||e.key==='Backspace')&&sel){e.preventDefault();del(sel)}else if((e.key==='b'||e.key==='B')&&sel){bypass(sel)}else if(e.key==='Escape'){closeMenu();select(null)}});
function fit(){const r=cv.getBoundingClientRect();if(!r.width)return;const xs=G.nodes.map(n=>n.x),ys=G.nodes.map(n=>n.y);const x0=Math.min(...xs)-30,x1=Math.max(...xs)+180,y0=Math.min(...ys)-50,y1=Math.max(...ys)+130;
  view.z=Math.min(1.1,Math.max(.35,Math.min(r.width/(x1-x0),r.height/(y1-y0))));view.x=(r.width-(x1-x0)*view.z)/2-x0*view.z;view.y=(r.height-(y1-y0)*view.z)/2-y0*view.z;applyView()}
win.querySelector('#ngFit').onclick=fit;
win.querySelector('#ngTidy').onclick=()=>{tidy();draw();fit()};
function tidy(){const depth={};const walk=(id,d)=>{if(depth[id]!==undefined&&depth[id]>=d)return;depth[id]=d;outsOf(id).forEach(l=>walk(l.b,d+1))};walk('src',0);G.nodes.forEach(n=>{if(depth[n.id]===undefined)depth[n.id]=0});
  const col={};G.nodes.slice().sort((a,b)=>a.y-b.y).forEach(n=>{const d=depth[n.id];col[d]=(col[d]||0)+1;n.x=40+d*200;n.y=120+(col[d]-1)*130})}
applyView();

// add / delete
function place(n,after){if(after){const a=node(after);n.x=a.x+200;n.y=a.y;G.nodes.forEach(o=>{if(o!==n&&o.x>=a.x+150&&Math.abs(o.y-a.y)<110)o.x+=200})}}
function addNode(type,opt={}){const T=TYPES[type];let from=opt.from||null;
  if(!from){const s=sel&&node(sel);if(s&&((T.fam==='still'&&stage(sel)<1)||(T.fam==='motion'&&stage(sel)>=1&&sel!=='mout')))from=sel;else from=T.fam==='still'?inputOf('sout'):inputOf('mout')||'sout';}
  const n=mkNode(type,0,0);if(opt.at){n.x=opt.at[0];n.y=opt.at[1]-50}else place(n,from);
  const downstream=outsOf(from).filter(l=>{const sb=stage(l.b);return T.fam==='still'?sb<=1:sb>=1.5});
  if(!(T.fam==='still'&&stage(from)>=1)&&!(T.fam==='motion'&&stage(from)<1)){G.links.push({a:from,b:n.id,port:0});downstream.forEach(l=>{l.a=n.id})}
  select(n.id);changed(n.id);if(T.fam==='motion'&&!mOn){if(userImage||mHasSrc())selectTab('motion');else snack('Import an image to see motion nodes play.')}return n}
NG.add=addNode;
function del(id){if(['src','sout','mout'].includes(id))return snack('Source and outputs stay. Disconnect them instead.');const n=node(id),inp=inputOf(id,0),outs=outsOf(id);G.links=G.links.filter(l=>l.a!==id&&l.b!==id);
  if(inp)outs.forEach(l=>G.links.push({a:inp,b:l.b,port:l.port}));G.nodes=G.nodes.filter(x=>x!==n);delete outCan[id];if(fbos[id]){Object.values(fbos[id]).forEach(x=>x&&x.t&&freeF(x));delete fbos[id]}sel=null;changed(outs[0]?.b||'sout');snack(`${TYPES[n.type].name} removed`)}
function bypass(id){const n=node(id);if(!n||TYPES[n.type].fam==='io')return;n.bypass=!n.bypass;changed(id)}

// add menu
let menu=null;
function closeMenu(){if(menu){menu.remove();menu=null}}
function openMenu(f,e,opt={}){closeMenu();menu=document.createElement('div');menu.className='ng-menu';const r=cv.getBoundingClientRect();
  menu.innerHTML=`<label class="search"><svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="text" placeholder="Search nodes" aria-label="Search nodes"></label><div class="tabs2"><button type="button" data-f="still">Still</button><button type="button" data-f="motion">Motion</button></div><div class="list"></div>`;
  cv.appendChild(menu);const px=e&&e.clientX?Math.min(r.width-310,Math.max(8,e.clientX-r.left)):12,py=e&&e.clientY?Math.min(r.height-200,Math.max(8,e.clientY-r.top)):8;menu.style.left=px+'px';menu.style.top=py+'px';
  const q=menu.querySelector('input'),list=menu.querySelector('.list');let cur=f;
  const fill=()=>{menu.querySelectorAll('.tabs2 button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.f===cur)));const s=q.value.trim().toLowerCase();list.innerHTML='';
    const groups=cur==='still'?STILL_GROUPS:MOTION_GROUPS;let first=null;
    groups.forEach(g=>{const items=Object.entries(TYPES).filter(([k,T])=>T.fam===cur&&T.group===g&&(!s||(T.name+' '+T.desc+' '+g).toLowerCase().includes(s)));if(!items.length)return;
      const h=document.createElement('h4');h.textContent=g;list.appendChild(h);
      items.forEach(([k,T])=>{const b=document.createElement('button');b.type='button';b.className='it';b.innerHTML='<b></b><small></small>';b.querySelector('b').textContent=T.name;b.querySelector('small').textContent=T.desc||'';
        b.onclick=()=>{closeMenu();addNode(k,opt)};list.appendChild(b);if(!first){first=b;b.classList.add('k')}})});
    if(!list.children.length)list.innerHTML='<div class="tnone">No nodes match.</div>'};
  menu.querySelectorAll('.tabs2 button').forEach(b=>b.onclick=()=>{cur=b.dataset.f;fill();q.focus()});
  q.oninput=fill;q.onkeydown=ev=>{if(ev.key==='Enter'){list.querySelector('.it')?.click()}if(ev.key==='Escape')closeMenu()};fill();q.focus()}
win.querySelectorAll('.ng-add-btn').forEach(b=>b.onclick=e=>{e.stopPropagation();openMenu(b.dataset.f,null)});

// inspector
function nctl(p,s,cb){const w=genCtl(p,s,cb);w.querySelectorAll('[id]').forEach(el=>{const o=el.id;el.id='nd-'+o;const lb=w.querySelector(`[for="${o}"]`);if(lb)lb.htmlFor='nd-'+o});return w}
function inspect(){insp.innerHTML='';if(!sel||!node(sel))return;const n=node(sel),T=TYPES[n.type];
  const h=document.createElement('div');h.className='phead';h.innerHTML='<b></b><p></p>';h.querySelector('b').textContent=T.name;h.querySelector('p').textContent=(T.fam==='io'?'':T.fam==='still'?'Still node · ':'Motion node · ')+(T.desc||'');insp.appendChild(h);
  if(T.params.length){const ps=document.createElement('div');ps.className='params';T.params.forEach(p=>ps.appendChild(nctl(p,n.p,()=>{if(T.fam==='still'){schedule()}})));insp.appendChild(ps)}
  if(T.fam!=='io'){const a=document.createElement('div');a.className='acts';a.innerHTML=`<button type="button" class="${n.bypass?'on':''}">${n.bypass?'Bypassed':'Bypass'}</button><button type="button">Duplicate</button><button type="button">Delete</button>`;
    const[b1,b2,b3]=a.children;b1.onclick=()=>bypass(n.id);b2.onclick=()=>{const c=mkNode(n.type,n.x+30,n.y+120,JSON.parse(JSON.stringify(n.p)));const i=inputOf(n.id);if(i)G.links.push({a:i,b:c.id,port:0});select(c.id);changed(c.id)};b3.onclick=()=>del(n.id);insp.appendChild(a)}}

/* ---------------- banners in Stack + Motion panes ---------------- */
const _ra=renderActive;renderActive=function(){_ra.apply(this,arguments);if(!NG.stillActive())return;const b=document.createElement('div');b.className='ng-banner';
  b.innerHTML='<span><b>Nodes are driving the image.</b> This stack is ignored until you go back to it.</span><div class="row"><button type="button">Open nodes</button><button type="button" class="g">Use the stack again</button></div>';
  b.querySelector('button').onclick=()=>toggle(true);b.querySelector('.g').onclick=()=>{G.links=G.links.filter(l=>l.b!=='sout');G.links.push({a:'src',b:'sout',port:0});changed('sout');renderActive()};paneA.prepend(b)};
const _rm=renderMotion;renderMotion=function(){_rm.apply(this,arguments);if(!NG.motionActive())return;const p=$('#paneMotion');const b=document.createElement('div');b.className='ng-banner';
  b.innerHTML='<span><b>Motion nodes are driving the video.</b> The loop picker below is ignored. Size, length, audio and recording still apply.</span><div class="row"><button type="button">Open nodes</button></div>';
  b.querySelector('button').onclick=()=>toggle(true);p.prepend(b)};
})();
