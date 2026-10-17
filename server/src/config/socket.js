const { Server } = require('socket.io');
const env = require('../config/env');

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  return io;
}

module.exports = {
  createSocketServer
};
