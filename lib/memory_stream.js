/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var Stream = require('stream');
var util = require('util');

// This stream will store incoming data
function MemoryStream() {
  Stream.call(this);

  this.readable = false;
  this.writable = true;
  this.size = 0;

  // internal API
  this.flower = {
    streams: [],
    cache: []
  };
}
util.inherits(MemoryStream, Stream);
module.exports = MemoryStream;

MemoryStream.prototype.write = function (chunk) {
  var intern = this.flower;
  if (this.writeable === false) {
    return this.emit('error', new Error('can not write to destroyed stream'));
  }

  // convert chunk to buffer
  if (!Buffer.isBuffer(chunk)) {
    chunk = new Buffer(chunk);
  }

  // increase size
  this.size += chunk.length;

  // Push this chunk to streams there are in query
  var i = intern.streams.length;
  while (i--) {
    intern.streams[i].write(chunk);
  }

  // Cache the chunk
  intern.cache.push(chunk);
  this.emit('drain');
  return true;
};

MemoryStream.prototype.end = function (chunk) {
  if (chunk) this.write(chunk);
  this.destroy();
};

MemoryStream.prototype.destroy = function () {
  if (this.writable === false) return;

  this.writable = false;
  this.emit('close');

  // Graceful emit end and close in all relays if they are not paused
  var streams = this.flower.streams;
  var i = streams.length;
  while (i--) {
    var stream = streams[i];
    if (stream.flower.paused === false) {
      stream.resume();
    }
  }
};

MemoryStream.prototype.destroySoon = MemoryStream.prototype.destroy;

MemoryStream.prototype.relay = function () {
  var output = new OutputStream(this);

  // add this stream to write query
  if (this.writable) {
    this.flower.streams.push(output);
  }

  return output;
};

// This stream will output the current cache and future data
function OutputStream(source) {
  var self = this;

  this.readable = true;
  this.writable = false;

  var intern = this.flower = {
    draining: false,
    source: source,
    paused: false,
    cache: []
  };

  intern.cache.push.apply(intern.cache, source.flower.cache);

  // Allow this.pause() to be executed
  process.nextTick(function () {
    if(intern.paused === false) {
      self.resume();
    }
  });
}
util.inherits(OutputStream, Stream);

OutputStream.prototype.pause = function () {
  this.flower.paused = true;
};

OutputStream.prototype.resume = function () {
  var intern = this.flower;
  var self = this;

  if (intern.draining) return;
  intern.paused = false;
  intern.draining = true;

  process.nextTick(function writeChunk() {
    if (intern.paused === true || self.readable === false) return;

    var chunk = intern.cache.shift();
    if (chunk === undefined) {
      intern.draining = false;
      self.emit('drain');

      if (intern.source.writable === false) {
        self.emit('end');
        self.destroy();
      }
      return;
    }

    if (intern.encoding) {
      chunk = chunk.toString(intern.encoding, 0, chunk.length);
    }

    self.emit('data', chunk);
    process.nextTick(writeChunk);
  });
};

OutputStream.prototype.destroy = function () {
  this.readable = false;
  this.emit('close');
};

OutputStream.prototype.setEncoding = function (encoding) {
  this.flower.encoding = encoding;
};

OutputStream.prototype.write = function (chunk) {
  var intern = this.flower;
  intern.cache.push(chunk);

  if (intern.paused === false) {
    this.resume();
  }
};
