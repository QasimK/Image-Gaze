/*
Set image on the panel
*/
"use strict";

var loadingImg = $("#loading-image");
var errorImg = $("#error-image");
var popupImg = $("#popup-image");

loadingImg.load(function() {
  self.port.emit("specifyLoadingImgDimensions", loadingImg[0].naturalWidth,
                  loadingImg[0].naturalHeight);
});

//self.port.on("setLoadingImg", function() {
//  $("img").removeClass("visible");
//  loadingImg.addClass("visible");
//  self.port.emit("requestResize", loadingImg[0].naturalWidth,
//                  loadingImg[0].naturalHeight);
//});

self.port.on("setErrorImg", function() {
  $("img").removeClass("visible");
  errorImg.addClass("visible");
});

self.port.on("setImageURL", function(url) {
  self.port.emit("requestResize", loadingImg[0].naturalWidth,
                  loadingImg[0].naturalHeight);
  $("img").removeClass("visible");
  loadingImg.addClass("visible");
  popupImg.attr("src", url);
});

popupImg.load(function() {
  self.port.emit("requestResize", popupImg[0].naturalWidth,
                  popupImg[0].naturalHeight);
  $("img").removeClass("visible");
  popupImg.addClass("visible");
});

popupImg.error(function() {
  self.port.emit("requestResize", errorImg[0].naturalWidth,
                  errorImg[0].naturalHeight);
  $("img").removeClass("visible");
  errorImg.addClass("visible");
});