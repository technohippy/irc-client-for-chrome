if (typeof(IRC) == 'undefined') var IRC = {};

IRC.Util = {};
IRC.Util.toColorClass = function(str) {
  return 'color' + (parseInt(str.toLowerCase().replace(/[^a-z0-9]/g, ''), 36) % 27);
};
IRC.Util.messageToElement = function(message) {
  var container = document.createElement('div');
  container.className = message.command.toLowerCase();
  var sender = document.createElement('span');
  sender.classList.add('sender');
  sender.classList.add(IRC.Util.toColorClass(message.sender));
  sender.appendChild(document.createTextNode(message.sender));
  var text = document.createElement('span');
  text.classList.add('text');
  var timestamp = document.createElement('span');
  timestamp.classList.add('timestamp');
  timestamp.appendChild(document.createTextNode(message.timestamp.hm()));
  container.appendChild(sender);
  container.appendChild(text);
  container.appendChild(timestamp);
  return container;
};
IRC.Util.messageToHTML = function(message) {
  var imageTags = '';
  var htmlMessage = message.text.substring(1).replace('<', '&lt;');
  htmlMessage = htmlMessage.replace(
    /https?:\/\/([-a-zA-Z0-9_\.\/%=&?:;#]+)/, 
    function(url, text) {
      if (url.match(/\.(jpeg|jpg|png|gif)/i)) {
        imageTags += '<br/><a href="' + url + '" target="_blank" title="' + url + '">' + 
          '<img src="' + url + '"></a><br/>';
      }
      if (20 < text.length) text = text.substring(0, 20) + '...';
      return '<a href="' + url + '" target="_blank" title="' + url + '">' + 
        text + '</a>';
    });
  return '<div class="line ' + message.command.toLowerCase() + '">' +
    '<span class="sender ' + IRC.Util.toColorClass(message.sender) + '">' + 
    message.sender + '</span>' + 
    '<span class="text">' + htmlMessage + imageTags + '</span>' +
    '<span class="timestamp">' + message.timestamp.hm() + '</span></div>';
};
IRC.Util.isBlank = function(val) {
  return val == null || val == '';
};

Date.prototype.ymdhm = function() {
  function fillZero(n) {return (n < 10 ? '0' : '') + n}
  var year = this.getFullYear();
  var month = this.getMonth() + 1;
  var date = this.getDate();
  var hours = this.getHours();
  var minutes = this.getMinutes();
  return '' + year + '-' + fillZero(month) + '-' + fillZero(date) + 
    ' ' + fillZero(hours) + ':' + fillZero(minutes);
};

Date.prototype.hm = function() {
  function fillZero(n) {return (n < 10 ? '0' : '') + n}
  var hours = this.getHours();
  var minutes = this.getMinutes();
  return '' + fillZero(hours) + ':' + fillZero(minutes);
};
