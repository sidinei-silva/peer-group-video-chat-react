import { io } from 'socket.io-client';

const socket = io(process.env.SOCKET_URL, {
  extraHeaders: {
    'Access-Control-Allow-Origin': '*',
  },
});

export const joinRoom = (room, userId) => {
  if (socket && room) {
    socket.emit('join-room', room, userId);
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
  socket.on('create-message', message => {
    return callback(null, message);
  });
};

export const socketSendMessage = message => {
  socket.emit('message', message);
};
