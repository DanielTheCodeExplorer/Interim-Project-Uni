import { createMaskPane, createSolidMask, createMaskWithHole, addNigeriaLayer } from './layers.js';
import { worldBounds } from './mapConfig.js';

// Responsive helpers for padding/zoom so fits nicely on different screens
function getPadding() {
  const base = Math.max(12, Math.min(window.innerWidth, window.innerHeight) * 0.05);
  return [base, base];
}

function getWorldZoom(map) {
  return map.getBoundsZoom(worldBounds, true);
}

function attachFocusButton(onNigeria, onWorld) {
  document.getElementById('nigeria-btn')?.addEventListener('click', onNigeria);
  document.getElementById('world-btn')?.addEventListener('click', onWorld);
}

export function setupFocus(map) {
  createMaskPane(map);
  let mask = createSolidMask(map);
  const mapEl = map.getContainer();
  const toggleCursor = (on) => {
    mapEl?.classList.toggle('map-button-cursor', on);
  };
  let nigeriaLayer = null;
  let nigeriaBounds = null;
  let dataReady = false;
  let shadeTimer = null;
  const originalMinZoom = map.getMinZoom();

  const scheduleDim = (on, delayMs) => {
    clearTimeout(shadeTimer);
    shadeTimer = setTimeout(() => {
      mask.setStyle({ fillOpacity: on ? 0.5 : 0 });
    }, delayMs);
  };

  const nigeriaFocus = () => {
    if (!dataReady) return;
    nigeriaLayer?.setStyle({ color: '#444', weight: 1, fillOpacity: 0.15, opacity: 1 });
    scheduleDim(true, 50);
    toggleCursor(true);

    const fitZoom = map.getBoundsZoom(nigeriaBounds, true);
    const desiredZoom = Math.min(fitZoom - .1 , map.getMaxZoom());

    map.once('moveend', () => {
      map.setMaxBounds(nigeriaBounds);
      map.setMinZoom(desiredZoom);
    });
    map.flyTo(nigeriaBounds.getCenter(), desiredZoom, { padding: getPadding(), duration: 0.75 });
  };


  const worldFocus = () => {
    if (!dataReady) return;
    nigeriaLayer?.setStyle({ weight: 0, fillOpacity: 0, opacity: 0 });
    scheduleDim(false, 50);
    toggleCursor(false);
    map.setMaxBounds(worldBounds)
    map.setMinZoom(originalMinZoom);
    map.flyTo(worldBounds.getCenter(), getWorldZoom(map), { duration: 0.75 });
  };

  attachFocusButton(nigeriaFocus, worldFocus);

  // Start in world view immediately
  map.setMaxBounds(worldBounds);
  map.flyTo(worldBounds.getCenter(), getWorldZoom(map), { duration: 0 });

  // Load Nigeria borders and swap the solid mask for a holed one
  fetch('nigeria.geojson')
    .then((r) => {
      if (!r.ok) throw new Error(`Http ${r.status}`);
      return r.json();
    })
    .then((geo) => {
      const ring = geo.features[0].geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
      nigeriaBounds = L.latLngBounds(ring);
      mask.remove();
      mask = createMaskWithHole(map, ring);
      nigeriaLayer = addNigeriaLayer(map, geo);
      dataReady = true;
      worldFocus(); // start in world focus mode once data is ready
      console.log('It has loaded')
    })
    .catch(console.error);

  return { nigeriaFocus, worldFocus };
}
