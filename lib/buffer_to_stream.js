/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var Stream = require('stream');
var util = require('util');

function Buffer2stream(buffer, options) {
  Stream.call(this);

  var self = this;

  this.readable = true;
  this.writable = false;

  // make sure buffer is a real buffer
  if (Buffer.isBuffer(buffer) === false) {
    buffer = new Buffer(buffer.toString());
  }

  var intern = this.flower = {
    stop: false,
    paused: false,
    position: 0,
    buffer: buffer,
    chunkSize: (options && options.chunkSize) ? options.chunkSize : 64 * 1024
  };

  this.on('error', function (error) {
    intern.stop = true;

    if (this.listeners('error').length === 1) throw error;
  });

  process.nextTick(function () {
    if (intern.paused === false) {
      self.resume();
    }
  });
}
util.inherits(Buffer2stream, Stream);
module.exports = Buffer2stream;

Buffer2stream.prototype.pause = function () {
  this.flower.paused = true;
};

Buffer2stream.prototype.resume = function () {
  var self = this;
  var intern = this.flower;
  intern.paused = false;
  if (intern.stop === true) return;

  (function writeChunk() {
    process.nextTick(function () {

      // if write stream is paused don't do anything
      if (intern.paused || intern.stop) return;

      // this won't be the last writen chunk
      if (intern.position + intern.chunkSize < intern.buffer.length) {
        self.write(intern.buffer.slice(intern.position, intern.position + intern.chunkSize));
        intern.position += intern.chunkSize;

        return writeChunk();
      }

      // last chunk
      intern.stop = true;
      self.write(intern.buffer.slice(intern.position, intern.buffer.length));
      self.emit('end');
      self.destroy();
    });
  })();
};

Buffer2stream.prototype.write = function (chunk) {
  this.emit('data', chunk);

  if (this.flower.stop || this.flower.paused) {
    return false;
  }
  return true;
};

Buffer2stream.prototype.destroy = function () {
  var intern = this.flower;
  if (intern.buffer === null) return;

  intern.stop = true;
  intern.position = intern.buffer.length;
  intern.buffer = null;
  this.emit('close');
};
