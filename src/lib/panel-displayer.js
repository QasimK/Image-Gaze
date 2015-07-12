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
const viewCore = require("sdk/view/core");

const jQuery = "./jquery-2.1.1.min.js";


var UPDATE_INTERVAL = 1000/60; //Possibility of changing fps (to refresh rate?)

// Various information about the image
var isImageVisible = null;
var imageWidth = null;  // If image is visible this is the image information
var imageHeight = null;
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

var isRequestedShowing = false; // Has main.js sent events so that the panel should be shown?
var requestedShowingDelay = null;

// Which panel positioning function to use:
var panelPositioningFunc = getCornerPositioning;

var imagePanel = panel.Panel({
  contentURL: "./panel.html",
  contentScriptFile: [jQuery, "./panel.js"]
});
var xulPanel = viewCore.getActiveView(imagePanel); // Low level view of imagePanel


// Called for loading, popup and error images:
imagePanel.port.on("requestResize",
  function(imgWidth, imgHeight, screenLeft, screenTop, screenWidth, screenHeight) {
    panelStoredImageWidth = imgWidth;
    panelStoredImageHeight = imgHeight;
    availLeft = screenLeft;
    availTop = screenTop;
    availWidth = screenWidth;
    availHeight = screenHeight;
    
    if (isRequestedShowing) {
      showPanel();
    }
  }
);


// --EXPORTS--

function setImage(url, isImgVisible, imgWidth, imgHeight) {
  imagePanel.port.emit("setImageURL", url);
  isImageVisible = isImgVisible;
  imageWidth = imgWidth;
  imageHeight = imgHeight;
}

function show(clientX, clientY, screenX, screenY, zoom, delay) {
  panelX = clientX;
  panelY = clientY;
  mouseScreenX = screenX;
  mouseScreenY = screenY;
  pageZoom = zoom;
  
  isRequestedShowing = true;

  if (delay) {
    showTimerID = timers.setTimeout(showPanel, delay);
  } else {
    isRequestedShowing = true;
  }
}

function hide() {
  imagePanel.hide();
  timers.clearTimeout(updateTimerID);
  updateTimerID = null;
  timers.clearTimeout(showTimerID);
  showTimerID = null;
  isRequestedShowing = false;
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

function requestShowing() {
  isRequestedShowing = true;
}

function showPanel() {
  // Make the panel visible

  var position = panelPositioningFunc();
  if (isPanelVisibilityAllowed(position)) {
    imagePanel.show(position);
    positionPanel(position.mPosition.left, position.mPosition.top,
                  position.width, position.height);
  }
}


function timedUpdatePanelPosition() {
  updateTimerID = null;
  if (imagePanel.isShowing) {
    var position = panelPositioningFunc();
    positionPanel(position.mPosition.left, position.mPosition.top,
                  position.width, position.height);
  }
}


function isPanelVisibilityAllowed(position) {
  // No if panel is smaller than the visible image
  if (isImageVisible &&
      (position.width <= imageWidth * pageZoom &&
       position.height <= imageHeight * pageZoom)) {

    return false;
  }

  return true;
}


function positionPanel(left, top, width, height) {
  // Move (optional) & resize (optional) the panel
  // left and top MUST be coordinates relative to the screen

  xulPanel.moveTo(left, top);
  imagePanel.resize(width, height);
}


function getCornerPositioning() {
  // Return best corner positioning for the panel
  //{ position: { left:#, top:#}, width:#, height:#, mPosition { left:#, top:#} }
  // mPosition is relative to the monitor
  
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
                             availWidth - mouseScreenX - MOUSE_OFFSET,
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
  
  var pLeft = panelX * pageZoom;
  var pTop = panelY * pageZoom;
  var mLeft = mouseScreenX;
  var mTop = mouseScreenY;

  var adjustLeft, adjustTop;
  if (largestScaling === brScaling) {
    adjustLeft = MOUSE_OFFSET;
    adjustTop = MOUSE_OFFSET;
  } else if (largestScaling === trScaling) {
    adjustLeft = MOUSE_OFFSET;
    adjustTop = -(MOUSE_OFFSET + fHeight);
  } else if (largestScaling === tlScaling) {
    adjustLeft = -(MOUSE_OFFSET + fWidth);
    adjustTop = -(MOUSE_OFFSET + fHeight);
  } else if (largestScaling === blScaling) {
    adjustLeft = -(MOUSE_OFFSET + fWidth);
    adjustTop = MOUSE_OFFSET;
  }

  pLeft += adjustLeft;
  pTop += adjustTop;
  mLeft += adjustLeft;
  mTop += adjustTop;
  
  return {
    position: {
      left: pLeft,
      top: pTop
    },
    width: fWidth,
    height: fHeight,
    mPosition: {
      left: mLeft,
      top: mTop
    }
  };
}
