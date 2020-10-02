const UrlWaste = 'lieux_decheteries.json';
const pageName = 'Decheteries';
var zoom = 12;
var lat = 48.5796;
var lng = 7.75;

ajaxGetState(pageName, isReady);
searchedFunction();

var map = L.map('map').setView([lat, lng], zoom);
mapCreation(map);
var markerGroup = L.layerGroup().addTo(map);

var info = L.control({ position: "bottomright" });

info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info decheteries');
    this.update();
    return this._div;
};

info.update = function (data, horaires, matHours) {
    if (data) {
        var size = 'Déchèterie'.length;
        var address1, address2;
        ({ address1, address2 } = parseAddress(data.address));

        this._div.innerHTML = `<h4>${data.name.slice(0, size) + '<br/>' + data.name.slice(size + 3)}
        </h4><p>${address1}<br/>${address2}</p>`;
        this._div.innerHTML += (data.accessforwheelchair ? `<img src="Images/Icons/wheelchair.png" 
        class="wheelchair">` : '&nbsp;');
        this._div.innerHTML += (horaires ? `<p><b>${horaires}</b></p>` : '');

        if (matHours) {
            for (let i = 0; i < matHours.length; i++) {
                this._div.innerHTML += `<p><b>${matHours[i][0]}</b>
                 : ${matHours[i][1]} - ${matHours[i][2]}</p>`;
            }
        }
    } else {
        this._div.innerHTML = `<h4>Déchèteries</h4><p>Survolez une icône<br/>
        pour voir ses informations.<br/>
        Cliquez dessus pour zoomer<br/>et centrer la carte.</p>`;
    }
};
info.addTo(map);

function isReady() {
    ajaxGet(UrlWaste, wasteCenterCard);
}

/**
 * Adds update Date to the header, exception schedules before the map,
 * creates a *card* element for each *center* and fills it with the schedule
 * Adds a *marker* on the map for each *center*
 * @param {object} data - data for all the entities
 * @param {object} data.center
 * @param {string} data.center.record_timestamp 
 * @param {string} data.center.recordid
 * @param {object} data.center.fields
 * @param {object} data.center.fields.name
 */
function wasteCenterCard(data) {
    var d = new Date(data[0].record_timestamp);
    displayDate(d);
    data.sort(compareName);
    var exceptions = JSON.parse(data[0].fields.exceptions);
    const exceptDiv = document.getElementById('exceptions');
    exceptDiv.innerHTML = getExceptions(exceptions, 30, false);

    data.forEach(center => {
        const card = document.createElement('div');
        card.setAttribute('class', 'card decheteries');
        container.appendChild(card);

        const centerName = document.createElement('h1');
        centerName.textContent = center.fields.name;
        centerName.setAttribute('data-ref', center.recordid);
        card.appendChild(centerName);

        var horaires, matHours;
        ({ horaires, matHours } = getScheduleCenter(center, card));

        card.onclick = function () {
            clickCard(center.recordid);
            info.update(center.fields, horaires, matHours);
        };

        createMarker(center, horaires, matHours);

    });
}


/**
 * Creates a *marker* on the map for the center entity.
 * Adds click, mouseover and mouseout events, updating the *info* control. 
 * @param {object} center - data for the entity
 * @param {object} center.recordid
 * @param {object} center.fields
 * @param {object} center.fields.point_geo
 * @param {object} center.fields.name
 * @param {string} horaires - sentence on schedule
 * @param {array} matHours - matrix with schedule hours
 */
function createMarker(center, horaires, matHours) {
    var centerMarker = L.marker(center.fields.point_geo, {
        icon: wasteIcon,
        title: center.fields.name,
        alt: center.fields.name,
        ref: center.recordid
    });
    centerMarker.addTo(markerGroup);
    centerMarker.bindPopup('', { className: `center-popup-container` });
    centerMarker.on('click', function (e) {
        map.setView(e.latlng, 16);
        info.update(center.fields, horaires, matHours);
    });
    centerMarker.on('mouseover', function () {
        centerMarker.valueOf()._icon.style.filter = `saturate(250%) 
            hue-rotate(5deg) brightness(121%) contrast(87%)`;
        info.update(center.fields, horaires, matHours);
    });
    centerMarker.on('mouseout', function () {
        centerMarker.valueOf()._icon.style.filter = '';
    });
    clickMarker(centerMarker, center);
}

/**
 * Gets schedule of the center and adds it to the *card* element
 * @param {object} center - data of the entity center
 * @param {object} center.fields
 * @param {string} center.fields.periods
 * @param {Element} card - element where the info will be added
 */
function getScheduleCenter(center, card) {
    var matHours;
    var horaires = `Horaires habituels :`;
    const hoursTitle = document.createElement('h2');
    hoursTitle.textContent = horaires;
    card.appendChild(hoursTitle);

    const dSchedule = document.createElement('div');
    dSchedule.setAttribute('class', 'centerSchedule');

    if (center.fields.periods !== undefined) {
        const periods = '{ "dayschedule": ' + center.fields.periods + '}';
        const periodsJ = JSON.parse(periods);
        matHours = hoursMatrix(periodsJ.dayschedule["0"].schedules);

        if (matHours[0][0] == "lundi, mardi, mercredi, jeudi, vendredi, samedi") {
            matHours[0][0] = "Du lundi au samedi";
        }

        for (let i = 0; i < matHours.length; i++) {
            const centerHours = document.createElement('p');
            var days = matHours[i][0];
            centerHours.innerHTML = `${days[0].toUpperCase()+days.slice(1)} :<br/>${matHours[i][1]} - ${matHours[i][2]}`;
            dSchedule.appendChild(centerHours);
        }
    }
    else {
        horaires = `Horaires d'ouverture non disponibles`;
        const centerHours = document.createElement('p');
        centerHours.setAttribute('class', 'centerSchedule');
        centerHours.textContent = horaires;
        dSchedule.appendChild(centerHours);
    }
    card.appendChild(dSchedule);

    return { horaires, matHours };
}