'use strict';

var IRC;
if (typeof IRC === 'undefined') IRC = {};

IRC.App = function() {
  this.messagesElm = $('.messages');
  this.logsElm = $('.logs');
  this.membersElm = $('.members');
  this.channelsElm = $('.channels');
  this.settingsApp = new IRC.App.Settings(this);

  this.servers = {};
  this.currentServerNick = null;
  this.currentChannelName = null;
};
IRC.App.DELAY = 100;
IRC.App.prototype.addServer = function(serverNick, server) {
  $('<li/>')
    .attr('id', 'server-' + serverNick)
    .addClass('server')
    .text(serverNick)
    .append($('<button/>').addClass('settings').click(function() {
      this.settingsApp.open(server);
    }.bind(this)))
    .append($('<ul/>'))
    .click(function() {
      console.log('TODO: show notice for the server');
    }.bind(this))
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
  if (lis.size() === 0) {
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
  $('<li/>')
    .addClass(IRC.Util.toColorClass(member))
    .append(member)
    .append($('<button/>').addClass('private-message-button').attr({'title':chrome.i18n.getMessage('privateMessage')}))
    .append($('<button/>').addClass('whois-button').attr({'title':chrome.i18n.getMessage('whoIs')}))
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
    for (i = 0; i < channel.members.length; i++) {
      this.addMember(channel.members[i]);
    }

    var channels = $('.channel');
    for (i = 0; i < channels.length; i++) {
      var channelElm = $(channels[i]);
      channelElm[channelElm.text() === channelName ? 'addClass' : 'removeClass']('selected');
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
  if (typeof obj === 'undefined') return;
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
  if (reply.command === 'PRIVMSG' || reply.command === 'NOTICE') {
    //reply.interprete();
    var channelName = reply.isToChannel ? reply.channelName : reply.sender;
    if (channelName === this.currentChannelName) {
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
  var i, j;
  if (eventType === IRC.Events.MEMBER_ADDED) {
    if (channel.name === this.currentChannelName) {
      if (!Array.isArray(members)) members = [members];
      for (i = 0; i < members.length; i++) {
        this.addMember(members[i]);
      }
    }
  }
  else if (eventType === IRC.Events.MEMBER_QUITTED) {
    if (channel.name === this.currentChannelName) {
      if (!Array.isArray(members)) members = [members];
      var removedLis = [];
      for (i = 0; i < members.length; i++) {
        var member = members[i];
        var lis = this.membersElm.children('li');
        for (j = 0; j < lis.length; j++) {
          if (lis[j].innerHTML === member) {
            removedLis.push(lis[j]);
          }
        }
      }
      for (i = 0; i < removedLis.length; i++) {
        var removedLi = removedLis[i];
        removedLi.parentNode.removeChild(removedLi);
      }
    }
  }
};
IRC.App.prototype.channelListener = function(eventType, channels) {
  var channel, channelName;
  if (eventType === IRC.Events.CHANNEL_ADDED) {
    var leaveHandler = function(evt) {
      evt.stopPropagation();
      // TODO
      channelName = $(evt.target).parent().contents().get(0).nodeValue;
      channel = channels[channelName];
      var settings = new IRC.Settings(channel.server);
      for (var i = 0; i < settings.channels.length; i++) {
        if (settings.channels[i] === channelName) {
          settings.channels.splice(i, 1);
          break;
        }
      }
      settings.save();
      channel.server.send(new IRC.Message('PART', channelName));
    }.bind(this);

    var focusHandler = function(evt) {
      evt.stopPropagation();
      // TODO
      var channelName = $(evt.target).contents().get(0).nodeValue;
      var channel = channels[channelName];
      this.focus(channel.server.serverNick, channelName);
    }.bind(this);

    for (var addedChannelName in channels) {
      var addedChannel = channels[addedChannelName];
      //var serverElm = $('#server-' + addedChannel.server.serverNick);
      var serverUlElm = $('#server-' + addedChannel.server.serverNick + ' ul');
      var channelLiElm = $('<li/>')
        .addClass('channel')
        .append(addedChannelName)
        .append($('<button/>').addClass('leave-button').attr({'title':chrome.i18n.getMessage('leave')}).click(leaveHandler))
        .click(focusHandler)
        .appendTo(serverUlElm);
      if (addedChannelName === this.currentChannelName) channelLiElm.addClass('selected');
    }
  }
  else if (eventType === IRC.Events.CHANNEL_REMOVED) {
    if (!Array.isArray(channels)) {
      var obj = {};
      obj[channels.name] = channels;
      channels = obj;
    }

    for (var removedChannelName in channels) {
      var removedChannel = channels[removedChannelName];
      // TODO
      var removedServerUlElm = $('#server-' + removedChannel.server.serverNick + ' ul');
      for (var i in removedServerUlElm.children('li')) {
        var serverLiElm = removedServerUlElm.children('li')[i];
        if (serverLiElm.innerText === removedChannelName) {
          removedServerUlElm.get(0).removeChild(serverLiElm);
        }
      }
    }
  }
  else if (eventType === IRC.Events.CHANNEL_CLOSED) {
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
  var container = win.contentWindow.document.getElementsByClassName('container')[0];
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
      var afterLoadHandler = function(serverNick, settings) {
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
        if (settings.channels.length === 0) {
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
      }.bind(this);

      for (var i = 0; i < serverNicks.length; i++) {
        IRC.Settings.load(serverNicks[i], afterLoadHandler);
      }
    }.bind(app),
    function() {
      this.settingsApp.open();
    }.bind(app)
  );

  window.addEventListener('online', function() {
    app.log('__online__');

    var connectAndJoinWithServer = function() {
      this.connect();
      this.joinAllOnConnect();
    };
    for (var serverName in this.servers) {
      setTimeout(connectAndJoinWithServer.bind(this.getServer(serverName)), 50);
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
    if (evt.keyCode === 13) { // enter key
      var text = evt.target.value;
      if (text.replace(/\s+/, '').length === 0) return;
      var message;
      if (text === '//version') {
        message = '[ChroCha] Ver. ' + IRC.VERSION;
      }
      else if (text === '//clear') {
        IRC.Settings.clearAllStorage();
        message = '[ChroCha] Clean settings';
      }
      else if (text === '//reload') {
        chrome.runtime.reload();
      }
      else if (text.match(/^\/(.+)/)) {
        // TODO
        message = RegExp.$1;
        this.getCurrentServer().send(message);
      }
      else {
        if (!text.match(/^:/)) text = ':' + text;
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

  $(document).on('click', '.members li .private-message-button', function(evt) {
    // TODO
    var member = $(evt.target).parent().contents().get(0).nodeValue.replace(/^@/, '');
    this.getCurrentServer().getOrCreateChannel(member);
    this.focus(ircApp.currentServerNick, member);
  }.bind(app));

  $(document).on('click', '.members li .whois-button', function(evt) {
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
      if (data.frame == null) data.frame = {};
      data.frame.bounds = bounds;
      chrome.storage.local.set(data);
    });
  });

  // change page sizes
  var mouseMoving = null;
  $('.left-pane .horizontal-separator').mousedown(function() {
    mouseMoving = 'left-pane';
  });

  $('.right-pane .horizontal-separator').mousedown(function() {
    mouseMoving = 'right-pane';
  });

  $('.container .vertical-separator').mousedown(function() {
    mouseMoving = 'container';
  });

  $('.container').mousemove(function(evt) {
    if (mouseMoving == null) return;

    var height = parseInt($('.container').css('height'), 10);
    var width = parseInt($('.container').css('width'), 10);
    if (mouseMoving === 'left-pane') {
      $('.logs').css('height', (height - evt.pageY - 2) + 'px');
    }
    else if (mouseMoving === 'right-pane') {
      $('.channels').css('height', (height - evt.pageY - 2) + 'px');
    }
    else if (mouseMoving === 'container') {
      $('.right-pane').css('width', (width - evt.pageX - 1) + 'px');
    }
  });

  $('.container').mouseup(function() {
    if (mouseMoving) {
      mouseMoving = null;
      chrome.storage.local.get('frame', function(data) {
        if (data.frame == null) data.frame = {};
        data.frame.logsHeight = $('.logs').css('height');
        data.frame.channelsHeight = $('.channels').css('height');
        data.frame.rightPaneWidth = $('.right-pane').css('width');
        chrome.storage.local.set(data);
      });
    }
  });

  return app;
};
