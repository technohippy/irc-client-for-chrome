if (typeof(IRC) == 'undefined') var IRC = {};

IRC.Util = {};
IRC.Util.messageToHTML = function(message) {
  return '<div class="line"><span class="sender">' + message.sender + '</span>' + 
    '<span class="text">' + message.text + '</span>' +
    '<span class="timestamp">' + message.timestamp.hm() + '</span></div>';
};
IRC.Util.isBlank = function(val) {
  return val == null || val == '';
};
