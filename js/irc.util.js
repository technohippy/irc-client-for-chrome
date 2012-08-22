if (typeof(IRC) == 'undefined') var IRC = {};

IRC.Util = {};
IRC.Util.messageToHTML = function(message) {
  var htmlMessage = message.text.substring(1).replace('<', '&lt;');
  htmlMessage = htmlMessage.replace(
    /https?:\/\/([a-zA-Z0-9_\.\/%=&?]+)/, 
    function(url, text) {
      if (url.match(/\.(jpeg|jpg|png|gif)/i)) {
        return '<br/><a href="' + url + '" target="_blank" title="' + url + '">' + 
          '<img src="' + url + '"></a><br/>';
      }
      else {
        if (20 < text.length) text = text.substring(0, 20) + '...';
        return '<a href="' + url + '" target="_blank" title="' + url + '">' + 
          text + '</a>';
      }
    });
  return '<div class="line"><span class="sender">' + message.sender + '</span>' + 
    '<span class="text">' + htmlMessage + '</span>' +
    '<span class="timestamp">' + message.timestamp.hm() + '</span></div>';
};
IRC.Util.isBlank = function(val) {
  return val == null || val == '';
};
