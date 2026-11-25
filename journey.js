const chapters=[...document.querySelectorAll('.journey .chapter')];
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
let waiting=false;
function updateCamera(){
 waiting=false;
 chapters.forEach((section,i)=>{
 const box=section.getBoundingClientRect(), frame=section.querySelector('.frame');
 if(reduced.matches){frame.style.transform='none';return}
 if(box.bottom<0||box.top>innerHeight)return;
 const t=Math.max(0,Math.min(1,-box.top/Math.max(1,box.height-section.firstElementChild.clientHeight)));
 const direction=i%2?-1:1;
 frame.style.transform='translate3d('+direction*t*3+'%,0,'+t*108+'px) rotateY('+direction*t*7+'deg) scale('+(1.04+t*.12)+')';
 });
}
function schedule(){if(!waiting){waiting=true;requestAnimationFrame(updateCamera)}}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reduced.addEventListener('change',schedule);updateCamera();