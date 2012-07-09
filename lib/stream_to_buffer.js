/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

function stream2buffer(input, callback) {
  var size = 0;
  var content = [];
  var called = false;

  input.on('data', function (chunk) {
    if (typeof chunk === 'string') {
      chunk = new Buffer(chunk);
    }

    size += chunk.length;
    content.push(chunk);
  });

  input.on('error', function (error) {
    if (called) return;
    called = true;
    callback(error, null);
  });

  input.once('end', function () {
    var buffer = new Buffer(size);
    var i = content.length;
    var pos = size;
    var from;

    while (i--) {
      from = content[i];
      pos = pos - from.length;
      from.copy(buffer, pos);
    }

    if (called) return;
    called = true;
    callback(null, buffer);
  });
}
module.exports = stream2buffer;
