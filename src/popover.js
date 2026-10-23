import {css} from 'lit';
export const popoverStyles=css`
  [popover]{position:fixed;inset:auto;margin:0;left:var(--popover-left,16px);top:var(--popover-top,64px);width:min(312px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;border:1px solid var(--md-sys-color-outline-variant);border-radius:20px;padding:16px;background:var(--md-sys-color-surface-container-high);color:var(--md-sys-color-on-surface);box-shadow:0 8px 24px #0004}
  [popover] h3{font-size:16px;line-height:24px;margin:0 0 8px}[popover] p{font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant);margin:8px 0}.popover-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;font-size:14px;line-height:20px}.popover-actions{display:flex;justify-content:flex-end;gap:4px;margin-top:12px}.popover-group{padding-top:12px;margin-top:8px;border-top:1px solid var(--md-sys-color-outline-variant)}
  [popover]:popover-open{animation:m3-pop-in 150ms cubic-bezier(.2,0,0,1)}@keyframes m3-pop-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){[popover]:popover-open{animation:none}}:host([motion=reduced]) [popover]{animation:none}
  .popover-dismiss{float:right;margin:-8px -8px 0 8px}.popover-actions{position:sticky;bottom:-16px;background:var(--md-sys-color-surface-container-high);padding:8px 0 0}
  @media(max-width:700px){[popover]{left:0!important;right:0!important;top:auto!important;bottom:0!important;width:100%;max-height:80dvh;border:0;border-radius:28px 28px 0 0;padding:20px 20px max(16px,env(safe-area-inset-bottom));overscroll-behavior:contain;scroll-padding-bottom:80px}[popover]::backdrop{background:color-mix(in srgb,var(--md-sys-color-scrim) 32%,transparent)}.popover-actions{bottom:calc(-1 * max(16px,env(safe-area-inset-bottom)));padding-bottom:max(8px,env(safe-area-inset-bottom));display:grid;grid-template-columns:1fr 1fr;gap:8px}.popover-actions ha-m3-button{min-width:0}.popover-row{min-height:52px}[popover]:popover-open{animation-name:m3-sheet-in}@keyframes m3-sheet-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}}
`;
export async function openPopover(card,id,event){
  const trigger=event?.currentTarget,rect=trigger?.getBoundingClientRect()||{left:16,bottom:64};
  await card.updateComplete;const panel=card.renderRoot.getElementById(id);if(!panel)return;
  panel.style.setProperty('--popover-left',Math.max(16,Math.min(rect.left,window.innerWidth-328))+'px');
  panel.style.setProperty('--popover-top',Math.max(16,Math.min(rect.bottom+4,window.innerHeight-320))+'px');
  panel.showPopover();
  const bounds=panel.getBoundingClientRect();if(bounds.bottom>window.innerHeight-16)panel.style.setProperty('--popover-top',Math.max(16,window.innerHeight-bounds.height-16)+'px');
  panel.querySelector('input,button,ha-m3-switch,ha-m3-button')?.focus({preventScroll:true});
  if(panel._restoreFocus)panel.removeEventListener('toggle',panel._restoreFocus);
  panel._restoreFocus=e=>{if(e.newState==='closed'){const active=card.renderRoot.activeElement;if(!active||panel.contains(active))trigger?.focus({preventScroll:true});}};
  panel.addEventListener('toggle',panel._restoreFocus);
}
