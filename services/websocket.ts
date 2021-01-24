/* eslint-disable @typescript-eslint/ban-ts-comment */
import { io } from 'socket.io-client';

const socket = io(process.env.SOCKET_URL, {
  extraHeaders: {
    'Access-Control-Allow-Origin': '*',
  },
});

export const socketIoRemoveAllEvents = () => {
  if (socket) {
    // @ts-ignore
    socket.removeAllListeners();
  }
};

export const joinRoom = (room, userId, name) => {
  if (socket && room) {
    socket.emit('join-room', room, userId, name);
  }
};

export const subscribeUserConnect = callback => {
  return socket.on('user-connected', ({ userId, userName }) => {
    return callback(null, userId, userName);
  });
};

export const subscribeUserDisconnect = callback => {
  return socket.on('user-disconnected', userId => {
    return callback(null, userId);
  });
};

export const subscribeCreateMessage = callback => {
  return socket.on('create-message', ({ name, message }) => {
    return callback(null, name, message);
  });
};

export const socketSendMessage = (name, message) => {
  socket.emit('message', { name, message });
};

export const subscribeToggleHandUp = callback => {
  return socket.on('toggle-hand-up', ({ userId, isHandUp }) => {
    return callback(null, userId, isHandUp);
  });
};

export const handUp = (userId, isHandUp) => {
  socket.emit('hand-up', { userId, isHandUp });
};

export const socketSendNotification = notification => {
  socket.emit('notification', { notification });
};

export const subscribeCreateNotification = callback => {
  return socket.on('create-notification', ({ notification }) => {
    return callback(null, notification);
  });
};

export const subscribeToggleMute = callback => {
  return socket.on('toggle-mute', ({ userId, isMute }) => {
    return callback(null, userId, isMute);
  });
};

export const sendMute = (userId, isMute) => {
  socket.emit('mute', { userId, isMute });
};

export const userStartTransmitting = () => {
  socket.emit('user-start-transmitting', {});
};

export const userStopTransmitting = () => {
  socket.emit('user-stop-transmitting', {});
};

export const subscribeRemoveSharedScreen = callback => {
  return socket.on('remove-shared-screen', ({ userId }) => {
    return callback(null, userId);
  });
};

export const subscribeToggleCam = callback => {
  return socket.on('toggle-cam', ({ userId, isDisableCam }) => {
    return callback(null, userId, isDisableCam);
  });
};

export const sendDisableCam = (userId, isDisableCam) => {
  socket.emit('disable-cam', { userId, isDisableCam });
};
