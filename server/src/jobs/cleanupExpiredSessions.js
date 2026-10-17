const Session = require('../models/Session');

async function cleanupExpiredSessions() {
  try {
    const result = await Session.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isRevoked: true, updatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    });
    if (result.deletedCount > 0) {
      console.log(`[Job] Cleaned up ${result.deletedCount} expired/revoked sessions.`);
    }
  } catch (err) {
    console.error('[Job] Session cleanup failed:', err.message);
  }
}

function startSessionCleanupJob(intervalMs = 60 * 60 * 1000) {
  // Run once on startup
  cleanupExpiredSessions();
  const timer = setInterval(cleanupExpiredSessions, intervalMs);
  timer.unref();
  return timer;
}

module.exports = {
  cleanupExpiredSessions,
  startSessionCleanupJob
};
