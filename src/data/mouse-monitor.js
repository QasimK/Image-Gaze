/*
Attach mouse-enter and mouse-leave events on URLS.
Script is attached to each page.
*/
"use strict";

$("body").on("mouseenter", 'a, img', function(event) {
  var $this = $(this);

  // use jQuery .find('> img')
  // (http://stackoverflow.com/questions/4444120/select-direct-child-of-this-in-jquery)
  // We are okay for now because the A event fires *after* the IMG event

  var isImageVisible; // Is it a link or an actual image on the page?
  var rawUrl;
  if ($this[0].tagName == "A") {
    isImageVisible = false;
    rawUrl = $this.attr("href");
    console.log("a");
  } else if ($this[0].tagName == "IMG") {
    isImageVisible = true;
    rawUrl = $this.attr("src");
    console.log("img");
  }

  var url = qualifyURL(rawUrl);

  var cased_url = url.toLowerCase();
  //Last 4 and 5 sub-characters of the string
  var firstSub = url.substr(-4, 4);
  var secondSub = url.substr(-5, 5);
  
  if (firstSub == ".png" || firstSub == ".jpg" || firstSub == ".gif" ||
      firstSub == ".bmp" || secondSub == ".jpeg" || secondSub == ".gifv")
  {
    var imgWidth, imgHeight;
    if(isImageVisible) {
      imgWidth = $(this).width(); // This is the size regardless of page zoom
      imgHeight = $(this).height();
    }
    
    $(this).on("mousemove", function(event) {
      // client is relative to the web page
      // client is altered by zoom level (100% gives 50, 200% gives 25)
      // screen is relative to the physical monitor
      self.port.emit("mouseUpdate", event.clientX, event.clientY,
                      event.screenX, event.screenY, window.devicePixelRatio);
    });
    
    self.port.emit("loadImage", url, isImageVisible, imgWidth, imgHeight);
    // 'showPanel' must come after 'loadImage' emit:
    self.port.emit("showPanel", event.clientx, event.clientY,
                    event.screenX, event.screenY, window.devicePixelRatio);
  }
});


$("body").on("mouseleave", 'a, img', function() {
  $(this).off("mousemove");
  self.port.emit("hidePanel");
});


function qualifyURL(url) {
  //Return the URL as an absolute URL (eg. if it is a relative URL)
  var a = document.createElement('a');
  a.href = url;
  var qualifiedUrl = a.href
  a.href = null; // Just to be certain of no memory leaks
  return qualifiedUrl;
}
