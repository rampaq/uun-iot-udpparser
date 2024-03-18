const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const log = require('./log');

function createHTTPServer(port, logfile) {
  const httpServer = http.createServer((req, res) => {
    log.info(`${req.method} ${req.url}`);
    const parsedUrl = url.parse(req.url);
    const { pathname } = parsedUrl;

    switch (pathname) {
      case '/getLog':
        if (fs.existsSync(logfile)) {
          // read file from file system
          fs.readFile(logfile, (err, data) => {
            if (err) {
              res.statusCode = 500;
              res.end(`Error getting the file: ${err}.`);
            } else {
              res.setHeader('Content-type', 'application/json');// || 'text/plain');
              res.end(data);
            }
          });
        } else {
          res.statusCode = 404;
          res.end(`File ${logfile} not found!`);
        }
        break;

      case '/resetLog':
        if (fs.existsSync(logfile)) {
          fs.rm(logfile, (error) => {
            if (error) {
              res.statusCode = 500;
              log.error(error);
              res.end();
            }
          });
          res.statusCode = 200;
          res.end('Log file resetted successfully.');
          log.info('Log file resetted.');
        } else {
          res.statusCode = 404;
          res.end(`File ${logfile} not found!`);
        }
        break;

      default:
        res.statusCode = 404;
        res.end('Available endpoints: \'/getLog\', \'/resetLog\'.');
        break;
    }

  }).listen(parseInt(port, 10));
  log.info(`HTTP server listening on port ${port}`);

  return httpServer;
}

module.exports = { createHTTPServer };
