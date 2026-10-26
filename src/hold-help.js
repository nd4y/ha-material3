import {nothing} from 'lit';
import {directive,PartType} from 'lit/directive.js';
import {AsyncDirective} from 'lit/async-directive.js';
import './components.js';

// Element directive: keep the existing tap action, reserve hold/F1 for help.
// Help owns no HA state or action. A consumed gesture cannot become a click.
class HoldHelpDirective extends AsyncDirective{
  constructor(info){
    super(info);
    if(info.type!==PartType.ELEMENT)throw new Error('holdHelp requires an element part');
    this.pointer=null;this.suppressClick=false;
    this.handlers={
      pointerdown:event=>this.start(event),
      pointermove:event=>{if(this.pointer?.id===event.pointerId&&Math.hypot(event.clientX-this.pointer.x,event.clientY-this.pointer.y)>10)this.cancel(true);},
      pointerup:event=>{if(this.pointer?.id===event.pointerId)this.cancel(false);},
      pointercancel:()=>this.cancel(true),
      pointerleave:()=>this.cancel(true),
      blur:()=>this.cancel(true),
      click:event=>{if(this.suppressClick){event.preventDefault();event.stopImmediatePropagation();}},
      contextmenu:event=>{event.preventDefault();event.stopPropagation();this.showHelp();},
      keydown:event=>{
        if(event.key==='F1'){event.preventDefault();event.stopPropagation();if(!event.repeat)this.showHelp();}
        else if(!event.repeat&&(event.key==='Enter'||event.key===' '))this.suppressClick=false;
      }
    };
    this.cancelExternal=()=>this.cancel(true);
    this.visibilityChanged=()=>{if(this.element?.ownerDocument.hidden)this.cancel(true);};
  }
  render(){return nothing;}
  update(part,[options]){
    this.options=options;
    if(this.element!==part.element){this.unbind();this.element=part.element;this.bind();}
    return nothing;
  }
  bind(){
    if(this.bound||!this.element)return;
    this.bound=true;
    for(const [type,handler]of Object.entries(this.handlers))this.element.addEventListener(type,handler,true);
    this.window=this.element.ownerDocument.defaultView;
    this.window.addEventListener('scroll',this.cancelExternal,true);
    this.window.addEventListener('blur',this.cancelExternal);
    this.element.ownerDocument.addEventListener('visibilitychange',this.visibilityChanged);
  }
  unbind(){
    this.cancel(true);
    if(this.bound){
      for(const [type,handler]of Object.entries(this.handlers))this.element.removeEventListener(type,handler,true);
      this.window.removeEventListener('scroll',this.cancelExternal,true);
      this.window.removeEventListener('blur',this.cancelExternal);
      this.element.ownerDocument.removeEventListener('visibilitychange',this.visibilityChanged);
      this.bound=false;
    }
    this.removeDialog(false);
  }
  disconnected(){this.unbind();}
  reconnected(){this.bind();}
  start(event){
    if(event.isPrimary===false){this.cancel(true);return;}
    if(event.button!==0)return;
    this.cancel(false);this.suppressClick=false;
    if(this.element.disabled||this.element.loading||this.element.getAttribute('aria-disabled')==='true')return;
    this.pointer={id:event.pointerId,x:event.clientX,y:event.clientY};
    this.timer=setTimeout(()=>this.showHelp(),600);
  }
  cancel(suppress){
    clearTimeout(this.timer);
    if(suppress&&this.pointer)this.suppressClick=true;
    this.pointer=null;
  }
  showHelp(){
    this.cancel(false);this.suppressClick=true;
    if(!this.isConnected||!this.element?.isConnected||this.dialog)return;
    const document=this.element.ownerDocument,dialog=document.createElement('ha-m3-dialog');
    dialog.dataset.holdHelp='';dialog.heading=this.options.heading;
    dialog.motion=this.options.motion||'expressive';dialog.lang=this.options.language||'en';
    // showModal can retarget the held finger's release to the backdrop. Consume
    // that click here as well; an explicit new gesture may close the help.
    let openingGesture=true;
    dialog.addEventListener('pointerdown',()=>{openingGesture=false;},true);
    dialog.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')openingGesture=false;},true);
    dialog.addEventListener('click',event=>{if(openingGesture){event.preventDefault();event.stopImmediatePropagation();}},true);
    dialog.addEventListener('contextmenu',event=>{if(openingGesture)event.preventDefault();},true);
    const body=document.createElement('p');body.style.whiteSpace='pre-line';body.textContent=this.options.body;
    dialog.append(body);
    dialog.addEventListener('m3-closed',()=>this.removeDialog(true),{once:true});
    this.dialog=dialog;
    // Keep the card's theme variables; the native modal still uses the top layer.
    const root=this.element.getRootNode();(root.nodeType===11?root:document.body).append(dialog);
    // The owning card can disappear while the dialog awaits its first render.
    dialog.show().catch(()=>{if(this.dialog===dialog)this.removeDialog(false);});
  }
  removeDialog(restoreFocus){
    const dialog=this.dialog;if(!dialog)return;
    this.dialog=null;
    dialog.renderRoot?.querySelector('dialog')?.close();dialog.remove();
    if(restoreFocus&&this.element?.isConnected)this.element.focus({preventScroll:true});
  }
}

export const holdHelp=directive(HoldHelpDirective);
