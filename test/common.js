/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var path = require('path');
var fs = require('fs');
var wrench = require('wrench');
var events = require('events');

// node < 0.8 compatibility
exports.exists = fs.exists || path.exists;
exports.existsSync = fs.existsSync || path.existsSync;

// resolve main dirpaths
exports.test = path.dirname(module.filename);
exports.root = path.resolve(exports.test, '..');

// resolve filepath to main module
exports.flower = path.resolve(exports.root, 'flower.js');

// resolve test dirpaths
exports.fixture = path.resolve(exports.test, 'fixture');
exports.temp = path.resolve(exports.test, 'temp');

// Reset temp directory
exports.reset = function () {
  if (exports.existsSync(exports.temp)) {
    wrench.rmdirSyncRecursive(exports.temp);
  }

  fs.mkdirSync(exports.temp);
};

exports.handleStream = function (stream, callback) {
  if (!callback) {
    var promise = new events.EventEmitter();
  }

  if (stream) {
    var content = '';
    stream.on('data', function (chunk) {
      content += chunk.toString();
    });

    stream.once('end', function () {
      if (callback) return callback(null, content);

      promise.emit('success', content);
    });

    stream.once('error', function (error) {
      if (callback) return callback(error, null);

      promise.emit('error', error);
    });
  }

  if (!callback) {
    return promise;
  }
}
