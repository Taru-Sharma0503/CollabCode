const mongoose = require('mongoose');
const env = require('./env');

let memoryServer = null;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[Database] Connecting to MongoDB URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
      await mongoose.connect(uri);
      console.log('[Database] MongoDB connected successfully.');
      return mongoose.connection;
    } catch (err) {
      console.warn(`[Database] Failed to connect to configured URI (${err.message}). Falling back to in-memory database.`);
    }
  }

  // Fallback to in-memory MongoDB for development/testing if no URI or connection failed
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    console.log(`[Database] Started in-memory MongoDB instance.`);
    await mongoose.connect(memUri);
    console.log('[Database] Connected to in-memory MongoDB.');
    return mongoose.connection;
  } catch (err) {
    console.error('[Database] Failed to start in-memory database:', err);
    throw err;
  }
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase
};
