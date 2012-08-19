chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'width': 700,
    'height': 500
  });
});
