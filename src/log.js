const option = {
  level: process.env.LOG_LEVEL || 'info',
};

if (process.env.LOG_PRETTY) {
  option.transport = { target: 'pino-pretty' };
}

module.exports = require('pino')(option);
