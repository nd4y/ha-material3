// Native Lovelace navigation only. Device controls never participate in this gesture.
const interactive='button,a,input,select,textarea,summary,video,canvas,iframe,[contenteditable],[role="button"],[role="slider"],[role="dialog"],dialog,[popover],ha-m3-slider,ha-m3-history,ha-camera-stream,hui-picture-entity-card,camera-cache-card,intercom-audio-call-card,apartment-3d-card,[data-no-swipe]';
export function validateSwipeNavigation(config){
  if(config===undefined||config===false)return;
  const paths=config?.paths;
  if(!Array.isArray(paths)||paths.length<2||paths.length>20||new Set(paths).size!==paths.length||paths.some(p=>typeof p!=='string'||!/^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(p)))throw Error('swipe_navigation needs 2..20 unique local dashboard view paths');
  if(new Set(paths.map(p=>p.split('/')[1])).size!==1)throw Error('Swipe paths must belong to one dashboard');
}
export function swipeDestination(paths,current,{dx,dy,duration,width}){
  if(![dx,dy,duration,width].every(Number.isFinite)||duration<0||duration>1000||width<=0||Math.abs(dx)<Math.min(96,Math.max(56,width*.18))||Math.abs(dx)<Math.abs(dy)*1.6)return null;
  const index=paths.indexOf(current);
  return index<0?null:paths[index+(dx<0?1:-1)]||null;
}
function viewOf(host){for(let node=host;node;node=node.parentNode||node.host){if(node.localName==='hui-view')return node;}return null;}
function openOverlay(root){
  for(const element of root.querySelectorAll('dialog[open],[popover]:popover-open'))if(element.getBoundingClientRect().width)return true;
  for(const element of root.querySelectorAll('*'))if(element.shadowRoot&&openOverlay(element.shadowRoot))return true;
  return false;
}
export function bindSwipeNavigation(host,config){
  validateSwipeNavigation(config);if(!config)return ()=>{};
  let gesture=null,swallowUntil=0;
  const cancel=()=>{gesture=null;};
  const start=event=>{
    cancel();swallowUntil=0;
    if(event.touches.length!==1||!host.isConnected||!config.paths.includes(location.pathname)||location.search.includes('edit=1'))return;
    const path=event.composedPath(),view=viewOf(host),touch=event.touches[0];
    if(!view||!path.includes(view)||path.some(e=>e.matches?.(interactive))||touch.clientX<24||touch.clientX>innerWidth-24||openOverlay(document))return;
    gesture={id:touch.identifier,x:touch.clientX,y:touch.clientY,time:event.timeStamp,view,active:false};
  };
  const move=event=>{
    if(!gesture)return;if(event.touches.length!==1){cancel();return;}
    const touch=event.touches[0];if(touch.identifier!==gesture.id){cancel();return;}
    const dx=Math.abs(touch.clientX-gesture.x),dy=Math.abs(touch.clientY-gesture.y);
    if(!gesture.active&&dy>10&&dy>dx){cancel();return;}
    if(dx>18&&dx>dy*1.6)gesture.active=true;
    if(gesture.active&&event.cancelable)event.preventDefault();
  };
  const end=event=>{
    const g=gesture;cancel();if(!g||!g.active||event.touches.length)return;
    const touch=[...event.changedTouches].find(t=>t.identifier===g.id);if(!touch)return;
    const destination=swipeDestination(config.paths,location.pathname,{dx:touch.clientX-g.x,dy:touch.clientY-g.y,duration:event.timeStamp-g.time,width:innerWidth});
    if(!destination)return;
    if(event.cancelable)event.preventDefault();swallowUntil=performance.now()+500;
    history.pushState(null,'',destination);window.dispatchEvent(new CustomEvent('location-changed'));
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&host.motion!=='reduced'){
      requestAnimationFrame(()=>{if(g.view.isConnected)g.view.animate?.([{opacity:.5,transform:`translateX(${touch.clientX<g.x?16:-16}px)`},{opacity:1,transform:'translateX(0)'}],{duration:200,easing:'cubic-bezier(.2,0,0,1)'});});
    }
  };
  const click=event=>{if(event.detail&&performance.now()<swallowUntil){event.preventDefault();event.stopImmediatePropagation();swallowUntil=0;}};
  const listeners=[['touchstart',start,{capture:true,passive:true}],['touchmove',move,{capture:true,passive:false}],['touchend',end,{capture:true,passive:false}],['touchcancel',cancel,true],['scroll',cancel,true],['blur',cancel,true],['popstate',cancel,true],['location-changed',cancel,true],['click',click,true]];
  for(const [type,fn,options]of listeners)window.addEventListener(type,fn,options);
  document.addEventListener('visibilitychange',cancel);
  return ()=>{cancel();for(const[type,fn,options]of listeners)window.removeEventListener(type,fn,options);document.removeEventListener('visibilitychange',cancel);};
}
