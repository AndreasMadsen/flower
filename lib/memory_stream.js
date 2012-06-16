/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var Stream = require('stream');
var util = require('util');

// This stream will store incoming data
function MemoryStream() {
  this.readable = false;
  this.writable = true;

  this.cache = [];
  this.streams = [];
  this.done = false;
  this.size = 0;
}
util.inherits(MemoryStream, Stream);
module.exports = MemoryStream;

MemoryStream.prototype.write = function (chunk) {
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
  var i = this.streams.length;
  while (i--) {
    this.streams[i].write(chunk);
  }

  // Cache the chunk
  this.cache.push(chunk);
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
  var i = this.streams.length;
  while (i--) {
    var stream = this.streams[i];
    if (stream.paused === false) {
      stream.resume();
    }
  }
};

MemoryStream.prototype.destroySoon = function () {
  this.destroy();
};

MemoryStream.prototype.relay = function () {
  var output = new OutputStream(this);

  // add this stream to write query
  if (this.writable) {
    this.streams.push(output);
  }

  return output;
};

// This stream will output the current cache and future data
function OutputStream(source) {
  var self = this;

  this.readable = true;
  this.writable = false;

  this.source = source;

  this.cache = [];
  this.cache.push.apply(this.cache, source.cache);

  this.draining = false;
  this.paused = false;

  // Allow this.pause() to be executed
  process.nextTick(function () {
    if(self.paused === false) {
      self.resume();
    }
  });
}
util.inherits(OutputStream, Stream);

OutputStream.prototype.pause = function () {
  this.paused = true;
};

OutputStream.prototype.resume = function () {
  if (this.draining) return;

  this.paused = false;
  this.draining = true;


  var self = this;
  process.nextTick(function writeChunk() {
    if (self.paused === true || self.readable === false) return;

    var chunk = self.cache.shift();
    if (chunk === undefined) {
      self.draining = false;
      self.emit('drain');

      if (self.source.writable === false) {
        self.emit('end');
        self.destroy();
      }
      return;
    }

    if (self.encoding) {
      chunk = chunk.toString(self.encoding, 0, chunk.length);
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
  this.encoding = encoding;
};

OutputStream.prototype.write = function (chunk) {
  this.cache.push(chunk);

  if (this.paused === false) {
    this.resume();
  }
};
