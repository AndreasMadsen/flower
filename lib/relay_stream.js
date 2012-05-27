/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var Stream = require('stream');
var util = require('util')

// Will relay a stream
function RelayStream() {
  Stream.apply(this, arguments);
  this.readable = true;
  this.writable = true;

  // contains pause query
  this.paused = false;

  // hack: will ignore end and close event pipe
  this._isStdio = true;

  this.source = null;
  this.once('pipe', function (source) {
    if (this.source) {
      return this.emit('error', new Error('only one pipe can be made'));
    }

    this.source = source;

    // relay end, close and error
    this.source.once('end', this.emit.bind(self, 'end'));
    this.source.once('close', this.emit.bind(self, 'close'));
    this.source.once('error', this.emit.bind(self, 'error'));

    if (this.paused) {
      source.pause();
    } else {
      source.resume();
    }
  });
}
util.inherits(RelayStream, Stream);
module.exports = RelayStream;

RelayStream.prototype.pause = function () {
  this.paused = true;

  if (this.source) return this.source.pause.apply(this.source, arguments);
};

RelayStream.prototype.resume = function () {
  this.paused = false;

  if (this.source) return this.source.resume.apply(this.source, arguments);
};

RelayStream.prototype.write = function () {
  return this.emit.apply(this, ['data'].concat(toArray(arguments)));
};

RelayStream.prototype.destroy = function () {
  if (this.source) return this.source.destroy.apply(this.source, arguments);

  this.query.push({ 'fn': this.destroy, 'args': arguments });
};

function toArray(input) {
  var output = [];
  for (var i = 0, l = input.length; i < l; i++) {
    output.push(input[i]);
  }
  return output;
}
