/*
Attach mouse-enter and mouse-leave events on URLS.
Script is attached to each page.
*/
"use strict";

$("body").on("mouseenter", 'a', function(event) {
  var url = qualifyURL($(this).attr("href"));
  var cased_url = url.toLowerCase();
  //Last 4 and 5 sub-characters of the string
  var firstSub = url.substr(-4, 4);
  var secondSub = url.substr(-5, 5);
  
  if (firstSub == ".png" || firstSub == ".jpg" || firstSub == ".gif" ||
      firstSub == ".bmp" || secondSub == ".jpeg" || secondSub == ".gifv")
  {
    $(this).on("mousemove", function(event) {
      // client is relative to the web page
      // client is altered by zoom level (100% gives 50, 200% gives 25)
      // screen is relative to the physical monitor
      self.port.emit("mouseUpdate", event.clientX, event.clientY,
                      event.screenX, event.screenY, window.devicePixelRatio);
    });
    self.port.emit("loadImage", url);
    // 'showPanel' must come after 'loadImage' emit:
    self.port.emit("showPanel", event.clientx, event.clientY,
                    event.screenX, event.screenY, window.devicePixelRatio);
  }
});


$("body").on("mouseleave", 'a', function() {
  $(this).off("mousemove");
  self.port.emit("hidePanel");
});


function qualifyURL(url) {
  //Return the URL as an absolute URL (eg. if it is a relative URL)
	var a = document.createElement('a');
	a.href = url;
  var url = a.href
  a.href = null;
	return url;
}
