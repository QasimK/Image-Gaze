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
  var img = loadingImg[0], s = window.screen;
  self.port.emit("requestResize", img.naturalWidth, img.naturalHeight,
                  s.availLeft, s.availTop, s.availWidth, s.availHeight);
  $("img").removeClass("visible");
  loadingImg.addClass("visible");
  popupImg.attr("src", url);
});

popupImg.load(function() {
  var img = popupImg[0], s = window.screen;
  self.port.emit("requestResize", img.naturalWidth, img.naturalHeight,
                  s.availLeft, s.availTop, s.availWidth, s.availHeight);
  $("img").removeClass("visible");
  popupImg.addClass("visible");
});

popupImg.error(function() {
  var img = errorImg[0], s = window.screen;
  self.port.emit("requestResize", img.naturalWidth, img.naturalHeight,
                  s.availLeft, s.availTop, s.availWidth, s.availHeight);
  $("img").removeClass("visible");
  errorImg.addClass("visible");
});
