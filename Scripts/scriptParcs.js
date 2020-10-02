const UrlPark = 'lieux_parcs.json';
const pageName = 'Parcs';
var zoom = 13;
var lat = 48.5796;
var lng = 7.7616;

ajaxGetState(pageName, isReady);
searchedFunction();

var map = L.map('map').setView([lat, lng], zoom);
mapCreation(map);
var markerGroup = L.layerGroup().addTo(map);

function isReady() {
    ajaxGet(UrlPark, parkMap);
}

/**
 * Adds update Date to the header, creates a *card* element for each *park*
 * and fills it with the details from getInfoPark()
 * Adds a *marker* on the map for each *park* and binds a popup to it
 * Adds on click events to the marker and to the *card*
 * @param {object} data - data for all the entities
 * @param {object} data.park
 * @param {string} data.park.record_timestamp
 * @param {string} data.park.recordid
 * @param {object} data.park.fields
 * @param {string} data.park.fields.name
 * @param {string} data.park.fields.point_geo
 * @param {string} data.park.fields.address
 */
function parkMap(data) {
    var d = new Date(data[0].record_timestamp);
    displayDate(d);
    var address1, address2;

    data.forEach(park => {
        const card = document.createElement('div');
        card.setAttribute('class', 'card balades drop');
        card.onclick = function () { clickCard(park.recordid, 16); };
        container.appendChild(card);

        const divTitle = document.createElement('div');
        divTitle.setAttribute('class', 'walkBloc');
        card.appendChild(divTitle);

        const parkName = document.createElement('h1');
        parkName.setAttribute('class', 'walkName');
        parkName.setAttribute('data-ref', park.recordid);
        parkName.textContent = park.fields.name;
        divTitle.appendChild(parkName);

        getInfoPark(park, divTitle);

        var parkMarker = L.marker(park.fields.point_geo,
            {
                icon: parkIcon,
                title: park.fields.name,
                alt: park.fields.name,
                ref: park.recordid
            });
        parkMarker.addTo(markerGroup);

        ({ address1, address2 } = parseAddress(park.fields.address));

        parkMarker.bindPopup(`<div class="fieldName">${park.fields.name}</div>
                <span class="fieldAddress">${address1}<br/>${address2}</span>`,
            { closeButton: false });
        clickMarker(parkMarker, park);
        openCloseWalk();
    });
}

/**
 * Gets details from the *park* data and adds it to the *divTitle* HTML element
 * @param {object} park - data for the park entity
 * @param {object} park.fields
 * @param {string} [park.fields.access]
 * @param {string} [park.fields.serviceandactivities]
 * @param {string} [park.fields.description]
 * @param {Element} divTitle - HTML element where the info will be added
 */
function getInfoPark(park, divTitle) {
    const dInfo = document.createElement('div');
    dInfo.setAttribute('class', 'baladesInfo panel');

    const descr = document.createElement('h2');
    descr.textContent = `Description`;
    dInfo.appendChild(descr);

    if (park.fields.access !== undefined) {
        const parkCharact = document.createElement('p');
        parkCharact.setAttribute('class', 'baladesInfo charact');
        const charact = '{ "characteristics": ' + park.fields.access + '}';
        const charactJ = JSON.parse(charact);
        parkCharact.innerHTML = charactJ.characteristics.fr_FR.replace(/&nbsp;/g, " ");
        dInfo.appendChild(parkCharact);
    }

    if (park.fields.serviceandactivities !== undefined) {
        const parkCharact = document.createElement('p');
        parkCharact.setAttribute('class', 'baladesInfo charact');
        const charact = '{ "characteristics": ' + park.fields.serviceandactivities + '}';
        const charactJ = JSON.parse(charact);
        parkCharact.innerHTML = charactJ.characteristics.fr_FR.replace(/&nbsp;/g, " ");
        dInfo.appendChild(parkCharact);
    }

    const baladesInfo = document.createElement('p');
    baladesInfo.setAttribute('class', 'baladesInfo');

    if (park.fields.description !== undefined) {
        const infos = '{ "description": ' + park.fields.description + '}';
        const infoJ = JSON.parse(infos);
        if (infoJ.description.fr_FR !== undefined) {
            baladesInfo.innerHTML = infoJ.description.fr_FR.replace(/&nbsp;/g, " ");
        } else {
            baladesInfo.textContent = `Informations non disponibles`;
        }
    }
    else {
        baladesInfo.textContent = `Informations non disponibles`;
    }
    dInfo.appendChild(baladesInfo);
    divTitle.appendChild(dInfo);
}