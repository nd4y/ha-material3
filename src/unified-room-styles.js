import {css} from 'lit';
export const unifiedRoomStyles=css`
  .unified-goals{display:contents}.unified-goals-heading{display:none}
  .climate-page[data-unified]{background:transparent;padding:4px 0;border-radius:0}
  .climate-page[data-unified]>.calm-head{margin:0 12px 16px;gap:8px;min-height:52px}
  .climate-page[data-unified]>.calm-head h2{font-size:28px;line-height:36px;font-weight:500}
  .climate-page[data-unified]>.calm-head ha-m3-journal-card{flex:0 0 48px;width:48px}
  .climate-page[data-unified]>.room-metrics{gap:12px 20px;padding:0 12px;margin:0 0 20px;border-radius:0;background:transparent;overflow:visible}
  .climate-page[data-unified] .room-metric{background:transparent;padding:0;min-width:0}
  .climate-page[data-unified][data-compact] .room-metric-button{min-height:82px;padding:4px;gap:3px}
  .climate-page[data-unified] .room-metric-label{order:2;font-size:14px;line-height:20px}
  .climate-page[data-unified] .room-metric-label .symbol{display:none}
  .climate-page[data-unified] .room-metric-value{order:1;font-size:28px;line-height:36px;font-weight:500}
  .climate-page[data-unified] .room-metric-value small{font-size:15px;line-height:20px}
  .climate-page[data-unified] .room-metric-status{order:3;font-size:12px;line-height:16px}
  .climate-page[data-unified] .room-metric[data-quality=fresh] .room-metric-status{display:none}
  .climate-page[data-unified] .unified-goals{display:block;background:var(--ha-m3-owner-auto-surface,var(--md-sys-color-secondary-container));border-radius:28px;padding:10px}
  .climate-page[data-unified] .unified-goals-heading{display:flex;align-items:center;gap:12px;padding:0 6px 6px;min-height:44px}
  .climate-page[data-unified] .unified-goals-heading>.symbol{color:var(--ha-m3-operation-fan,var(--md-sys-color-primary));font-size:22px}
  .climate-page[data-unified] .unified-goals-heading h3{font-size:18px;line-height:24px;font-weight:500;margin:0;flex:1}
  .climate-page[data-unified][data-compact] .calm-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px;background:transparent;overflow:visible;border-radius:20px}
  .climate-page[data-unified][data-compact] .calm-body>div{padding:12px 14px;border-radius:5px;min-width:0;background:var(--md-sys-color-surface-container-high)}
  .climate-page[data-unified][data-compact] .calm-body>div:first-child{background:var(--ha-m3-operation-cool-container,var(--md-sys-color-secondary-container));border-top-left-radius:20px;--goal-tone:var(--ha-m3-operation-cool,var(--md-sys-color-primary))}
  .climate-page[data-unified][data-compact] .calm-body>[data-air-goal=fresh]{grid-column:1;grid-row:2;border-bottom-left-radius:20px;background:var(--ha-m3-operation-fan-container,var(--md-sys-color-surface-container-high));--goal-tone:var(--ha-m3-operation-fan,var(--md-sys-color-primary))}
  .climate-page[data-unified][data-compact] .calm-body>[data-air-goal=clean]{grid-column:2;grid-row:2;border-bottom-right-radius:20px;background:var(--ha-m3-operation-clean-container,var(--md-sys-color-surface-container-high));--goal-tone:var(--ha-m3-operation-clean,var(--md-sys-color-tertiary))}
  .climate-page[data-unified][data-compact] .calm-body>[data-air-goal=noise]{grid-column:2;grid-row:1;border-top-right-radius:20px;--goal-tone:var(--md-sys-color-secondary)}
  .climate-page[data-unified][data-compact] .room-target-heading,.climate-page[data-unified][data-compact] .air-goal-heading{padding:0;min-height:32px;font-size:14px}
  .climate-page[data-unified] .air-goal-heading output,.climate-page[data-unified] .room-target-heading output{color:var(--goal-tone);font-size:16px;line-height:22px}
  .climate-page[data-unified] .air-scale,.climate-page[data-unified] .room-target .endpoints{display:none}
  .climate-page[data-unified] .air-boost{margin:0;min-height:44px}
  .climate-page[data-unified] .air-boost ha-m3-button{--md-sys-color-primary:var(--goal-tone)}
  .climate-page[data-unified] .calm-head .room-trust{margin:0}
  .climate-page[data-unified] .calm-head .room-trust:not([data-not-ready]) .trust-scope{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
  .climate-page[data-unified] .calm-body>div{transition:background-color 240ms,color 240ms}
  @container(max-width:650px){
    .climate-page[data-unified][data-compact] .calm-body{grid-template-columns:1fr}
    .climate-page[data-unified][data-compact] .calm-body>div,.climate-page[data-unified][data-compact] .calm-body>[data-air-goal]{grid-column:auto;grid-row:auto;border-radius:5px}
    .climate-page[data-unified][data-compact] .calm-body>div:first-child{border-radius:20px 20px 5px 5px}
    .climate-page[data-unified][data-compact] .calm-body>div:last-child,.climate-page[data-unified][data-compact] .calm-body>[data-air-goal]:last-child{border-radius:5px 5px 20px 20px}
    .climate-page[data-unified]>.calm-head{gap:4px;margin-inline:4px}
    .climate-page[data-unified]>.calm-head h2{font-size:24px;line-height:32px}
  }
  @media(prefers-reduced-motion:reduce){.climate-page[data-unified] *{transition:none!important;animation:none!important}}
  .climate-page[data-unified][data-motion=reduced] *{transition:none!important;animation:none!important}
`;
