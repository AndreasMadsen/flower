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

  var intern = this.flower = {
    drained: true,
    paused: false,
    query: [],
    link: null
  };

  function error(error) {
    this.emit('error', error);
  }

  this.on('pipe', function (source) {
    if (intern.link) {
      intern.link.removeListener('error', error);
      intern.link.destroy();
    }

    intern.link = source;
    intern.link.addListener('error', error);
  });
}
util.inherits(QueryStream, Stream);
module.exports = QueryStream;

QueryStream.prototype.pause = function () {
  var intern = this.flower;
  if (this.readable === false) return;

  intern.paused = true;

  if (intern.link && intern.link.pause) {
    intern.link.pause();
  }
};

QueryStream.prototype.resume = function () {
  var self = this;
  var intern = this.flower;

  if (this.readable === false) return;
  if (intern.drained === false && intern.paused === false) return;

  intern.paused = false;
  intern.drained = false;

  (function loop() {
    // query drained, link can resume
    if (intern.query.length === 0) {
      return linkResume();
    }

    // if this.pause is called stop draining
    if (intern.paused) {
      return;
    }

    // grap and send next chunk
    var fn = intern.query.shift();
    fn();

    // drain next data chunk on next tick
    process.nextTick(loop);
  })();

  // resume stream link
  function linkResume() {
    if (intern.link && intern.link.resume) {
      intern.link.resume();
    }
    done();
  }

  function done() {
    intern.drained = true;
    self.emit('drain');
  }
};

QueryStream.prototype.write = function (chunk) {
  var intern = this.flower;
  var fn = this.emit.bind(this, 'data', chunk);

  if (this.writable === false) {
    return this.emit('error', new Error("Can't write to closed stream"));
  }

  if (!intern.drained || intern.paused) {
    intern.query.push(fn);
    return false;
  } else {
    fn();
    return true;
  }
};

QueryStream.prototype.end = function (chunk) {
  var intern = this.flower;

  if (this.writable === false) {
    return this.emit('error', new Error("Can't write to closed stream"));
  }

  if (chunk) this.write(chunk);

  var fn = (function () {
    this.readable = false;
    this.writable = false;
    this.emit('end');
  }).bind(this);

  if (!intern.drained || intern.paused) {
    intern.query.push(fn);
  } else {
    fn();
  }

  this.destroy();
};

QueryStream.prototype.destroy = function () {
  var intern = this.flower;

  var fn = (function () {
    this.readable = false;
    this.writable = false;

    if (intern.link && intern.link.readable || intern.link.writable) {
      intern.link.destroy();
      intern.link.once('close', this.emit.bind(this, 'close'));
    } else {
      this.emit('close');
    }
  }).bind(this);

  if (!intern.drained || intern.paused) {
    intern.query.push(fn);
  } else {
    fn();
  }
};

QueryStream.prototype.destroySoon = QueryStream.prototype.destroy;
