if (typeof(IRC) == 'undefined') var IRC = {};

Date.prototype.ymdhm = function() {
  function fillZero(n) {return (n < 10 ? '0' : '') + n}
  var year = this.getFullYear();
  var month = this.getMonth() + 1;
  var day = this.getDay();
  var hours = this.getHours();
  var minutes = this.getMinutes();
  return '' + year + '-' + fillZero(month) + '-' + fillZero(day) + 
    ' ' + fillZero(hours) + ':' + fillZero(minutes);
};

Date.prototype.hm = function() {
  function fillZero(n) {return (n < 10 ? '0' : '') + n}
  var hours = this.getHours();
  var minutes = this.getMinutes();
  return '' + fillZero(hours) + ':' + fillZero(minutes);
};

IRC.Message = function() {
  this.timestamp = new Date();
  var firstIndex = 0;
  var first = arguments[firstIndex++];
  if (first === null || first == '' ||  first.match(/^:/)) {
    this.prefix = first;
    this.command = arguments[firstIndex++];
  }
  else {
    this.prefix = null;
    this.command = first;
  }
  if (arguments[firstIndex] instanceof Array) {
    this.params = arguments[firstIndex++];
  }
  else {
    this.params = [];
    for (var i = 0; i + firstIndex < arguments.length; i++) {
      this.params.push(arguments[i + firstIndex]);
    }
  }
};
IRC.Message.parse = function(str) {
  if (str.match(/(:[^ ]+ +)?([a-zA-Z]+|\d{3})([^:]*)(:.+)?$/)) {
    var prefix = RegExp.$1.trim();
    var command = RegExp.$2;
    var lastParam = RegExp.$4;
    var paramsWithSpace = RegExp.$3.split(/ +/);
/*
  if (str.match(/((:[^ ]+) +)?([a-zA-Z]+|\d{3})([^:]*)(:.+)?$/)) {
    var prefix = RegExp.$2;
    var command = RegExp.$3;
    var lastParam = RegExp.$5;
    var paramsWithSpace = RegExp.$4.split(/ +/);
*/
    var params = [];
    for (var i = 0; i < paramsWithSpace.length; i++) {
      var param = paramsWithSpace[i];
      if (param != '') params.push(param);
    }
    if (lastParam) params.push(lastParam);
    return new IRC.Message(prefix, command, params);
  }
  else {
    return null;
  }
};
IRC.Message.prototype.interprete = function() {
  if (this.command == 'PRIVMSG') {
    this.sender = this.prefix.split('!')[0].substring(1);
    this.channelName = this.params[this.params.length - 2];
    this.text = this.params[this.params.length - 1];
  }
  else if (this.command == 'NOTICE') {
    this.text = this.params[this.params.length - 1];
  }
  else if (this.command == 'PART') {
    this.sender = this.prefix.split('!')[0].substring(1);
    this.channelName = this.params[0];
    this.text = this.params[1];
  }
  else if (this.command == 'JOIN') {
    this.sender = this.prefix.split('!')[0].substring(1);
    this.channelName = this.params[0];
  }
};
IRC.Message.prototype.copy = function() {
  return new IRC.Message(this.prefix, this.command, this.params.slice(0));
};
IRC.Message.prototype.toString = function() {
  var ret = '';
  if (this.prefix) ret += this.prefix + ' ';
  ret += this.command;
  if (0 < this.params.length) {
    ret += ' ' + this.params.join(' ');
  }
  ret += '\r\n';
  return ret;
};
