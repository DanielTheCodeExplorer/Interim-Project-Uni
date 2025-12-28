
export const worldBounds = L.latLngBounds([[-85, -180], [85, 180]]);

export function createMap() {
    const map = L.map('map' ,{zoomSnap: 0.25, zoomDelta: 0.5, minZoom: 3.1}).setView([0, 0], 3);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {noWrap: true, continuousWorld: false, minZoom: 1, maxZoom: 20,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    map.setMaxBounds(worldBounds);
    map.whenReady(() => map.invalidateSize());
    window.addEventListener('resize', () => map.invalidateSize());

    return map;

}
