const UrlWait = 'duree-dattente-aux-mairies-en-temps-reel';
const UrlLoc = 'lieux_mairies-de-quartier-et-centre-administratif';
//const pageName = 'Mairies';
var zoom = 13;
var lat = 48.5752;
var lng = 7.7490;
var data1, data2;
var data1ready = false;
var data2ready = false;

var baseUrlLoc = "https://data.strasbourg.eu/api/records/1.0/search/?dataset="+ UrlLoc + "&q=&lang=fr%2F&timezone=Europe%2FBerlin&rows=";
var urlNhitsLoc = baseUrlLoc + noHits;

var baseUrlWait = "https://data.strasbourg.eu/api/records/1.0/search/?dataset="+ UrlWait + "&q=&lang=fr%2F&timezone=Europe%2FBerlin&rows=";
var urlNhitsWait = baseUrlWait + noHits;

ajaxGetnHits(urlNhitsLoc, isReadyLoc);
ajaxGetnHits(urlNhitsWait, isReadyWait);
searchedFunction();

var map = L.map('map').setView([lat, lng], zoom);
mapCreation(map);
var markerGroup = L.layerGroup().addTo(map);

var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    var div = L.DomUtil.create("div", "legend townhall logos");
    const h4 = document.createElement('h4');
    h4.textContent = "Infos";
    div.appendChild(h4);
    const ligne1 = document.createElement('div');
    div.appendChild(ligne1);
    const imgOpen = document.createElement('img');
    imgOpen.setAttribute('src', openTownhallIcon.options.iconUrl);
    ligne1.appendChild(imgOpen);
    const legendOpen = document.createElement('span');
    legendOpen.innerHTML = "Mairie ouverte";
    ligne1.appendChild(legendOpen);
    const ligne2 = document.createElement('div');
    div.appendChild(ligne2);
    const imgClosed = document.createElement('img');
    imgClosed.setAttribute('src', closedTownhallIcon.options.iconUrl);
    ligne2.appendChild(imgClosed);
    const lengendClosed = document.createElement('span');
    lengendClosed.textContent = "Mairie fermée";
    ligne2.appendChild(lengendClosed);
    const ligne3 = document.createElement('div');
    div.appendChild(ligne3);
    const imgNoInfo = document.createElement('img');
    imgNoInfo.setAttribute('src', noInfoTownhallIcon.options.iconUrl);
    ligne3.appendChild(imgNoInfo);
    const lengendNoInfo = document.createElement('span');
    lengendNoInfo.textContent = "Information non disponible";
    ligne3.appendChild(lengendNoInfo);
    return div;
};
legend.addTo(map);
clickLegend();

function isReadyLoc(nHits) {
    var urlPage = baseUrlLoc + nHits;
    ajaxGetJson(urlPage, mapReady);
}

function isReadyWait(nHits) {
    var urlPage = baseUrlWait + nHits;
    ajaxGetJson(urlPage, cardReady);
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
        townhallCard(data1);
        entityMap(data2, openTownhallIcon, closedTownhallIcon, noInfoTownhallIcon);
    }
}

/**
 * Adds update Date to the header,
 * creates a *card* HTML element under the map for each entity (townhall), fills it
 * with getAttendance() details.
 * @param {object} data - data for all the entities
 * @param {object} data.townhall
 * @param {string} data.townhall.record_timestamp
 * @param {object} data.townhall.fields
 * @param {object} data.townhall.fields.sigid
 * @param {object} data.townhall.fields.name
 */
function townhallCard(data) {
    var d = new Date(data[0].record_timestamp);
    displayDateRealTime(d);
    data.sort(compareName);

    data.forEach(townhall => {
        const card = document.createElement('div');
        card.setAttribute('class', 'card administration');
        card.onclick = function () { clickCard(townhall.fields.sigid); };
        container.appendChild(card);

        const townhallName = document.createElement('h1');
        townhallName.textContent = townhall.fields.name;
        townhallName.setAttribute('data-ref', townhall.fields.sigid);
        card.appendChild(townhallName);

        getAttendance(townhall, card);
    });
}

/**
 * Gets attendance information and adds it to the *card* element. * 
 * @param {object} townhall - data for the entity
 * @param {object} townhall.fields
 * @param {number} townhall.fields.isopen
 * @param {string} townhall.fields.realtimestatus
 * @param {number} townhall.fields.averagewaitingtime
 * @param {Element} card - HTML element where the info will be added
 */
function getAttendance(townhall, card) {
    const stateTitle = document.createElement('h2');
    const waitDiv = document.createElement('div');
    waitDiv.setAttribute('class', 'flex');

    var state = townhall.fields.isopen;
    var rate = townhall.fields.realtimestatus;
    var wait = townhall.fields.averagewaitingtime;

    if (state == 1) {
        stateTitle.textContent = 'Ouvert';
        stateTitle.setAttribute('class', 'ouvert');
        const pWait = document.createElement('p');
        pWait.setAttribute('class', 'bottom');
        if (wait == 0) {
            pWait.textContent = `Pas d'attente.`;
        } else {
            pWait.textContent = `Attente moyenne : ${wait} min.`;
        }
        imgWarning(waitDiv, rate);
        waitDiv.appendChild(pWait);
    }
    else if (state == 0) {
        stateTitle.setAttribute('class', 'ferme');
        stateTitle.textContent = 'Fermé';
    }
    else {
        stateTitle.textContent = `Fréquentation en temps réel indisponible`;
    }
    card.appendChild(stateTitle);
    card.appendChild(waitDiv);

    getScheduleTownhall(townhall, waitDiv);
}

/**
 * Gets the schedule details and adds it to the *waitDiv* element. * 
 * @param {object} townhall - data of the townhall
 * @param {object} townhall.fields
 * @param {object} [townhall.fields.dayschedule]
 * @param {number} townhall.fields.dayschedule.openingHour
 * @param {number} townhall.fields.dayschedule.openingMinute
 * @param {number} townhall.fields.dayschedule.closingHour
 * @param {number} townhall.fields.dayschedule.closingMinute
 * @param {Element} waitDiv - HTML element where the info will be added 
 */
function getScheduleTownhall(townhall, waitDiv) {
    const divSchedule = document.createElement('div');
    divSchedule.setAttribute('class', 'schedule');
    const pHoraires = document.createElement('p');
    if (townhall.fields.dayschedule !== undefined) {
        const horaires = (townhall.fields.dayschedule);
        const horairesJ = JSON.parse(horaires.substring(1, horaires.length - 1));
        const openingH = horairesJ.openingHour;
        const openingM = pad(horairesJ.openingMinute);
        const closingH = horairesJ.closingHour;
        const closingM = pad(horairesJ.closingMinute);
        pHoraires.textContent = `Horaires d'ouverture : ${openingH}h${openingM} - ${closingH}h${closingM}`;
    }
    else {
        pHoraires.textContent = `Horaires d'ouverture non disponibles`;
    }
    waitDiv.appendChild(divSchedule);
    divSchedule.appendChild(pHoraires);
}