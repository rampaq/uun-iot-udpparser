const EventEmitter = require('events');
const mqtt = require('mqtt');
const log = require('./log');

class MQTTClient extends EventEmitter {
  constructor(brokerUrl, options = {}) {
    super();

    this.brokerUrl = brokerUrl;
    this.client = mqtt.connect(brokerUrl, options);

    this.client.on('connect', (rc) => {
      log.info('MQTT connect rc: %o', rc);
      this.emit('connect');
    });
    this.client.on('disconnect', () => {
      log.info('MQTT disconnect');
      this.emit('disconnect');
    });
    this.client.on('error', (error) => {
      log.warn('MQTT error %o', error);
      this.emit('error');
    });
    this.client.on('message', (topic, message) => {
      log.debug('MQTT received topic: %s message: %s', topic, message);
      this.emit('message', topic, message);
    });
  }

  disconnect() {
    this.client.end();
  }

  subscribe(topic) {
    log.debug('MQTT subscribing', topic);
    this.client.subscribe(topic);
  }

  unsubscribe(topic) {
    this.client.unsubscribe(topic);
  }

  publish(topic, message = null) {
    log.debug('MQTT publish topic: %s message: %o', topic, message);
    this.client.publish(topic, message);
  }

  ready(timeout = 5000) {
    const timeoutEnd = new Date().getTime() + timeout;
    const self = this;
    return new Promise((resolve, reject) => {
      function check() {
        if (self.client.connected) {
          resolve();
        } else if (timeoutEnd < (new Date().getTime())) {
          reject(new Error('Timeout'));
        } else {
          setTimeout(check, 50);
        }
      }
      check();
    });
  }
}

module.exports = MQTTClient;
