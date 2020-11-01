const UrlWC = 'lieux_toilettes_publiques';
//const pageName = 'WC';
var zoom = 13;
var lat = 48.5796;
var lng = 7.77;

var baseUrl = "https://data.strasbourg.eu/api/records/1.0/search/?dataset="+ UrlWC + "&q=&lang=fr%2F&timezone=Europe%2FBerlin&rows=";
var urlNhits = baseUrl + noHits

//ajaxGetState(pageName, isReady);
ajaxGetnHits(urlNhits, isReady)

var map = L.map('map').setView([lat, lng], zoom);
var texteSII = "Toilettes non publiques accessibles aux horaires d'ouverture de l'agence !";
mapCreation(map, texteSII);

var info = L.control({ position: "bottomright" });

info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info wc');
    this.update();
    return this._div;
};

info.update = function (data, services, schedule, matHours) {
    if (data) {
        var size = 'Toilettes Publiques'.length;      
        this._div.innerHTML = `<h4>${data.name.slice(0, size) + '<br/>' + 
        data.name.slice(size)}</h4><p>${data.street}</p>`;
        this._div.innerHTML += (data.accessforwheelchair ? `<img src="Images/Icons/wheelchair.png" 
        class="wheelchair">`: '&nbsp;');
        this._div.innerHTML += (services ? `<p><b>Services</b> : ${services}.</p>` : '');
        this._div.innerHTML += (schedule ? `<p><b>${schedule}</b></p>` : '');
        this._div.innerHTML += (matHours ? `<p><b>${matHours[0][0]}</b>
         : ${matHours[0][1]} - ${matHours[0][2]}</p>` : '');
    } else {
        this._div.innerHTML = `<h4>Toilettes Publiques</h4><p>Survolez une icône<br/>
        pour voir ses horaires.<br/>
        Cliquez dessus pour zoomer<br/>et centrer la carte.</p>`;
    }
};
info.addTo(map);

function isReady(nHits) {
    var urlPage = baseUrl + nHits;
    ajaxGetJson(urlPage, locWC);
}

/**
 * Creates a *marker* on the map for each wc entity.
 * Adds click, mouseover and mouseout events, updating the *info* control. 
 * @param {object} data - data for all the entities
 * @param {object} data.wc
 * @param {string} data.wc.record_timestamp
 * @param {object} data.wc.fields
 * @param {string} data.wc.fields.point_geo
 * @param {string} data.wc.fields.name
 */
function locWC(data) {
    var d = new Date(data[0].record_timestamp);
    displayDate(d);

    data.forEach(wc => {
        var markWC = L.marker(
            wc.fields.point_geo,
            { icon: wcIcon, title: wc.fields.name, alt: wc.fields.name }
        ).setOpacity(0.9);
        markWC.addTo(map);

        var services, schedule, matHours;
        ({ services, schedule, matHours } = getInfos(wc));

        markWC.on('click', function (e) {
            map.setView(e.latlng, 17);
            info.update(wc.fields, services, schedule, matHours);
        });

        markWC.on('mouseover', function () {
            markWC.valueOf()._icon.style.filter = `saturate(439%) 
            hue-rotate(254deg) brightness(121%) contrast(117%)`;
            info.update(wc.fields, services, schedule, matHours);
        });

        markWC.on('mouseout', function () {
            markWC.valueOf()._icon.style.filter = '';
        });
    });
}

/**
 * Return the *services* list for the wc entity, a timeschedule sentence 
 * *schedule* and an array *matHours* with the general schedule
 * @param {object} wc - data for the toilet entity
 * @param {object} wc.fields
 * @param {string} [wc.fields.serviceandactivities]
 * @param {string} [wc.fields.periods]
 */
function getInfos(wc) {
    var services, schedule, matHours;
    if (wc.fields.serviceandactivities !== undefined) {
        const servicesJ = JSON.parse('{"services": ' + wc.fields.serviceandactivities + '}');
        services = (servicesJ.services.fr_FR).replace(/(<([^>]+)>)/ig, "");
    }

    if (wc.fields.periods !== undefined) {
        const periodsJ = JSON.parse(wc.fields.periods)[0];

        if (periodsJ.alwaysOpen == 1) {
            schedule = "Ouverts 24/7";
        } else if (periodsJ.schedules !== undefined) {
            schedule = `Horaires habituels :`;
            matHours = hoursMatrix(periodsJ.schedules);

            if (matHours[0][0] == "Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche") {
                matHours[0][0] = "Tous les jours";
            }
        } else {
            schedule = `Horaires d'ouverture non disponibles`;
        }
    }
    return { services, schedule, matHours };
}