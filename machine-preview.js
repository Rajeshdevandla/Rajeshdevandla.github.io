(() => {
 const hero=document.querySelector('#hero'), art=hero?.querySelector('.hero-right'), projects=document.querySelector('#projects');
 if(!art||!projects)return;
 const stage=document.createElement('section'); stage.className='machine-stage'; stage.setAttribute('aria-label','Inside the machine');
 stage.innerHTML='<div class="machine-view"><canvas aria-hidden="true"></canvas><div class="machine-caption"><small>Inside the machine</small><span>Processor assembly</span></div></div>';
 const canvas=stage.querySelector('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
 hero.after(stage);
 const sheen=document.createElement('div');sheen.className='machine-sheen';art.append(sheen);
 const caption=stage.querySelector('.machine-caption span'), title=[...projects.querySelectorAll('h3,h4')].find(e=>/AskDocs/i.test(e.textContent));
 const card=title?.closest('article')||title?.parentElement?.parentElement;
 const screenshot=card?.querySelector('img');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const clamp=x=>Math.min(1,Math.max(0,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
 let lastLabel='',pending=false;
 function draw(){
 pending=false;if(motion.matches)return;
 const rect=stage.getBoundingClientRect(),h=canvas.clientHeight,w=canvas.clientWidth;
 const hr=hero.getBoundingClientRect(),entry=clamp(-hr.top/Math.max(1,hr.height*.65));
 sheen.style.opacity=String(Math.sin(entry*Math.PI)*.8);sheen.style.transform='translateX('+((entry-.5)*95)+'%)';
 if(rect.top>innerHeight||rect.bottom<0||!w||!h)return;
 const p=clamp(-rect.top/(rect.height-h)), open=ease(p/.65), arrive=ease((p-.6)/.38);
 const d=Math.min(devicePixelRatio||1,1.6);if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d)}
 ctx.setTransform(d,0,0,d,0,0);ctx.fillStyle='#090d0d';ctx.fillRect(0,0,w,h);
 const yaw=-.68+1.5*open-.82*arrive,pitch=.53-.33*open,faces=[];
 function view(x,y,z){const a=x*Math.cos(yaw)-z*Math.sin(yaw),b=x*Math.sin(yaw)+z*Math.cos(yaw);return [a,y*Math.cos(pitch)-b*Math.sin(pitch),b*Math.cos(pitch)+y*Math.sin(pitch)]}
 function screen(v){const k=Math.min(w*.87,h*.91)/(5.6-1.25*open+v[2]*.43);return [w*.5+v[0]*k,h*.45+v[1]*k]}
 const corners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
 function box(x,y,z,a,b,c,colors){const pts=corners.map(([i,j,k])=>view(x+i*a/2,y+j*b/2,z+k*c/2));[[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]].forEach((ids,i)=>{let v=ids.map(n=>pts[n]);faces.push({z:v.reduce((s,t)=>s+t[2],0)/4,pts:v.map(screen),color:colors[i%colors.length]})})}
 const metal=['#454e51','#222a2b','#738084','#252e31','#333d40','#576467'],copper=['#955940','#713f2b','#f4b482','#613824','#92573a','#ce8964'];
 const shell=1.18+open*2.6;
 [-1,1].forEach(side=>{box(side*shell,0,0,.32,1.66,2.4,metal);for(let i=0;i<9;i++)box(side*shell,-.88,-.98+i*.245,.45,.11,.075,metal)});
 box(0,.42,0,2.22,.11,2.25,['#193830','#102a24','#37554b']);
 for(let i=0;i<12;i++){const x=(i-5.5)*.16;box(x,.35,.71,.026,.022,.5,copper);box(x,.32,-.85,.09,.08,.17,metal)}
 box(0,.26-open*.24,0,1.25,.25,1.12,metal);
 box(0,.09-open*.35,0,.9,.12,.83,copper);
 for(let i=0;i<8;i++)box((i-3.5)*.128,-.1-open*.92,0,.064,.25,.96,metal);
 faces.sort((a,b)=>b.z-a.z);ctx.globalAlpha=1-arrive*.88;
 for(const face of faces){ctx.beginPath();face.pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=face.color;ctx.fill();ctx.strokeStyle='#0e171833';ctx.lineWidth=.65;ctx.stroke()}
 ctx.globalAlpha=1;
 if(arrive&&screenshot?.complete&&screenshot.naturalWidth){const scale=Math.min(w*.73/screenshot.naturalWidth,h*.45/screenshot.naturalHeight);const sw=screenshot.naturalWidth*scale,sh=screenshot.naturalHeight*scale;ctx.globalAlpha=arrive;ctx.drawImage(screenshot,(w-sw)/2,(h-sh)*.42,sw,sh);ctx.globalAlpha=1}
 const label=p>.7?'project':p>.25?'core':'shell';
 if(label!==lastLabel){lastLabel=label;caption.replaceChildren();if(label==='project'){const a=document.createElement('a');a.href='#projects';a.textContent=(title?.textContent.trim()||'Explore projects')+' ↗';caption.append(a)}else caption.textContent=label==='core'?'Processing core':'Processor assembly'}
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(draw)}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);motion.addEventListener('change',schedule);screenshot?.addEventListener('load',schedule);schedule()
})();