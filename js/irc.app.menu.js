if (typeof(IRC) == 'undefined' || !IRC.App) throw 'load error';

IRC.App.Menu = function() {
  this.menuElm = $('#member-menu');
  this.menuElm.click(function() {this.hide()}.bind(this));
  this.nameElm = $('#member-menu > .member-menu-name');

  $('#member-menu .who-is').click(this.showWhoIs.bind(this));
  $('#member-menu .private-message').click(this.sendPrivateMessage.bind(this));
};

IRC.App.Menu.prototype.show = function(member, x, y) {
  this.member = member;
  this.nameElm.text(member);
  this.menuElm.css('left', (x - 50) + 'px');
  this.menuElm.css('top', y + 'px');
  this.menuElm.show();
};

IRC.App.Menu.prototype.hide = function() {
  this.menuElm.hide();
};

IRC.App.Menu.prototype.showWhoIs = function() {
  // TODO: ircApp (global object)
  ircApp.getCurrentServer().send(new IRC.Message('WHOIS', this.member));
};

IRC.App.Menu.prototype.sendPrivateMessage = function() {
  // TODO: ircApp (global object)
  ircApp.getCurrentServer().getOrCreateChannel(this.member);
  ircApp.focus(ircApp.currentServerNick, this.member);
};
