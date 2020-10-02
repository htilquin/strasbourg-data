const UrlVelhop = 'stations-velhop.json';
const UrlBikeway = 'filaire-de-circulation.json';
const pageName = 'Velo';
var zoom = 13;
var lat = 48.581;
var lng = 7.748;

ajaxGetState(pageName, isReady);

var map = L.map('map').setView([lat, lng], zoom);
mapCreation(map);

function isReady() {
    ajaxGet(UrlBikeway, bikewayMap);
    ajaxGet(UrlVelhop, velhopMap);
}

/**
 * Adds a *marker* for each *station* entity, binds a pop-up to it.
 * @param {object} data - data for all the velhop stations
 * @param {object} data.station
 * @param {object} data.station.fields
 * @param {object} data.station.fields.coordonnees
 * @param {object} data.station.fields.na
 * @param {object} data.station.fields.to
 */
function velhopMap(data) {   
    var markersCluster = new L.MarkerClusterGroup();

    data.forEach(station => {
        var markStation = L.marker(
            station.fields.coordonnees,
            { icon: bikeIcon, title: station.fields.na, alt: station.fields.na }
        ).setOpacity(0.9);

        markStation.bindPopup(`<div class="fieldName">${station.fields.na}</div>
                <span class="fieldAddress">Jusqu'à ${station.fields.to} vélos</span>`,
            { closeButton: false }
        );
        markersCluster.addLayer(markStation);
    });
    map.addLayer(markersCluster);
}

/**
 * Adds update Date to the header, adds each geoshape to the map as an overlay.
 * @param {object} data - data for the bike paths
 * @param {object} data.way
 * @param {string} data.way.record_timestamp
 * @param {object} data.way.fields
 * @param {object} data.way.fields.geo_shape
 * @param {array} data.way.fields.geo_shape.coordinates
 */
function bikewayMap(data) {
    var d = new Date(data[0].record_timestamp);
    displayDate(d);
    var zonesOverlay = new L.layerGroup();

    data.forEach(way => {
        var coordinates = way.fields.geo_shape.coordinates[0];
        for (let i = 0; i < coordinates.length; i++) {
            coordinates[i] = coordinates[i].reverse();
        }
 
        var zonePolygon = L.polyline(
            coordinates,
            { color: "#0B9619" }
        );
        zonesOverlay.addLayer(zonePolygon);
    });
    zonesOverlay.addTo(map);
    layerControl.addOverlay(zonesOverlay, "Voies cyclables");
}