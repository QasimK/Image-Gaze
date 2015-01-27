/*
Control display of the panel that shows the image
*/
"use strict";

exports.show = show;
exports.hide = hide;
exports.setImage = setImage;
exports.moveTo = moveTo;

var timers = require('sdk/timers');
var panel = require("sdk/panel");
var jQuery = "./jquery-2.1.1.min.js";

var UPDATE_INTERVAL = 1000/60; //Possibility of changing frame-rate (auto?)

var panelStoredX = null;
var panelStoredY = null;
var panelStoredImageWidth = 0;
var panelStoredImageHeight = 0;
var loadingImgWidth = null;
var loadingImgHeight = null;
var timerID = null;

var showTimerID = null;

var imagePanel = panel.Panel({
  contentURL: "./panel.html",
  contentScriptFile: [jQuery, "./panel.js"]
});

//This is called immediately after above panel is loaded
imagePanel.port.on("specifyLoadingImgDimensions", function(width, height) {
  loadingImgWidth = width;
  loadingImgHeight = height;
  imagePanel.resize(width, height);
});

//Called when popup Image (or error image) is ready
imagePanel.port.on("requestResize", function(width, height) {
  panelStoredImageWidth = width;
  panelStoredImageHeight = height;
  imagePanel.resize(width, height);
});

function show(x, y) {
  panelStoredX = x;
  panelStoredY = y;
  //Delay makes sure there is enough time to set loading image panel size
  showTimerID = timers.setTimeout(function() {
    imagePanel.show(getPanelDimensions());
  }, UPDATE_INTERVAL);
}

function hide() {
  imagePanel.hide();
  timers.clearTimeout(timerID);
  timerID = null;
  timers.clearTimeout(showTimerID);
  showTimerID = null
}

function moveTo(x, y) {
  if (x !== panelStoredX || y !== panelStoredY) {
    panelStoredX = x;
    panelStoredY = y;
    if (!timerID) {
      timerID = timers.setTimeout(timedUpdatePanelPosition, UPDATE_INTERVAL);
    }
  }
}

function setImage(url) {
  panelStoredImageWidth = loadingImgWidth;
  panelStoredImageHeight = loadingImgHeight;
  imagePanel.port.emit("setImageURL", url);
}


function getPanelDimensions(corner) {
  //Return { position: {left, top, right, bottom} } based corner
  return {
    position: {
      left: panelStoredX + 20,
      top: panelStoredY + 20
    },
    width: panelStoredImageWidth,
    height: panelStoredImageHeight
  };
}

function updatePanelDimensions() {
  imagePanel.hide();
  imagePanel.show(getPanelDimensions());
}

function timedUpdatePanelPosition() {
  timerID = null;
  imagePanel.hide();
  //TODO: Bug in SDK - panel flickers
  //var dim = getPanelDimensions()["position"]
  //imagePanel.sizeTo(dim["left"], dim["top"]);
  imagePanel.show(getPanelDimensions());
}
