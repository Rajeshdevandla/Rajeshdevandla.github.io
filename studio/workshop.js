const panel=document.querySelector('.model-card');
let canvas=panel.querySelector('canvas');
const stage=panel.querySelector('.model-stage');
const story=document.querySelector('.workshop');
const tools=panel.querySelector('.model-tools');
const hint=panel.querySelector('.model-help');
const layerButton=tools.querySelector('.layer-button');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const small=matchMedia('(max-width: 760px)');
const clamp=(v,low=0,high=1)=>Math.max(low,Math.min(high,v));
const ease=t=>t*t*(3-2*t);
const radians=Math.PI/180;
let scene, visible=true, lost=false, frame=0, lastFrame=0;
let introTime=0, introDone=motion.matches, lastOpen=0, desiredOpen=0, manual=false;
let angle=0, elevation=0, drag=null;

function showFallback(){
  canvas.hidden=true;canvas.tabIndex=-1;tools.hidden=true;hint.hidden=true;
  panel.querySelector('.model-poster').hidden=false;
}
function schedule(){
  if(scene&&!lost&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(render);
}
function scrollPosition(){
  const rect=story.getBoundingClientRect();
  if(small.matches){
    const top=stage.getBoundingClientRect().top;
    return clamp((innerHeight*.52-top)/(innerHeight*.62));
  }
  return clamp(-rect.top/Math.max(260,rect.height-Math.min(innerHeight*.90,750)));
}
function updateButton(){
  const active=desiredOpen>.5;
  layerButton.setAttribute('aria-pressed',String(active));
  layerButton.querySelector('b').textContent=active?'Assemble model':'Explode layers';
}
function render(now){
  frame=0;
  const dt=Math.min(50,Math.max(0,now-(lastFrame||now)));lastFrame=now;
  if(!introDone){introTime+=dt;introDone=introTime>=1700;}
  const scroll=motion.matches?0:scrollPosition();
  if(!manual)desiredOpen=ease(clamp(scroll*1.38));
  if(motion.matches)lastOpen=desiredOpen;
  else lastOpen+=(desiredOpen-lastOpen)*(1-Math.exp(-dt/110));
  if(Math.abs(lastOpen-desiredOpen)<.001)lastOpen=desiredOpen;
  const intro=introDone?1:ease(clamp(introTime/1700));
  const yaw=(-42+15*intro+52*ease(scroll))*radians+angle;
  const pitch=clamp((36+4*intro-18*ease(scroll))*radians+elevation,12*radians,78*radians);
  scene.draw({yaw,pitch,open:lastOpen,zoom:1+.065*Math.sin(scroll*Math.PI)});
  panel.style.setProperty('--meter',(34*lastOpen)+'px');
  updateButton();
  if(!introDone||lastOpen!==desiredOpen)schedule();
}
function turn(amount){
  angle+=amount*radians;introDone=true;schedule();
}
function toggleLayers(){
  introDone=true;manual=true;desiredOpen=desiredOpen>.5?0:1;schedule();
}
function reset(){
  introDone=true;manual=false;angle=0;elevation=0;schedule();
}
layerButton.addEventListener('click',toggleLayers);
for(const button of tools.querySelectorAll('[data-turn]'))button.addEventListener('click',()=>turn(Number(button.dataset.turn)*30));
tools.querySelector('[data-reset]').addEventListener('click',reset);
function enableInput(canvas){
  canvas.addEventListener('keydown',e=>{
    switch(e.key){
      case 'ArrowLeft':turn(-15);break;
      case 'ArrowRight':turn(15);break;
      case 'ArrowUp':elevation=clamp(elevation+.12,-.75,.9);schedule();break;
      case 'ArrowDown':elevation=clamp(elevation-.12,-.75,.9);schedule();break;
      case 'Home':reset();break;
      case ' ':case 'Enter':toggleLayers();break;
      default:return;
    }
    e.preventDefault();
  });
  canvas.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,angle,elevation,claimed:e.pointerType==='mouse'};
    if(drag.claimed)canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.claimed){
      if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}
      if(Math.abs(dx)<5)return;
      canvas.setPointerCapture(e.pointerId);drag.claimed=true;
    }
    introDone=true;angle=drag.angle-dx*.011;
    elevation=clamp(drag.elevation+dy*.008,-.75,.9);schedule();
  });
  function endDrag(e){if(drag&&drag.id===e.pointerId)drag=null;}
  canvas.addEventListener('pointerup',endDrag);
  canvas.addEventListener('pointercancel',endDrag);
  canvas.addEventListener('lostpointercapture',endDrag);
}
function stop(){if(frame)cancelAnimationFrame(frame);frame=0;lastFrame=0;}
if('IntersectionObserver' in window)new IntersectionObserver(([entry])=>{
  visible=entry.isIntersecting;if(visible)schedule();else stop();
}).observe(stage);
addEventListener('scroll',()=>{if(!motion.matches)manual=false;schedule();},{passive:true});
addEventListener('resize',schedule);
if('ResizeObserver' in window)new ResizeObserver(schedule).observe(stage);
motion.addEventListener('change',()=>{introDone=true;manual=false;schedule();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else schedule();});
async function start(fallback=false){
  try{
    if(fallback){
      const fresh=canvas.cloneNode(false);canvas.replaceWith(fresh);canvas=fresh;
      const {createTurntable}=await import('./turntable.js');scene=await createTurntable(canvas);
      panel.dataset.renderer='turntable';
    }else{
      const {createRenderer}=await import('./renderer.js');scene=createRenderer(canvas);
      canvas.addEventListener('webglcontextlost',event=>{
        event.preventDefault();lost=true;stop();showFallback();scene=null;start(true);
      },{once:true});
      panel.dataset.renderer='webgl';
    }
    lost=false;enableInput(canvas);canvas.hidden=false;canvas.tabIndex=0;
    render(performance.now());
    panel.querySelector('.model-poster').hidden=true;tools.hidden=false;hint.hidden=false;schedule();
  }catch(error){
    scene=null;showFallback();
    if(!fallback)return start(true);
    console.warn('Model viewer unavailable',error);
  }
}
start();
