import Papa from 'papaparse';
import _ from 'lodash';
import L from 'leaflet';
import 'leaflet.featuregroup.subgroup';

// eslint-disable-next-line
// delete L.Icon.Default.prototype._getIconUrl;

// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: markerIcon2x,
//   iconUrl: markerIcon,
//   shadowUrl: markerShadow,
// });
const dayOfTheWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const regexDayOfTheWeek = [
  /mo[a-z]*/i,
  /tu[a-z]*/i,
  /we[a-z]*/i,
  /th[a-z]*/i,
  /fr[a-z]*/i,
];

class MobileLibraries {
  constructor(map) {
    this.map = map;
    this.loadMobileLibrariesIntoMap();
  }

  static loadMobileLibrariesIntoMap() {
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
  }

  static processCSVDataToSplitDateAndTime(data) {
    const processedData = [];
    data.forEach((library) => {
      let processed = {};
      processed = JSON.parse(JSON.stringify(library));
      const dayAndTime = library['Day and time'];
      if (dayAndTime) {
        regexDayOfTheWeek.forEach((expression, index) => {
          if (expression.test(dayAndTime)) {
            processed.Day = dayOfTheWeek[index];
          }
        });
        processedData.push(processed);
      }
    });

    this.layers = processedData;
  }

  static addControlLayers() {
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
  }

  static setMarkersForMobileLibraries() {
    this.mobileLibraries = this.getMarkersFromObjectGroupOrderedByWeekDay(
      _.groupBy(this.layers, 'Day'),
    );
  }

  static getMarkersFromObjectGroupOrderedByWeekDay(layers) {
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
  }

  static generateMarker(el) {
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
  }

  static orderObjectByWeekDay(objectToOrder) {
    const orderedObject = {};

    dayOfTheWeek.forEach((dayOfWeek) => {
      orderedObject[dayOfWeek] = objectToOrder[dayOfWeek];
    });

    return orderedObject;
  }
}
