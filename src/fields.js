// Build-time namespace transform covers registrations, templates and selectors.
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';
import './slider.js';
import {html} from 'lit';
export const selectField=(label,value,options,onChange,disabled=false,reduced=false)=>html`<ha-m3-md-outlined-select class="select-field" label=${label} .value=${String(value??'')} .quick=${reduced} ?data-m3-reduced=${reduced} ?disabled=${disabled} @change=${e=>onChange(e.target.value)}>${options.map(option=>html`<ha-m3-md-select-option value=${String(option.value??option)}><span slot="headline">${option.label??option}</span></ha-m3-md-select-option>`)}</ha-m3-md-outlined-select>`;
export const sliderField=(label,value,min,max,step,onChange,disabled=false,motion='expressive')=>html`<div class="slider-label"><span>${label}</span><output>${value}</output><ha-m3-slider .label=${label} .value=${Number(value)} .min=${Number(min)} .max=${Number(max)} .step=${Number(step)} .disabled=${disabled} motion=${motion} @m3-change=${e=>onChange(e.detail.value)}></ha-m3-slider></div>`;
