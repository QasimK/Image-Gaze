"use strict";

var pageMod = require("sdk/page-mod");
var jQuery = "./jquery-2.1.1.min.js";
var panelDisplayer = require("./panel-displayer");
var preferences = require("sdk/simple-prefs");

var prefPanelDelay = preferences.prefs['panelDelay'];
preferences.on("panelDelay", function(prefName) {
  if (prefName == 'panelDelay') {
    prefPanelDelay = preferences.prefs['panelDelay'];
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
    worker.port.on("showPanel", function(x, y) {
      panelDisplayer.show(x, y, prefPanelDelay);
    });
    worker.port.on("hidePanel", function() {
      panelDisplayer.hide();
    });
    worker.port.on("mouseUpdate", function(x, y) {
      panelDisplayer.moveTo(x, y);
    });
  }
});
