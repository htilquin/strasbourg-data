const UrlTrafic = 'trafic-routier-eurometropole.json';
const pageName = 'Trafic';
var zoom = 13;
var lat = 48.581;
var lng = 7.748;

ajaxGetState(pageName, isReady);

var map = L.map('map').setView([lat, lng], zoom);
mapCreation(map);
var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    var div = L.DomUtil.create("div", "legend trafic");
    div.innerHTML += "<h4>Etat du trafic</h4>";
    div.innerHTML += '<i style="background: #1DD422"></i><span>Fluide</span>';
    div.innerHTML += '<i style="background: #FF8000"></i><span>Dense</span>';
    div.innerHTML += '<i style="background: #E91919"></i><span>Saturé</span>';
    return div;
};
legend.addTo(map);
clickLegend();

function isReady() {
    ajaxGet(UrlTrafic, traficMap);
}

/**
 * Adds update Date to the header, adds each geoshape to the map as an overlay,
 * colors it depending on state (busy or not).
 * @param {object} data - data for the trafic
 * @param {object} data.way
 * @param {object} data.way.fields
 * @param {number} data.way.fields.etat
 * @param {string} data.way.fields.dmajetatexp
 * @param {object} data.way.fields.geo_shape
 * @param {array} data.way.fields.geo_shape.coordinates
 */
function traficMap(data) {
    var d = new Date(data[0].fields.dmajetatexp);
    displayDateRealTime(d);
    var zonesOverlay = new L.layerGroup();

    data.forEach(way => {
        var coordinates = way.fields.geo_shape.coordinates;
        for (let i = 0; i < coordinates.length; i++) {
            coordinates[i] = coordinates[i].reverse();
        }

        var colorState;
        switch (way.fields.etat) {
            case '2':
                colorState = "#FF8000";
                break;
            case '3':
                colorState = "#E91919";
                break;
            default:
                colorState = "#1DD422";
        }

        var route = L.polyline(
            coordinates,
            { color: colorState, weight: 4 }
        );
        zonesOverlay.addLayer(route);
    });
    zonesOverlay.addTo(map);
    layerControl.addOverlay(zonesOverlay, "Trafic");
}