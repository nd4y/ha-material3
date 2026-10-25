import {validateControls} from './quick-controls.js';
import {validateConfig} from './ha.js';

export function deviceGroupConfig(config){
  const next=validateConfig(config,'panel');
  if(!Array.isArray(next.cards)||!next.cards.length||next.cards.length>12)throw new Error('Device group needs 1-12 quick device cards');
  if(next.title!==undefined&&(typeof next.title!=='string'||!next.title.trim()))throw new Error('Invalid device group title');
  next.cards=next.cards.map(card=>{
    if(card?.type!=='custom:ha-m3-quick-device-card')throw new Error('Device group supports quick device cards');
    const child={...card,config_version:card.config_version??next.config_version??1,language:card.language??next.language,appearance:{...next.appearance,...card.appearance},grouped:true};
    validateControls(child);return validateConfig(child,'device');
  });
  return next;
}
