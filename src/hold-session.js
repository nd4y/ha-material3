// Release-to-confirm: reaching the duration alone never performs an action.
export function holdDuration(value=1200){
  if(typeof value!=='number'||!Number.isFinite(value)||value<800||value>5000)throw new Error('hold_duration must be 800-5000 milliseconds');
  return value;
}
export class HoldSession{
  constructor(duration=1200){this.duration=holdDuration(duration);this.cancel();}
  start(id,now){if(this.id!==null){this.cancel();return false;}this.id=id;this.started=now;return true;}
  release(id,now){const ready=this.id!==null&&id===this.id&&Number.isFinite(now)&&now-this.started>=this.duration;this.cancel();return ready;}
  cancel(){this.id=null;this.started=0;}
}
