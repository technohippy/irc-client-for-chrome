if (typeof(IRC) == 'undefined') var IRC = {};

IRC.App = function() {
  this.messagesElm = $('.messages');
  this.logsElm = $('.logs');
  this.membersElm = $('.members');
  this.channelsElm = $('.channels');
  this.settingsApp = new IRC.App.Settings(this);

  this.servers = {};
  this.currentServerNick = null;
  this.currentChannelName = null;
}
IRC.App.DELAY = 100;
IRC.App.prototype.addServer = function(serverNick, server) {
  $('<li/>')
    .attr('id', 'server-' + serverNick)
    .addClass('server')
    .text(serverNick)
    .append($('<ul/>'))
    .click(function() {this.settingsApp.open(server)}.bind(this))
    .bind('contextmenu', function(evt) {evt.preventDefault()}.bind(this))
    .appendTo(this.channelsElm);

  server.serverNick = serverNick;
  server.addReplyListener(this.replyListener.bind(this));
  server.addMemberListener(this.memberListener.bind(this));
  server.addChannelListener(this.channelListener.bind(this));
  this.servers[serverNick] = server;
  this.channelListener(IRC.Events.CHANNEL_ADDED, server.channels);
};
IRC.App.prototype.getServer = function(serverNick) {
  return this.servers[serverNick];
};
IRC.App.prototype.getCurrentServer = function() {
  return this.getServer(this.currentServerNick);
};
IRC.App.prototype.getAnyServer = function() {
  for (var serverNick in this.servers) {
    return this.getServer(serverNick);
  }
  return null;
};
IRC.App.prototype.getCurrentChannel = function() {
  if (this.getCurrentServer()) {
    return this.getCurrentServer().getChannel(this.currentChannelName);
  }
  else {
    return null;
  }
};
IRC.App.prototype.addMember = function(member) {
  /*
  var liElm = $('<li/>')
    .addClass(IRC.Util.toColorClass(member))
    .text(member);
  //var lis = this.membersElm.find('li');
  var lis = $('.members li');
  if (lis.size() == 0) {
    liElm.appendTo(this.membersElm);
  }
  else {
    for (var i = 0; i < lis.size(); i++) {
      var li = lis.get(i);
      //if (member < li.innerText) $(li).before(liElm);
      if (li.innerText < member) $(li).after(liElm);
    }
  }
  */
  /*
  var liElm = $('<li/>')
    .addClass(IRC.Util.toColorClass(member))
    .text(member)
    .appendTo(this.membersElm);
  */
  var liElm = $('<li/>')
    .addClass(IRC.Util.toColorClass(member))
    .append(member)
    .append($('<button/>').addClass('private-message-button'))
    .append($('<button/>').addClass('whois-button'))
    .appendTo(this.membersElm);
};
IRC.App.prototype.focus = function(serverNick, channelName, force) {
  if (force || this.getServer(serverNick).hasChannel(channelName)) {
    this.currentServerNick = serverNick;
    this.currentChannelName = channelName;

    var channel = this.getCurrentChannel();
    if (!channel) return;

    this.messagesElm.text('');
    for (var i = 0; i < channel.messages.length; i++) {
      IRC.Util.appendMessage(this.messagesElm, channel.messages[i]);
    }
    this.membersElm.text('');
    for (var i = 0; i < channel.members.length; i++) {
      this.addMember(channel.members[i]);
    }

    var channels = $('.channel');
    for (var i = 0; i < channels.length; i++) {
      var channel = $(channels[i]);
      channel[channel.text() == channelName ? 'addClass' : 'removeClass']('selected');
    }
  }
  else {
    throw 'The channel named "' + channelName + 
      '" does not exist on the server named "' + serverNick + '."';
  }
};
IRC.App.prototype.isFocused = function() {
  return this.currentServerNick != null;
};
IRC.App.prototype.log = function(obj, cls) {
  if (!cls) cls = 'message'; 
  var message = obj.toString();
  if (message.match(/^__(.+)__$/)) {
    message = chrome.i18n.getMessage(RegExp.$1) || message;
  }
  this.logsElm
    .append($('<span/>').addClass('timestamp').text(new Date().ymdhm()))
    .append($('<span/>').addClass(cls).text(message))
    .append($('<br/>'));
  this.logsElm.scrollTop(this.logsElm.get(0).scrollHeight);
};
IRC.App.prototype.logWarn = function(obj) {
  this.log(obj, 'warn');
};
IRC.App.prototype.replyListener = function(reply) {
  // TODO
  //console.log(reply.toString());
  if (reply.command == 'PRIVMSG' || reply.command == 'NOTICE') {
    //reply.interprete();
    var channelName = reply.isToChannel ? reply.channelName : reply.sender;
    if (channelName == this.currentChannelName) {
      IRC.Util.appendMessage(this.messagesElm, reply);
    }

    // TODO
    this.storeMessage(reply);
  }
  else if (IRC.isWhoisReply(reply.command)) {
    reply.command = 'notice';
    reply.sender = '[WHOIS]';
    reply.text = reply.params.join(' ');
    IRC.Util.appendMessage(this.messagesElm, reply);
  }

  this.log(reply);
};
IRC.App.prototype.memberListener = function(eventType, members, channel) {
  if (eventType == IRC.Events.MEMBER_ADDED) {
    if (channel.name == this.currentChannelName) {
      if (!Array.isArray(members)) members = [members];
      for (var i = 0; i < members.length; i++) {
        this.addMember(members[i]);
      }
    }
  }
  else if (eventType == IRC.Events.MEMBER_QUITTED) {
    if (channel.name == this.currentChannelName) {
      if (!Array.isArray(members)) members = [members];
      var removedLis = [];
      for (var i = 0; i < members.length; i++) {
        var member = members[i];
        var lis = this.membersElm.children('li');
        for (var j = 0; j < lis.length; j++) {
          if (lis[j].innerHTML == member) {
            removedLis.push(lis[j]);
          }
        }
      }
      for (var i = 0; i < removedLis.length; i++) {
        var removedLi = removedLis[i];
        removedLi.parentNode.removeChild(removedLi);
      }
    }
  }
};
IRC.App.prototype.channelListener = function(eventType, channels) {
  if (eventType == IRC.Events.CHANNEL_ADDED) {
    for (var channelName in channels) {
      var channel = channels[channelName];
      var serverElm = $('#server-' + channel.server.serverNick);
      var serverUlElm = $('#server-' + channel.server.serverNick + ' ul');
/*
      var channelLiElm = $('<li/>')
        .text(channelName)
        .addClass('channel')
        .click(function(evt) {
          evt.stopPropagation();
          this.focus(channel.server.serverNick, evt.target.innerHTML);
        }.bind(this))
        .bind('contextmenu', function(evt) {
          evt.stopPropagation();
        }.bind(this))
        .appendTo(serverUlElm);
*/
      var channelLiElm = $('<li/>')
        .addClass('channel')
        .append(channelName)
        .append($('<button/>').addClass('leave-button').click(function(evt) {
          evt.stopPropagation();
          // TODO
          var channelName = $(evt.target).parent().contents().get(0).nodeValue;
          var settings = new IRC.Settings(channel.server);
          for (var i = 0; i < settings.channels.length; i++) {
            if (settings.channels[i] == channelName) {
              settings.channels.splice(i, 1);
              break;
            }
          }
          settings.save();
          channel.server.send(new IRC.Message('PART', channelName));
        }.bind(this)))
        .click(function(evt) {
          evt.stopPropagation();
          // TODO
          var channelName = $(evt.target).contents().get(0).nodeValue;
          this.focus(channel.server.serverNick, channelName);
        }.bind(this))
        .bind('contextmenu', function(evt) {
          evt.stopPropagation();
        }.bind(this))
        .appendTo(serverUlElm);
      if (channelName == this.currentChannelName) channelLiElm.addClass('selected');
    }
  }
  else if (eventType == IRC.Events.CHANNEL_REMOVED) {
    if (!Array.isArray(channels)) {
      var obj = {};
      obj[channels.name] = channels;
      channels = obj;
    }

    for (var channelName in channels) {
      var channel = channels[channelName];
      // TODO
      var serverUlElm = $('#server-' + channel.server.serverNick + ' ul');
      for (var i in serverUlElm.children('li')) {
        var serverLiElm = serverUlElm.children('li')[i];
        if (serverLiElm.innerText == channelName) {
          serverUlElm.get(0).removeChild(serverLiElm);
        }
      }
    }
  }
  else if (eventType == IRC.Events.CHANNEL_CLOSED) {
    var server = channels;
    $('#server-' + server.serverNick).addClass('closed');
  }
};
IRC.App.prototype.storeMessage = function(message) {
  if (message.command != 'PRIVMSG') return; // TODO
  chrome.storage.local.get(message.fullChannelName, function(data) {
    if (!data[message.fullChannelName]) data[message.fullChannelName] = [];
    while (IRC.Settings.MAX_MESSAGE_LOG < data[message.fullChannelName].length) {
      data[message.fullChannelName].shift();
    }
    data[message.fullChannelName].push(message.toJson());
    chrome.storage.local.set(data);
  });
};
IRC.App.setBounds = function(bounds, shouldSetBounds) {
  var win = chrome.app.window.current();
  if (shouldSetBounds) win.setBounds(bounds);
  var container = win.contentWindow.document.getElementsByClassName("container")[0];
  container.style.width = bounds.width + 'px';
  container.style.height = bounds.height + 'px';
};
IRC.App.start = function() {
  var app = new IRC.App();
  chrome.storage.local.get('current', function(data) {
    if (data.current) {
      this.focus(data.current.serverNick, data.current.channelName, true);
    }
  }.bind(app));
  IRC.Settings.ifExists(
    function(serverNicks) {
      for (var i = 0; i < serverNicks.length; i++) {
        var serverNick = serverNicks[i];
        var settings = IRC.Settings.load(serverNick, function(serverNick, settings) {
          // TODO
          var server = new IRC.Server(settings.host, settings.port, 
            settings.nick, settings.user, settings.pass, settings.encoding);
          for (var j = 0; j < settings.channels.length; j++) {
            server.addChannel(settings.channels[j]);
          }

          // TODO
          chrome.storage.local.get(null, function(data) {
            for (var channelName in server.channels) {
              var channel = server.getChannel(channelName);
              var messages = data[channel.getFqn()];
              if (messages) {
                for (var j = 0; j < messages.length; j++) {
                  messages[j] = IRC.Message.fromJson(messages[j], server);
                }
                channel.messages = messages;
              }
            }
          });

          this.addServer(serverNick, server);
          if (settings.channels.length == 0) {
            this.settingsApp.open();
            return;
          }
          if (!this.isFocused()) {
            setTimeout(function() {
              this.focus(serverNick, settings.channels[0]);
            }.bind(this), IRC.App.DELAY);
          }

          if (navigator.onLine) {
            server.connect();
            server.joinAllOnConnect();
          }
          else {
            this.logWarn('__warnOffline__');
          }
        }.bind(this));
      }
    }.bind(app),
    function() {
      this.settingsApp.open();
    }.bind(app)
  );

  window.addEventListener('online', function() {
    app.log('__online__');
    for (var serverName in this.servers) {
      setTimeout(function() {
        this.connect();
        this.joinAllOnConnect();
      }.bind(this.getServer(serverName)), 50);
    }
  }.bind(app), false);

  window.addEventListener('offline', function() {
    app.logWarn('__warnOffline__');
    for (var serverName in this.servers) {
      var server = this.getServer(serverName);
      server.disconnect();
      server.removeAllMembers();
    }
  }.bind(app), false);

  $('#command').bind('keypress', function(evt) {
    if (evt.keyCode == 13) { // enter key
      var text = evt.target.value;
      if (text.replace(/\s+/, '').length == 0) return;
      var message;
      if (text == '//version') {
        message = '[ChroCha] Ver. ' + IRC.VERSION;
      }
      else if (text == '//clear') {
        IRC.Settings.clearAllStorage();
        message = '[ChroCha] Clean settings';
      }
      else if (text.match(/^\/(.+)/)) {
        // TODO
        message = RegExp.$1;
        this.getCurrentServer().send(message);
      }
      else {
        if (!text.match(/^:/)) text = ':' + text
        var channel = this.getCurrentChannel();
        var command = evt.ctrlKey ? 'NOTICE' : 'PRIVMSG';
        // TODO
        message = new IRC.Message(command, channel.name, text);
        message.server = this.getCurrentServer(); // TODO
        //var prefix = ':' + this.getCurrentServer().nick + '!';
        //var message = new IRC.Message(prefix, 'PRIVMSG', channel.name, text);
        channel.sendMessage(message);
        message.prefix = ':' + this.getCurrentServer().nick + '!'; // TODO
        message.interprete(); // TODO
        IRC.Util.appendMessage(this.messagesElm, message);
        this.storeMessage(message);
      }
      this.log(message);
      evt.target.value = '';
    }
  }.bind(app));

  $('.members li .private-message-button').live('click', function(evt) {
    // TODO
    var member = $(evt.target).parent().contents().get(0).nodeValue.replace(/^@/, '');
    this.getCurrentServer().getOrCreateChannel(member);
    this.focus(ircApp.currentServerNick, member);
  }.bind(app));

  $('.members li .whois-button').live('click', function(evt) {
    // TODO
    var member = $(evt.target).parent().contents().get(0).nodeValue.replace(/^@/, '');
    this.getCurrentServer().send(new IRC.Message('WHOIS', member));
  }.bind(app));

  $('#add-new-server').click(function() {
    this.settingsApp.open();
  }.bind(app));

  // window appearance
  chrome.storage.local.get('frame', function(data) {
    if (data.frame) {
      if (data.frame.bounds) {
        IRC.App.setBounds(data.frame.bounds, true);
      }
      if (data.frame.logsHeight) {
        $('.logs').css('height', data.frame.logsHeight);
      }
      if (data.frame.channelsHeight) {
        $('.channels').css('height', data.frame.channelsHeight);
      }
      if (data.frame.rightPaneWidth) {
        $('.right-pane').css('width', data.frame.rightPaneWidth);
      }
    }
  }.bind(app));

  var win = chrome.app.window.current();
  win.onBoundsChanged.addListener(function() {
    var bounds = win.getBounds();
    IRC.App.setBounds(bounds);
    chrome.storage.local.get('frame', function(data) {
      if (data['frame'] == null) data['frame'] = {};
      data['frame']['bounds'] = bounds;
      chrome.storage.local.set(data);
    });
  });

  // change page sizes
  var mouseMoving = null;
  $('.left-pane .horizontal-separator').mousedown(function(evt) {
    mouseMoving = 'left-pane';
  });

  $('.right-pane .horizontal-separator').mousedown(function(evt) {
    mouseMoving = 'right-pane';
  });

  $('.container .vertical-separator').mousedown(function(evt) {
    mouseMoving = 'container';
  });

  $('.container').mousemove(function(evt) {
    if (mouseMoving == null) return;

    if (mouseMoving == 'left-pane') {
      var height = parseInt($('.container').css('height'));
      $('.logs').css('height', (height - evt.pageY - 2) + 'px');
    }
    else if (mouseMoving == 'right-pane') {
      var height = parseInt($('.container').css('height'));
      $('.channels').css('height', (height - evt.pageY - 2) + 'px');
    }
    else if (mouseMoving == 'container') {
      var width = parseInt($('.container').css('width'));
      $('.right-pane').css('width', (width - evt.pageX - 1) + 'px');
    }
  });

  $('.container').mouseup(function(evt) {
    if (mouseMoving) {
      mouseMoving = null;
      chrome.storage.local.get('frame', function(data) {
        if (data['frame'] == null) data['frame'] = {};
        data['frame']['logsHeight'] = $('.logs').css('height');
        data['frame']['channelsHeight'] = $('.channels').css('height');
        data['frame']['rightPaneWidth'] = $('.right-pane').css('width');
        chrome.storage.local.set(data);
      });
    }
  });

  return app;
};
