const mongoose = require('mongoose');
const env = require('./env');

let memoryServer = null;

async function connectDatabase(options = {}) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const isTest = process.env.NODE_ENV === 'test' || options.isTest;

  // SAFETY GUARD: In test mode, NEVER touch production or development database!
  // Always use an isolated MongoMemoryServer or dedicated TEST_MONGODB_URI.
  if (isTest) {
    const testUri = process.env.TEST_MONGODB_URI;
    if (testUri) {
      console.log('[Database] Connecting to dedicated test MongoDB...');
      await mongoose.connect(testUri);
      return mongoose.connection;
    }

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      console.log('[Database] Test runner connected to isolated in-memory MongoDB.');
      await mongoose.connect(memUri);
      return mongoose.connection;
    } catch (err) {
      console.error('[Database] Failed to start test in-memory database:', err);
      throw err;
    }
  }

  const uri = env.MONGODB_URI;

  if (uri) {
    try {
      const safeUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
      console.log(`[Database] Connecting to persistent MongoDB: ${safeUri}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000
      });
      console.log(`[Database] MongoDB connected successfully to database: "${mongoose.connection.name}".`);
      return mongoose.connection;
    } catch (err) {
      console.error(`[Database] CRITICAL: Failed to connect to persistent MongoDB (${err.message}).`);
      // Do NOT silently fall back to an ephemeral in-memory database if a persistent URI was configured!
      // Silently falling back causes data to vanish upon server restarts.
      throw new Error(`Failed to connect to persistent MongoDB at ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}: ${err.message}`);
    }
  }

  // Fallback ONLY when no MONGODB_URI is provided at all
  console.warn('[Database] WARNING: No MONGODB_URI configured in environment.');
  console.warn('[Database] Falling back to temporary in-memory MongoDB. (DATA WILL NOT PERSIST ACROSS RESTARTS!)');
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    console.log('[Database] Connected to ephemeral in-memory MongoDB.');
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
