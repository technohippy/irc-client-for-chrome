if (typeof(IRC) == 'undefined' || !IRC.App) throw 'load error';

IRC.App.Settings = function(app) {
  this.app = app;
  this.server = null;
  this.settings = null;
  this.elm = document.getElementsByClassName('server-settings')[0];
  this.serverNickElm = document.getElementById('servernick');
  this.hostElm = document.getElementById('host');
  this.portElm = document.getElementById('port');
  this.nickElm = document.getElementById('nick');
  this.userElm = document.getElementById('user');
  this.encodingElm = document.getElementById('encoding');
  this.newChannelElm = document.getElementById('new-channel');
  this.channelsElm = document.getElementById('channel-list');
  this.channelPasswordElm = document.getElementById('password');
  this.channelJoinOnConnectElm = document.getElementById('join-on-connect');
  this.backgroundElm = document.getElementById('settings-background');

  document.getElementById('ok').addEventListener('click', function() {
    // TODO
    this.settings.channels = [];
    for (var i = 0; i < this.channelsElm.childNodes.length; i++) {
      var li = this.channelsElm.childNodes[i];
      if (li.nodeName != 'LI') continue;
      this.settings.channels.push(li.childNodes[0].textContent);
    }

    if (!this.settings.isReady()) return;
    this.settings.save();

    if (this.server) {
      // updated
      var shouldReconnect = false;
      var shouldRejoin = false;
      if (this.settings.serverNick != this.server.serverNick) {
        document.querySelector('#server-' + this.server.serverNick
          ).childNodes[0].textContent = this.settings.serverNick;
        delete this.app.servers[this.server.serverNick];
        this.app.servers[this.settings.serverNick] = this.server;
        this.server.serverNick = this.settings.serverNick;
      }
      if (this.settings.host != this.server.host) {
        this.server.disconnect();
        this.server.host = this.settings.host;
        shouldReconnect = true;
      }
      if (this.settings.port != this.server.port) {
        this.server.disconnect();
        this.server.port = parseInt(this.settings.port);
        shouldReconnect = true;
      }
      if (this.settings.encoding != this.server.encoding) {
        this.server.disconnect();
        this.server.encoding = this.settings.encoding;
        shouldReconnect = true;
      }
      if (this.settings.user != this.server.user) {
        // TODO
        this.server.user = this.settings.user;
      }
      if (this.settings.nick != this.server.nick) {
        this.server.nick = this.settings.nick;
        this.server.send(new IRC.Message('NICK', this.server.nick));
      }

      var serverChannels = [];
      for (var channelName in this.server.channels) {
        serverChannels.push(channelName);
      }
      var removedChannels = [];
      for (var i = 0; i < serverChannels.length; i++) {
        var serverChannelName = serverChannels[i];
        if (this.settings.channels.indexOf(serverChannelName) < 0) {
          removedChannels.push(serverChannelName);
          this.server.removeChannel(serverChannelName);
        }
      }
      var addedChannels = [];
      for (var i = 0; i < this.settings.channels.length; i++) {
        var settingsChannelName = this.settings.channels[i];
        if (serverChannels.indexOf(settingsChannelName) < 0) {
          addedChannels.push(settingsChannelName);
          this.server.addChannel(settingsChannelName);
        }
      }

      if (shouldReconnect) {
        this.server.reconnect();
        this.server.joinAll();
      }
      else {
        for (var i = 0; i < removedChannels.length; i++) {
          // TODO: removedChannels[i].part();
          this.server.send(new IRC.Message('PART', removedChannels[i]));
        }
        for (var i = 0; i < addedChannels.length; i++) {
          // TODO: addedChannels[i].join();
          this.server.send(new IRC.Message('JOIN', addedChannels[i]));
        }
      }
    }
    else {
      // created
      var server = new IRC.Server(this.settings.host, this.settings.port, 
        this.settings.nick, this.settings.user, this.settings.encoding);
      for (var i = 0; i < this.settings.channels.length; i++) {
        server.addChannel(this.settings.channels[i]);
      }
      this.app.addServer(this.settings.serverNick, server); // TODO
      server.connect();
      server.joinAll();

      var keys = {};
      keys[IRC.Settings.KEY_SERVERS] = [];
      chrome.storage.sync.get(keys, function(data) {
        data[IRC.Settings.KEY_SERVERS].push(this.settings.serverNick);
        chrome.storage.sync.set(data);
      }.bind(this));
    }

    this.close();
  }.bind(this));

  document.getElementById('cancel').addEventListener('click', function() {
    this.close();
  }.bind(this));

  this.backgroundElm.addEventListener('click', function() {
    this.close();
  }.bind(this));

  document.getElementById('add-channel').addEventListener('click', function() {
    var channelName = document.getElementById('new-channel').value;
    document.getElementById('new-channel').value = '';
    this.addChannel(new IRC.Channel(null, channelName));
  }.bind(this));
};
IRC.App.Settings.prototype.open = function(server) {
  this.server = server;

  if (server) {
    this.settings = new IRC.Settings(server);

    this.serverNickElm.value = server.serverNick;
    this.hostElm.value = server.host;
    this.portElm.value = server.port;
    this.nickElm.value = server.nick;
    this.userElm.value = server.user;
    this.encodingElm.value = server.encoding;
    for (var channelName in server.channels) {
      this.addChannel(server.getChannel(channelName));
    }
  }
  else {
    this.settings = new IRC.Settings();
    this.portElm.value = this.settings.port;
  }
  this.serverNickElm.onchange = function(evt) {
    this.settings.serverNick = evt.target.value;
  }.bind(this);
  this.hostElm.onchange = function(evt) {
    this.settings.host = evt.target.value;
  }.bind(this);
  this.portElm.onchange = function(evt) {
    this.settings.port = evt.target.value;
  }.bind(this);
  this.nickElm.onchange = function(evt) {
    this.settings.nick = evt.target.value;
  }.bind(this);
  this.userElm.onchange = function(evt) {
    this.settings.user = evt.target.value;
  }.bind(this);
  this.encodingElm.onchange = function(evt) {
    this.settings.encoding = evt.target.value;
  }.bind(this);

  this.show();
};
IRC.App.Settings.prototype.close = function() {
  this.serverNickElm.value = '';
  this.hostElm.value = '';
  this.portElm.value = '';
  this.nickElm.value = '';
  this.userElm.value = '';
  this.encodingElm.value = 'utf-8';
  this.channelsElm.innerHTML = '';
  this.channelPasswordElm = '';

  this.hide();
};
IRC.App.Settings.prototype.addChannel = function(channel) {
  var li = document.createElement('li');
  li.innerHTML = channel.name;
  li.addEventListener('click', function() {
    // TODO
    document.getElementById('password').value = channel.name;
  });
  var deleteButton = document.createElement('button');
  deleteButton.innerHTML = 'x';
  deleteButton.addEventListener('click', function() {
    li.parentNode.removeChild(li);
  });
  li.appendChild(deleteButton);
  this.channelsElm.appendChild(li);
};
IRC.App.Settings.prototype.show = function() {
  this.elm.className = 'server-settings show';
  this.backgroundElm.className = 'settings-background show';
};
IRC.App.Settings.prototype.hide = function() {
  this.elm.className = 'server-settings';
  this.backgroundElm.className = 'settings-background';
};
