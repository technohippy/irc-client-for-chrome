if (typeof(IRC) == 'undefined') var IRC = {};

IRC.Channel = function(server, name) {
  this.server = server;
  this.name = name;
  this.members = [];
  this.messages = [];
  this.password = null;
  this.topic = null;
  this.shouldJoinOnConnect = true;
};
IRC.Channel.prototype.addMember = function(member) {
  var added = [];
  if (member instanceof Array) {
    for (var i = 0; i < member.length; i++) {
      if (this.members.indexOf(member[i]) < 0) {
        this.members.push(member[i]);
        added.push(member[i]);
      }
    }
  }
  else {
    if (this.members.indexOf(member) < 0) {
      this.members.push(member);
      added.push(member);
    }
  }
  return added;
};
IRC.Channel.prototype.sendMessage = function(message) {
  this.server.send(message);
  this.messages.push(message);
};
IRC.Channel.prototype.removeMember = function(member) {
  this.members.splice(this.members.indexOf(member), 1);
};
