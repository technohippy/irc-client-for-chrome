if (typeof(IRC) == 'undefined' || !IRC.App) throw 'load error';

var ircApp;
var mouseMoving = null;
window.addEventListener('load', function(evt) {
  //IRC.Settings.clearAllStorage();
  //IRC.Settings.setupTestData();
  ircApp = IRC.App.start();

  $('.left-pane .horizontal-separator').mousedown(function(evt) {
    mouseMoving = 'left-pane';
  });
  $('.right-pane .horizontal-separator').mousedown(function(evt) {
    mouseMoving = 'right-pane';
  });
  $('.container .vertical-separator').mousedown(function(evt) {
    mouseMoving = 'container';
  });
  $('.container').mousemove(function(evt) {
    if (mouseMoving == null) return;

    if (mouseMoving == 'left-pane') {
      var height = parseInt($('.container').css('height'));
      $('.logs').css('height', (height - evt.pageY - 2) + 'px');
    }
    else if (mouseMoving == 'right-pane') {
      var height = parseInt($('.container').css('height'));
      $('.channels').css('height', (height - evt.pageY - 2) + 'px');
    }
    else if (mouseMoving == 'container') {
      var width = parseInt($('.container').css('width'));
      $('.right-pane').css('width', (width - evt.pageX - 1) + 'px');
    }
  });
  $('.container').mouseup(function(evt) {
    if (mouseMoving) {
      mouseMoving = null;
    }
  });
});
/*
window.addEventListener('unload', function(evt) {
  ircApp.server.disconnect();
});
*/
