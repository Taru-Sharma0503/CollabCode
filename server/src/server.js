const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const { createSocketServer } = require('./config/socket');
const { initSocketIO } = require('./socket');

async function startServer() {
  try {
    await connectDatabase();

    const httpServer = http.createServer(app);
    const io = createSocketServer(httpServer);
    initSocketIO(io);

    // Attach io to express app so routes/services can emit events
    app.set('io', io);

    httpServer.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 CollabCode Server running on port ${env.PORT}`);
      console.log(`📡 Environment: ${env.NODE_ENV}`);
      console.log(`🌐 Client URL: ${env.CLIENT_URL}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
