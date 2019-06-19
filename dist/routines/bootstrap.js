"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _events = _interopRequireDefault(require("events"));

var _http = _interopRequireDefault(require("http"));

var _https = _interopRequireDefault(require("https"));

var _semver = _interopRequireDefault(require("semver"));

var _Logger = _interopRequireDefault(require("../Logger"));

var _classes = require("../classes");

var _errors = require("../errors");

var _utilities = require("../utilities");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = _Logger.default.child({
  namespace: 'bootstrap'
});

const bootstrap = () => {
  global.GLOBAL_AGENT = global.GLOBAL_AGENT || {};

  if (global.GLOBAL_AGENT.bootstrapped) {
    log.warn('found global.globalAgent; second attempt to bootstrap global-agent was ignored');
    return;
  }

  global.GLOBAL_AGENT.bootstrapped = true; // eslint-disable-next-line no-process-env

  global.GLOBAL_AGENT.HTTP_PROXY = process.env.GLOBAL_AGENT_HTTP_PROXY || null; // eslint-disable-next-line no-process-env

  global.GLOBAL_AGENT.NO_PROXY = process.env.GLOBAL_AGENT_NO_PROXY || null;
  log.info({
    configuration: global.GLOBAL_AGENT
  }, 'global agent has been initialized');

  const isProxyConfigured = () => {
    return global.GLOBAL_AGENT.HTTP_PROXY;
  };

  const mustUrlUseProxy = url => {
    if (!global.GLOBAL_AGENT.HTTP_PROXY) {
      return false;
    }

    if (!global.GLOBAL_AGENT.NO_PROXY) {
      return true;
    }

    return !(0, _utilities.isUrlMatchingNoProxy)(url, global.GLOBAL_AGENT.NO_PROXY);
  };

  const getUrlProxy = () => {
    if (!global.GLOBAL_AGENT.HTTP_PROXY) {
      throw new _errors.UnexpectedStateError('HTTP proxy must be configured.');
    }

    return (0, _utilities.parseProxyUrl)(global.GLOBAL_AGENT.HTTP_PROXY);
  };

  const eventEmitter = new _events.default();
  const httpAgent = new _classes.HttpProxyAgent(isProxyConfigured, mustUrlUseProxy, getUrlProxy, _http.default.globalAgent, eventEmitter);
  const httpsAgent = new _classes.HttpsProxyAgent(isProxyConfigured, mustUrlUseProxy, getUrlProxy, _https.default.globalAgent, eventEmitter); // Overriding globalAgent was added in v11.7.
  // @see https://nodejs.org/uk/blog/release/v11.7.0/

  if (_semver.default.gte(process.version, 'v11.7.0')) {
    // @see https://github.com/facebook/flow/issues/7670
    // $FlowFixMe
    _http.default.globalAgent = httpAgent; // $FlowFixMe

    _https.default.globalAgent = httpsAgent;
  } else {
    // $FlowFixMe
    _http.default.get = (0, _utilities.bindHttpMethod)(_http.default.get, httpAgent); // $FlowFixMe

    _http.default.request = (0, _utilities.bindHttpMethod)(_http.default.request, httpAgent); // $FlowFixMe

    _https.default.get = (0, _utilities.bindHttpMethod)(_https.default.get, httpsAgent); // $FlowFixMe

    _https.default.request = (0, _utilities.bindHttpMethod)(_https.default.request, httpsAgent);
  }
};

var _default = bootstrap;
exports.default = _default;
//# sourceMappingURL=bootstrap.js.map