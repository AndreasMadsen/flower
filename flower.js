/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

exports.RelayStream = require('./lib/relay_stream.js');
exports.relayStream = function () {
  return new exports.RelayStream();
};

exports.Buffer2stream = require('./lib/relay_stream.js');
exports.buffer2stream = function (buffer, options) {
  return new exports.Buffer2stream(buffer, options);
};

exports.stream2buffer = require('./lib/relay_stream.js');
