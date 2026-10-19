import './components.js';
import './fields.js';
import {M3ClimateCard,M3DeviceCard,M3CameraCard} from './cards.js';
import {M3QuickDeviceCard} from './quick-card.js';
import {M3Dashboard} from './panel.js';
import './editor.js';
import {loadFonts} from './theme.js';
loadFonts();
for(const Card of [M3ClimateCard,M3DeviceCard,M3QuickDeviceCard,M3CameraCard,M3Dashboard])Card.getConfigElement=()=>document.createElement('ha-m3-editor');
M3ClimateCard.getStubConfig=()=>({config_version:1,entities:{room_temperature:'sensor.choose_temperature',target_temperature:'input_number.choose_target',enabled:'input_boolean.choose_control'},presets:[]});
M3DeviceCard.getStubConfig=()=>({config_version:1,entity:'sensor.choose_entity'});
M3QuickDeviceCard.getStubConfig=()=>({config_version:1,entity:'sensor.choose_entity',quick_controls:[]});
M3CameraCard.getStubConfig=()=>({config_version:1,entity:'camera.choose_camera'});
M3Dashboard.getStubConfig=()=>({config_version:1,home:{cards:[]},rooms:[]});
window.customCards=window.customCards||[];
for(const[type,name,description]of[
  ['ha-m3-climate-card','Material 3 Expressive - Climate','Room target, control and ventilation presets'],
  ['ha-m3-camera-card','Material 3 Expressive - Camera','Native HA camera with preview fallback'],
  ['ha-m3-device-card','Material 3 Expressive - Device','Entity controls and live state'],
  ['ha-m3-quick-device-card','Material 3 Expressive - Quick controls','Configurable sliders, native Auto and persistent automation locks'],
  ['ha-m3-dashboard','Material 3 Expressive - Composite','Optional composition with its own navigation; use individual cards for native HA views'],
])if(!window.customCards.some(card=>card.type===type))window.customCards.push({type,name,description});
export const version=__VERSION__;
