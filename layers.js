export function createMaskPane(map) {
    const pane = map.createPane('mask');
    pane.style.zIndex = 300;
    pane.style.pointerEvents = 'none'
    return pane
}

export function createSolidMask(map) {
        return L.rectangle([[-90 , -180] , [90 , 180]],{
        pane: 'mask',
        color : '#000',
        weight: 0,
        fillColor: '#000',
        fillOpacity: 0,
    }).addTo(map)
}

export function createMaskWithHole(map , nigeriaRingLatLng){
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

export function addNigeriaLayer(map , nigeriaGeo , show=true){
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
