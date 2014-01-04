chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('/html/window.html', {
    'width': 700,
    'height': 500,
  }, function(win) {
    win.onBoundsChanged.addListener(function() {
      var bounds = win.getBounds();
      var container = win.contentWindow.document.getElementsByClassName("container")[0];
      container.style.width = bounds.width + 'px';
      container.style.height = bounds.height + 'px';
    });
  });
});
