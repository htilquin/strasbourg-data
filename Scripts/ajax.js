const container = document.getElementById('container');
document.title = document.title + ' - ' + websiteName;
var prePath;
var demoMode;

/**
 * Adds favicon to each page of the website.
 */
window.onload = function () {
    const head = top.document.getElementsByTagName("head")[0];
    const admin = (head.className == "admin");
    var link = top.document.createElement("link");
    link.type = "image/png";
    link.rel = "shortcut icon";
    link.href = (admin ? '../' + favicon : favicon);
    head.appendChild(link);
};

/**
 * Parse response from pageUpdate.php to :
 * * Add string with *state of data* in the page header
 *  * 'Off-line mode'
 *  * 'Data brought up to date'
 *  * 'Up to date Data'
 * * Add string with *number of visits* in the page footer.
 *  * 'Page visited X times'
 * * if requested, adds date from php in the header of the page.
 * * if in demo-mode, change the demoMode variable to true.
 * @param {string} data - response from pageUpdate.php : *'state-status;
 * numberOfVisits'*
 */
function parseEcho(data, addDate = false) {
    data = data.split("; ");

    var statusText;
    var status = document.getElementById('status');

    if (status !== null) {
        switch (data[0]) {
            case 'failed':
                statusText = `Mode hors-ligne.`;
                status.setAttribute('class', 'offline');
                break;
            case 'update':
                statusText = `Données actualisées.`;
                status.setAttribute('class', 'online');
                break;
            case 'no-update':
                statusText = `Données à jour.`;
                status.setAttribute('class', 'online');
                break;
            case 'demo-mode':
                statusText = `Données de démonstration.`;
                status.setAttribute('class', 'offline');
                break;
            default:
                statusText = `Données indisponibles.`;
        }
        status.innerText = statusText;
    }

    if (data[0] == 'demo-mode') {
        demoMode = true;
        if (addDate) {
            displayDate(new Date());
        }

    } else {
        const footer = document.getElementsByTagName('footer')[0];
        const visits = document.createElement('p');
        visits.textContent = ` - Page visitée ${data[2]} fois (dont ${data[4]} ce mois-ci).`;
        footer.appendChild(visits);

        if (addDate) {
            displayDate(new Date(data[5] * 1000));
        }
    }
    prePath = data[1];
}

/**
 * Executes program pageUpdate.php (checks and updates data for page if
 * necessary) THEN
 * * Executes function parseEcho using *response*
 * * Executes function callback if requested.
 * @param {string} pageName - Name of the page
 * @param {function} [callback] - Function to execute when data is ready.
 * @param {boolean} [addDate = false] - update date provided by php program or not
 */
function ajaxGetState(pageName, callback, addDate = false) {
    var requestphp = new XMLHttpRequest();
    var phpUrl = `php/pageUpdate.php?page=${pageName}&forcerefresh=false`;
    requestphp.open('GET', phpUrl);
    requestphp.onloadend = function () {
        if (requestphp.status >= 200 && requestphp.status < 400) {
            parseEcho(this.response, addDate);
            if (callback) {
                callback();
            }
        }
        else {
            console.error(requestphp.status + " " + requestphp.statusText);
        }
    };
    requestphp.onerror = function () {
        console.error(`Erreur réseau avec l'URL ${phpUrl}`);
    };
    requestphp.send();
}

/**
 * * Executes program pageUpdate.php and *forces the update* of data for page
 * THEN
 * * Executes function callback using *response*.
 * @param {string} pageName - Name of the page
 * @param {function} callback - Function to execute when data is ready.
 * @param {Element} element - Element to update with statusText
 */
function ajaxForceRefresh(pageName, callback, element) {
    var statusText, state;
    var requestphp = new XMLHttpRequest();
    var phpUrl = `../php/pageUpdate.php?page=${pageName}&forcerefresh=true`;
    requestphp.open('GET', phpUrl);
    requestphp.onloadend = function () {
        if (requestphp.status >= 200 && requestphp.status < 400) {
            ({ statusText, state } = callback(this.response));
            element.textContent = statusText;
            element.setAttribute('class', `forceRefresh ${pageName} done`);
            if (state == 'update' || state == 'demo-mode') {
                const card = document.getElementsByClassName(`card ${pageName}`)[0];
                const infos = card.getElementsByClassName('infoAdmin');

                for (let i = 0; i < infos.length; i++) {
                    const update = infos[i].getElementsByTagName('span')[0];
                    update.textContent = formatDateAdmin(new Date());

                    const ago = infos[i].getElementsByTagName('span')[1];
                    ago.textContent = 'quelques secondes !';
                }
            }
        }
        else {
            console.error(requestphp.status + " " + requestphp.statusText);
        }
    };
    requestphp.onerror = function () {
        console.error(`Erreur réseau avec l'URL ${phpUrl}`);
    };
    requestphp.send();
}

/**
 * * Gets data from server THEN
 * * Parses it if *isJSON* THEN
 * * Executes function *callback* using data
 * @param {string} path - server path to data
 * @param {function} callback - function to execute once data is ready
 * @param {boolean} [isJSON = true] - data is JSON or not
 */
function ajaxGet(path, callback, isJSON = true) {
    var request = new XMLHttpRequest();
    request.open('GET', (isJSON ? (prePath + path) : path));
    request.onloadend = function () {
        if (request.status >= 200 && request.status < 400) {
            var data = (isJSON ? JSON.parse(this.response) : data = this.response);
            callback(data);
        }
        else {
            console.error(request.status + " " + request.statusText);
        }
    };
    request.onerror = function () {
        console.error(`Erreur réseau avec l'URL ${path}`);
    };
    request.send();
}

/**
 * Change one digit number *n* to two digits *0n* for displaying dates purpose.
 * @param {number} n - day, month, hour of minute.
 */
function pad(n) {
    return n < 10 ? '0' + n : n;
}

/**
 * Parse Date to string *'day DD month YYYY'*
 * @param {Date} date
 */
function formatDateCenter(date) {
    const options = {
        weekday: 'long', year: 'numeric',
        month: 'long', day: 'numeric'
    };
    return (date).toLocaleDateString('fr-FR', options);
}

/**
 * Parse Date to string *'Data from DD month YYYY.'*
 * @param {Date} date - last update of data
 */
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return `Données du ${(date).toLocaleDateString('fr-FR', options)}.`;
}

/**
 * Parse Date to string *'DD/MM/YYYY at hh:mm.'*
 * @param {Date} date  - last update of data
 */
function formatDateAdmin(date) {
    const options = {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric'
    };
    return `${(date).toLocaleDateString('fr-FR', options)}.`;
}

/**
 * Parse Date to string *'Data from DD month YYYY at hh:mm.'*
 * @param {Date} date  - last update of data
 */
function formatDateReel(date) {
    const options = {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric'
    };
    return `Données du ${(date).toLocaleDateString('fr-FR', options)}`;
}

/**
 * Calculate difference between Date and today.
 * Returns text *'less than a day / week / month / year'*.
 * @param {Date} date - last update of data
 */
function timeDiff(date) {
    var today = new Date();
    var timeDiff = Math.floor((today - date) / 1000);
    var text = 'Mis à jour il y a ';
    var day = 3600 * 24;
    var week = day * 7;
    var month = day * 30;
    var year = day * 365;
    if (timeDiff < day) {
        text += `moins d'un jour`;
    } else if (timeDiff < week) {
        text += `moins d'une semaine.`;
    } else if (timeDiff < month) {
        text += `moins d'un mois.`;
    } else if (timeDiff < year) {
        text += `moins d'un an.`;
    } else {
        text += `plus d'un an.`;
    }
    return text;
}

/**
 * Calculate difference between Date and today.
 * Returns either text :
 * * 'Updated XX min ago.'
 * * 'More than 15min ago. Data have propably evolved since.'
 * @param {Date} date - last update of data
 */
function timeDiffReel(date) {
    var today = new Date();
    var timeDiff = Math.floor((today - date) / 1000);
    var text = '';
    var minute = 60;
    if (timeDiff < 15 * minute) {
        text = `Mis à jour il y a ${Math.floor(timeDiff / 60)} min.`;
    } else {
        text = `Il y a plus de 15 min. Les données ont 
        probablement évolué depuis !`;
    }
    return text;
}

/**
 * Calculate difference between Date and today.
 * Returns text with days + hours / hours + min / min + sec in sentence.
 * @example 3 days and 5 hours.
 * @param {Date} date - last update of data
 */
function timeDiffAbsolut(date) {
    var today = new Date();
    var timeDiff = today - date;
    var days = Math.floor(timeDiff / 1000 / 60 / (60 * 24));
    var dateDiff = new Date(timeDiff);
    var text;

    if (days > 1) {
        text = days + " jours et " + dateDiff.getHours() + " h.";
    } else if (days == 1) {
        text = days + " jour " + dateDiff.getHours() + " h.";
    } else if (dateDiff.getHours() >= 1) {
        text = dateDiff.getHours() + " h " + dateDiff.getMinutes() + " min.";
    } else {
        text = dateDiff.getMinutes() + " min et " + dateDiff.getSeconds() + " sec";
    }
    return text;
}

/**
 * Adds update date and how long ago that was in the header for 'static' data.
 * @param {Date} date - date of the last update
 */
function displayDate(date) {
    const upDate = document.getElementById('upDate');
    const ago = document.getElementById('ago');

    if (!demoMode) {
        upDate.textContent = formatDate(date);
        ago.textContent = timeDiff(date);
    } else {
        upDate.textContent = demoText1;
        ago.textContent = demoText2;
    }
}

/**
 * Adds update date and how long ago that was in the header for real-time data.
 * @param {Date} date - date of the last update
 */
function displayDateRealTime(date) {
    const upDate = document.getElementById('upDate');
    const ago = document.getElementById('ago');

    if (!demoMode) {
        upDate.textContent = formatDateReel(date);
        ago.textContent = timeDiffReel(date);
    } else {
        upDate.textContent = demoText1;
        ago.textContent = demoText2;
    }
}

/**
 * Function used in .sort() to determine the alphabetical
 * order of the elements.
 * Sorting is made on the startDates
 * @param {object} a 
 * @param {string} a.startDate 
 * @param {object} b 
 * @param {string} b.startDate
 */
function compareDate(a, b) {
    if (a.startDate > b.startDate) {
        return 1;
    } else if (a.startDate < b.startDate) {
        return -1;
    }
}

/**
 * function used in .sort() to determine the alphabetical
 * order of the elements.
 * Sorting is made on the names
 * @param {object} a - data a
 * @param {object} a.fields
 * @param {string} a.fields.name 
 * @param {object} b - data b
 * @param {object} b.fields 
 * @param {string} b.fields.name 
 */
function compareName(a, b) {
    if (a.fields.name > b.fields.name) {
        return 1;
    } else if (a.fields.name < b.fields.name) {
        return -1;
    }
}

/**
 * Parses french address : *'street postcode city country'* and returns :
 * * address 1 : *street*
 * * address 2 : *postcode city*
 * @param {string} address - 'street 5-digits-postcode city France?'
 */
function parseAddress(address) {
    address = address.replace(/France/g, "");
    var cut = address.search(/[0-9]{5}\s/g);
    var address1 = address.slice(0, cut);
    var address2 = address.slice(cut);
    return { address1, address2 };
}

/**
 * Filters the *cards* under the map of the page according
 * to the text written by the user, as it is written.
 */
function searchedFunction() {
    document.getElementById('searched').oninput = function () {
        var filter, txtValue;
        const input = document.getElementById('searched');
        filter = input.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const ul = document.getElementById('container');
        const cards = ul.getElementsByClassName('card');

        for (let i = 0; i < cards.length; i++) {
            const h = cards[i].getElementsByTagName('h1')[0];
            txtValue = h.textContent || h.innerText;
            txtValue = txtValue.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                cards[i].style.display = '';
            }
            else {
                cards[i].style.display = 'none';
            }
        }
    };
}

/**
 * Filters and un-filters *cards* according to the *marker* clicked on.
 * @param {object} marker - leaflet marker object
 * @param {object} entity - data of the entity with idsurfs or recordid property
 * @param {object} entity.fields
 * @param {string} [entity.fields.idsurfs]
 * @param {string} [entity.recordid]
 */
function clickMarker(marker, entity) {
    marker.on('popupopen', function () {
        var filter;
        if (entity.fields.idsurfs) {
            filter = entity.fields.idsurfs;
        } else if (entity.recordid) {
            filter = entity.recordid;
        }
        const ul = document.getElementById('container');
        const cards = ul.getElementsByClassName('card');

        for (let i = 0; i < cards.length; i++) {
            var dataRef = cards[i].getElementsByTagName('h1')[0].dataset.ref;
            if (dataRef == filter) {
                cards[i].style.display = '';
                var panel = cards[i].firstElementChild.lastElementChild;
                if (panel && panel.className.indexOf('balades') > -1 && !panel.style.maxHeight) {
                    cards[i].classList.toggle("active");
                    cards[i].firstElementChild.classList.toggle("active");
                    panel.style.maxHeight = panel.scrollHeight + "px";
                }
            }
            else {
                cards[i].style.display = 'none';
            }
        }
    });
    marker.on('popupclose', function () {
        const ul = document.getElementById('container');
        const cards = ul.getElementsByClassName('card');
        for (let i = 0; i < cards.length; i++) {
            cards[i].style.display = "";
            var panel = cards[i].firstElementChild.lastElementChild;
            if (panel && panel.className.indexOf('balades') > -1 && panel.style.maxHeight) {
                cards[i].classList.toggle("active");
                cards[i].firstElementChild.classList.toggle("active");
                panel.style.maxHeight = null;
            }
        }
    });
}

/**
 * Enables touch-screen users to see the legend of maps (otherwise hoverable)
 */
function clickLegend() {
    if (L.Browser.mobile) {
        const legends = document.getElementsByClassName('legend');
        for (let i = 0; i < legends.length; i++) {
            legends[i].addEventListener("click", function () {
                legends[i].classList.toggle("active");
                for (let j = 0; j < legends.length; j++) {
                    if (j != i && legends[j].className.indexOf('active') > -1) {
                        legends[j].classList.toggle("active");
                    }
                }
            });
        }
    }
}

/**
 * Opens *marker*'s popup with same id of clicked-on *card*,
 * centers the map and zooms on it.
 * @param {string} dataRef - id of entity
 * @param {number} [zoom = 14] - zoom value of the map to set, from 11 to 17
 */
function clickCard(dataRef, zoom = 14) {
    markerGroup.eachLayer(function (marker) {
        var filter = marker.options.ref;
        if (dataRef == filter) {
            map.setView(marker.getLatLng(), zoom);
            marker.openPopup();
        }
    });
}

/**
 * Opens description-panel of *card*  when clicked-on or when
 * associated *marker* is clicked-on
 * Closes the panel when another *card* of *marker* is selected.
 */
function openCloseWalk() {
    const acc = document.getElementsByClassName('walkBloc');
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function () {
            acc[i].classList.toggle("active");
            acc[i].parentElement.classList.toggle("active");
            const panel = this.lastElementChild;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            }
            else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }

            for (let j = 0; j < acc.length; j++) {
                const panelj = acc[j].lastElementChild;
                if (j != i && panelj.style.maxHeight) {
                    panelj.style.maxHeight = null;
                    acc[j].classList.toggle("active");
                    acc[j].parentElement.classList.toggle("active");
                }
            }
        });
    }
}

/**
 * Adds a circle with coloring depending on attendance rate
 * in the pPlaces Element.
 * (circle and colored with CSS)
 * @param {htmlElement} pPlaces - HTML Element
 * @param {number} rate - occupancy rate from the data
 */
function imgWarning(pPlaces, rate) {
    const warning = document.createElement('span');
    warning.setAttribute('class', `warning${rate}`);
    warning.setAttribute('alt', rate);
    pPlaces.appendChild(warning);
}

/**
 * Creates matrix with one line per day :
 * * day(s) name in french, start hour, end hour
 * @param {object} entity - data of the entity with schedule properties
 * @param {object} entity.schedule
 * @param {number} entity.schedule.dayOfWeek
 * @param {number} entity.schedule.startHour
 * @param {number} entity.schedule.endHour
 * @example [[lundi, mercredi], [8:00], [17:00]]
 */
function hoursMatrix(entity) {
    var matrix = [];
    const week = ['lundi', 'mardi', 'mercredi',
        'jeudi', 'vendredi', 'samedi', 'dimanche'];
    entity.forEach(schedule => {
        const line = [week[schedule.dayOfWeek], schedule.startHour, schedule.endHour];
        matrix.push(line);
    });
    var matHours = [];
    matHours.push(matrix[0]);
    let j = 0;
    for (let i = 1; i < matrix.length; i++) {
        if ((matrix[i][1] == matHours[j][1]) && (matrix[i][2] == matHours[j][2])) {
            matHours[j][0] += ", " + matrix[i][0];
        }
        else {
            matHours.push(matrix[i]);
            j++;
        }
    }
    return matHours;
}

/**
 * Sets Icon leaflet for the marker according to state
 * of the entity (open/closed)
 * @param {object} entity - data of the entity
 * @param {object} entity.fields
 * @param {string} entity.fields.name
 * @param {string} [entity.fields.idsurfs]
 * @param {string} [entity.recordid]
 * @param {object} openIcon - leaflet icon object for open entity
 * @param {object} openIcon.options
 * @param {object} closedIcon - leaflet icon object for closed entity
 * @param {object} closedIcon.options
 * @param {object} noInfoIcon - leaflet icon object when there's no info
 * @param {object} noInfoIcon.options
 * @param {object} [almostFullIcon] - leaflet icon object for almost full entity
 * @param {object} almostFullIcon.options
 * @param {object} [fullIcon] - leaflet icon object for full entity
 * @param {object} fullIcon.options
 */
function setIconOptions(entity, openIcon, closedIcon, noInfoIcon, almostFullIcon, fullIcon) {
    var filter;
    if (entity.fields.idsurfs) {
        filter = entity.fields.idsurfs;
    } else if (entity.recordid) {
        filter = entity.recordid;
    }
    const ul = document.getElementById('container');
    const cards = ul.getElementsByClassName('card');
    var optionsIcon = noInfoIcon.options;
    for (let i = 0; i < cards.length; i++) {
        var dataRef = cards[i].getElementsByTagName('h1')[0].dataset.ref;
        if (dataRef == filter) {
            var state = cards[i].getElementsByTagName('h2')[0];
            if (state.className == "ferme") {
                optionsIcon = closedIcon.options;
            } else if (state.className == "ouvert") {
                optionsIcon = openIcon.options;
            } else if (fullIcon && state.className == "complet") {
                optionsIcon = fullIcon.options;
            } else if (almostFullIcon && state.className == "ouvert almostfull") {
                optionsIcon = almostFullIcon.options;
            }
        }
    }
    return optionsIcon;
}

/**
 *
 * @param {object} data - data of the entities
 * @param {object} data.entity
 * @param {object} data.entity.fields
 * @param {[number, number]} data.entity.fields.point_geo
 * @param {string} data.entity.fields.name
 * @param {string} data.entity.fields.idsurfs
 * @param {string} data.entity.fields.address
 * @param {string} data.entity.fields.accessforwheelchair
 * @param {object} openIcon - leaflet icon object for open entity
 * @param {object} openIcon.options
 * @param {object} closedIcon - leaflet icon object for closed entity
 * @param {object} closedIcon.options
 * @param {object} noInfoIcon - leaflet icon object when there's no info
 * @param {object} noInfoIcon.options
 * @param {boolean} displayNoAccess - false to display no image for "no access" for wheelchair
 */
function entityMap(data, openIcon, closedIcon, noInfoIcon) {
    var address1, address2, wheelchair;
    data.forEach(entity => {
        var optionsIcon = setIconOptions(entity, openIcon, closedIcon, noInfoIcon);
        var entityMarker = L.marker(entity.fields.point_geo,
            {
                icon: L.icon(optionsIcon),
                alt: entity.fields.name,
                title: entity.fields.name,
                ref: entity.fields.idsurfs
            });
        entityMarker.addTo(markerGroup);

        ({ address1, address2 } = parseAddress(entity.fields.address));

        if (entity.fields.accessforwheelchair == 1) {
            wheelchair = `<img src="Images/Icons/wheelchair.png" class="wheelchair">`;
        } else {
            wheelchair = '&nbsp;';
        }

        var exceptions = JSON.parse(entity.fields.exceptions);
        var exceptText = getExceptions(exceptions, 7, true);

        entityMarker.bindPopup(`<div class="fieldName">${entity.fields.name}</div>
                <span class="fieldAddress">${address1}<br/>${address2}
                <br/>${wheelchair}${exceptText}</span>`,
            { closeButton: false }
        );
        clickMarker(entityMarker, entity);
    });
}

/**
 *  * Gets exceptions schedule from the data and displays them before the map
 * @param {object} exceptions - exceptions schedule
 * @param {string} exceptions.startDate
 * @param {string} exceptions.endDate
 * @param {object} exceptions.description
 * @param {string} exceptions.description.fr_FR
 * @param {number} days - extent in days of the exceptions to display
 * @param {boolean} twolines - if the dates in two parts is to be on 2 lines
 */
function getExceptions(exceptions, days, twolines) {
    exceptions.sort(compareDate);
    var exceptText = "<h2>Horaires exceptionnels</h2>";

    for (let i = 0; i < exceptions.length; i++) {
        var startDate = Date.parse(exceptions[i].startDate);
        var endDate = Date.parse(exceptions[i].endDate);
        var today = new Date();
        diffDateDaysStart = Math.floor((startDate - today) / (1000 * 60 * 60 * 24));
        diffDateDaysEnd = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
        if ((diffDateDaysStart > 0 && diffDateDaysStart < days) || (diffDateDaysStart < 0 && diffDateDaysEnd > 0)) {
            if (startDate == endDate) {
                exceptText += `<p><b>Le ${formatDateCenter(new Date(startDate))}</b>
                <br/>${exceptions[i].description.fr_FR}`;
            }
            else {
                exceptText += `<p><b>Du ${formatDateCenter(new Date(startDate))+(twolines ? '<br/>' : ' ')}au
                 ${formatDateCenter(new Date(endDate))}</b>
                 <br/>${exceptions[i].description.fr_FR}</p>`;
            }
            exceptText += (exceptions[i].closed ? `</p>` : ` - Ouvert de ${exceptions[i].schedule[0].startHour} à 
            ${exceptions[i].schedule[0].endHour}.`);
        }
    }

    if (exceptText == "<h2>Horaires exceptionnels</h2>") {
        exceptText += `<p>Pas d'exception sur les horaires d'ouverture 
        prévue au cours des ${days} prochains jours.</p>`;
    }

    return exceptText;
}