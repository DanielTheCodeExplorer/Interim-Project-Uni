import { createMap } from './mapConfig.js';
import { setupFocus } from './focus.js';

// Create the map and hand focus/dimming/data loading to focus.js
const map = createMap();
setupFocus(map);
