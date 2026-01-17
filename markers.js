import { downloadFiberCSV } from './getData.js';

const cursorClasses = ['cursor-fiber', 'cursor-cell', 'cursor-copper'];

function applyCursor(mapEl, cls) {
  if (!mapEl) return;
  mapEl.classList.remove(...cursorClasses);
  if (cls) mapEl.classList.add(cls);
}

export function setupMarkers(map) {
  const mapEl = map.getContainer();
  const fiberBtn = document.getElementById('fiber-btn');
  const cellBtn = document.getElementById('cell-btn');
  const copperBtn = document.getElementById('copper-btn');
  const downloadBtn = document.getElementById('download-btn');
  const buttons = { fiber: fiberBtn, cell: cellBtn, copper: copperBtn };
  const markers = [];
  const lines = { fiber: [], cell: [], copper: [] };
  const segmentPoints = { fiber: [], cell: [], copper: [] };
  const segmentLine = { fiber: null, cell: null, copper: null };
  let activeType = null;

  // Bail early if Leaflet isn't available or buttons are missing
  if (!mapEl || !window.L) return;

  const styles = {
    fiber: { radius: 6, color: '#A78BFA', fillColor: '#A78BFA', fillOpacity: 1, opacity: 1, pane: 'markerPane' },
    cell: { radius: 6, color: '#60A5FA', fillColor: '#60A5FA', fillOpacity: 1, opacity: 1, pane: 'markerPane' },
    copper: { radius: 6, color: '#C08457', fillColor: '#C08457', fillOpacity: 1, opacity: 1, pane: 'markerPane' },
  };

  const toggleType = (type) => {
    const nextActive = activeType === type ? null : type;

    // Finalize current segment when turning off
    if (activeType && segmentLine[activeType]) {
      lines[activeType].push(segmentLine[activeType]);
      segmentLine[activeType] = null;
      segmentPoints[activeType] = [];
    }

    activeType = nextActive;
    // Reset points for new segment when activating
    if (activeType && segmentLine[activeType]) {
      lines[activeType].push(segmentLine[activeType]);
      segmentLine[activeType] = null;
    }
    if (activeType) segmentPoints[activeType] = [];

    applyCursor(mapEl, activeType ? `cursor-${activeType}` : null);
    Object.entries(buttons).forEach(([key, btn]) => {
      if (!btn) return;
      btn.classList.toggle('marker-active', activeType === key);
    });
  };

  const addMarker = (latlng, type) => {
    const marker = window.L.circleMarker(latlng, styles[type]).addTo(map);
    marker.bringToFront();

    const entry = { marker, type, coverage: null, decayTimer: null, placedAt: new Date().toISOString() };

    if (type === 'cell') {
      // Show a steady coverage radius for towers (no fading)
      const coverage = window.L.circle(latlng, {
        radius: 50000, // meters
        color: 'transparent',
        fillColor: styles[type].color,
        fillOpacity: 0.35,
        weight: 0,
      }).addTo(map);

      entry.coverage = coverage;
      entry.decayTimer = null;
    }

    markers.push(entry);
    redrawLine(type);
  };

  const redrawLine = (type) => {
    // Cellular towers stay independent; no connecting lines
    if (type === 'cell') return;
    segmentPoints[type].push(markers[markers.length - 1].marker.getLatLng());
    if (segmentPoints[type].length < 2) return;
    if (segmentLine[type]) {
      map.removeLayer(segmentLine[type]);
      lines[type] = lines[type].filter((l) => l !== segmentLine[type]);
      segmentLine[type] = null;
    }
    segmentLine[type] = window.L.polyline(segmentPoints[type], {
      color: styles[type].color,
      weight: 2,
      opacity: 0.8,
    }).addTo(map);
    lines[type].push(segmentLine[type]);
  };

  fiberBtn?.addEventListener('click', () => toggleType('fiber'));
  cellBtn?.addEventListener('click', () => toggleType('cell'));
  copperBtn?.addEventListener('click', () => toggleType('copper'));

  map.on('click', (e) => {
    if (!activeType) return;
    addMarker(e.latlng, activeType);
  });

  downloadBtn?.addEventListener('click', () => {
    const fiberData = markers
      .filter((m) => m.type === 'fiber')
      .map((m, idx) => ({
        id: idx + 1,
        type: m.type,
        lat: m.marker.getLatLng().lat,
        lng: m.marker.getLatLng().lng,
        placedAt: m.placedAt,
      }));
    downloadFiberCSV(fiberData);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'map-download-triggered' }, '*');
    }
    setTimeout(() => { window.location.href = './dashboard.html'; }, 200);
  });
}
