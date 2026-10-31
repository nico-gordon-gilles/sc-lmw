/* Original equirectangular surfaces for the map spheres.
 * Colors follow the existing body palette. These are not game-client textures. */
(function(){
  const SC=window.SCLMW=window.SCLMW||{};
  const KIND={
    Hurston:'rust', Crusader:'gas', ArcCorp:'city', microTech:'ice',
    Arial:'lava', Aberdeen:'toxic', Magda:'rock', Ita:'rock', Cellin:'lava', Daymar:'dune',
    Yela:'ice', Lyria:'rock', Wala:'rock', Calliope:'ice', Clio:'ice', Euterpe:'ice',
    'Pyro I':'lava', Monox:'dune', Bloom:'green', 'Pyro IV':'rust', 'Pyro V':'gas', Terminus:'ash',
    Ignis:'lava', Vatra:'rock', Adir:'ash', Fairo:'dune', Fuego:'lava', Vuur:'rust',
    Delamar:'crater', 'Nyx I':'ash', 'Nyx II':'rock', 'Nyx III':'ice'
  };
  const ROUGH={gas:.96, city:.62, ice:.48, lava:.9, toxic:.88, dune:.92, green:.9, rust:.94, rock:.92, ash:.93, crater:.95};
  const cache={};
  function hashName(s){ let h=2166136261; for(let i=0;i<s.length;i++) h=Math.imul(h^s.charCodeAt(i),16777619); return h>>>0; }
  function hex(h){ const n=parseInt(String(h).slice(1),16)||0x9a9a9a; return [(n>>16)&255,(n>>8)&255,n&255]; }
  function mix(a,b,t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
  function clamp8(v){ return v<0?0:v>255?255:v|0; }
  function rgb(c){ return [clamp8(c[0]), clamp8(c[1]), clamp8(c[2])]; }
  function noise(x,y,seed,px){
    const x0=Math.floor(x), y0=Math.floor(y);
    let fx=x-x0, fy=y-y0;
    fx=fx*fx*(3-2*fx); fy=fy*fy*(3-2*fy);
    const xi=i=>((i%px)+px)%px;
    const h=(ix,iy)=>{ let n=Math.imul(xi(ix),374761393)+Math.imul(iy,668265263)+Math.imul(seed,1442695041); n=Math.imul(n^(n>>>13),1274126177); return ((n^(n>>>16))>>>0)/4294967296; };
    const a=h(x0,y0), b=h(x0+1,y0), c=h(x0,y0+1), d=h(x0+1,y0+1);
    return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;
  }
  function fbm(u,v,seed){
    let n=0, a=.56, f=4;
    for(let i=0;i<4;i++){ n+=a*noise(u*f, v*f, seed+i*97, f); a*=.5; f*=2; }
    return n;
  }
  function ph(x,y,seed){ let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1442695041); n=Math.imul(n^(n>>>13),1274126177); return ((n^(n>>>16))>>>0)/4294967296; }
  function stretch(n){ const t=(n-.36)/.3; const x=t<0?0:t>1?1:t; return x*x*(3-2*x); }
  function paint(name, baseHex, w, h){
    const kind=KIND[name]||'rock', seed=hashName(name)||1, base=hex(baseHex);
    const dark=mix(base,[18,14,12],.55), light=mix(base,[255,248,236],.42);
    const storms=[];
    if(kind==='gas'){ for(let i=0;i<4;i++) storms.push({u:noise(i*3.1,1.7,seed,8), v:.22+i*.16, rx:.07+.04*(i%2), ry:.035}); }
    const craters=[];
    if(kind==='crater'||kind==='rock'||kind==='ash'||kind==='dune'){
      const n=kind==='crater'?28:10;
      for(let i=0;i<n;i++) craters.push({u:ph(i,3,seed), v:.08+ph(i,9,seed)*.84, r:.012+ph(i,5,seed)*(kind==='crater'?.05:.028)});
    }
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    const ctx=c.getContext('2d'); const img=ctx.createImageData(w,h); const d=img.data;
    for(let y=0;y<h;y++){
      const v=y/(h-1);
      const pole=Math.pow(Math.abs(v*2-1),1.35);
      for(let x=0;x<w;x++){
        const u=x/w;
        const n=fbm(u,v,seed), s=stretch(n);
        const grain=(ph(x,y,seed)-.5)*.06;
        let col=base;
        if(kind==='gas'){
          const wob=(noise(u*3,v*2,seed+3,3)-.5)*.09;
          const band=.5+.5*Math.sin((v+wob)*Math.PI*11);
          const fine=.5+.5*Math.sin((v*2+wob)*Math.PI*28);
          col=mix(mix(base,[40,24,10],.45), mix(base,[255,236,200],.22), band*.75+fine*.25);
          for(let si=0;si<storms.length;si++){ const st=storms[si]; let du=Math.abs(u-st.u); if(du>.5) du=1-du; const q=(du/st.rx)**2+((v-st.v)/st.ry)**2; if(q<1) col=mix(col,mix(base,[255,244,220],.35),(1-q)*.65); }
        } else if(kind==='city'){
          col=mix([24,12,16], [120,48,40], s);
          const spark=ph(x,y,seed+4);
          const bx=x>>2, by=y>>2;
          if(s>.42&&ph(bx,by,seed+9)>.62&&(x&3)>0&&(y&3)>0) col=ph(bx,by,seed+2)>.8?[255,236,200]:[255,168,60];
          else if(s>.5&&spark>.9) col=[255,210,120];
        } else if(kind==='ice'){
          const crack=Math.abs(noise(u*14,v*9,seed+11,14)-.5)<.018;
          col=mix([150,186,206], [248,252,255], Math.min(1, s*.55+pole*1.2));
          if(crack&&pole<.8) col=mix(col,[46,78,110],.72);
        } else if(kind==='lava'){
          const hi=noise(u*16,v*10,seed+6,16);
          const vein=hi>.66&&hi<.76;
          col=mix([28,12,8], base, s);
          if(vein) col=hi>.71?[255,214,80]:[220,70,16];
        } else if(kind==='toxic'){
          col=mix([150,130,40], [210,200,70], s);
          if(s>.62) col=mix(col,[70,110,36],.75);
          if(noise(u*12,v*8,seed+8,12)>.84) col=[36,42,16];
        } else if(kind==='dune'){
          const ridge=.5+.5*Math.sin((v*18+(noise(u*4,v*2,seed,4)-.5)*2.2)*Math.PI);
          col=mix([120,78,40], [236,196,130], ridge*.7+s*.3);
        } else if(kind==='green'){
          col=mix([40,62,28], [150,160,70], s);
          if(s>.7) col=mix(col,[220,210,160],.45);
        } else if(kind==='crater'){
          col=mix([36,32,28], [150,142,130], s);
        } else if(kind==='ash'){
          col=mix([28,30,34], [168,172,176], s);
          if(pole>.55) col=mix(col,[236,240,244],(pole-.55)*1.4);
        } else if(kind==='rust'){
          col=mix([42,22,12], [196,122,64], s);
          if(s>.78) col=mix(col,[120,70,40],.4);
        } else {
          col=mix(mix(base,[12,10,8],.62), mix(base,[255,244,230],.55), s);
          if(pole>.7) col=mix(col,[230,236,242],(pole-.7)*1.6);
        }
        if(kind!=='gas'&&kind!=='city'&&kind!=='ice'){
          for(let i=0;i<craters.length;i++){
            const cr=craters[i]; let du=Math.abs(u-cr.u); if(du>.5) du=1-du; const dv=(v-cr.v)*(h/w);
            const q=Math.hypot(du,dv)/cr.r;
            if(q<1){ const rim=q>.72&&q<1; col=mix(col, rim?light:dark, rim?.55:(1-q)*.45); break; }
          }
        }
        col=rgb([col[0]+grain*40, col[1]+grain*36, col[2]+grain*30]);
        const i=(y*w+x)*4; d[i]=col[0]; d[i+1]=col[1]; d[i+2]=col[2]; d[i+3]=255;
      }
    }
    ctx.putImageData(img,0,0);
    return c;
  }
  SC.paintBody=function(name, baseHex, big){
    const w=big?1024:512, h=big?512:256, key=name+'@'+w;
    if(cache[key]) return cache[key];
    cache[key]=paint(name, baseHex, w, h);
    return cache[key];
  };
  SC.bodyRough=function(name){ return ROUGH[KIND[name]||'rock']; };
})();
