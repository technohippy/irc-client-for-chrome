if (typeof(IRC) == 'undefined') var IRC = {};

IRC.Server = function(host, port, nick, user, pass, encoding) {
  this.host = host;
  this.port = port;
  this.nick = nick;
  this.user = user;
  this.pass = pass;
  this.encoding = encoding || 'utf-8';
  this.channels = {};
  this.tcpClient = null;
  this.reservedCommands = [];
  this.ready = false;
  this.replyListeners = [];
  this.memberListeners = [];
  this.channelListeners = [];
  this.closed = false;
}
IRC.Server.prototype.hasChannel = function(channelName) {
  return this.getChannel(channelName) != null;
};
IRC.Server.prototype.getChannel = function(channelName) {
  return this.channels[channelName];
};
IRC.Server.prototype.getAnyChannel = function() {
  for (var channelName in this.channels) {
    return this.getChannel(channelName);
  }
  return null;
};
IRC.Server.prototype.getOrCreateChannel = function(channelName) {
  if (this.hasChannel(channelName)) {
    return this.getChannel(channelName);
  }
  else {
    return this.addChannel(channelName);
  }
};
IRC.Server.prototype.addChannel = function(channel) {
  var channelName;
  if (typeof(channel) == 'string') {
    channelName = channel;
    channel = new IRC.Channel(this, channelName);
  }
  else {
    channel.server = this;
    channelName = channel.name;
  }
  this.channels[channelName] = channel;
  for (var i = 0; i < this.channelListeners.length; i++) {
    // TODO: オブジェクト以外を渡せるように
    //this.channelListeners[i](IRC.Events.CHANNEL_ADDED, channel);
    var data = {};
    data[channelName] = channel;
    this.channelListeners[i](IRC.Events.CHANNEL_ADDED, data);
  }
  return channel;
};
IRC.Server.prototype.removeChannel = function(channel) {
  var channelName;
  if (typeof(channel) == 'string') {
    channelName = channel;
    channel = this.channels[channelName];
  }
  else {
    channelName = channel.name;
  }
  delete this.channels[channelName];

  for (var i = 0; i < this.channelListeners.length; i++) {
    // TODO: オブジェクト以外を渡せるように
    //this.channelListeners[i](IRC.Events.CHANNEL_ADDED, channel);
    var data = {};
    data[channelName] = channel;
    this.channelListeners[i](IRC.Events.CHANNEL_REMOVED, data);
  }
};
IRC.Server.prototype.join = function(channelName) {
  var server = this;
  // JOINの返り値にIRC.Replies.NAMREPLYを返さないサーバーがある気がするので
  // メンバー一覧が得られるまでNAMESを定期的に実行する
  function pollNames(channel) {
    setTimeout(function() {
      if (0 == channel.members.length && !server.closed) {
        server.send(new IRC.Message('NAMES', channel.name));
        pollNames(channel);
      }
    }, 5000);
  };

  if (!this.getChannel(channelName)) this.addChannel(channelName);
  var channel = this.getChannel(channelName);
  this.send(new IRC.Message('JOIN', channel.name));
  pollNames(channel);
  return channel;
};
IRC.Server.prototype.joinAllOnConnect = function() {
  for (var channelName in this.channels) {
    var channel = this.getChannel(channelName);
    if (channel.shouldJoinOnConnect) this.join(channelName);
  }
};
IRC.Server.prototype.joinAll = function() {
  for (var channelName in this.channels) {
    this.join(channelName);
  }
};
IRC.Server.prototype.addReplyListener = function(listener) {
  this.replyListeners.push(listener);
};
IRC.Server.prototype.clearReplyListeners = function() {
  this.replyListeners.clear();
};
IRC.Server.prototype.addMemberListener = function(listener) {
  this.memberListeners.push(listener);
};
IRC.Server.prototype.clearMemberListener = function() {
  this.memberListeners.clear();
};
IRC.Server.prototype.addChannelListener = function(listener) {
  this.channelListeners.push(listener);
};
IRC.Server.prototype.clearChannelListener = function() {
  this.channelListeners.clear();
};
IRC.Server.prototype.send = function(message, force, callback) {
  if (arguments.length == 1) {
    force = false;
  }
  else if (arguments.length == 2) {
    if (typeof(force) == 'function') {
      callback = force;
      force = false;
    }
  }

  if (force || this.ready) {
    this.tcpClient.sendMessage(message.toString(), callback);
    if (message.command == 'PART') {
      for (var j = 0; j < this.channelListeners.length; j++) {
        this.channelListeners[j](IRC.Events.CHANNEL_REMOVED, this.getChannel(message.params[0]));
      }
    }
  }
  else {
    this.reservedCommands.push([message, callback]);
  }
};
IRC.Server.prototype.forceSend = function(message, callback) {
  return this.send(message, true, callback);
};
IRC.Server.prototype.connect = function() {
  this.tcpClient = new TcpClient(this.host, parseInt(this.port), this.encoding);
  this.tcpClient.connect(function() {
    this.tcpClient.addResponseListener(function(response) {
      var replies = response.split('\r\n');
      for (var i = 0; i < replies.length; i++) {
        var reply = replies[i];
        if (reply == '\r\n') continue;
        var message = IRC.Message.parse(reply, this);
        if (!message) continue;

        if (message.command == 'PRIVMSG') {
          // TODO
          message.interprete();
          if (message.isToChannel) {
            // public message among the channel
            var channel = this.getChannel(message.channelName);
            channel.messages.push(message);
          }
          else {
            // private message from a user
            var channel = this.getOrCreateChannel(message.sender);
            if (channel.members.length == 0) {
              channel.addMember([message.channelName, message.sender]);
            }
            channel.messages.push(message);
          }
        }
        else if (message.command == 'NOTICE') {
          // TODO
          message.interprete();
          var channel = this.getChannel(message.channelName);
          if (channel) channel.messages.push(message);
        }
        else if (message.command == 'PING') {
          console.log(message);
          var pong = message.copy();
          pong.command = 'PONG';
          this.send(pong);
        }
        else if (message.command == 'JOIN') {
          message.interprete();
          var channel = this.getChannel(message.channelName);
          if (channel) {
            if (0 < channel.addMember(message.sender).length) {
              for (var j = 0; j < this.memberListeners.length; j++) {
                this.memberListeners[j](IRC.Events.MEMBER_ADDED, message.sender, channel);
              }
            }
          }
        }
        else if (message.command == 'PART') {
          message.interprete();
          var channel = this.getChannel(message.channelName);
          if (channel) { // TODO: how to notify to listners
            channel.removeMember(message.sender);
            for (var j = 0; j < this.memberListeners.length; j++) {
              this.memberListeners[j](IRC.Events.MEMBER_QUITTED, message.sender, channel);
            }
          }
        }
        else if (message.command == 'QUIT') {
          var member = message.prefix.split('!')[0].substring(1);
          for (var channelName in this.channels) {
            var channel = this.channels[channelName];
            channel.removeMember(member);
            for (var j = 0; j < this.memberListeners.length; j++) {
              this.memberListeners[j](IRC.Events.MEMBER_QUITTED, member, channel);
            }
          }
        }
        else if (message.command == 'ERROR') {
          if (message.params[0].match(/^:Closing Link:/)) {
            this.closed = true;
            for (var j = 0; j < this.channelListeners.length; j++) {
              this.channelListeners[j](IRC.Events.CHANNEL_CLOSED, this);
            }
          }
        }
        else if (message.command == IRC.Errors.NICKNAMEINUSE) {
          this.nick += IRC.Settings.NICK_SUFFIX;
          this.forceSend(new IRC.Message('NICK', this.nick));
        }
        else if (message.command == IRC.Replies.ENDOFMOTD) {
          this.ready = true;
          while (0 < this.reservedCommands.length) {
            var command = this.reservedCommands.shift();
            this.send(command[0], command[1]);
          }
        }
        else if (message.command == IRC.Replies.NAMREPLY) {
          var channelName = message.params[message.params.length - 2];
          var tmp = message.params[message.params.length - 1];
          if (tmp.match(/^:(.+)/)) {
            var members = RegExp.$1.split(/ +/);
            var channel = this.getChannel(channelName);
            var addedMembers = channel.addMember(members);
            for (var j = 0; j < this.memberListeners.length; j++) {
              this.memberListeners[j](IRC.Events.MEMBER_ADDED, addedMembers, channel);
            }
          }
        }
        else if (message.command == IRC.Replies.TOPIC) {
          // TODO
        }

        for (var j = 0; j < this.replyListeners.length; j++) {
          this.replyListeners[j](message);
        }
      }
    }.bind(this));

    if (this.pass) {
      this.forceSend(new IRC.Message('PASS', this.pass), function() {
        this.forceSend(new IRC.Message('NICK', this.nick));
        this.forceSend(new IRC.Message('USER', this.user, '0', '*', ':user name')); // TODO
      }.bind(this));
    }
    else {
      this.forceSend(new IRC.Message('NICK', this.nick));
      this.forceSend(new IRC.Message('USER', this.user, '0', '*', ':user name')); // TODO
    }
  }.bind(this));
};
IRC.Server.prototype.disconnect = function(afterDisconnect) {
  this.ready = false;
  if (this.tcpClient.isConnected) {
    this.tcpClient.disconnect(afterDisconnect);
  }
  else {
    afterDisconnect();
  }
};
IRC.Server.prototype.reconnect = function() {
  this.disconnect(function() {this.connect()}.bind(this));
};
IRC.Server.prototype.removeAllMembers = function() {
  for (var channelName in this.channels) {
    var channel = this.getChannel(channelName);
    var removedMembers = channel.removeAllMembers();
    for (var i = 0; i < this.memberListeners.length; i++) {
      this.memberListeners[i](IRC.Events.MEMBER_QUITTED, removedMembers, channel);
    }
  }
};
