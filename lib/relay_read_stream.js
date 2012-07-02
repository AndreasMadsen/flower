/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var Stream = require('stream');
var util = require('util')

// Will relay a stream
function RelayStream() {
  Stream.call(this);

  this.readable = true;
  this.writable = true;

  // contains pause query
  var intern = this.flower = {
    paused: false,
    source: null
  };

  // hack: will ignore end and close event pipe
  this._isStdio = true;

  this.once('pipe', function (source) {
    if (intern.source) {
      return this.emit('error', new Error('only one pipe can be made'));
    }

    intern.source = source;

    // relay end, close and error
    source.once('end', this.emit.bind(this, 'end'));
    source.once('close', this.emit.bind(this, 'close'));
    source.once('error', this.emit.bind(this, 'error'));

    if (intern.paused) {
      source.pause();
    } else {
      source.resume();
    }
  });
}
util.inherits(RelayStream, Stream);
module.exports = RelayStream;

RelayStream.prototype.pause = function () {
  var intern = this.flower;
  intern.paused = true;

  if (intern.source) return intern.source.pause.apply(intern.source, arguments);
};

RelayStream.prototype.resume = function () {
  var intern = this.flower;
  intern.paused = false;

  if (intern.source) return intern.source.resume.apply(intern.source, arguments);
};

RelayStream.prototype.write = function () {
  return this.emit.apply(this, ['data'].concat(toArray(arguments)));
};

RelayStream.prototype.destroy = function () {
  var intern = this.flower;
  if (intern.source) return intern.source.destroy.apply(intern.source, arguments);

  intern.query.push({ 'fn': this.destroy, 'args': arguments });
};

function toArray(input) {
  var output = [];
  for (var i = 0, l = input.length; i < l; i++) {
    output.push(input[i]);
  }
  return output;
}
