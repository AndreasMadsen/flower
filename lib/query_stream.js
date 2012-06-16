/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var Stream = require('stream');
var util = require('util');

// This stream will store incoming data
function QueryStream() {
  Stream.call(this);

  this.readable = true;
  this.writable = true;

  this.query = [];
  this.drained = true;
  this.paused = false;
  this.link = null;

  function error(error) {
    this.emit('error', error);
  }

  this.on('pipe', function (source) {
    if (this.link) {
      this.link.removeListener('error', error);
      this.link.destroy();
    }

    this.link = source;
    this.link.addListener('error', error);
  });
}
util.inherits(QueryStream, Stream);
module.exports = QueryStream;

QueryStream.prototype.pause = function () {
  if (this.readable === false) return;

  this.paused = true;

  if (this.link && this.link.pause) {
    this.link.pause();
  }
};

QueryStream.prototype.resume = function () {
  if (this.readable === false) return;
  if (this.drained === false && this.paused === false) return;

  var self = this;

  this.paused = false;
  this.drained = false;

  (function loop() {
    // query drained, link can resume
    if (self.query.length === 0) {
      return linkResume();
    }

    // if this.pause is called stop draining
    if (self.paused) {
      return;
    }

    // grap and send next chunk
    var fn = self.query.shift();
    fn();

    // drain next data chunk on next tick
    process.nextTick(loop);
  })();

  // resume stream link
  function linkResume() {
    if (self.link && self.link.resume) {
      self.link.resume();
    }
    done();
  }

  function done() {
    self.drained = true;
    self.emit('drain');
  }
};

QueryStream.prototype.write = function (chunk) {
  var fn = this.emit.bind(this, 'data', chunk);

  if (this.writable === false) {
    return this.emit('error', new Error("Can't write to closed stream"));
  }

  if (!this.drained || this.paused) {
    this.query.push(fn);
    return false;
  } else {
    fn();
    return true;
  }
};

QueryStream.prototype.end = function (chunk) {
  if (this.writable === false) {
    return this.emit('error', new Error("Can't write to closed stream"));
  }

  if (chunk) this.write(chunk);

  var fn = (function () {
    this.readable = false;
    this.writable = false;
    this.emit('end');
  }).bind(this);

  if (!this.drained || this.paused) {
    this.query.push(fn);
  } else {
    fn();
  }

  this.destroy();
};

QueryStream.prototype.destroy = function () {

  var fn = (function () {
    this.readable = false;
    this.writable = false;
    this.emit('close');
  }).bind(this);

  if (!this.drained || this.paused) {
    this.query.push(fn);
  } else {
    fn();
  }
};

QueryStream.prototype.destroySoon = QueryStream.prototype.destroy;
