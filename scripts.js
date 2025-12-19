//Getting the map ready
// Allow fractional zoom steps so flyTo can land between whole-number levels
var map = L.map('map', {
    zoomSnap: 0.25,
    zoomDelta: 0.5
}).setView([51.505, -0.09], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

function createMaskPane(map) {
    const pane = map.createPane('mask');
    pane.style.zIndex = 300;
    pane.style.pointerEvents = 'none';
    return pane;
}

function createSolidMask(map, pane) {
    return L.rectangle([[-90, -180], [90, 180]], {
        pane: pane || 'mask',
        color: '#000',
        weight: 0,
        fillColor: '#000',
        fillOpacity: 0,
    }).addTo(map);
}

function dimWorld(mask, on) {
    if (!mask) return;
    mask.setStyle({ fillOpacity: on ? 0.5 : 0 });
}

// Turn a GeoJSON ring into Leaflet [lat, lng] coords
function toLatLngRing(geojsonRing) {
    return geojsonRing.map(([lng, lat]) => [lat, lng]);
}

// Get the first ring from Polygon or MultiPolygon
function firstRingLatLng(geo) {
    const coords = geo?.features?.[0]?.geometry?.coordinates;
    if (!coords) return [];
    const ring = Array.isArray(coords[0][0]) && Array.isArray(coords[0][0][0]) ? coords[0][0] : coords[0];
    return toLatLngRing(ring);
}

function createMaskWithHole(map, pane, nigeriaRingLatLng) {
    const worldRing = [
        [-90, -180],
        [90, -180],
        [90, 180],
        [-90, 180],
        [-90, -180], // close the ring, clockwise
    ];
    const hole = nigeriaRingLatLng.slice().reverse(); // opposite winding

    return L.polygon([worldRing, hole], {
        pane: pane || 'mask',
        color: '#000',
        weight: 0,
        fillColor: '#000',
        fillOpacity: 0,
        interactive: false,
    }).addTo(map);
}

function addNigeriaLayer(map, geo) {
    return L.geoJSON(geo, {
        style: { color: '#444', weight: 1, fillOpacity: 0.15 },
    }).addTo(map);
}

// Creating a mask
const maskPane = createMaskPane(map);
let mask = createSolidMask(map, maskPane);
let nigeriaLayer = null;
let shadeTimer = null;

function scheduleDim(on, delayMs) {
    clearTimeout(shadeTimer);
    shadeTimer = setTimeout(() => dimWorld(mask, on), delayMs);
}

function nigeriaFocus() {
  scheduleDim(true, 0);
  if (nigeriaLayer && !map.hasLayer(nigeriaLayer)) {
    nigeriaLayer.addTo(map);
  }
  map.flyTo([9.0820, 8.6753], 7.07);
}

function worldFocus() {
  scheduleDim(false, 0);
  if (nigeriaLayer && map.hasLayer(nigeriaLayer)) {
    map.removeLayer(nigeriaLayer); // hide the outline
  }
  map.flyTo([10, 0], 2);
}


document.getElementById('nigeria-btn')?.addEventListener('click', nigeriaFocus);
document.getElementById('world-btn')?.addEventListener('click', worldFocus);

fetch('nigeria.geojson')
    .then((r) => {
        if (!r.ok) throw new Error(`Http ${r.status}`);
        return r.json();
    })
    .then((geo) => {
        const nigeriaRingLatLng = firstRingLatLng(geo);
        if (mask) mask.remove();
        mask = createMaskWithHole(map, maskPane, nigeriaRingLatLng);
        nigeriaLayer = addNigeriaLayer(map, geo);
    })
    .catch(console.error);
