const UrlFreq = 'frequentation-en-temps-reel-des-piscines';
const UrlLoc = 'lieux_piscines';
//const pageName = 'Piscines';
var zoom = 12;
var lat = 48.5796;
var lng = 7.7380;
var data1, data2;
var data1ready = false;
var data2ready = false;

var baseUrlLoc = "https://data.strasbourg.eu/api/records/1.0/search/?dataset="+ UrlLoc + "&q=&lang=fr%2F&timezone=Europe%2FBerlin&rows=";
var urlNhitsLoc = baseUrlLoc + noHits;

var baseUrlFreq = "https://data.strasbourg.eu/api/records/1.0/search/?dataset="+ UrlFreq + "&q=&lang=fr%2F&timezone=Europe%2FBerlin&rows=";
var urlNhitsFreq = baseUrlFreq + noHits;

ajaxGetnHits(urlNhitsLoc, isReadyLoc);
ajaxGetnHits(urlNhitsFreq, isReadyFreq);
searchedFunction();

var map = L.map('map').setView([lat, lng], zoom);
mapCreation(map);
var markerGroup = L.layerGroup().addTo(map);
var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend pool logos");
    const h4 = document.createElement('h4');
    h4.textContent = "Infos";
    div.appendChild(h4);
    const ligne1 = document.createElement('div');
    div.appendChild(ligne1);
    const imgOpen = document.createElement('img');
    imgOpen.setAttribute('src', openPoolIcon.options.iconUrl);
    ligne1.appendChild(imgOpen);
    const legendOpen = document.createElement('span');
    legendOpen.innerHTML = "Piscine ouverte";
    ligne1.appendChild(legendOpen);
    const ligne2 = document.createElement('div');
    div.appendChild(ligne2);
    const imgClosed = document.createElement('img');
    imgClosed.setAttribute('src', closedPoolIcon.options.iconUrl);
    ligne2.appendChild(imgClosed);
    const lengendClosed = document.createElement('span');
    lengendClosed.textContent = "Piscine fermée";
    ligne2.appendChild(lengendClosed);
    const ligne3 = document.createElement('div');
    div.appendChild(ligne3);
    const imgNoInfo = document.createElement('img');
    imgNoInfo.setAttribute('src', noInfoPoolIcon.options.iconUrl);
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

function isReadyFreq(nHits) {
    var urlPage = baseUrlFreq + nHits;
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
        poolCard(data1);
        entityMap(data2, openPoolIcon, closedPoolIcon, noInfoPoolIcon);
    }
}

/**
 * Adds update Date to the header, creates a *card* element for each *pool*
 * and fills it with the attendance from the getAttendancePool() function,
 * and the schedule from getSchedulePool() function.
 * @param {object} data - data for all the entities
 * @param {object} data.pool
 * @param {string} data.pool.record_timestamp
 * @param {object} data.pool.fields
 * @param {string} data.pool.fields.sigid
 * @param {string} data.pool.fields.name
 */
function poolCard(data) {
    var d = new Date(data[0].record_timestamp);
    displayDateRealTime(d);
    data.sort(compareName);

    data.forEach(pool => {
        const card = document.createElement('div');
        card.setAttribute('class', 'card sport');
        card.onclick = function () { clickCard(pool.fields.sigid); };
        container.appendChild(card);

        const poolName = document.createElement('h1');
        poolName.textContent = pool.fields.name;
        poolName.setAttribute('data-ref', pool.fields.sigid);
        card.appendChild(poolName);

        getAttendancePool(pool, card);
        getSchedulePool(pool, card);
    });
}

/**
 * Gets the details of attendance for the *pool* entity and
 * adds it to the *card* element
 * @param {object} pool - data for the entity pool
 * @param {object} pool.fields
 * @param {number} pool.fields.occupation
 * @param {number} pool.fields.isopen
 * @param {string} pool.fields.realtimestatus
 * @param {Element} card - HTML element where the info will be added
 */
function getAttendancePool(pool, card) {
    const stateTitle = document.createElement('h2');
    const dPlaces = document.createElement('div');
    dPlaces.setAttribute('class', 'flex');

    var occup = pool.fields.occupation;
    var state = pool.fields.isopen;
    var rate = pool.fields.realtimestatus;

    if (state == 1) {
        stateTitle.textContent = 'Ouvert';
        stateTitle.setAttribute('class', 'ouvert');
        const pNbPers = document.createElement('p');
        pNbPers.setAttribute('class', 'bigMarges');
        pNbPers.textContent = `Occupation : ${occup} personnes.`;
        dPlaces.appendChild(pNbPers);
        imgWarning(dPlaces, rate);
        const pOccup = document.createElement('p');
        pOccup.setAttribute('class', 'bottom');
        switch (rate) {
            case 'GREEN':
                pOccup.textContent = `Taux d'occupation faible.`;
                break;
            case 'ORANGE':
                pOccup.textContent = `Taux d'occupation moyen.`;
                break;
            case 'RED':
                pOccup.textContent = `Taux d'occupation élevé.`;
                break;
            case 'BLACK':
                pOccup.textContent = `Taux d'occupation très élevé.`;
                break;
            default:
                pOccup.textContent = '';
        }
        dPlaces.appendChild(pOccup);
    }
    else if (state == 0) {
        stateTitle.setAttribute('class', 'ferme');
        stateTitle.textContent = 'Fermé';
    }
    else {
        stateTitle.textContent = `Fréquentation en temps réel indisponible`;
    }
    card.appendChild(stateTitle);
    card.appendChild(dPlaces);
}

/**
 * Gets the schedule details and adds it to the *waitDiv* element. * 
 * @param {object} pool - data of the townhall
 * @param {object} pool.fields
 * @param {string} [pool.fields.dayschedule]
 * @param {Element} waitDiv - HTML element where the info will be added 
 */
function getSchedulePool(pool, card) {
    const dSchedule = document.createElement('div');
    dSchedule.setAttribute('class', 'schedule');

    if (pool.fields.dayschedule !== undefined) {
        const horaires = '{ "dayschedule": ' + pool.fields.dayschedule + '}';
        const horairesJ = JSON.parse(horaires);
        const poolSchedule = document.createElement('p');
        poolSchedule.setAttribute('class', 'schedule');
        poolSchedule.textContent = `Horaires d'ouverture du jour`;
        dSchedule.appendChild(poolSchedule);
        horairesJ.dayschedule.forEach(schedule => {
            const poolSchedule = document.createElement('p');
            poolSchedule.setAttribute('class', 'schedule');
            const openingH = schedule.openingHour;
            const openingM = pad(schedule.openingMinute);
            const closingH = schedule.closingHour;
            const closingM = pad(schedule.closingMinute);
            poolSchedule.textContent = `${openingH}h${openingM} - ${closingH}h${closingM}`;
            dSchedule.appendChild(poolSchedule);
        });
    }
    else {
        const poolSchedule = document.createElement('p');
        poolSchedule.setAttribute('class', 'schedule');
        poolSchedule.textContent = `Horaires d'ouverture non disponibles`;
        dSchedule.appendChild(poolSchedule);
    }
    card.appendChild(dSchedule);
}