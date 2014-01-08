if (typeof(IRC) == 'undefined' || !IRC.App) throw 'load error';

IRC.VERSION = chrome.runtime.getManifest()['version'];

var ircApp;
window.addEventListener('load', function(evt) {
  //IRC.Settings.clearAllStorage();
  //IRC.Settings.setupTestData();
  
  IRC.App.MENU = new IRC.App.Menu();
  ircApp = IRC.App.start();
});
/*
window.addEventListener('unload', function(evt) {
  ircApp.server.disconnect();
});
*/
