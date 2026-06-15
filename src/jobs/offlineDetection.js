const deviceService = require('../services/deviceService');
const logger = require('../utils/logger');

const OFFLINE_THRESHOLD_SECONDS = 600;
const CHECK_INTERVAL_MS = 10000;

let intervalId = null;

function startOfflineDetection() {
  logger.info('Starting offline detection job', {
    threshold: `${OFFLINE_THRESHOLD_SECONDS}s`,
    interval: `${CHECK_INTERVAL_MS}ms`,
  });

  intervalId = setInterval(async () => {
    try {
      const threshold = new Date(Date.now() - OFFLINE_THRESHOLD_SECONDS * 1000).toISOString();
      const markedOffline = await deviceService.markOffline(threshold);

      if (markedOffline.length > 0) {
        logger.info('Devices marked offline', { count: markedOffline.length });
      }
    } catch (err) {
      logger.error('Offline detection job failed', { error: err.message });
    }
  }, CHECK_INTERVAL_MS);

  intervalId.unref();
}

function stopOfflineDetection() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Offline detection job stopped');
  }
}

module.exports = { startOfflineDetection, stopOfflineDetection };
