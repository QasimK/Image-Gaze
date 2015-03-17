/*
Control display of the panel that shows the image
*/
"use strict";

exports.show = show;
exports.hide = hide;
exports.setImage = setImage;
exports.moveTo = moveTo;

const timers = require('sdk/timers');
const panel = require("sdk/panel");

const jQuery = "./jquery-2.1.1.min.js";


var UPDATE_INTERVAL = 1000/60; //Possibility of changing fps (to refresh rate?)

var panelStoredImageWidth = null;
var panelStoredImageHeight = null;

// panel is relative to web page view port
// mouseScreen is relative to the physical monitor
var panelX = null; // "clientX"
var panelY = null;
var mouseScreenX = null; // "screenX"
var mouseScreenY = null;

// clientX is affected by DPI (ie. At 200% the value is half of "actual" value)
var pageZoom = null;

// Available space on desktop:
var availLeft = null;
var availTop = null;
var availWidth = null;
var availHeight = null;

var showTimerID = null;
var updateTimerID = null;

// Which panel positioning function to use:
var panelPositioningFunc = getCornerPositioning;

var imagePanel = panel.Panel({
  contentURL: "./panel.html",
  contentScriptFile: [jQuery, "./panel.js"]
});


// Called for loading, popup and error images:
imagePanel.port.on("requestResize",
  function(imgWidth, imgHeight, screenLeft, screenTop, screenWidth, screenHeight) {
    panelStoredImageWidth = imgWidth;
    panelStoredImageHeight = imgHeight;
    availLeft = screenLeft;
    availTop = screenTop;
    availWidth = screenWidth;
    availHeight = screenHeight;
    
    var dim = panelPositioningFunc();
    imagePanel.resize(dim.width, dim.height);
  }
);


// --EXPORTS--

function setImage(url) {
  imagePanel.port.emit("setImageURL", url);
}

function show(clientX, clientY, screenX, screenY, zoom, delay) {
  panelX = clientX;
  panelY = clientY;
  mouseScreenX = screenX;
  mouseScreenY = screenY;
  pageZoom = zoom;
  
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

function moveTo(clientX, clientY, screenX, screenY, zoom) {
  if (clientX !== panelX || clientY !== panelY || screenX !== mouseScreenX ||
       screenY !== mouseScreenY || pageZoom !== zoom) {
    panelX = clientX;
    panelY = clientY;
    mouseScreenX = screenX;
    mouseScreenY = screenY;
    pageZoom = zoom;
    
    if (!updateTimerID) {
      updateTimerID = timers.setTimeout(timedUpdatePanelPosition, UPDATE_INTERVAL);
    }
  }
}

// --END EXPORTS--

function showPanel() {
  imagePanel.show(panelPositioningFunc());
}

function timedUpdatePanelPosition() {
  updateTimerID = null;
  if (imagePanel.isShowing) {
    // TODO: Missing functionality in SDK - so instead, flickering by hide/show
    imagePanel.hide();
    imagePanel.show(panelPositioningFunc());
  }
}

function getCornerPositioning() {
  // Return best corner positioning for the panel
  //{ position: { left:#, top:#}, width:#, height:# }
  
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
  
  // MAGIC: 5px padding
  var innerW = panelStoredImageWidth + 10;
  var innerH = panelStoredImageHeight + 10
  
  var brScaling = getScaling(innerW, innerH,
                             availWidth - mouseScreenX - MOUSE_OFFSET,
                             availHeight - mouseScreenY - MOUSE_OFFSET);
  var trScaling = getScaling(innerW, innerH,
                             availWidth - mouseScreenX + MOUSE_OFFSET,
                             mouseScreenY - MOUSE_OFFSET);
  var tlScaling = getScaling(innerW, innerH,
                             mouseScreenX - MOUSE_OFFSET,
                             mouseScreenY - MOUSE_OFFSET);
  var blScaling = getScaling(innerW, innerH,
                             mouseScreenX - MOUSE_OFFSET,
                             availHeight - mouseScreenY - MOUSE_OFFSET);
  
  // Select corner giving largest scaling
  var largestScaling = Math.max(brScaling, trScaling, tlScaling, blScaling);
  
  var fWidth = largestScaling * panelStoredImageWidth;
  var fHeight = largestScaling * panelStoredImageHeight;
  
  var fLeft = panelX;
  var fTop = panelY;
  if (largestScaling === brScaling) {
    fLeft += MOUSE_OFFSET;
    fTop += MOUSE_OFFSET;
  } else if (largestScaling === trScaling) {
    fLeft += MOUSE_OFFSET;
    fTop -= MOUSE_OFFSET + fHeight;
  } else if (largestScaling === tlScaling) {
    fLeft -= MOUSE_OFFSET + fWidth;
    fTop -= MOUSE_OFFSET + fHeight;
  } else if (largestScaling === blScaling) {
    fLeft -= MOUSE_OFFSET + fWidth;
    fTop += MOUSE_OFFSET;
  }
  fLeft *= pageZoom;
  fTop *= pageZoom;
  
  return {
    position: {
      left: fLeft,
      top: fTop
    },
    width: fWidth,
    height: fHeight
  };
}
