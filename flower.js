/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

exports.RelayReadStream = require('./lib/relay_read_stream.js');
exports.relayReadStream = function () {
  return new exports.RelayReadStream();
};

exports.QueryStream = require('./lib/query_stream.js');
exports.queryStream = function () {
  return new exports.QueryStream();
};

exports.Buffer2stream = require('./lib/buffer_to_stream.js');
exports.buffer2stream = function (buffer, options) {
  return new exports.Buffer2stream(buffer, options);
};

exports.MemoryStream = require('./lib/memory_stream.js');
exports.memoryStream = function () {
  return new exports.MemoryStream();
};

exports.stream2buffer = require('./lib/stream_to_buffer.js');
