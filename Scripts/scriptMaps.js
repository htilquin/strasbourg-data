var layerControl;

/**
 * Adds tileLayers, layer control and SII marker to the *map* object 
 * @param {object} map - Leaflet map object
 * @param {string} [texteSII] - text to be written in the SII marker popup
 */
function mapCreation(map, texteSII) {
    var mainLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: `Map data © <a href="http://openstreetmap.org/copyright">
        OpenStreetMap</a> contributors`,
        maxZoom: 17,
        minZoom: 11
    }).addTo(map);

    var wikiLight = L.tileLayer('https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: `<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">
        Wikimedia maps</a> | Map data © <a href="http://openstreetmap.org/copyright">
        OpenStreetMap</a> contributors`,
        maxZoom: 17,
        minZoom: 11
    });

    var stamenLayer = L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
        attribution: `<a href="http://maps.stamen.com/">Stamen maps</a> | Map data
         © <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors`,
        maxZoom: 17,
        minZoom: 11
    });

    layerControl = L.control.layers({
        'Main': mainLayer,
        'Light': wikiLight,
        'B&W': stamenLayer
    }).addTo(map);


    var markerSII = L.marker(coordSII,
        { icon: iconSII },
        { title: 'SII' }
    );
    markerSII.addTo(map);

    if (texteSII == undefined) {
        texteSII = defaultTextSII;
    }
    markerSII.bindPopup(`<div class="fieldName SII">${titleSII}</div>
        <span class="fieldAddress">${texteSII}</span>`,
        { closeButton: false }
    );
}

var iconSII = L.divIcon({
    className: 'sii-div-icon',
    html: `<div class='marker-sii'></div><img src='${logoSII}'/>`,
    iconSize: [16, 15],
    iconAnchor: [8, 15],
    popupAnchor: [0, -45]
});

var treeIcon = L.icon({
    iconUrl: 'Images/Icons/tree.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

var parkIcon = L.icon({
    iconUrl: 'Images/Icons/park.png',
    iconSize: [46, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
});

var squareIcon = L.Icon.extend({
    options: {
        iconSize: [40, 40],
        iconAnchor: [20, 30],
        popupAnchor: [0, -30]
    }
});

var openPoolIcon = new squareIcon({ iconUrl: 'Images/Icons/openPool.png' });
var closedPoolIcon = new squareIcon({ iconUrl: 'Images/Icons/closedPool.png' });
var noInfoPoolIcon = new squareIcon({ iconUrl: 'Images/Icons/noInfoPool.png' });

var openParkingIcon = new squareIcon({ iconUrl: 'Images/Icons/greenParking.png' });
var almostFullParkingIcon = new squareIcon({ iconUrl: 'Images/Icons/orangeParking.png' });
var fullParkingIcon = new squareIcon({ iconUrl: 'Images/Icons/redParking.png' });
var closedParkingIcon = new squareIcon({ iconUrl: 'Images/Icons/blackParking.png' });
var noInfoParkingIcon = new squareIcon({ iconUrl: 'Images/Icons/greyParking.png' });

var openTownhallIcon = new squareIcon({ iconUrl: 'Images/Icons/openTownhall.png' });
var closedTownhallIcon = new squareIcon({ iconUrl: 'Images/Icons/closedTownhall.png' });
var noInfoTownhallIcon = new squareIcon({ iconUrl: 'Images/Icons/noInfoTownhall.png' });

var bikeIcon = new squareIcon({ iconUrl: 'Images/Icons/bike.png' });

var wcIcon = L.icon({
    iconUrl: 'Images/Icons/wc.png',
    iconSize: [30, 30],
    iconAnchor: [15, 22],
    popupAnchor: [0, -22]
});

var wasteIcon = new squareIcon({ iconUrl: 'Images/Icons/waste.png' });