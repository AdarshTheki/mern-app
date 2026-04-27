export const events = Object.freeze({
  // ? when user is ready to go
  CONNECTED: 'connected',
  // ? when user gets disconnected
  DISCONNECT: 'disconnect',
  // ? when there is new one on one chat, new group chat or user gets added in the group
  NEW_CHAT: 'newChat',
  // ? when user joins a socket room
  JOIN_CHAT: 'joinChat',
  // ? when participant gets removed from group, chat gets deleted or leaves a group
  LEAVE_CHAT: 'leaveChat',
  // ? when admin updates a group name
  UPDATE_GROUP_NAME: 'updateGroupName',
  // ? when participant stops typing
  STOP_TYPING: 'stopTyping',
  // ? when participant starts typing
  TYPING: 'typing',
  // ? when new message is received
  MESSAGE_RECEIVED: 'messageReceived',
  // ? when message is deleted
  MESSAGE_DELETE: 'messageDeleted',
  // ? when there is an error in socket
  SOCKET_ERROR: 'socketError',
});
