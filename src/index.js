/* eslint-disable no-param-reassign */
const fs = require('fs');
const axios = require('axios');
const log = require('./log');
const UDPServer = require('./UDPServer');
const MQTTClient = require('./MQTTClient');
const { createHTTPServer } = require('./HTTPServer');
const { getDecoderFromFile } = require('./decoder');

const decoderYaml = process.env.DECODER_YAML || './decoder.yaml';

const mqttOptions = {};
if (process.env.MQTT_USERNAME) {
  mqttOptions.username = process.env.MQTT_USERNAME;
}
if (process.env.MQTT_PASSWORD) {
  mqttOptions.password = process.env.MQTT_PASSWORD;
}
if (process.env.MQTT_CLIENT_ID) {
  mqttOptions.clientId = process.env.MQTT_CLIENT_ID;
}
if (process.env.MQTT_CA) {
  mqttOptions.ca = fs.readFileSync(process.env.MQTT_CA);
}
if (process.env.MQTT_CERT) {
  mqttOptions.cert = fs.readFileSync(process.env.MQTT_CERT);
}
if (process.env.MQTT_KEY) {
  mqttOptions.key = fs.readFileSync(process.env.MQTT_KEY);
}

const mqttUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

log.info('Using decoder file: %s', decoderYaml);

const decoder = getDecoderFromFile(decoderYaml);

log.info('Connecting to MQTT broker: %s', mqttUrl);

const mqttclient = process.env.MQTT_ENABLE ? new MQTTClient(mqttUrl, mqttOptions) : null;
const httpUrl = process.env.HTTP_URL || null;

const logFile = process.env.LOG_FILE || null;
const HTTPPort = process.env.HTTP_LOG_PORT || 5000;
const httpServer = process.env.HTTP_LOG_ENABLE ? createHTTPServer(HTTPPort, logFile) : null;

async function publish(msg) {
  if (mqttclient) {
    const payload = JSON.stringify(msg, (key, value) => (typeof value === 'bigint'
      ? value.toString()
      : value));
    mqttclient.publish(`chester/${msg.serial_number}`, payload);
  }

  if (httpUrl) {
    axios.post(process.env.HTTP_URL, msg, {
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((err) => {
      log.error(err);
    });
  }

  if (logFile) {
    // load and append msg to JSON file
    if (fs.existsSync(logFile)) {
      fs.readFile(logFile, (err, data) => {
        if (err) {
          log.error(err);
          return;
        }

        const json = JSON.parse(data);
        json.push(msg);
        fs.writeFile(logFile, JSON.stringify(json), (err_write) => {
          if (err_write) throw err;
          log.debug('The log has been updated!');
        });
      });
    } else {
      const msg_arr = [msg];
      fs.writeFile(logFile, JSON.stringify(msg_arr), (err) => {
        if (err) throw err;
        log.debug('The log has been created!');
      });
    }
  }
}

const udpserver = new UDPServer();

udpserver.on('message', (msg) => {

  msg.data = decoder.decode(msg.raw);
  msg.raw = msg.raw.toString('hex');

  publish(msg);
});

udpserver.listen(process.env.PORT || 5000);

module.exports = { udpserver, mqttclient };
