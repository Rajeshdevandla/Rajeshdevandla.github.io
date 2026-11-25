import {slab,disc,finish,printTop} from './geometry.js';

const metal=finish('a3aab0',.84,.70), bright=finish('d9dee1',.75,.83);
const body=finish('292f32',.67,.54), dark=finish('171d20',.42,.47);
const silver=finish('c2c9cb',.77,.73), green=finish('163f37',.36,.55);
const gold=finish('c8a264',.79,.65), orange=finish('fb6632',.21,.58);
const paint=finish('e1dfd2',.16,.42), ink=finish('181d20',.18,.33);
const glass=finish('70b7bf',.71,.93), white=finish('ffffff',.04,.35);

function artwork(width,height,draw) {
  const c=document.createElement('canvas');c.width=width;c.height=height;
  draw(c.getContext('2d'),width,height);return c;
}
function coverArt() {
  return artwork(960,600,(g,w,h)=>{
    g.fillStyle='#e9e7dc';g.fillRect(0,0,w,h);
    g.fillStyle='#29352e';g.font='600 23px monospace';g.fillText('RK  /  APPLIED AI',45,64);
    g.textAlign='right';g.fillText('01',w-43,64);g.textAlign='left';
    g.fillRect(44,89,w-88,3);g.font='bold 139px Arial';g.fillText('ASK /',37,253);g.fillText('DOCS',37,384);
    g.fillStyle='#f8652d';g.fillRect(52,439,105,15);g.fillRect(52,465,66,15);g.fillRect(52,491,38,15);
    g.fillStyle='#303c36';g.font='600 20px monospace';g.fillText('DOCUMENT RETRIEVAL',186,461);g.fillText('FAISS   /   BEDROCK',186,500);
    // Contour marks printed on the face, aligned to the same die-cut area.
    g.save();g.beginPath();g.rect(590,115,320,411);g.clip();
    g.strokeStyle='#7c8b78';g.lineWidth=3;
    for(let i=0;i<16;i++){
      g.beginPath();g.ellipse(883,336,55+i*13,83+i*18,-.32,0,Math.PI*2);g.stroke();
    }
    g.restore();g.fillStyle='#27332c';
    for(let i=0;i<48;i++){const thick=[3,7,2,4,2,6,3][i%7];g.fillRect(46+i*7,556,thick,18);}
    g.textAlign='right';g.font='16px monospace';g.fillText('FIELD MODEL   /   RK–01',911,575);
  });
}
function boardArt() {
  return artwork(768,480,(g,w,h)=>{
    g.fillStyle='#204d41';g.fillRect(0,0,w,h);
    g.strokeStyle='#568772';g.lineWidth=2;
    for(let i=0;i<29;i++){
      const y=42+i*14, off=19*(i%5);
      g.beginPath();g.moveTo(49,y);g.lineTo(118+off,y);g.lineTo(180+off,y+(i%2?34:-34));
      g.lineTo(326,y+(i%2?34:-34));g.stroke();
      g.beginPath();g.moveTo(w-36,y);g.lineTo(w-105-off,y);g.lineTo(w-185-off,y+(i%3?25:-25));g.lineTo(460,y+(i%3?25:-25));g.stroke();
      g.fillStyle='#d1b27f';g.fillRect(42,y-2,6,4);g.fillRect(w-40,y-2,6,4);
    }
    g.strokeStyle='#9ab399';g.strokeRect(21,20,w-42,h-40);
    g.fillStyle='#dfdfbe';g.font='bold 17px monospace';g.fillText('RK  /  RETRIEVAL',40,39);
  });
}
function screw(mesh,x,y,z) {
  disc(mesh,x,y,z,.072,.034,metal);
  disc(mesh,x,y+.018,z,.049,.006,dark,14);
  slab(mesh,x,y+.023,z,.057,.006,.012,.005,silver,0,1);
}
function fourCorners(fn,x,z){for(const a of [-x,x])for(const b of [-z,z])fn(a,b);}
export function makeCartridge() {
  const parts=[];
  function group(layer,style=null){const g={layer,style,vertices:[]};parts.push(g);return g.vertices;}
  // The grounded shell and the six dark cooling fins separate from the electronics.
  const base=group('base');
  slab(base,0,0,0,3.08,.29,2.22,.23,body,.065,8);
  slab(base,0,.145,0,2.92,.06,2.04,.18,metal);
  slab(base,0,.19,0,2.75,.079,1.88,.13,dark);
  for(let i=0;i<7;i++){
    const x=-1.08+i*.36;
    slab(base,x,.252,0,.20,.11,1.48,.04,body);
  }
  for(let i=0;i<15;i++){
    slab(base,-1.11+i*.159,.008,1.111,.086,.068,.015,.006,dark,.003,1);
  }
  slab(base,.96,.013,1.122,.37,.055,.026,.015,orange,.006,2);
  fourCorners((x,z)=>{disc(base,x,.255,z,.081,.18,gold);screw(base,x,.357,z);},1.31,.85);

  const board=group('board');
  slab(board,0,0,0,2.83,.115,1.99,.16,green,.026,7);
  printTop(group('board','board'),0,.059,0,2.55,1.73,white);
  slab(board,-.23,.137,-.03,1.08,.16,.94,.058,dark);
  slab(board,-.23,.23,-.03,.87,.074,.74,.04,metal);
  slab(board,-.23,.275,-.03,.59,.024,.45,.026,gold);
  for(let i=0;i<14;i++){
    const x=-.69+i*.072;
    slab(board,x,.086,.475,.03,.035,.102,.004,gold,.003,1);
    slab(board,x,.086,-.535,.03,.035,.102,.004,gold,.003,1);
  }
  for(let i=0;i<4;i++){
    const z=-.59+i*.36;
    slab(board,.79,.123,z,.39,.105,.22,.025,ink);
    for(const x of [.54,1.04]) for(let j=0;j<3;j++){
      slab(board,x,.082,z+(j-1)*.061,.066,.025,.025,.005,silver,.003,1);
    }
  }
  for(let i=0;i<8;i++)slab(board,-.72+i*.18,.061,.909,.115,.018,.09,.01,gold,.003,1);
  fourCorners((x,z)=>screw(board,x,.075,z),1.24,.82);

  const optic=group('optic');
  slab(optic,0,0,0,2.83,.065,1.97,.16,glass,.022,7);
  slab(optic,0,-.038,0,2.65,.024,1.80,.11,green,.009,5);
  for(let i=0;i<5;i++)slab(optic,-.86+i*.1,.039,.73,.043,.008,.19,.009,bright,.002,1);
  fourCorners((x,z)=>disc(optic,x,.04,z,.049,.016,metal),1.22,.78);

  const cap=group('cap');
  slab(cap,0,0,0,3.08,.236,2.22,.23,silver,.06,10);
  slab(cap,0,.13,-.025,2.96,.069,2.05,.185,paint,.026,8);
  printTop(group('cap','cover'),0,.167,-.040,2.68,1.67,white);
  fourCorners((x,z)=>screw(cap,x,.166,z),1.36,.90);
  slab(cap,-.82,-.025,1.115,.62,.118,.027,.011,orange,.005,2);
  for(let i=0;i<13;i++)slab(cap,-.23+i*.097,-.024,1.115,.038,.076,.018,.005,dark,.003,1);
  for(let i=0;i<6;i++)slab(cap,1.541,-.027,-.56+i*.20,.013,.07,.12,.006,dark,.003,1);
  const floor=group('floor'); slab(floor,0,-.2,0,170,.08,170,.1,finish('e3e4d7',0,.02),0,1);
  return {parts,textures:{cover:coverArt(),board:boardArt()}};
}
