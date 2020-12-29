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
  socket.on('user-connected', userId => {
    return callback(null, userId);
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
