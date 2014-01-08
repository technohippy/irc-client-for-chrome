chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('/html/window.html', {
    'width': 700,
    'height': 500,
  });
});
