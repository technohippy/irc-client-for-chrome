if (typeof(IRC) == 'undefined') var IRC = {};

IRC.Message = function() {
  if (arguments.length == 0) {
    this.timestamp = new Date();
    this.prefix = null;
    this.command = null;
    this.params = [];
    this.server = null;
    return;
  }

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
  this.server = null;
};
IRC.Message.parse = function(str, server) {
  if (str.match(/(:[^ ]+ +)?([a-zA-Z]+|\d{3})([^:]*)(:.+)?$/)) {
    var prefix = RegExp.$1.trim();
    var command = RegExp.$2;
    var lastParam = RegExp.$4;
    var paramsWithSpace = RegExp.$3.split(/ +/);
    var params = [];
    for (var i = 0; i < paramsWithSpace.length; i++) {
      var param = paramsWithSpace[i];
      if (param != '') params.push(param);
    }
    if (lastParam) params.push(lastParam);
    var message = new IRC.Message(prefix, command, params);
    message.server = server;
    return message;
  }
  else {
    return null;
  }
};
IRC.Message.prototype.interprete = function() {
  if (this.command == 'PRIVMSG' || this.command == 'NOTICE') {
    this.sender = this.prefix.split('!')[0].substring(1);
    this.channelName = this.params[this.params.length - 2];
    this.isToChannel = this.channelName.match(/^#/) != null;
    this.text = this.params[this.params.length - 1];
    if (this.server) this.fullChannelName = IRC.Channel.getFqn(this.server, this.channelName);
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
  //return new IRC.Message(this.prefix, this.command, this.params.slice(0));
  var copied = new IRC.Message();
  // TODO
  //for (var prop in this) copied[prop] = this[prop];
  copied.timestamp = this.timestamp;
  copied.prefix = this.prefix;
  copied.command = this.command;
  copied.params = this.params;
  copied.server = this.server;
  copied.sender = this.sender;
  copied.fullChannelName = this.fullChannelName;
  return copied;
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
IRC.Message.prototype.toJson = function() {
  var message = this.copy();
  message.interprete();
  message.server = null;
  return JSON.stringify(message);
};
IRC.Message.fromJson = function(json, server) {
  var message = JSON.parse(json);
  message.server = server;
  message.timestamp = new Date(Date.parse(message.timestamp));
  return message;
};
