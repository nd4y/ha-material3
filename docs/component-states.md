# Expressive component/state contract

Reference checked 2026-10-17: [M3](https://m3.material.io/), [motion overview/specs](https://m3.material.io/styles/motion/overview/specs), [connected button groups](https://m3.material.io/components/button-groups/specs), Google Material Web token snapshot 34.0.21. Token files in the dependency default to Standard motion; Expressive values below were read in the official **Expressive, Web** context, rather than assumed from the default file.

## Geometry and state roles

| Component | Contract |
| --- | --- |
| Small button/icon button | 40px visual container, minimum48px native button target; full corner20, pressed corner8; on/container color pair; focus ring3px |
| Connected small group | 2px gap; inner8, outer full20, selected corners full; pressed inner4 while outer connected corners remain full; keyboard radio-group navigation |
| State layers | Hover0.08, focus0.10, pressed0.10; selected state also has a check or native aria state; no color-only selection |
| Disabled | Container On Surface0.12, content On Surface0.38; actual disabled control prevents writes |
| Switch | Track52x32, outline2, icon handle24, pressed28; state layer40, icon16; selected on-primary handle, off outline handle; native role=switch |
| Slider | Two16px tracks, inner corner2, outer full; handle4x44, focus/pressed width2; gap6 each side, stop indicators4; native range keyboard/pointer semantics,64px control target |
| Dialog | Corner28, Surface Container High, scrim32%; native modal focus/cancel semantics and localized accessible heading |
| Navigation | Standalone panel: rail80, indicator56x32; selected label On Surface, icon On Secondary Container. Integrated Lovelace dashboard: compact section navigation without a second app bar/rail. Compact navigation bar80 high, sticky within the owned dashboard |
| App surfaces | Composite containers use28 and temperature region20. These are app compositions, not a claim that standard filled M3 cards have changed from corner12 |
| Outlined select | Selected official Material Web field/option/menu implementation, fully namespaced; no global md-* registration |

Readings are formatted with the HA/user locale. Unknown/unavailable helpers do not display a fictitious numeric value. Off states suppress stale speed attributes. Conditional secondary fields hide saved manual settings in automatic mode.

## Motion

| Token | Damping ratio | Stiffness | Use |
| --- | --- | --- | --- |
| Fast spatial | .6 |800| Buttons, switch and slider geometry |
| Default spatial | .8 |380| Dialog entry |
| Slow spatial | .8 |200| Available for larger extension components |
| Fast effects |1|3800| Non-overshooting effects |
| Default effects |1|1600| Dialog opacity |
| Slow effects |1|800| Available for larger extension components |

Mass is1. The analytic solver integrates the damped spring exactly for each elapsed time and preserves both position and velocity on retarget. Dragged slider position follows native input directly; subsequent programmatic changes use spring motion. Idle components schedule no continuous animation frames. Disconnect cancels their animation controllers.

Color/state-layer CSS transitions use the published Expressive fast-effects Web conversion:150ms, cubic-bezier(.31,.94,.34,1). Modal scrim uses default effects200ms, cubic-bezier(.34,.80,.34,1). Dropdown opening uses default-spatial Web conversion500ms, cubic-bezier(.38,1.21,.22,1), closing uses fast-spatial350ms, cubic-bezier(.42,1.67,.21,.90). These are documented non-gestural curve fallbacks, not a claim that CSS cubic-bezier preserves physical velocity. Gestural owned geometry uses the real spring solver.

System reduced-motion removes owned spatial movement and vendor CSS transitions; explicit reduced mode also snaps owned geometry and sets the dropdown's quick mode. No initial decorative animation or loop is added, apart from the conventional pending progress indicator, which becomes static under system reduced-motion.

## Command state

Loading disables duplicate commands and announces progress. A failed command retains confirmed HA values, shows a localized error and offers retry. Focus is restored after pending controls re-enable. Numeric target changes use HA bounds/step; ventilation only invokes its configured action. Countdown is a view of the backend timer and never performs a physical return-to-everyday action from a browser.

The component matrix is the implementation contract and audit basis. It is not Google certification, does not cover HA's native administrative interface, and does not assert pixel identity under recoloring extensions or untested browsers.
