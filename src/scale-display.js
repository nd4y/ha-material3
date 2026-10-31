// Display-only continuity. Never used to create or confirm a command.
export const displayPrefix='ha-m3.scale-display.v1.';
export function scaleDisplayRecord(model,signature,now=Date.now()){
  return {signature,savedAt:now,choices:model.choices,position:model.position,owner:model.owner};
}
export function restoreScaleDisplay(record,signature,model,now=Date.now()){
  if(!record||record.signature!==signature||!Number.isFinite(record.savedAt)||now-record.savedAt<0||now-record.savedAt>86400000)return null;
  const {choices,position,owner}=record;
  if(!Array.isArray(choices)||choices.length<3||choices.length>503||choices[0]!=='off'||choices.at(-1)!=='auto'||!Number.isInteger(position)||position<0||position>=choices.length||!['ha','manual','native'].includes(owner))return null;
  if(choices.some(v=>!(typeof v==='number'&&Number.isFinite(v)||typeof v==='string'&&v.length>0&&v.length<=50)))return null;
  return {...model,choices,position,owner,available:false,selectable:false,selectionOnly:true,displayOnly:true,offline:true,effective:null,room:null,turboCooldown:0};
}
