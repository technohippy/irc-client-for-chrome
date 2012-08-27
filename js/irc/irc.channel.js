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
IRC.Channel.prototype.addMember = function(members) {
  var added = [];
  if (!(members instanceof Array)) members = [members];
  for (var i = 0; i < members.length; i++) {
    var member = members[i];
    var anotherMember = member.match(/^@.+/) ? member.substring(1) : '@' + member;
    if (this.members.indexOf(member) < 0) {
      this.members.push(members[i]);
      if (0 <= this.members.indexOf(anotherMember)) {
        this.members.splice(this.members.indexOf(anotherMember), 1);
      }
      else {
        added.push(members[i]);
      }
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
IRC.Channel.prototype.removeAllMembers = function() {
  var oldMembers = this.members;
  this.members = [];
  return oldMembers;
};
IRC.Channel.prototype.join = function(callback) {
  this.server.send(new IRC.Message('JOIN', this.name), callback);
};
IRC.Channel.prototype.part = function(callback) {
  this.server.send(new IRC.Message('PART', this.name), callback);
};
