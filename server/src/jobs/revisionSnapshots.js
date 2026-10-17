const documentManager = require('../collaboration/documentManager');

async function flushActiveSnapshots() {
  try {
    await documentManager.flushAll();
  } catch (err) {
    console.error('[Job] Document snapshot flush failed:', err.message);
  }
}

function startSnapshotJob(intervalMs = 5 * 60 * 1000) {
  const timer = setInterval(flushActiveSnapshots, intervalMs);
  timer.unref();
  return timer;
}

module.exports = {
  flushActiveSnapshots,
  startSnapshotJob
};
