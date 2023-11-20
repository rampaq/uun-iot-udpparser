/* eslint-disable no-plusplus */
const fs = require('fs');
const path = require('path');
const dgram = require('dgram');
const WaitQueue = require('wait-queue');
const MQTTClient = require('../src/MQTTClient');
// const app = require('../src/index');

exports.udpSend = (app, data) => new Promise((resolve, reject) => {
  const buffer = Buffer.from(data, 'hex');
  const address = app.udpserver.address();
  const client = dgram.createSocket('udp4');
  client.send(buffer, address.port, address.address, (err) => {
    client.close();
    if (err) {
      reject(Error(err));
    } else {
      resolve();
    }
  });
});

exports.createMqttWaitQueue = async (app, subscribe = '#') => {
  const results = new WaitQueue();
  const client = new MQTTClient(app.mqttclient.brokerUrl);
  await client.ready();
  client.subscribe(subscribe);
  client.on('message', (topic, message) => {
    results.push({
      topic,
      message: JSON.parse(message.toString()),
    });
  });
  return results;
};

exports.readFile = (filename) => fs.readFileSync(path.join(__dirname, filename)).toString('utf8');

exports.loadJSON = (filename) => JSON.parse(fs.readFileSync(path.join(__dirname, filename)));

exports.loadRaw = (filename) => exports.readFile(filename).trim();
