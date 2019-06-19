"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _events = _interopRequireDefault(require("events"));

var _Logger = _interopRequireDefault(require("../Logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = _Logger.default.child({
  namespace: 'Agent'
});

let requestId = 0;

class Agent {
  constructor(isProxyConfigured, mustUrlUseProxy, getUrlProxy, fallbackAgent, eventEmitter) {
    this.fallbackAgent = fallbackAgent;
    this.isProxyConfigured = isProxyConfigured;
    this.mustUrlUseProxy = mustUrlUseProxy;
    this.getUrlProxy = getUrlProxy;
    this.eventEmitter = eventEmitter;
  }

  addRequest(request, configuration) {
    const requestUrl = this.protocol + '//' + (configuration.hostname || configuration.host) + (configuration.port === 80 || configuration.port === 443 ? '' : ':' + configuration.port) + request.path;

    if (!this.isProxyConfigured()) {
      log.trace({
        destination: requestUrl
      }, 'not proxying request; GLOBAL_AGENT.HTTP_PROXY is not configured'); // $FlowFixMe It appears that Flow is missing the method description.

      this.fallbackAgent.addRequest(request, configuration);
      return;
    }

    if (!this.mustUrlUseProxy(requestUrl)) {
      log.trace({
        destination: requestUrl
      }, 'not proxying request; url matches GLOBAL_AGENT.NO_PROXY'); // $FlowFixMe It appears that Flow is missing the method description.

      this.fallbackAgent.addRequest(request, configuration);
      return;
    }

    const currentRequestId = requestId++;
    const proxy = this.getUrlProxy(requestUrl);

    if (this.protocol === 'http:') {
      request.path = requestUrl;

      if (proxy.authorization) {
        request.setHeader('Proxy-Authorization', 'Basic ' + Buffer.from(proxy.authorization).toString('base64'));
      }
    }

    this.eventEmitter.emit('request', request);
    log.trace({
      destination: requestUrl,
      proxy: 'http://' + proxy.hostname + ':' + proxy.port,
      requestId: currentRequestId
    }, 'proxying request');
    request.once('response', response => {
      log.trace({
        headers: response.headers,
        requestId: currentRequestId,
        statusCode: response.statusCode
      }, 'proxying response');
    });
    request.shouldKeepAlive = false;
    const connectionConfiguration = {
      host: configuration.hostname || configuration.host,
      port: configuration.port || 80,
      proxy
    }; // $FlowFixMe It appears that Flow is missing the method description.

    this.createConnection(connectionConfiguration, (error, socket) => {
      if (error) {
        request.emit('error', error);
      } else {
        request.onSocket(socket);
      }
    });
  }

}

var _default = Agent;
exports.default = _default;
//# sourceMappingURL=Agent.js.map