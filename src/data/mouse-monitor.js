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
      self.port.emit("mouseUpdate", event.clientX, event.clientY);
    });
    self.port.emit("loadImage", url);
    //This will eventually port.emit to the timer.js file who will do it:
    //must come after 'loadImage' emit:
    self.port.emit("showPanel", event.clientX, event.clientY); 
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
