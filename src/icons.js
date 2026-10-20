// Shared by configuration validation, components and the local font subset.
export const symbols=['ac_unit','add','air','arrow_back','arrow_forward','auto_awesome','check','check_circle','chevron_right','close','delete','devices','eco','error','expand_more','home','humidity_percentage','info','kitchen','lightbulb','lock','meeting_room','menu','menu_book','mode_fan','more_horiz','open_in_full','pause','play_arrow','power_settings_new','refresh','remove','settings','thermostat','thermostat_auto','tune','vacuum','videocam','water_drop','lock_open'];
const bundled=new Set(symbols);
export const isBundledIcon=name=>bundled.has(name);
