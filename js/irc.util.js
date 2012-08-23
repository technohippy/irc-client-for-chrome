if (typeof(IRC) == 'undefined') var IRC = {};

IRC.Util = {};
IRC.Util.toColorClass = function(str) {
  return 'color' + (parseInt(str.toLowerCase().replace(/[^a-z0-9]/g, ''), 36) % 8);
};
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
IRC.Util.toColorClass('$#$adkjfas=^');
  return '<div class="line ' + message.command.toLowerCase() + '">' +
    '<span class="sender ' + IRC.Util.toColorClass(message.sender) + '">' + 
    message.sender + '</span>' + 
    '<span class="text">' + htmlMessage + '</span>' +
    '<span class="timestamp">' + message.timestamp.hm() + '</span></div>';
};
IRC.Util.isBlank = function(val) {
  return val == null || val == '';
};
