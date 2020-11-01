const UrlTree = 'lieux_arbres-remarquables';
//const pageName = 'Arbres';
var zoom = 13;
var lat = 48.5796;
var lng = 7.7616;

var base_url = "https://data.strasbourg.eu/api/records/1.0/search/?dataset="+ UrlTree + "&q=&lang=fr%2F&timezone=Europe%2FBerlin&rows=";
var url_nhits = base_url + no_hits;

var map = L.map('map').setView([lat, lng], zoom);
mapCreation(map);
var markerGroup = L.layerGroup().addTo(map);

//ajaxGetState(pageName, isReady);
ajaxGetnHits(url_nhits, isReady);
searchedFunction();

function isReady(n_hits) {
    var url_page = base_url + n_hits;
    ajaxGetJson(url_page, treeMap);
}

/**
 * Using *data*, displays last update date in the header, and for each 
 * entity(tree) :
 * * creates a *card* under the map
 * * calls *getInfo()* to fill it with details
 * * adds a *marker* to the map with a popup containing name and address
 * 
 * @param {object} data - data for the trees
 * @param {object} data.tree
 * @param {string} data.tree.record_timestamp
 * @param {string} data.tree.recordid
 * @param {object} data.tree.fields
 * @param {string} data.tree.fields.name
 * @param {string} data.tree.fields.address
 * @param {[number, number]} data.tree.fields.pt_geo
 */
function treeMap(data) {
    var d = new Date(data[0].record_timestamp);
    displayDate(d);
    var address1, address2;

    data.forEach(tree => {
        var cleanName = tree.fields.name.replace(/\\\"/g, "\"");

        const card = document.createElement('div');
        card.setAttribute('class', 'card balades drop');
        card.onclick = function () { clickCard(tree.recordid, 16); };
        container.appendChild(card);

        const divTitle = document.createElement('div');
        divTitle.setAttribute('class', 'walkBloc');
        card.appendChild(divTitle);

        const treeName = document.createElement('h1');
        treeName.setAttribute('class', 'walkName');
        treeName.setAttribute('data-ref', tree.recordid);
        treeName.textContent = cleanName;
        divTitle.appendChild(treeName);

        getInfo(tree, divTitle);

        ({ address1, address2 } = parseAddress(tree.fields.address));

        var treeMarker = L.marker(tree.fields.pt_geo,
            {
                icon: treeIcon,
                alt: cleanName,
                title: cleanName,
                ref: tree.recordid
            });
        treeMarker.addTo(markerGroup);

        var cut = cleanName.search('-');
        treeMarker.bindPopup(`<div class="fieldName">
        ${cleanName.slice(0, cut)}</div><span class="fieldAddress">${address1}
        <br/>${address2}</span>`,
            { closeButton: false });
        clickMarker(treeMarker, tree);
        openCloseWalk();
    });
}

/**
 * Gets and adds the characteristics and description details 
 * to the divTitle element of the tree entity
 * @param {object} tree - data for the tree
 * @param {object} tree.fields
 * @param {string} [tree.fields.characteristics]
 * @param {string} [tree.fields.description]
 * @param {Element} divTitle - element in which the info will be added
 */
function getInfo(tree, divTitle) {

    const dInfo = document.createElement('div');
    dInfo.setAttribute('class', 'baladesInfo panel');

    const descr = document.createElement('h2');
    descr.textContent = `Description`;
    dInfo.appendChild(descr);

    if (tree.fields.characteristics !== undefined) {
        const treeCharact = document.createElement('p');
        treeCharact.setAttribute('class', 'baladesInfo charact');

        const charact = '{ "characteristics": ' + tree.fields.characteristics + '}';
        const charactJ = JSON.parse(charact);

        treeCharact.innerHTML = charactJ.characteristics.fr_FR.replace(/&nbsp;/g, " ");
        dInfo.appendChild(treeCharact);
    }

    const baladesInfo = document.createElement('p');
    baladesInfo.setAttribute('class', 'baladesInfo');

    if (tree.fields.description !== undefined) {
        const infos = '{ "description": ' + tree.fields.description + '}';
        const infoJ = JSON.parse(infos);
        baladesInfo.innerHTML = infoJ.description.fr_FR.replace(/&nbsp;/g, " ");
    }
    else {
        baladesInfo.textContent = `Informations non disponibles`;
    }
    dInfo.appendChild(baladesInfo);
    divTitle.appendChild(dInfo);
}