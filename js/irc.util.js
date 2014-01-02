if (typeof(IRC) == 'undefined') var IRC = {};

IRC.Util = {};
IRC.Util.toColorClass = function(str) {
  return 'color' + (parseInt(str.toLowerCase().replace(/[^a-z0-9]/g, ''), 36) % 27);
};
IRC.Util.appendMessage = function(container, message) {
  var lineElm = $('<div></div>')
    .addClass('line')
    .addClass(message.command.toLowerCase())
    .appendTo(container);
  var senderElm = $('<span></span>')
    .addClass('sender')
    .addClass(IRC.Util.toColorClass(message.sender))
    .text(message.sender)
    .appendTo(lineElm);
  var textElm = $('<span></span>')
    .addClass('text')
    .appendTo(lineElm);
  var timeElm = $('<span></span>')
    .addClass('timestamp')
    .text(message.timestamp.hm())
    .appendTo(lineElm);

  message = message.text.substring(1).replace('<', '&lt;');
  while (true) {
    if (message.match(/https?:\/\/([-a-zA-Z0-9_\.\/%=&?:;#]+)/)) {
      var leftContext = RegExp.leftContext;
      var url = RegExp.lastMatch;
      var rightContext = RegExp.rightContext;
      if (url.match(/\.(jpeg|jpg|png|gif)/i)) {
        var label = url;
        if (20 < label.length) label = label.substring(0, 20) + '...';
        textElm
          .append(leftContext)
          .append('<a href="' + url + '" target="_blank">' + label + '</a>')
          .append('<br/>');
        var iframe = $('<iframe></iframe>')
          .attr('src', 'image.html')
          .appendTo(textElm);
        setTimeout(function() {
          iframe.get(0).contentWindow.postMessage({
            src:url,
            alt:url,
            title:url
          }, '*');
        });
      }
      else {
        textElm
          .append(leftContext)
          .append('<a href="' + url + '" target="_blank">' + url + '</a>');
      }
      message = rightContext;
    }
    else {
      break;
    }
  }
  textElm.append(message);
  container.scrollTop(container.get(0).scrollHeight);
  return container;
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
