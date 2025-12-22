
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

function scheduleDim(mask, on, delayMs) {
  clearTimeout(shadeTimer);
  shadeTimer = setTimeout(() => dimWorld(mask, on), delayMs);
}

function nigeriaFocus() {
  scheduleDim(mask , true , 50)
  map.flyTo([9.0820 , 8.6753] , 7.07)
}

function worldFocus() {
  addNigeriaLayer(map , nigeriaGeo , false)
  scheduleDim(mask , false , 50)
  map.flyTo([10, 0], 2);
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
        mask.remove();
        mask = createMaskWithHole(map , nigeriaRingLatLng);
        nigeriaLayer = addNigeriaLayer(map , nigeriaGeo)
        nigeriaGeo = geo
    })
    .catch(console.error);