var configPath = '../php/configFiles/configJson.txt';
var countsPath = '../php/stateFiles/counts.txt';
var datePath = '../php/stateFiles/upDate.txt';
var data1, data2, data3;
var data1ready = false;
var data2ready = false;
var data3ready = false;

ajaxGet(configPath, configReady, false);
ajaxGet(countsPath, visitsReady, false);
ajaxGet(datePath, majReady, false);

searchedFunction();

function configReady(data) {
    data1 = data;
    data1ready = true;
    parseData();
}

function visitsReady(data) {
    data2 = data;
    data2ready = true;
    parseData();
}

function majReady(data) {
    data3 = data;
    data3ready = true;
    parseData();
}

function parseData() {
    if (data1ready && data2ready && data3ready) {
        pagesInfos();
    }
}

/**
 * Creates a *card* element for each Page of the application, with basic
 * statistics from the config and state files and the possibility to 
 * force the update of the json files of a page.
 */
function pagesInfos() {
    const head = ['Page', 'Categorie', 'Fichier', 'Format', 'Précision url', 'Dernière MAJ', 'Il y a', 'Délai entre 2 MAJ', 'visites', 'le mois dernier', 'ce mois-ci'];

    var configTable = data1.split('\n');
    var visitsTable = data2.split('\n');
    var majTable = data3.split('\n');
    var card, visited;

    configTable.forEach(line => {
        var array = line.split('; ');
        visited = false;
        //Ajout "DernièreMaj"
        majTable.forEach(page => {
            var date = page.split('; ');
            if (date[0] == array[2]) {
                array.splice(5, 0, date[1]);
                visited = true;
            }
        });

        //Ajout "Il y a"
        //php timestamp is in seconds and GMT0
        if (visited) {
            array.splice(6, 0, timeDiffAbsolut(array[5] * 1000 + 60 * 60 * 1000));
            array[5] = formatDateAdmin(new Date(array[5] * 1000));
            array[7] = array[7].substr(1).replace('days', 'jours');

            visitsTable.forEach(page => {
                var visits = page.split('; ');
                if (visits[0] == array[0]) {
                    array[8] = visits[1];
                    array[9] = visits[2];
                    array[10] = visits[3];
                }
            });

        } else {
            array.splice(5, 0, '/');
            array.splice(6, 0, '/');
            array[7] = array[7].substr(1).replace('days', 'jours');
            array[8] = 'Pas encore de';
            array[9] = '0';
            array[10] = '0';
        }

        if (document.getElementsByClassName(`card ${array[0]}`)[0]) {
            card = document.getElementsByClassName(`card ${array[0]}`)[0];
            pRefresh = document.getElementsByClassName(`forceRefresh ${array[0]}`)[0];

        } else {
            card = document.createElement('div');
            card.setAttribute('class', `card ${array[0]} admin ${array[1]}`);
            container.appendChild(card);

            const cardName = document.createElement('h1');
            cardName.textContent = array[0];
            card.appendChild(cardName);


            const pVisits = document.createElement('p');
            pVisits.textContent = `- ${array[8]} ${head[8]} -`;
            pVisits.setAttribute('class', 'totalVisits');
            card.appendChild(pVisits);

            if (visited) {
                const pLastMonthVisits = document.createElement('p');
                pLastMonthVisits.textContent = `${head[9]} : ${array[9]}`;
                pLastMonthVisits.setAttribute('class', 'monthVisits');
                card.appendChild(pLastMonthVisits);
    
                const pMonthVisits = document.createElement('p');
                pMonthVisits.textContent = `${head[10]} : ${array[10]}`;
                pMonthVisits.setAttribute('class', 'monthVisits');
                card.appendChild(pMonthVisits);
            }

            var pRefresh = refreshButton(array[0], card);
        }

        getInfo(head, array, card, pRefresh);
    });

    const divSelect = document.createElement('div');
    divSelect.setAttribute('class', 'background');
    container.appendChild(divSelect);
}

/**
 * Creates a *p* element that executes *ajaxForceRefresh* function on click.
 * @param {string} pageName - name of the page
 * @param {Element} card - HTML element where the *p* will be added
 */
function refreshButton(pageName, card) {
    pRefresh = document.createElement('p');
    pRefresh.textContent = 'Forcer la mise à jour de la page';
    pRefresh.setAttribute('class', `forceRefresh ${pageName}`);
    card.appendChild(pRefresh);
    pRefresh.addEventListener('click', function () {
        ajaxForceRefresh(pageName, updateState, this);
        this.textContent = 'En cours...';
    });
    return pRefresh;
}

/**
 * 
 * @param {array} head - array working like the header for *array* 
 * @param {array} array - data for each json file
 * @param {Element} card - HTML element where the info will be added
 * @param {Element} pRefresh - HTML element before which the info will be added
 */
function getInfo(head, array, card, pRefresh) {
    const descr = document.createElement('h2');
    descr.textContent = array[2];
    card.insertBefore(descr, pRefresh);
    const dInfo = document.createElement('div');
    dInfo.setAttribute('class', 'infoAdmin');

    for (let i = 3; i < head.length - 3; i++) {
        const fileInfo = document.createElement('p');
        if (i == 5 || i == 6) {
            fileInfo.innerHTML = `<b>${head[i]} :</b> <span>${array[i]}</span>`;
        } else {
            fileInfo.innerHTML = `<b>${head[i]} :</b> ${array[i]}`;
        }
        dInfo.appendChild(fileInfo);
    }
    card.insertBefore(dInfo, pRefresh);
}

/**
 * Returns the status text and state of update for the "force refresh" button
 * when the ajaxForceRefresh has been executed.
 * @param {string} data - data returned by the ajaxForceRefresh function
 */
function updateState(data) {
    data = data.split("; ");
    const state = data[0];
    var statusText;

    switch (state) {
        case 'failed':
            statusText = `Echec de la mise à jour.`;
            break;
        case 'update':
            statusText = `Données mises à jour.`;
            break;
        case 'no-update':
            statusText = `Données déjà à jour.`;
            break;
        default:
            statusText = `Données indisponibles.`;
    }
    return { statusText, state };
}