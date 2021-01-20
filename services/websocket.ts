import { io } from 'socket.io-client';

const socket = io(process.env.SOCKET_URL, {
  extraHeaders: {
    'Access-Control-Allow-Origin': '*',
  },
});

export const joinRoom = (room, userId, name) => {
  if (socket && room) {
    socket.emit('join-room', room, userId, name);
  }
};

export const subcribeUserConnect = callback => {
  socket.on('user-connected', ({ userId, userName }) => {
    return callback(null, userId, userName);
  });
};

export const subcribeUserDisconnect = callback => {
  socket.on('user-disconnected', userId => {
    return callback(null, userId);
  });
};

export const subcribeCreateMessage = callback => {
  socket.on('create-message', ({ name, message }) => {
    return callback(null, name, message);
  });
};

export const socketSendMessage = (name, message) => {
  socket.emit('message', { name, message });
};

export const subcribeToggleHandUp = callback => {
  socket.on('toggle-hand-up', ({ userId, isHandUp }) => {
    return callback(null, userId, isHandUp);
  });
};

export const handUp = (userId, isHandUp) => {
  socket.emit('hand-up', { userId, isHandUp });
};

export const socketSendNotification = notification => {
  socket.emit('notification', { notification });
};

export const subcribeCreateNotification = callback => {
  socket.on('create-notification', ({ notification }) => {
    return callback(null, notification);
  });
};

export const subcribeToggleMute = callback => {
  socket.on('toggle-mute', ({ userId, isMute }) => {
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

export const subcribeRemoveSharedScreen = callback => {
  socket.on('remove-shared-screen', ({ userId }) => {
    return callback(null, userId);
  });
};
