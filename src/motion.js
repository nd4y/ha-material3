import tokens from '../tokens/motion.json' with {type:'json'};

// Exact closed-form solution of x'' + 2*zeta*sqrt(k)*x' + k*(x-target)=0.
// Retargeting preserves position and velocity, including an interrupted press.
export function springSample(position,velocity,target,seconds,{damping,stiffness}) {
  const t=Math.max(0,seconds),w=Math.sqrt(stiffness),y=position-target;
  if(damping<1){
    const wd=w*Math.sqrt(1-damping*damping),a=damping*w,b=(velocity+a*y)/wd;
    const c=Math.cos(wd*t),s=Math.sin(wd*t),e=Math.exp(-a*t);
    return {position:target+e*(y*c+b*s),velocity:e*(-a*(y*c+b*s)-y*wd*s+b*wd*c)};
  }
  const b=velocity+w*y,e=Math.exp(-w*t);
  return {position:target+(y+b*t)*e,velocity:(velocity-w*b*t)*e};
}

export class Motion {
  constructor(host){this.host=host;this.tracks=new Map();this.frame=0;this.reduced=()=>host.motion==='reduced'||(typeof Element!=='undefined'&&host instanceof Element&&getComputedStyle(host).getPropertyValue('--ha-m3-motion-reduced').trim()==='1')||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
  number(element,key,target,kind='fastSpatial',unit='px'){
    if(!element||!Number.isFinite(target))return;
    let elementTracks=this.tracks.get(element);
    if(!elementTracks)this.tracks.set(element,elementTracks=new Map());
    const previous=elementTracks.get(key),now=performance.now();
    if(previous?.target===target)return;
    const current=previous?springSample(previous.position,previous.velocity,previous.target,(now-previous.time)/1000,previous.token):{position:target,velocity:0};
    const track={...current,target,time:now,token:tokens.springs[kind],unit};
    if(this.reduced()||!previous){track.position=target;track.velocity=0;element.style.setProperty(key,`${target}${unit}`);}
    elementTracks.set(key,track);
    if(previous&&!this.reduced()&&!this.frame)this.frame=requestAnimationFrame(t=>this.step(t));
  }
  snap(element,key,value,unit='px'){
    let tracks=this.tracks.get(element);if(!tracks)this.tracks.set(element,tracks=new Map());
    tracks.set(key,{position:value,velocity:0,target:value,time:performance.now(),token:tokens.springs.fastSpatial,unit});element.style.setProperty(key,`${value}${unit}`);
  }
  step(now){
    this.frame=0;let moving=false;
    for(const [element,tracks]of this.tracks){
      if(!element.isConnected){this.tracks.delete(element);continue;}
      for(const [key,tr]of tracks){
        const next=this.reduced()?{position:tr.target,velocity:0}:springSample(tr.position,tr.velocity,tr.target,(now-tr.time)/1000,tr.token);
        const settled=Math.abs(next.position-tr.target)<0.001&&Math.abs(next.velocity)<0.001;
        tr.position=settled?tr.target:next.position;tr.velocity=settled?0:next.velocity;tr.time=now;
        element.style.setProperty(key,`${tr.position}${tr.unit}`);moving||=!settled;
      }
    }
    if(moving)this.frame=requestAnimationFrame(t=>this.step(t));
  }
  stop(){cancelAnimationFrame(this.frame);this.frame=0;this.tracks.clear();}
}
export const motionTokens=tokens;
