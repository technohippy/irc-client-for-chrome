if (typeof(IRC) == 'undefined') var IRC = {};

IRC.Util = {};
IRC.Util.messageToHTML = function(message) {
  var htmlMessage = message.text.replace('<', '&lt;');
  //htmlMessage = htmlMessage.replace(/https?:\/\/[a-zA-Z0-9_\.\/%]+/, '<a href="\\&" target="_blank">\\&</a>');
  //htmlMessage += '<a href="http://google.com" target="_blank">google</a>';
  return '<div class="line"><span class="sender">' + message.sender + '</span>' + 
    '<span class="text">' + htmlMessage + '</span>' +
    '<span class="timestamp">' + message.timestamp.hm() + '</span></div>';
};
IRC.Util.isBlank = function(val) {
  return val == null || val == '';
};
