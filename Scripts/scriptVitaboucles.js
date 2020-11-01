const UrlVitaboucles = 'boucles_sportives_vitaboucle&format=geojson';
//const pageName = 'Vitaboucles';
const siteVitaboucles = 'https://www.strasbourg.eu/parcours-vitaboucle';
var zoom = 12;
var lat = 48.58;
var lng = 7.75;

var geojsonLayer;

var base_url = "https://data.strasbourg.eu/api/records/1.0/search/?dataset="+ UrlVitaboucles + "&q=&lang=fr%2F&timezone=Europe%2FBerlin";

ajaxGetJson(base_url, ToGeojson, geojson = true);

var map = L.map('map').setView([lat, lng], zoom);
mapCreation(map);

var info = L.control({ position: "bottomright" });
var legend = L.control({ position: "bottomright" });
var myRenderer = L.canvas({ padding: 0.5, tolerance: 5 });

info.onAdd = function () {
  this._div = L.DomUtil.create('div', 'info');
  this.update();
  return this._div;
};

info.update = function (data) {
  this._div.innerHTML = (data ? `<h4>${data.nom}</h4><p>Vitaboucle n°${data.numero}<br/>
  Difficulté : ${data.difficulte}</b>.<br/>- ${data.long_km} km -<br/>
  <a href=${siteVitaboucles}>Plus d'infos</a></p>`
    : `<h4>Vitaboucle</h4><p>Survolez un parcours<br/>pour voir ses infos.<br/>
    Cliquez dessus pour zoomer<br/>et centrer la carte.</p>`);
};
info.addTo(map);

legend.onAdd = function () {
  var div = L.DomUtil.create("div", "legend vitaboucles");
  div.innerHTML += "<h4>Difficulté</h4>";
  div.innerHTML += '<i style="background: green"></i><span>Facile</span>';
  div.innerHTML += '<i style="background: #156dc0"></i><span>Moyenne</span>';
  div.innerHTML += '<i style="background: red"></i><span>Difficile</span>';
  return div;
};
legend.addTo(map);
clickLegend();

function ToGeojson(data) {
  dataJ = JSON.parse(data);

  dataJ.features.forEach(boucle => {
    boucle.geometry = boucle.properties.geo_shape;
  });

  vitabouclesMap(dataJ);
}

/**
 * Adds the geojson Features to the map.
 * @param {object} geojsonFeature
 */
function vitabouclesMap(geojsonFeature) {
  geojsonLayer = L.geoJson(geojsonFeature, {
    style: styleFunction,
    onEachFeature: onEachFeature,
    renderer: myRenderer
  });
  geojsonLayer.addTo(map);
}

/**
 * Attributes a color to the geojson Feature according to its
 * difficulty property.
 * @param {object} geojsonFeature - one vitaboucle
 * @param {object} geojsonFeature.properties
 * @param {string} geojsonFeature.properties.difficulte
 */
function styleFunction(geojsonFeature) {
  switch (geojsonFeature.properties.difficulte) {
    case 'facile': return { color: 'green' };
    case 'moyenne': return { color: '#156dc0' };
    case 'difficile': return { color: 'red' };
    default: return { color: 'white' };
  }
}

/**
 * Adds events to each geojson Feature on mouseover, mouseout and click.
 * @param {object} feature - group of layers
 * @param {object} layer 
 */
function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature
  });
}

/**
 * Sets the style for the highlighted feature and brings it to the front.
 * Updates the *info* control details with the properties of the feature.
 * @param {event} e - mouse over
 */
function highlightFeature(e) {
  var layer = e.target;
  layer.setStyle({
    weight: 4,
    color: 'orange'
  });

  if (!L.Browser.ie && !L.Browser.opera) {
    layer.bringToFront();
  }
  info.update(layer.feature.properties);
}

/**
 * Resets the style of the targeted geojson Layer.
 * @param {event} e - mouse out
 */
function resetHighlight(e) {
  geojsonLayer.resetStyle(e.target);
}

/**
 * Fits the *map* to the feature (vitaboucle) targeted, 
 * updates the *info* control details with the properties of the feature,
 * brings to the front the feature (if browser not Internet Explorer or Opera).
 * @param {event} e - click
 */
function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
  info.update(e.target.feature.properties);

  if (!L.Browser.ie && !L.Browser.opera) {
    e.target.bringToFront();
  }
}