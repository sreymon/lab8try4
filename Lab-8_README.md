# Lab 8 – APIs and Leaflet Methods

## Overview

The goal of this final lab is to integrate everything you have learned so far, from basic web technologies (HTML, JavaScript, and CSS) to web mapping with Leaflet, and extend your skills into working with [APIs](https://www.oracle.com/ca-en/cloud/cloud-native/api-management/what-is-api/) to fetch real-world data and advanced Leaflet techniques for interactivity and visualization. You will learn how to fetch and parse data from web APIs, including the use of asynchronous programming concepts (`fetch()`, promises, and JSON parsing), practice adding and styling multiple Leaflet layers, and implement interactive Leaflet controls, such as layer toggles, scale bars, and legends. By the end of this lab, you will have a complete, interactive web map that displays climate station data from Environment and Climate Change Canada (ECCC) and fetches live or near-real-time data from an API.

## Setup

First, create a working folder for this lab, if you haven't already, named 'Lab8' or something similar. The provided 'Lab-8_DOWNLOADME.zip' folder contains three starter files. Unzip it into your lab working folder. Make sure these files are stored in their respective diretories, as in previous labs and as shown below:

```
Lab8/
├── index.html
├── js/
    ├── script.js
├── css/
    ├── styles.css
```

You will also be accessing [this GeoJSON file on GitHub](https://github.com/brubcam/GEOG-464_Lab-8/blob/main/DATA/climate-stations.geojson), which contains approximately 150 active climate stations across  Québec, represented as point features with attributes such as name, province, elevation, and Environment Canada station IDs. Feel free to download and take a look at the content of this file before starting, but note that you won't be providing your website with this file locally, but rather fetching it from the repository, as you did in the previous lab.

Also as in the previous lab, you will upload the files of this lab to a public GitHub repository, with the website published as a [GitHub page](https://docs.github.com/en/pages/quickstart). Start by [creating a public repo](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository) for this lab (either using the command line or from the GitHub website), and link/upload the files from your Lab 8 working folder.

Let's take a quick look at the HTML file. Open `index.html` in VS Code and try to understand its structure. It's relatively short/simple and will remain so throught the lab - all the work will be done within the `script.js` JavaScript file. It is important to note, however, the various Leaflet libraries that are loaded into the website from an online repository called [UNPKG](https://unpkg.com/). This allows us to remotely access the required Leaflet data without having to have the files stored locally (i.e. in a `lib/` folder, as was done in the previous labs). Specifically, the base Leaflet and Leaflet MarkerCluster CSS (styling) files are loaded at the top of the HTML, and the JS files at the bottom, as seen below. Leaflet MarkerCluster is an external library which we'll cover later in this lab.

```html
<!-- Leaflet JS -->
<script
  src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
></script>

<!-- Leaflet MarkerCluster JS -->
<script 
  src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js">
</script>
```

## Part 1: Loading and Visualizing GeoJSON Data

We will load our station data dynamically using the [`fetch()` API.](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) Fetching data asynchronously allows your website to continue running while data is being retrieved — a key aspect of modern web applications.

Let's start by defining the URL of the GeoJSON file and writing a function to fetch and display it. Paste the following in your `script.js`, under 'PART 1':

```javascript
// Load GeoJSON of weather stations
const stationsURL = "https://raw.githubusercontent.com/brubcam/GEOG-464_Lab-8/refs/heads/main/DATA/climate-stations.geojson";

// Fetch GeoJSON and add to map
function loadStations(url) {
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("Failed to load GeoJSON");
      return response.json();
    })
    .then(data => {
      const stationLayer = L.geoJSON(data, {
        onEachFeature: onEachStation,
      }).addTo(map);
    })
    .catch(err => console.error("Error loading GeoJSON:", err));
};

// Popup and click handler for each station
function onEachStation(feature, layer) {
  const props = feature.properties;
  const popup = `
    <strong>${props.name}</strong><br>
    Province: ${props.province}<br>
  `;
  layer.bindPopup(popup);
}
```

Reload `index.html` (or open it in your browser if you haven't already), and explore some of the stations.

**Q1. Explain what `.then()` and `.catch()` do in the above JavaScript code.** (1 point)

Answer this question with a comment in `script.js`, following the code you just pasted.

**Q2. Modify the `onEachStation()` function so that it also displays the station’s ID and its elevation.** (2 points)

## Part 2: Fetching and Integrating API Data

Now we’ll use the [ECCC Climate Daily API](https://api.weather.gc.ca/openapi#/climate-daily) to fetch daily climate data for our selected stations. (see more documentation on the API [here](https://api.weather.gc.ca/) and [here](https://eccc-msc.github.io/open-data/msc-geomet/ogc_api_en/)). API data typically comes in JSON format. To request it, you provide the endpoint URL, sometimes with parameters such as a station ID or date range.

Example API call (copy and paste into your browser to see the results):

```
https://api.weather.gc.ca/collections/climate-daily/items?limit=10&offset=0&sortby=-LOCAL_DATE&STATION_NAME=montreal
```

Let's start with a function that fetches data from the API for a single station and displays one or two data fields (e.g., date and mean temperature) in the console. Paste this in your `script.js`, under 'PART 2':

```javascript
// Function to fetch Environment Canada climate data
function fetchClimateData(climateID) {
  const apiURL = `https://api.weather.gc.ca/collections/climate-daily/items?limit=10&sortby=-LOCAL_DATE&CLIMATE_IDENTIFIER=${climateID}`;

  fetch(apiURL)
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then(json => {
      if (!json.features || json.features.length === 0) {
        console.log("No recent climate data available for this station.");
        return;
      }

      const props = json.features[0].properties;
      console.log("Date:", props.LOCAL_DATE);
      console.log("Mean Temp (°C):", props.MEAN_TEMPERATURE);
    })
    .catch(error => {
      console.error("Error fetching climate data:", error);
    });
}
```

Now, let's call this function whenver a popup is clicked, providing it with that station's Climate ID. Paste this within your `onEachStation()` function (under 'PART 1'), after the first block of code:

```javascript
// Fetch API data on click
layer.on("click", () => {
  document.getElementById("station-name").innerHTML = "<strong>" + props.STATION_NAME + "</strong>";
  document.getElementById("climate-data").innerHTML = "<p>Loading climate data...</p>";
  fetchClimateData(props.CLIMATE_IDENTIFIER);
  });
```

Reload the HTML file, and open the developer/inspector pane within your browser. Click on some stations and check the output in the console.

**Q3. Edit the `fetchClimateData()` function so that it also prints out another value of your choice from the [Climate Daily API](https://api.weather.gc.ca/collections/climate-daily/items?limit=10&sortby=-LOCAL_DATE&PROVINCE_CODE=QC), such as the total precipitation.** (2 points)

**Q4. Using a new variable, edit the function definition and API URL so that it only returns data from the year 2020.** (3 points)

Hint: Declare a new variable (using `let`) within the function, and incorporate this variable into the URL.

Once you've done this, change the variable to 2025, or remove it from the function.

## Part 3: Styling the Map and Layers

Let’s make the map more visually engaging by styling the points. Let's start by changing all the points to a simple blue circle. Under 'PART 3' of your `script.js`, paste this:

```javascript
// Style for stations
function stationStyle(feature) {
  return {
    radius: 6,
    fillColor: "#2E7DA1",
    color: "#fff",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };
}
```

Then, add the following to the variables passed to your `loadStations()` function (under 'PART 1'), along with `onEachFeature` (already there):

```javascript
pointToLayer: (feature, latlng) => L.circleMarker(latlng, stationStyle(feature))
```

Reload the webpage to see the new point style.

We can also have the point style change based on its attributes. For example, we can colour stations by their elevation. Replace the `fillColor` line within the function with this:

```javascript
fillColor: feature.properties.ELEVATION > 200 ? '#fc8d59' : '#91bfdb',
```

Reload the webpage to see the changes.

**Q5. Change the style function to use three categories of elevation of your choice (low, medium, high) with different colors.** (3 points)

Hint: You will need to determine the `fillColor` variable within the function (again, using `let`) before returning its value. You will also need to use conditional logic to determine its colour and assign the variable.

Looking good! But a little busy, especially with all the stations in Southern Québec. In Leaflet, it's also possible to automatically cluster symbols depending on the map's zoom level. Paste the following into the `loadStations()` function (under 'PART 1'), after the GeoJSON is 'added' to the map, but before the error catch line:

```javascript
// Add marker cluster group
const markers = L.markerClusterGroup();
stationLayer.eachLayer(layer => {
  markers.addLayer(layer);
});
markers.addTo(map);
```

Reload the page. We can see the cluster groups, but the individual stations symbols are still there.

**Q6. Edit the `loadStations()` function so the station symbols aren't 'added' to the map before the marker clusters.** (1 point)

## Part 4: Adding Interactive Leaflet Controls

Leaflet offers several built-in controls to enhance interactivity and ease-of-use, including:

- Layer Control: allows toggling between base maps or overlays.
- Scale Bar: shows a visual reference for distance.
- Custom Buttons/Widgets: you can build your own controls with HTML and CSS.

Copy the following code and paste it within your `loadStations()` function (under 'PART 1'), after the 'Add marker cluster group' block:

```javascript
// Add layer control
const baseMaps = {
  "OpenStreetMap": osm,
};
const overlayMaps = {
  "Climate Stations": stationsLayer
};
L.control.layers(baseMaps, overlayMaps).addTo(map);
L.control.scale().addTo(map);
```

Reload the page. You should see a layer toggle in the top-right of the map and a scalebar in the bottom left.

**Q7. Add another base tileset option to your map from the [options here](https://leaflet-extras.github.io/leaflet-providers/preview/) (choose one that does not require an API key).** (2 points)

Hint: You will need to add the tileset as a variable towards the beginning of your `script.js` (as was done for the OSM base map), and then add a line calling on this variable within the `baseMaps` variable you declared previously (within your `loadStations()` function).

## Part 5: Adding a Legend

Legends help users interpret map symbology. A basic Leaflet legend can be created as a control and styled with CSS.

Paste the following into your `script.js`, under 'PART 5'.

```javascript
// Add elevation color legend
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function(map) {
  const div = L.DomUtil.create('div', 'info legend');
  const grades = [0, 100, 200, 300];
  const colors = ['#91bfdb', '#ffffbf', "#fee090", '#fc8d59'];
  div.innerHTML += '<b>Elevation (m)</b><br>';
  for (let i = 0; i < grades.length; i++) {
    div.innerHTML += `<i style="background:${colors[i]}"></i> ${grades[i]}${grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+'}`;
  }
  return div;
};
legend.addTo(map);
```

**Q8. Edit the function to match the three elevation classes you defined in Q5.** (1 point)

## Part 6: Presenting the Data

Let's revisit your base `fletchClimateData()` function from Part 2. So far, it's just displaying some base data in pop-ups, and printing some others to the console. You may have noticed the 'Station Climate Information' sidebar to the right of the map, and that, whenever you click on a station, it just displays "Loading climata data...". Let's use this space to actually show some useful climate data!

Remove (or comment out) the `console.log` statements from your `fetchClimateData()` function (under 'PART 2'). Paste the following below it (before the error catch line):

```javascript
const container = document.getElementById("climate-data");
      container.innerHTML = `
        <p><strong>Date:</strong> ${props.LOCAL_DATE}</p>
        <p><strong>Max Temp:</strong> ${props.MAX_TEMPERATURE} °C</p>
        <p><strong>Min Temp:</strong> ${props.MIN_TEMPERATURE} °C</p>
        <p><strong>Total Precipitation:</strong> ${props.TOTAL_PRECIPITATION} mm</p>
      `;
```

Refresh the page and click on a station. Some data should now appear in the right panel.

Now we can easily see some basic data from each station. But while exploring, I'm sure you've seen some stations with 'null' values, notably for total precipitation. It would be a good idea to not show these data points if they happen to be null, and furthermore, to show the specific type of precipitation (rain and snow) and its amount, in the case that there has been precipitation.

**Q9. Edit the `fetchClimateData()` function so that it only displays a value if it is not null, and also displays individual rain and snow amounts if they are not null.** (3 points)

Hint: You will need to use conditional logic to determine if these values are null (i.e. `if (props.TOTAL_PRECIPITATION !== null) {}`), and set a new HTML string variable (i.e. `precipHTML`) within this if statement, before passing it to the station climate information sidebar (i.e. under `container.innerHTML`). You may need to find specific stations that have rain and/or snow data in order to check if it's working (at time of writing, 'MONTREAL INTL A' has both rain and snow values).

## Deliverables

Upload the website files (`index.html`, `script.js`, and `styles,css` - within their respective folders) to your GitHub repo for this lab. Then, make sure it's deployed as a GitHub page, and upload its URL as submission to Moodle, as was done in the previous lab. Again, I do not want you to upload the individual website files, nor a link to the GitHub repository itself, but rather the generated URL of the GitHub page (usually [GitHubUsername].github.io/[NameOfRepo]).

(18 points total)
