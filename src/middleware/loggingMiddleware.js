const morgan = require('morgan');
const logger = require('../utils/logger');

// Morgan format
morgan.token('user', (req) => req.user?.username || 'anonymous');

const morganFormat = ':user | :method :url :status - :response-time ms';

const loggingMiddleware = morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});

module.exports = loggingMiddleware;
