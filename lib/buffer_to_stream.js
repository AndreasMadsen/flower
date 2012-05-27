/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var Stream = require('stream');
var util = require('util')

function Buffer2stream(buffer, options) {
  var self = this;

  this.readable = true;
  this.writable = false;

  this.stop = false;
  this.paused = false;

  this.position = 0;
  this.buffer = buffer;
  this.chunkSize = (options && options.chunkSize) ? options.chunkSize : 64 * 1024;

  this.on('error', function (error) {
    this.stop = true;

    if (this.listeners('error').length > 1) throw error;
  });

  process.nextTick(function () {
    if (self.paused === false) {
      self.resume();
    }
  });
}
util.inherits(Buffer2stream, Stream);
module.exports = Buffer2stream;

Buffer2stream.prototype.pause = function () {
  this.paused = true;
};

Buffer2stream.prototype.resume = function () {
  var self = this;
  this.paused = false;
  if (this.stop === true) return;

  (function writeChunk() {
    process.nextTick(function () {

      // if write stream is paused don't do anything
      if (self.paused || self.stop) return;

      // this won't be the last writen chunk
      if (self.position + self.chunkSize < self.buffer.length) {
        self.write(self.buffer.slice(self.position, self.position + self.chunkSize));
        self.position += self.chunkSize;

        return writeChunk();
      }

      // last chunk
      self.stop = true;
      self.write(self.buffer.slice(self.position, self.buffer.length));
      self.emit('end');
      self.destroy();
    });
  })();
};

Buffer2stream.prototype.write = function (chunk) {
  this.emit('data', chunk);

  if (this.stop || this.paused) {
    return false;
  }
  return true;
};

Buffer2stream.prototype.destroy = function () {
  if (this.buffer === null) return;

  this.stop = true;
  this.position = this.buffer.length;
  this.buffer = null;
  this.emit('close');
};
