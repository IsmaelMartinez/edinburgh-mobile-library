<template>
  <div id="leaflet-map">
    <h1>{{ msg }}</h1>
  </div>
</template>

<script>
import Papa from 'papaparse';
import _ from 'lodash';
import L from 'leaflet';
import 'leaflet.featuregroup.subgroup';
import 'leaflet.markercluster';
import 'leaflet-fullscreen';
import 'leaflet-pulse-icon';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import 'leaflet-pulse-icon/dist/L.Icon.Pulse.css';


import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default {
  name: 'leaflet-map',
  data() {
    return {
      map: {},
      msg: '',
      tileLayer: {},
      layers: [],
      dayOfTheWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      regexDayOfTheWeek: [
        /mo[a-z]*/i,
        /tu[a-z]*/i,
        /we[a-z]*/i,
        /th[a-z]*/i,
        /fr[a-z]*/i,
      ],
    };
  },

  mounted() {
    this.loadMap();
    this.setCurrentLocation();
  },

  methods: {
    loadMap() {
      this.defineMap();
      this.loadTileLayer();
      this.getLayersFromCSV();
    },

    addControlLayers() {
      this.controlLayers = L.control.layers(null, null, { collapsed: false });
      this.markers = L.markerClusterGroup();
      this.markers.addTo(this.map);
      _.keys(this.mobileLibraries).forEach((key) => {
        const group = L.featureGroup.subGroup(
          this.markers,
          this.mobileLibraries[key],
        );
        this.controlLayers.addOverlay(group, key);
        group.addTo(this.map);
      });
      this.controlLayers.addTo(this.map);
    },

    loadTileLayer() {
      this.tileLayer = L.tileLayer(
        'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png',
        {
          maxZoom: 18,
          attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>',
        },
      );
      this.tileLayer.addTo(this.map);
    },

    defineMap() {
      this.map = L.map('leaflet-map', {
        fullscreenControl: true,
        center: [55.953251, -3.188267],
        zoom: 12,
      });
    },

    getLayersFromCSV() {
      const self = this;
      Papa.parse('directoryexport16.csv', {
        download: true,
        header: true,
        complete: function complete(results) {
          self.processCSVDataToSplitDateAndTime(results.data);
          self.setMarkersForMobileLibraries();
          self.addControlLayers();
        },
      });
    },

    processCSVDataToSplitDateAndTime(data) {
      const processedData = [];
      data.forEach((library) => {
        let processed = {};
        processed = JSON.parse(JSON.stringify(library));
        const dayAndTime = library['Day and time'];
        if (dayAndTime) {
          this.regexDayOfTheWeek.forEach((expression, index) => {
            if (expression.test(dayAndTime)) {
              processed.Day = this.dayOfTheWeek[index];
            }
          });
          processedData.push(processed);
        }
      });

      this.layers = processedData;
    },

    setMarkersForMobileLibraries() {
      this.mobileLibraries = this.getMarkersFromObjectGroupOrderedByWeekDay(
        _.groupBy(this.layers, 'Day'),
      );
    },

    getMarkersFromObjectGroupOrderedByWeekDay(layers) {
      const markers = {};

      _.keys(layers).forEach((key) => {
        const values = [];
        layers[key].forEach((el) => {
          if (el.Location) {
            values.push(this.generateMarker(el));
          }
        });
        markers[key] = values;
      });

      return this.orderObjectByWeekDay(markers);
    },

    generateMarker(el) {
      let popup = el.Name;
      const address = el.Address;
      if (address) {
        if (address.includes(popup)) {
          popup = address;
        } else {
          popup = `${popup}<br> ${address}`;
        }
      }
      popup = `${popup} <br> ${el['Day and time']}`;
      // eslint-disable-next-line
      return L.marker(el.Location.split(",")).bindPopup(popup);
    },

    orderObjectByWeekDay(objectToOrder) {
      const orderedObject = {};

      this.dayOfTheWeek.forEach((dayOfWeek) => {
        orderedObject[dayOfWeek] = objectToOrder[dayOfWeek];
      });

      return orderedObject;
    },

    setCurrentLocation() {
      const pulsingIcon = L.icon.pulse({ iconSize: [8, 8], color: 'red' });
      navigator.geolocation.getCurrentPosition((position) => {
        L.marker([position.coords.latitude, position.coords.longitude], {
          icon: pulsingIcon,
        }).addTo(this.map);
      });
    },
  },
};
</script>

<style>
/* @import "leaflet/dist/leaflet.css"; */

/* @import "leaflet.markercluster/dist/MarkerCluster.css";
@import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
@import 'leaflet-fullscreen/dist/Leaflet.fullscreen'; */

body {
  padding: 0;
  margin: 0;
}
html,
body,
#leaflet-map {
  height: 100%;
  width: 100vw;
}
</style>
