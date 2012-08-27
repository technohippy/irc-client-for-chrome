if (typeof(IRC) == 'undefined' || !IRC.App) throw 'load error';

var ircApp;
window.addEventListener('load', function(evt) {
  //IRC.Settings.clearAllStorage();
  //IRC.Settings.setupTestData();
  ircApp = IRC.App.start();
});
/*
window.addEventListener('unload', function(evt) {
  ircApp.server.disconnect();
});
*/
