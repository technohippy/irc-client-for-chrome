chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'width': 700,
    'minWidth': 700,
    'maxWidth': 700,
    'height': 500,
    'minHeight': 500,
    'maxHeight': 500
  });
});
