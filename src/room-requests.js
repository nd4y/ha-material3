// A service ACK is not a state confirmation. Keep room controls pending until
// their exact HA helpers read back, without automatically repeating commands.
export const roomChangePending=card=>Object.keys(card._roomRequests||{}).length>0;
function finish(card,key,request,error){
  if(card._roomRequests?.[key]!==request)return;
  clearTimeout(card._roomRequestTimers?.get(key));card._roomRequestTimers?.delete(key);
  const next={...card._roomRequests};delete next[key];card._roomRequests=next;
  card._roomErrors={...card._roomErrors,[key]:error};
  if(key==='room-target')card._roomTargetDraft=null;
}
export function syncRoomRequests(card){
  for(const[key,request]of Object.entries(card._roomRequests||{}))if(request.checks.every(([id,value])=>typeof value==='number'?String(card.s(id)?.state??'').trim()!==''&&Number(card.s(id)?.state)===value:card.s(id)?.state===value))finish(card,key,request,false);
}
export function resumeRoomRequests(card){
  card._roomRequestTimers||=new Map();
  for(const[key,request]of Object.entries(card._roomRequests||{})){
    clearTimeout(card._roomRequestTimers.get(key));
    card._roomRequestTimers.set(key,setTimeout(()=>finish(card,key,request,true),Math.max(0,request.deadline-Date.now())));
  }
}
export function pauseRoomRequests(card){for(const timer of card._roomRequestTimers?.values()||[])clearTimeout(timer);card._roomRequestTimers?.clear();}
export async function runRoomChange(card,key,action,checks){
  if(card._busy||roomChangePending(card))return;
  const request={checks,deadline:Date.now()+10000};card._roomRequests={[key]:request};card._roomErrors={};resumeRoomRequests(card);
  await card.run(action,key);
  if(card._error){card._error=false;finish(card,key,request,true);}else syncRoomRequests(card);
}
