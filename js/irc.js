if (typeof(IRC) == 'undefined' || !IRC.App) throw 'load error';

window.addEventListener('load', function(evt) {
  IRC.Settings.clearAllStorage();
  //IRC.Settings.setupTestData();
  IRC.App.start();
});
