// Column-major matrices used by the model, camera and directional light.
export const identity = () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
export function multiply(a,b) {
  const out = new Float32Array(16);
  for (let col=0; col<4; col++) for (let row=0; row<4; row++) {
    for (let i=0; i<4; i++) out[col*4+row] += a[i*4+row]*b[col*4+i];
  }
  return out;
}
const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const unit = a => {const len=Math.hypot(...a)||1; return a.map(v=>v/len);};
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function camera(eye,target) {
  const z=unit(eye.map((v,i)=>v-target[i])), x=unit(cross([0,1,0],z)), y=cross(z,x);
  return new Float32Array([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0,
    -dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}
export function perspective(fov,aspect,near,far) {
  const f=1/Math.tan(fov/2), n=near-far;
  return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)/n,-1, 0,0,2*far*near/n,0]);
}
export function ortho(radius,near,far) {
  return new Float32Array([1/radius,0,0,0, 0,1/radius,0,0, 0,0,2/(near-far),0, 0,0,(far+near)/(near-far),1]);
}
export function pose(x=0,y=0,z=0,yaw=0) {
  const c=Math.cos(yaw),s=Math.sin(yaw);
  return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, x,y,z,1]);
}
export function finish(hex,metal=0,gloss=.45) {
  const color=hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255);
  return [...color,metal,gloss];
}
// Vertex layout: position, normal, paint color, metal/gloss, texture coordinates.
function vertex(mesh,p,n,mat,uv=[0,0]) {mesh.push(...p,...n,...mat,...uv);}
export function quad(mesh,points,normal,mat,uv=[[0,0],[1,0],[1,1],[0,1]]) {
  for(const i of [0,1,2,0,2,3]) vertex(mesh,points[i],normal,mat,uv[i]);
}
function ring(w,d,r,segments) {
  const path=[];
  for(let corner=0;corner<4;corner++) {
    const cx=(corner===0||corner===3?1:-1)*(w/2-r);
    const cz=(corner<2?1:-1)*(d/2-r);
    for(let j=0;j<=segments;j++) {
      const angle=(corner+j/segments)*Math.PI/2;
      const nx=Math.cos(angle),nz=Math.sin(angle);
      path.push({x:cx+r*nx,z:cz+r*nz,nx,nz});
    }
  }
  return path;
}
// Extruded rounded rectangles with real bevel faces, including the underside.
export function slab(mesh,x,y,z,w,h,d,r,mat,b=.025,segments=5) {
  r=Math.min(r,w*.499,d*.499); b=Math.min(b,h*.43,r*.8);
  const edge=ring(w,d,r,segments);
  const bands=[[-h/2,b,-.93,.37],[-h/2+b,0,-.28,.96],[h/2-b,0,.28,.96],[h/2,b,.93,.37]];
  function point(i,k){
    const e=edge[i], [height,inset,ny,horiz]=bands[k];
    return [[x+e.x-e.nx*inset,y+height,z+e.z-e.nz*inset],[e.nx*horiz,ny,e.nz*horiz]];
  }
  for(let i=0;i<edge.length;i++){
    const j=(i+1)%edge.length;
    for(let k=0;k<3;k++){
      for(const [a,l] of [[i,k],[j,k],[j,k+1],[i,k],[j,k+1],[i,k+1]]) {
        const [p,n]=point(a,l);vertex(mesh,p,n,mat);
      }
    }
    for(const k of [0,3]){
      const sign=k===3?1:-1, n=[0,sign,0];
      vertex(mesh,[x,y+sign*h/2,z],n,mat);
      vertex(mesh,point(i,k)[0],n,mat);vertex(mesh,point(j,k)[0],n,mat);
    }
  }
}
export function disc(mesh,x,y,z,r,h,mat,edges=18) {
  slab(mesh,x,y,z,r*2,h,r*2,r,mat,Math.min(.012,h*.24),Math.max(3,Math.ceil(edges/4)));
}
export function printTop(mesh,x,y,z,w,d,mat) {
  quad(mesh,[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2]],[0,1,0],mat);
}
