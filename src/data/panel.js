/*
Set image on the panel
*/
"use strict";

var loadingImg = $("#loading-image");
var errorImg = $("#error-image");
var popupImg = $("#popup-image");

self.port.on("setErrorImg", function() {
  $("img").removeClass("visible");
  errorImg.addClass("visible");
});

self.port.on("setImageURL", function(url) {
  var s = window.screen;
  self.port.emit("requestResize", loadingImg[0].naturalWidth,
                  loadingImg[0].naturalHeight,
                  s.availLeft, s.availTop, s.availWidth, s.availHeight,
                  window.screenX, window.screenY);
  $("img").removeClass("visible");
  loadingImg.addClass("visible");
  popupImg.attr("src", url);
});

popupImg.load(function() {
  var s = window.screen;
  self.port.emit("requestResize", popupImg[0].naturalWidth,
                  popupImg[0].naturalHeight,
                  s.availLeft, s.availTop, s.availWidth, s.availHeight,
                  window.screenX, window.screenY);
  $("img").removeClass("visible");
  popupImg.addClass("visible");
});

popupImg.error(function() {
  var s = window.screen;
  self.port.emit("requestResize", errorImg[0].naturalWidth,
                  errorImg[0].naturalHeight,
                  s.availLeft, s.availTop, s.availWidth, s.availHeight,
                  window.screenX, window.screenY);
  $("img").removeClass("visible");
  errorImg.addClass("visible");
});
