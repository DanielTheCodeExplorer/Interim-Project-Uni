
//Getting the map ready
// Allow fractional zoom steps so flyTo can land between whole-number levels
var map = L.map('map', {
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    minZoom: 3.1
}).setView([0, 0], 3);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    noWrap: true,
    continuousWorld: false,
    minZoom: 1,
    maxZoom: 20,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const worldBounds = L.latLngBounds([[-85, -180], [85, 180]]);
map.setMaxBounds(worldBounds);

// Need to understand this
map.whenReady(() => map.invalidateSize());
window.addEventListener('resize', () => map.invalidateSize());

function createMaskPane(map) {
    const pane = map.createPane('mask');
    pane.style.zIndex = 300;
    pane.style.pointerEvents = 'none'
    return pane
}

function createSolidMask(map) {
        return L.rectangle([[-90 , -180] , [90 , 180]],{
        pane: 'mask',
        color : '#000',
        weight: 0,
        fillColor: '#000',
        fillOpacity: 0,
    }).addTo(map)
}

function dimWorld(mask , on){
    mask.setStyle({fillOpacity: on ? 0.5 : 0});
}

// Responsive helpers for padding/zoom so fits nicely on different screens
function getPadding() {
    const base = Math.max(12, Math.min(window.innerWidth, window.innerHeight) * 0.05);
    return [base, base];
}

function getNigeriaMaxZoom() {
    return window.innerWidth < 640 ? 6.5 : 7.5;
}

function getWorldZoom() {
    return map.getBoundsZoom(worldBounds, true);
}

// Turn a GeoJSON ring into Leaflet [lat, lng] coords
function toLatLngRing(geojsonRing) {
  return geojsonRing.map(([lng, lat]) => [lat, lng]);
}

function createMaskWithHole(map , nigeriaRingLatLng){
    const worldRing = [
        [90 , -180] , [90 , 180] , [-90 , 180] , [-90 , -180]
    ];

    return L.polygon(
        [worldRing , nigeriaRingLatLng.slice().reverse()],{
            pane: 'mask',
            color:'#000',
            weight: 0,
            fillColor: '#000',
            fillOpacity: 0 ,
            interactive: false,
        }
    ).addTo(map)
}

//
function addNigeriaLayer(map , nigeriaGeo , show=true){
    if(show){
            return L.geoJSON(nigeriaGeo, {
            style: {color: '#444' , weight: 1, fillOpacity: 0.15},
        }).addTo(map)
    }else{
        return L.geoJSON(nigeriaGeo, {
            style: {weight: 0, fillOpacity: 0 , opacity: 0},
        }).addTo(map)
    }
}


// Creating a mask
const maskPane = createMaskPane(map);
let mask = createSolidMask(map , maskPane);
let nigeriaLayer = null;
let shadeTimer = null;
let nigeriaGeo = null;
let dataReady = false;
let nigeriaBounds = null;

function scheduleDim(mask, on, delayMs) {
  clearTimeout(shadeTimer);
  shadeTimer = setTimeout(() => dimWorld(mask, on), delayMs);
}

function nigeriaFocus() {
  if(!dataReady) return;
  const revealNigeria = () => {
    nigeriaLayer?.setStyle({color: '#444' , weight: 1, fillOpacity: 0.15, opacity: 1});
    scheduleDim(mask ,true , 50);
  };
  map.once('moveend', revealNigeria);
  map.flyToBounds(nigeriaBounds, {padding: getPadding(), maxZoom: getNigeriaMaxZoom(), duration: 0.75});
}

function worldFocus() {
  if(!dataReady) return;
  nigeriaLayer?.setStyle({weight: 0, fillOpacity: 0 , opacity: 0});
  scheduleDim(mask , false , 50)
  map.flyTo(worldBounds.getCenter(), getWorldZoom(), {duration: 0.75});
}

document.getElementById("nigeria-btn")?.addEventListener('click' , nigeriaFocus);
document.getElementById('world-btn')?.addEventListener('click' , worldFocus)

fetch('nigeria.geojson')
    .then((r) => {
        if(!r.ok) throw new Error(`Http ${r.status}`);
        return r.json()
    })
    .then((geo) => {
        const nigeriaRingLatLng = toLatLngRing(geo.features[0].geometry.coordinates[0]);
        nigeriaBounds = L.latLngBounds(nigeriaRingLatLng);
        mask.remove();
        mask = createMaskWithHole(map , nigeriaRingLatLng);
        nigeriaGeo = geo
        nigeriaLayer = addNigeriaLayer(map , nigeriaGeo)
        dataReady = true;
    })
    .catch(console.error);
