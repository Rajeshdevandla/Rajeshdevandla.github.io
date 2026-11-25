import {camera,multiply,ortho,perspective,pose} from './geometry.js';
import {makeCartridge} from './model.js';

const attributes= 'attribute vec3 aPosition; attribute vec3 aNormal; attribute vec3 aColor; attribute vec2 aSurface; attribute vec2 aUV;';
const vertex=attributes+`
uniform mat4 model, vp, lightVP;
varying vec3 world, normal, color; varying vec2 surface, uv; varying vec4 shadowPosition;
void main(){
  vec4 p=model*vec4(aPosition,1.0); world=p.xyz; normal=mat3(model)*aNormal;
  color=aColor; surface=aSurface; uv=aUV;
  shadowPosition=lightVP*p;
  gl_Position=vp*p;
}`;
const fragment=`precision highp float;
varying vec3 world, normal, color; varying vec2 surface, uv; varying vec4 shadowPosition;
uniform vec3 eye, lamp;
uniform sampler2D art, shadows;
uniform float printed, floorPart, useShadow;
float visibility(vec3 n,vec3 l) {
  if(useShadow<0.5)return 1.0;
  vec3 q=shadowPosition.xyz/shadowPosition.w*.5+.5;
  if(q.x<=0.0||q.x>=1.0||q.y<=0.0||q.y>=1.0)return 1.0;
  float v=0.0, bias=.00075+.0016*(1.0-max(dot(n,l),0.0));
  for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){
    vec3 sampleDepth=texture2D(shadows,q.xy+vec2(float(i),float(j))*.00165).rgb;
    float depth=dot(sampleDepth,vec3(1.0,1.0/255.0,1.0/65025.0));
    v+=step(q.z-bias,depth);
  }
  return v/9.0;
}
void main(){
  vec3 n=normalize(normal),v=normalize(eye-world),l=normalize(lamp),h=normalize(l+v);
  float vis=visibility(n,l),nl=max(dot(n,l),0.0), metal=surface.x,gloss=surface.y;
  if(floorPart>.5){
    float ao=exp(-dot(world.xz*vec2(.6,.88),world.xz*vec2(.6,.88))*1.45);
    float grad=clamp(world.z*.028-world.x*.024,-.095,.07);
    vec3 f=vec3(.885,.897,.843)+grad-ao*.08-(1.0-vis)*.145;
    gl_FragColor=vec4(f,1.0);return;
  }
  vec3 base=color;if(printed>.5)base=texture2D(art,uv).rgb;
  vec3 reflection=reflect(-v,n);
  float strip=exp(-pow((reflection.y-.49)*5.8,2.0))*(.58+.42*cos(reflection.x*2.7));
  float sky=smoothstep(-.3,.9,reflection.y);
  float fres=pow(1.0-max(dot(n,v),0.0),3.0);
  float highlight=pow(max(dot(n,h),0.0),mix(16.0,110.0,gloss));
  vec3 rgb=base*(.43+.48*nl*vis+.23*max(n.y,0.0));
  rgb+=metal*(vec3(.13,.17,.18)*sky+vec3(.45,.47,.46)*strip+vec3(.16,.19,.19)*fres);
  rgb+=vec3(1.0,.91,.78)*highlight*vis*(.12+.62*metal);
  gl_FragColor=vec4(rgb,1.0);
}`;
const depthVS='attribute vec3 aPosition; uniform mat4 model, vp; void main(){gl_Position=vp*model*vec4(aPosition,1.0);}';
const depthFS=`precision highp float; void main(){vec3 p=fract(gl_FragCoord.z*vec3(1.,255.,65025.));p-=p.yzz*vec3(1./255.,1./255.,0.);gl_FragColor=vec4(p,1.);}`;
const names=['aPosition','aNormal','aColor','aSurface','aUV'];
function program(gl,vs,fs,uniforms) {
  function compile(kind,src){const s=gl.createShader(kind);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));return s;}
  const p=gl.createProgram(),v=compile(gl.VERTEX_SHADER,vs),f=compile(gl.FRAGMENT_SHADER,fs);
  gl.attachShader(p,v);gl.attachShader(p,f);names.forEach((n,i)=>gl.bindAttribLocation(p,i,n));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
  gl.deleteShader(v);gl.deleteShader(f);
  return {p,...Object.fromEntries(uniforms.map(n=>[n,gl.getUniformLocation(p,n)]))};
}
export function createRenderer(canvas) {
  const gl=canvas.getContext('webgl',{antialias:true,alpha:false,powerPreference:'low-power'});
  if(!gl)throw Error('WebGL unavailable');
  const paint=program(gl,vertex,fragment,['model','vp','lightVP','eye','lamp','art','shadows','printed','floorPart','useShadow']);
  const depth=program(gl,depthVS,depthFS,['model','vp']);
  const {parts,textures}=makeCartridge(), verts=[];
  for(const part of parts){part.start=verts.length/13;part.count=part.vertices.length/13;
    for(const val of part.vertices)verts.push(val);delete part.vertices;}
  const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
  function tex(src){
    const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    if(src)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
    else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;
  }
  const ink={cover:tex(textures.cover),board:tex(textures.board),plain:tex(null)};
  const shadowTex=tex(null),fb=gl.createFramebuffer(),rb=gl.createRenderbuffer(),size=1024;
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,size,size);
  gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,shadowTex,0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);
  const hasShadows=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  const light=[-3.7,7.3,4.3], lightVP=multiply(ortho(4.5,.1,24),camera(light,[0,.8,0]));
  const rad=Math.PI/180, fov=33*rad;
  let lastOpen=-1;
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  function bindGeometry(full){
    let off=0;
    for(const [i,count] of [3,3,3,2,2].entries()){
      if(full||i===0){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,count,gl.FLOAT,false,52,off*4);}
      else gl.disableVertexAttribArray(i);off+=count;
    }
  }
  function draw({yaw,pitch,open,zoom}) {
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
    const d=Math.min(window.devicePixelRatio||1,1.8,1300/w,1300/h);
    const width=Math.round(w*d),height=Math.round(h*d);
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    const transforms={floor:pose(),base:pose(),board:pose(.12*open,.35+.50*open,-.025*open,.05*open),
      optic:pose(.36*open,.69+1.22*open,-.08*open,.16*open),cap:pose(-.27*open,.87+1.94*open,.08*open,-.16*open)};
    function drawPart(part,p){
      gl.uniformMatrix4fv(p.model,false,transforms[part.layer]);gl.drawArrays(gl.TRIANGLES,part.start,part.count);
    }
    if(hasShadows&&Math.abs(open-lastOpen)>.0005){
      gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.viewport(0,0,size,size);
      gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(depth.p);bindGeometry(false);gl.uniformMatrix4fv(depth.vp,false,lightVP);
      for(const part of parts)if(part.layer!=='floor'&&!part.style)drawPart(part,depth);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);lastOpen=open;
    }
    const aspect=width/height;
    const distance=(7.15+.89*open)*Math.max(1.03,1.23/aspect)/zoom;
    const target=[0,.49+open*1.00,0], cp=Math.cos(pitch);
    const eye=[target[0]+distance*Math.sin(yaw)*cp,target[1]+distance*Math.sin(pitch),target[2]+distance*Math.cos(yaw)*cp];
    const vp=multiply(perspective(fov,aspect,.1,180),camera(eye,target));
    gl.viewport(0,0,width,height);gl.clearColor(.89,.90,.85,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(paint.p);bindGeometry(true);
    gl.uniformMatrix4fv(paint.vp,false,vp);gl.uniformMatrix4fv(paint.lightVP,false,lightVP);
    gl.uniform3fv(paint.eye,eye);gl.uniform3fv(paint.lamp,light);gl.uniform1f(paint.useShadow,hasShadows?1:0);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,shadowTex);gl.uniform1i(paint.shadows,1);
    gl.activeTexture(gl.TEXTURE0);gl.uniform1i(paint.art,0);
    for(const part of parts){
      gl.bindTexture(gl.TEXTURE_2D,ink[part.style]||ink.plain);
      gl.uniform1f(paint.floorPart,part.layer==='floor'?1:0);gl.uniform1f(paint.printed,part.style?1:0);
      drawPart(part,paint);
    }
  }
  return {draw};
}
