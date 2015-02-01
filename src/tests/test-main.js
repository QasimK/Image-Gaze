"use strict";

var tabs = require("sdk/tabs");
var main = require("./main");

// Put all tests together so tabs open all at once
exports["test link hover"] = function(assert, done) {
  const NUM_PAGES = 3;
  var num_closed = 0;
  var doneTest = function(doneMsg) {
    assert.pass(doneMsg);
    num_closed += 1;
    if(num_closed == NUM_PAGES) {
      done();
    }
  };
  
  tabs.open({
    url: "./tests/test-link-hover.html",
    onClose: function(tab) {
      doneTest("Test link hover: DONE");
    }
  });
  
  tabs.open({
    url: "./tests/test-smooth-mouse.html",
    onClose: function(tab) {
      doneTest("Test smooth mouse: DONE");
    }
  });
  
  tabs.open({
    url: "./tests/test-image-hover.html",
    onClose: function(tab) {
      doneTest("Test image hover: DONE");
    }
  });
};

require("sdk/test").run(exports);
