if (typeof(IRC) == 'undefined') throw 'load error';

IRC.Settings = function(server) {
  if (server) {
    this.serverNick = server.serverNick;
    this.host = server.host;
    this.port = server.port;
    this.nick = server.nick;
    this.user = server.user;
    this.pass = server.pass;
    this.encoding = server.encoding;
    this.channels = []; // TODO: とりあえずchannelNameの配列。将来的にはchannelの配列にする
    for (var channelName in server.channels) {
      this.channels.push(channelName);
    }
  }
  else {
    this.serverNick = null;
    this.host = null;
    this.port = 6667;
    this.nick = null;
    this.user = null;
    this.pass = null;
    this.encoding = 'utf-8';
    this.channels = [];
  }
}
IRC.Settings.MAX_MESSAGE_LOG = 10;
IRC.Settings.KEY_SERVERS = 'servers';
IRC.Settings.NICK_SUFFIX = '_';
IRC.Settings.setupTestData = function() {
  var serverNick1 = 'freenode';
  var channels1 = ['#testmyclient1', '#testmyclient2'];

  var serverNick2 = 'ircnet';
  var channels2 = ['#testmyclient3', '#testmyclient4'];

  var data = {};
  data[IRC.Settings.KEY_SERVERS] = [serverNick1, serverNick2];
  chrome.storage.sync.set(data);

  var s1 = new IRC.Settings();
  s1.serverNick = serverNick1;
  s1.host = 'irc.freenode.net';
  s1.nick = 'ando12345';
  s1.user = 'ando12345';
  s1.encoding = 'iso-2022-jp';
  s1.channels = channels1;
  s1.save();

  var s2 = new IRC.Settings();
  s2.serverNick = serverNick2;
  s2.host = 'irc.ircnet.ne.jp';
  s2.nick = 'ando12345';
  s2.user = 'ando12345';
  s2.encoding = 'iso-2022-jp';
  s2.channels = channels2;
  s2.save();

  //new IRC.Settings(serverNick1, 'irc.freenode.net', 6667, 'ando12345', 'ando12345', 'iso-2022-jp', channels1).save();
  //new IRC.Settings(serverNick2, 'irc.ircnet.ne.jp', 6667, 'ando12345', 'ando12345', 'iso-2022-jp', channels2).save();

  chrome.storage.local.set({
    current:{
      serverNick:serverNick1,
      channelName:channels1[0]
    } 
  });
};
IRC.Settings.clearAllStorage = function() {
  chrome.storage.sync.clear();
  chrome.storage.local.clear();
};
IRC.Settings.load = function(serverNick, callback) {
  return new IRC.Settings().load(serverNick, callback);
};
IRC.Settings.loadAll = function(callback) {
  if (arguments.length == 0) throw 'callback is a mandatory argument.';
  chrome.storage.sync.get(IRC.Settings.KEY_SERVERS, function(data) {
    var serverNicks = data.servers;
    for (var i = 0; i < serverNicks.length; i++) {
      IRC.Settings.load(serverNicks[i], callback);
    }
  });
};
IRC.Settings.ifExists = function(thenCallback, elseCallback) {
  chrome.storage.sync.get(IRC.Settings.KEY_SERVERS, function(data) {
    if (data.servers) {
      thenCallback(data.servers);
    }
    else {
      elseCallback();
    }
  });
};
IRC.Settings.prototype.load = function(serverNick, callback) {
  if (!serverNick) return this;

  chrome.storage.sync.get(serverNick, function(items) {
    this.host = items[serverNick].host;
    this.port = items[serverNick].port;
    this.nick = items[serverNick].nick;
    this.user = items[serverNick].user;
    this.encoding = items[serverNick].encoding;
    this.channels = [];
    for (var i = 0; i < items[serverNick].channels.length; i++) {
      var channel = items[serverNick].channels[i];
      if (typeof(channel) == 'string') this.channels.push(channel);
    }
    if (callback) callback(serverNick, this);
  }.bind(this));
  return this;
};
IRC.Settings.prototype.save = function(callback) {
  var data = {};
  data[this.serverNick] = {
    host:this.host, 
    port:this.port, 
    nick:this.nick.replace(/_+$/, ''), // TODO
    user:this.user,
    pass:this.pass,
    encoding:this.encoding,
    channels:this.channels
  };

  chrome.storage.sync.set(data, function() {
    console.log('settings saved');
    if (callback) callback(this);
  }.bind(this));
};
IRC.Settings.prototype.isReady = function() {
  return !IRC.Util.isBlank(this.host) &&
    !IRC.Util.isBlank(this.port) &&
    !IRC.Util.isBlank(this.nick) &&
    !IRC.Util.isBlank(this.user) &&
    !IRC.Util.isBlank(this.encoding) &&
    this.channels.length != 0;
};
