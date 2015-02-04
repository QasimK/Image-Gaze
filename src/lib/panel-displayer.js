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

var UPDATE_INTERVAL = 1000/60; //Possibility of changing fps (to refresh rate?)

var panelStoredImageWidth = null;
var panelStoredImageHeight = null;

// panel is relative to web page view port
// mouseScreen is relative to the physical monitor
var panelX = null; // "clientX"
var panelY = null;
var mouseScreenX = null; // "screenX"
var mouseScreenY = null;

//Desktop available space:
var availLeft = null;
var availTop = null;
var availWidth = null;
var availHeight = null;

var showTimerID = null;
var updateTimerID = null;

var imagePanel = panel.Panel({
  contentURL: "./panel.html",
  contentScriptFile: [jQuery, "./panel.js"]
});


//Todo: Pass in desktop resolution available space...
//Called when popup Image (or error image) is ready
imagePanel.port.on("requestResize",
  function(imgWidth, imgHeight, screenLeft, screenTop, screenWidth, screenHeight) {
    panelStoredImageWidth = imgWidth;
    panelStoredImageHeight = imgHeight;
    availLeft = screenLeft;
    availTop = screenTop;
    availWidth = screenWidth;
    availHeight = screenHeight;
    
    var dim = getPanelDimensions();
    imagePanel.resize(dim.width, dim.height);
  }
);


//EXPORTS

function setImage(url) {
  imagePanel.port.emit("setImageURL", url);
}

function show(clientX, clientY, screenX, screenY, delay) {
  panelX = clientX;
  panelY = clientY;
  mouseScreenX = screenX;
  mouseScreenY = screenY;
  
  //If delay is undefined, null, zero or less than UPDATE_INTERVAL
  //There is a minimum delay to ensure 'specifyLoadingImgDimensions' is sent
  if (!delay || delay < UPDATE_INTERVAL) {
    delay = UPDATE_INTERVAL;
  }
  showTimerID = timers.setTimeout(showPanel, delay);
}

function hide() {
  imagePanel.hide();
  timers.clearTimeout(updateTimerID);
  updateTimerID = null;
  timers.clearTimeout(showTimerID);
  showTimerID = null
}

function moveTo(clientX, clientY, screenX, screenY) {
  if (clientX !== panelX || clientY !== panelY || screenX !== mouseScreenX ||
       screenY !== mouseScreenY) {
    panelX = clientX;
    panelY = clientY;
    mouseScreenX = screenX;
    mouseScreenY = screenY;
    if (!updateTimerID) {
      updateTimerID = timers.setTimeout(timedUpdatePanelPosition, UPDATE_INTERVAL);
    }
  }
}

// END EXPROTS


//Not used
/*function updatePanelDimensions() {
  imagePanel.hide();
  imagePanel.show(getPanelDimensions());
}*/

function showPanel() {
  imagePanel.show(getPanelDimensions());
}

function timedUpdatePanelPosition() {
  updateTimerID = null;
  if (imagePanel.isShowing) {
    imagePanel.hide();
    //TODO: Bug in SDK - panel flickers
    //var dim = getPanelDimensions()["position"]
    //imagePanel.sizeTo(dim["left"], dim["top"]);
    imagePanel.show(getPanelDimensions());
  }
}

function getPanelDimensions() {
  // Return best location { position: { left:#, top:#}, width:#, height:# }
  // Currently only bottom-right
  
  const MOUSE_OFFSET = 20;
  
  function getScaling(innerWidth, innerHeight, outerWidth, outerHeight) {
    // Return scaling ratio fitting inner inside outer, keeping the aspect ratio
    if (outerWidth < 1 || outerHeight < 1)
      return 0;
    if (innerWidth > outerWidth || innerHeight > outerHeight)
    {
      var wScale, hScale;
      wScale = outerWidth/innerWidth;
      hScale = outerHeight/innerHeight;
      if (wScale < hScale)
        return wScale;
      else
        return hScale;
    }
    else
      return 1;
  }
  
  //For now: bottom-right
  var fLeft, fTop, fWidth, fHeight;
  fLeft = mouseScreenX + MOUSE_OFFSET;
  fTop = mouseScreenY + MOUSE_OFFSET;
  
  // There is 5px padding inside the panel in addition to the image
  var scaling = getScaling(panelStoredImageWidth+10, panelStoredImageHeight+10,
                            availWidth - fLeft, availHeight - fTop);
  
  fWidth = scaling * panelStoredImageWidth;
  fHeight = scaling * panelStoredImageHeight;
  
  return {
    position: {
      left: panelX + MOUSE_OFFSET,
      top: panelY + MOUSE_OFFSET
    },
    width: fWidth,
    height: fHeight
  };
}
