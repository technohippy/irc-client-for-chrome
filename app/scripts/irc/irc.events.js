'use strict';

var IRC;
if (typeof IRC === 'undefined') IRC = {};

IRC.Events = {
  CHANNEL_ADDED: 'channel_added',
  CHANNEL_REMOVED: 'channel_removed',
  CHANNEL_CLOSED: 'channel_closed',

  MESSAGE_ADDED: 'message_added',

  MEMBER_ADDED: 'member_added',
  MEMBER_QUITTED: 'member_quitted'
};
