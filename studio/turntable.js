// The same model, pre-rendered for devices where WebGL cannot start.
export async function createTurntable(canvas) {
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('Canvas unavailable');
  async function load(file){
    const img=new Image();img.src=new URL(file,import.meta.url).href;await img.decode();return img;
  }
  const [closed,exploded]=await Promise.all([load('atlas-closed.webp'),load('atlas-open.webp')]);
  function draw({yaw,open}){
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w||!h)return;
    const d=Math.min(devicePixelRatio||1,1.6);
    if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);}
    const sw=closed.naturalWidth/4,sh=closed.naturalHeight/3;
    const index=(Math.round((yaw*180/Math.PI+27)/30)%12+12)%12;
    const sx=(index%4)*sw,sy=Math.floor(index/4)*sh;
    // Preserve the proportions of the rendered object on landscape and portrait cards.
    const s=Math.min(canvas.width/sw,canvas.height/sh),dw=sw*s,dh=sh*s;
    const dx=(canvas.width-dw)/2,dy=(canvas.height-dh)/2;
    ctx.globalAlpha=1;ctx.fillStyle='#dfe2d5';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(closed,sx,sy,sw,sh,dx,dy,dw,dh);
    if(open>0){ctx.globalAlpha=open;ctx.drawImage(exploded,sx,sy,sw,sh,dx,dy,dw,dh);ctx.globalAlpha=1;}
  }
  return {draw};
}
