const UrlLoc = 'parkings';
const UrlFreq = 'occupation-parkings-temps-reel';
const UrlZone = 'stationnement-payant';
const pageName = 'Parking';
var zoom = 14;
var lat = 48.581;
var lng = 7.748;
var data1, data2;
var data1ready = false;
var data2ready = false;

var baseUrlLoc = "https://data.strasbourg.eu/api/records/1.0/search/?dataset="+ UrlLoc + "&q=&lang=fr%2F&timezone=Europe%2FBerlin&rows=";
var urlNhitsLoc = baseUrlLoc + noHits;

var baseUrlFreq = "https://data.strasbourg.eu/api/records/1.0/search/?dataset="+ UrlFreq + "&q=&lang=fr%2F&timezone=Europe%2FBerlin&rows=";
var urlNhitsFreq = baseUrlFreq + noHits;

var baseUrlZone = "https://data.strasbourg.eu/api/records/1.0/search/?dataset="+ UrlZone + "&q=&lang=fr%2F&timezone=Europe%2FBerlin&rows=";
var urlNhitsZone = baseUrlZone + noHits;

ajaxGetnHits(urlNhitsLoc, isReadyLoc);
ajaxGetnHits(urlNhitsFreq, isReadyFreq);
ajaxGetnHits(urlNhitsZone, isReadyZone);

searchedFunction();

var map = L.map('map').setView([lat, lng], zoom);
var texteSII = "Parking gratuit au sous-sol... Si vous avez la clé !";
mapCreation(map, texteSII);

var markersCluster = new L.MarkerClusterGroup({ maxClusterRadius: 50 });
markersCluster.addTo(map);

var legend2 = L.control({ position: "bottomright" });

legend2.onAdd = function () {
    const div = L.DomUtil.create("div", "legend parkings logos");
    const h4 = document.createElement('h4');
    h4.textContent = "Infos";
    div.appendChild(h4);

    const ligne1 = document.createElement('div');
    div.appendChild(ligne1);
    const imgOpen = document.createElement('img');
    imgOpen.setAttribute('src', openParkingIcon.options.iconUrl);
    ligne1.appendChild(imgOpen);
    const legendOpen = document.createElement('span');
    legendOpen.innerHTML = "Parking ouvert";
    ligne1.appendChild(legendOpen);

    const ligne2 = document.createElement('div');
    div.appendChild(ligne2);
    const imgAlmostFull = document.createElement('img');
    imgAlmostFull.setAttribute('src', almostFullParkingIcon.options.iconUrl);
    ligne2.appendChild(imgAlmostFull);
    const lengendAlmostFull = document.createElement('span');
    lengendAlmostFull.textContent = "< 10% de places disponibles";
    ligne2.appendChild(lengendAlmostFull);

    const ligne3 = document.createElement('div');
    div.appendChild(ligne3);
    const imgFull = document.createElement('img');
    imgFull.setAttribute('src', fullParkingIcon.options.iconUrl);
    ligne3.appendChild(imgFull);
    const lengendFull = document.createElement('span');
    lengendFull.textContent = "Parking complet";
    ligne3.appendChild(lengendFull);

    const ligne4 = document.createElement('div');
    div.appendChild(ligne4);
    const imgClosed = document.createElement('img');
    imgClosed.setAttribute('src', closedParkingIcon.options.iconUrl);
    ligne4.appendChild(imgClosed);
    const lengendClosed = document.createElement('span');
    lengendClosed.textContent = "Parking fermé";
    ligne4.appendChild(lengendClosed);

    const ligne5 = document.createElement('div');
    div.appendChild(ligne5);
    const imgNoInfo = document.createElement('img');
    imgNoInfo.setAttribute('src', noInfoParkingIcon.options.iconUrl);
    ligne5.appendChild(imgNoInfo);
    const lengendNoInfo = document.createElement('span');
    lengendNoInfo.textContent = "Information non disponible";
    ligne5.appendChild(lengendNoInfo);

    return div;
};
legend2.addTo(map);

var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    var div = L.DomUtil.create("div", "legend parkings");
    div.innerHTML += "<h4>Tarifs</h4>";
    div.innerHTML += '<i style="background: green"></i><span>0,50 € / h ou 1 € / 3h</span>';
    div.innerHTML += '<i style="background: orange"></i><span>1,70 € / h</span>';
    div.innerHTML += '<i style="background: red"></i><span>2,10 € / h</span>';
    return div;
};
legend.addTo(map);
clickLegend();

function isReadyLoc(nHits) {
    var urlPage = baseUrlLoc + nHits;
    ajaxGetJson(urlPage, mapReady);
}

function isReadyFreq(nHits) {
    var urlPage = baseUrlFreq + nHits;
    ajaxGetJson(urlPage, cardReady);
}

function isReadyZone(nHits) {
    var urlPage = baseUrlZone + nHits;
    ajaxGetJson(urlPage, zoneMap);
}

function cardReady(data) {
    data1 = data;
    data1ready = true;
    parseData();
}

function mapReady(data) {
    data2 = data;
    data2ready = true;
    parseData();
}

function parseData() {
    if (data1ready && data2ready) {
        parkingCard(data1);
        parkingMap(data2);
    }
}

/**
 * Adds update Date to the header
 * creates a *card* element for each *parking* and fills it with the attendance
 * from the getAttendanceParking() function.
 * @param {object} data - data for all the entities
 * @param {object} data.parking
 * @param {string} data.parking.record_timestamp
 * @param {object} data.parking.fields
 * @param {string} data.parking.fields.idsurfs
 * @param {string} data.parking.fields.nom_parking
 */
function parkingCard(data) {
    var d = new Date(data[0].record_timestamp);
    displayDateRealTime(d);
    data.sort(compare);

    data.forEach(parking => {
        const card = document.createElement('div');
        card.setAttribute('class', 'card deplacements');
        card.onclick = function () { clickCardParking(parking.fields.idsurfs); };
        container.appendChild(card);

        const nomParking = document.createElement('h1');
        nomParking.textContent = parking.fields.nom_parking;
        nomParking.setAttribute('data-ref', parking.fields.idsurfs);
        card.appendChild(nomParking);

        getAttendanceParking(parking, card);
    });
}

/**
 * Gets the details of attendance for the *parking* entity and
 * adds it to the *card* element.
 * @param {object} parking - data for the entity parking
 * @param {object} parking.fields
 * @param {number} parking.fields.libre
 * @param {number} parking.fields.total
 * @param {string} parking.fields.etat_descriptif
 * @param {Element} card - HTML element where the info will be added
 */
function getAttendanceParking(parking, card) {
    const stateTitle = document.createElement('h2');
    const dPlaces = document.createElement('p');
    dPlaces.setAttribute('style', 'white-space: pre;');
    dPlaces.setAttribute('class', 'placesDispo');

    var state = parking.fields.etat_descriptif;
    var rate = parking.fields.libre / parking.fields.total;

    if (state == "Ouvert") {
        if (rate == 0) {
            stateTitle.setAttribute('class', 'complet');
            stateTitle.textContent = 'Ouvert - Complet';
            dPlaces.textContent = `${parking.fields.total} places\nPlaces disponibles : ${parking.fields.libre}`;
            imgWarningParking(dPlaces);
        }
        else {
            stateTitle.textContent = state;
            dPlaces.textContent = `${parking.fields.total} places\nPlaces disponibles : ${parking.fields.libre}`;
            if (rate <= 0.1) {
                imgWarningParking(dPlaces);
                const pWarning = document.createElement('p');
                pWarning.textContent = "< 10% de places disponibles";
                pWarning.setAttribute('class', 'ouvert almostfull');
                dPlaces.appendChild(pWarning);
                stateTitle.setAttribute('class', 'ouvert almostfull');
            } else {
                stateTitle.setAttribute('class', 'ouvert');
            }
        }
    }
    else if (state == "Fermé") {
        stateTitle.setAttribute('class', 'ferme');
        stateTitle.textContent = state;
        dPlaces.textContent = `${parking.fields.total} places`;
    }
    else {
        stateTitle.textContent = `Fréquentation en temps réel indisponible`;
        dPlaces.textContent = `${parking.fields.total} places`;
    }
    card.appendChild(stateTitle);
    card.appendChild(dPlaces);
}

/**
 * Function used in .sort() to determine the alphabetical
 * order of the elements.
 * Sorting is made on the name
 * @param {object} a
 * @param {object} a.fields
 * @param {string} a.fields.nom_parking
 * @param {object} b
 * @param {object} b.fields
 * @param {string} b.fields.nom_parking
 */
function compare(a, b) {
    if (a.fields.nom_parking > b.fields.nom_parking) {
        return 1;
    } else if (a.fields.nom_parking < b.fields.nom_parking) {
        return -1;
    }
}

/**
 * Adds a warning img to the dPlaces element 
 * @param {Element} dPlaces - HTML element where the img will be added
 */
function imgWarningParking(dPlaces) {
    const warning = document.createElement('img');
    warning.src = 'Images/Icons/warning.png';
    warning.setAttribute('class', 'blocImg');
    warning.setAttribute('alt', '/!\\');
    dPlaces.appendChild(warning);
}

/**
 * Adds a *marker* on the map for each *parking* according to the state
 * of the parking (open / closed / almost full / full / no info)
 * Adds a popup with details and a click event to the *marker*
 * @param {object} data - data for all the entities
 * @param {object} data.parking
 * @param {object} data.parking.fields
 * @param {string} data.parking.name
 * @param {string} data.parking.idsurfs
 * @param {string} data.parking.address
 * @param {string} data.parking.description
 * @param {string} data.parking.accessforwheelchair
 * @param {[number, number]} data.parking.fields.position
 * 
 */
function parkingMap(data) {
    var address1, address2, pPlusR, duree, gestion, wheelchair;

    data.forEach(parking => {
        var optionsIcon = setIconOptions(parking, openParkingIcon, closedParkingIcon,
            noInfoParkingIcon, almostFullParkingIcon, fullParkingIcon);
        var parkingMarker = L.marker(
            parking.fields.position,
            {
                icon: L.icon(optionsIcon),
                alt: parking.fields.name,
                title: parking.fields.name,
                ref: parking.fields.idsurfs
            });
        markersCluster.addLayer(parkingMarker);

        ({ address1, address2 } = parseAddress(parking.fields.address));

        ({ pPlusR, duree, gestion } = parseDescription(parking.fields.description));

        if (parking.fields.accessforwheelchair == 1) {
            wheelchair = `<img src="Images/Icons/wheelchair.png" class="wheelchair">`;
        } else {
            wheelchair = '&nbsp;';
        }

        parkingMarker.bindPopup(`<div class="fieldName">${parking.fields.name}
            ${pPlusR}</div><span class="fieldAddress">${address1}<br/>
            ${address2}<br/>${wheelchair}<br/>
            ${duree}${gestion}</span>`,
            { closeButton: false }
        );
        clickMarker(parkingMarker, parking);
    });
}

/**
 * Returns information about the type, classic parking duration and 
 * administration of the parking
 * @param {string} description - description of the parking entity
 */
function parseDescription(description) {
    var pPlusR = '';
    var duree = '';
    var gestion = '';

    if (description) {
        if (description.indexOf('P+R') > -1) {
            pPlusR = 'P+R';
        }

        if (pPlusR == 'P+R' || description.indexOf('longue durée') > -1) {
            duree = "Parking longue durée";
        }
        else if (description.indexOf('moyenne durée') > -1) {
            duree = "Parking moyenne durée";
        }
        else if (description.indexOf('courte durée') > -1) {
            duree = "Parking courte durée";
        }

        if (description.indexOf('CTS') > -1) {
            gestion = 'éré par la CTS';
        } else if (description.indexOf('PARCUS') > -1) {
            gestion = 'éré par PARCUS';
        } else if (description.indexOf('INDIGO') > -1) {
            gestion = 'éré par INDIGO';
        } else if (description.indexOf('CEGIP') > -1) {
            gestion = 'éré par la CEGIP';
        }

        if (gestion != '' && duree != '') {
            gestion = ', g' + gestion;
        } else if (gestion != '') {
            gestion = 'G' + gestion;
        }

    }
    return { pPlusR, duree, gestion };
}

/**
 * Adds the parking zones on the map as overlay and colors them
 * according to their type (libelle)
 * @param {object} data - data of the parking zones
 * @param {object} data.zone
 * @param {object} data.zone.fields
 * @param {string} data.zone.fields.libelle
 * @param {object} data.zone.fields.geo_shape
 * @param {array} data.zone.fields.geo_shape.coordinates
 */
function zoneMap(data) {
    var zonesOverlay = new L.layerGroup();
    var colorPrice;

    data.forEach(zone => {
        var coordinates = zone.fields.geo_shape.coordinates[0];
        for (let i = 0; i < coordinates.length; i++) {
            coordinates[i] = coordinates[i].reverse();
        }

        switch (zone.fields.libelle) {
            case '1,7€/h':
                colorPrice = "orange";
                break;
            case '2,1€/h':
                colorPrice = "red";
                break;
            default:
                colorPrice = "green";
        }

        var zonePolygon = L.polygon(
            coordinates,
            { color: colorPrice }
        );
        zonesOverlay.addLayer(zonePolygon);
    });
    zonesOverlay.addTo(map);
    layerControl.addOverlay(zonesOverlay, "Zones de stationnement");
}

/**
 * Opens *marker*'s popup with same id of clicked-on *card*,
 * centers the *map* and zooms on the *marker*.
 * @param {string} dataRef - id of the entity linked to the marker
 */
function clickCardParking(dataRef) {
    var clicked = true;
    markersCluster.eachLayer(function (marker) {
        var filter = marker.options.ref;
        if (filter == dataRef) {
            map.setView(marker.getLatLng(), 15);
            map.on('moveend', function () {
                if (clicked) {
                    marker.openPopup();
                    clicked = false;
                }
            });
        }
    });
}