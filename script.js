// Initialize base map
const map = L.map("map").setView([55, -70], 5);

// Add base tile layer (OpenStreetMap)
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Carto Dark basemap
const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  minZoom: 0,
  maxZoom: 20,
  attribution: '&copy; <a href="https://carto.com/" target="_blank">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// GeoJSON of weather stations (fixed raw URL)
const stationsURL = "https://raw.githubusercontent.com/brubcam/GEOG-464_Lab-8/main/DATA/climate-stations.geojson";

// Year for climate data
const DATA_YEAR = 2025;

// Load stations and add to map
function loadStations(url) {
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("Failed to load GeoJSON");
      return response.json();
    })
    .then(data => {
      const stationLayer = L.geoJSON(data, {
        onEachFeature: onEachStation,
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, stationStyle(feature))
      });

      // Add MarkerCluster
      const markers = L.markerClusterGroup();
      markers.addLayer(stationLayer);
      markers.addTo(map);

      // Layer control
      const baseMaps = {
        "OpenStreetMap": osm,
        "Carto Dark": cartoDark
      };
      const overlayMaps = {
        "Climate Stations": markers
      };
      L.control.layers(baseMaps, overlayMaps).addTo(map);

      // Scale control
      L.control.scale().addTo(map);
    })
    .catch(err => console.error("Error loading GeoJSON:", err));
}

// Function to handle popups for each station
function onEachStation(feature, layer) {
  const props = feature.properties || {};
  const stationId = props.STN_ID ?? props.stn_id ?? props.id ?? 'N/A';
  const stationName = props.STATION_NAME ?? props.name ?? 'Unknown';
  const province = props.PROV_STATE_TERR_CODE ?? props.province ?? '';
  const elevation = props.ELEVATION ?? 'N/A';

  const popup = `
    <strong>${stationName}</strong><br>
    <strong>Station ID:</strong> ${stationId}<br>
    <strong>Elevation:</strong> ${elevation} m<br>
    ${province ? `<strong>Province:</strong> ${province}<br>` : ''}
  `;
  layer.bindPopup(popup);

  // Fetch climate data on click
  layer.on("click", () => {
    document.getElementById("station-name").innerHTML = `<strong>${stationName}</strong>`;
    document.getElementById("climate-data").innerHTML = "<p>Loading climate data...</p>";

    if (props.CLIMATE_IDENTIFIER) {
      fetchClimateData(props.CLIMATE_IDENTIFIER);
    } else {
      document.getElementById("climate-data").innerHTML = "<p>No climate ID available for this station.</p>";
    }
  });
}

// Fetch Environment Canada climate data
function fetchClimateData(climateID) {
  const apiURL = `https://api.weather.gc.ca/collections/climate-daily/items?limit=10&sortby=-LOCAL_DATE&CLIMATE_IDENTIFIER=${climateID}&LOCAL_YEAR=${DATA_YEAR}`;

  fetch(apiURL)
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then(json => {
      const container = document.getElementById("climate-data");
      if (!json.features || json.features.length === 0) {
        container.innerHTML = `<p>No climate data available for ${DATA_YEAR}.</p>`;
        return;
      }

      const props = json.features[0].properties;
      let html = "";

      if (props.LOCAL_DATE != null) html += `<p><strong>Date:</strong> ${props.LOCAL_DATE}</p>`;
      if (props.MAX_TEMPERATURE != null) html += `<p><strong>Max Temp:</strong> ${props.MAX_TEMPERATURE} °C</p>`;
      if (props.MIN_TEMPERATURE != null) html += `<p><strong>Min Temp:</strong> ${props.MIN_TEMPERATURE} °C</p>`;
      if (props.MEAN_TEMPERATURE != null) html += `<p><strong>Mean Temp:</strong> ${props.MEAN_TEMPERATURE} °C</p>`;
      if (props.TOTAL_PRECIPITATION != null) html += `<p><strong>Total Precipitation:</strong> ${props.TOTAL_PRECIPITATION} mm</p>`;
      if (props.TOTAL_RAIN != null) html += `<p><strong>Total Rain:</strong> ${props.TOTAL_RAIN} mm</p>`;
      if (props.TOTAL_SNOW != null) html += `<p><strong>Total Snow:</strong> ${props.TOTAL_SNOW} mm</p>`;

      container.innerHTML = html || `<p>No data available for ${DATA_YEAR}.</p>`;
    })
    .catch(error => {
      console.error("Error fetching climate data:", error);
      document.getElementById("climate-data").innerHTML = `<p>Error loading climate data.</p>`;
    });
}

// Style stations based on elevation
function stationStyle(feature) {
  const elevation = feature.properties.ELEVATION ?? 0;
  let fillColor;

  if (elevation < 200) fillColor = "#9ac7e3"; // low
  else if (elevation <= 500) fillColor = "#f8f871"; // medium
  else fillColor = "#fc8d59"; // high

  return {
    radius: 6,
    fillColor: fillColor,
    color: "#fff",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };
}

// Elevation legend
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function(map) {
  const div = L.DomUtil.create('div', 'info legend');
  const grades = [0, 200, 500];
  const colors = ['#9ac7e3', '#f8f871', '#fc8d59'];
  const labels = ['Low (<200m)', 'Medium (200-500m)', 'High (>500m)'];

  div.innerHTML += '<b>Elevation</b><br>';
  for (let i = 0; i < grades.length; i++) {
    div.innerHTML += `<i style="background:${colors[i]}"></i> ${labels[i]}<br>`;
  }
  return div;
};
legend.addTo(map);

// Load stations on map
loadStations(stationsURL);
