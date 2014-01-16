'use strict';

var IRC;
if (typeof IRC === 'undefined' || !IRC.App) throw 'load error';

IRC.VERSION = chrome.runtime.getManifest().version;

var ircApp;
window.addEventListener('load', function() {
  //IRC.Settings.clearAllStorage();
  //IRC.Settings.setupTestData();
  
  ircApp = IRC.App.start();
});
/*
window.addEventListener('unload', function(evt) {
  ircApp.server.disconnect();
});
*/
