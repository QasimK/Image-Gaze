"use strict";

const self = require("sdk/self");
const pageMod = require("sdk/page-mod");
const preferences = require("sdk/simple-prefs");
const storage = require("sdk/simple-storage");
const advancedPreferences = require("sdk/preferences/service");

const jQuery = "./jquery-2.1.1.min.js";

const panelDisplayer = require("./panel-displayer");

// Mark 'syncBlob' as synchronisable
const SYNC_BLOB_NAME = "services.sync.prefs.sync.extensions." + self.id +
                      ".syncBlob";
advancedPreferences.set(SYNC_BLOB_NAME, true);

// Initialise storage of preferences
if (!storage.storage.panelDelay) {
  storage.storage.panelDelay = preferences.prefs['panelDelay'];
}
var prefPanelDelay = storage.storage.panelDelay;

// Handle preferences being altered through FireFox UI
preferences.on("panelDelay", function(prefName) {
  if (prefName == 'panelDelay') {
    prefPanelDelay = preferences.prefs['panelDelay'];
    // Write to storage
    storage.storage.panelDelay = prefPanelDelay;
    // Update sync blob
    preferences.prefs["syncBlob"] = JSON.stringify(storage.storage);
  }
});

// Handle preferences syncBlob being altered
preferences.on("syncBlob", function(prefName) {
  if (prefName == 'syncBlob') {
    storage.storage = JSON.parse(preferences.prefs["syncBlob"]);
    prefPanelDelay = storage.storage.panelDelay;
    preferences.prefs['panelDelay'] = prefPanelDelay;
  }
});

var workers = [];
function detachWorker(worker, workerArray) {
  var index = workerArray.indexOf(worker);
  if (index != -1) {
    workerArray.splice(index, 1);
  }
}

pageMod.PageMod({
  include: ["*", "file://*"],
  contentScriptFile: [jQuery, "./mouse-monitor.js"],
  attachTo: ["existing", "top", "frame"],
  onAttach: function(worker) {
    workers.push(worker);
    worker.on('detach', function() {
      detachWorker(this, workers);
    });

    worker.port.on("loadImage", function(url) {
      panelDisplayer.setImage(url);
    });
    worker.port.on("showPanel", function(clientX, clientY, screenX, screenY) {
      panelDisplayer.show(clientX, clientY, screenX, screenY, prefPanelDelay);
    });
    worker.port.on("hidePanel", function() {
      panelDisplayer.hide();
    });
    worker.port.on("mouseUpdate", function(clientX, clientY, screenX, screenY) {
      panelDisplayer.moveTo(clientX, clientY, screenX, screenY);
    });
  }
});
