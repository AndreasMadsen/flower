/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var vows = require('vows'),
    path = require('path'),
    fs = require('fs'),
    crypto = require('crypto'),
    assert = require('assert'),
    common = require('../common.js'),
    flower = require(common.flower);

// remove temp content
common.reset();

var filepath = path.resolve(common.temp, 'temp.txt');
var content, output;

var buffer = crypto.randomBytes(Math.round(64 * 1024 * 4.66));
var content = buffer.toString('hex', 0, buffer.length);
var output = flower.queryStream();
var result = '';
var position = 0;
output.on('data', function (chunk) {
  result += chunk;
});

fs.writeFileSync(filepath, content);

vows.describe('testing relay read stream').addBatch({

  'when writeing to output stream': {
    topic: function () {
      var self = this;

      output.once('data', function (chunk) {
        self.callback(null, chunk);
      });
      output.write('G');
    },

    'data chunk should emit': function (error, chunk) {
      assert.ifError(error);
      assert.equal(chunk, 'G');
    }
  }

}).addBatch({

  'when writeing to paused output stream': {
    topic: function () {
      var self = this;

      output.pause();
      output.write('H');

      var noemit = false;
      var timer = setTimeout(function() {
          noemit = true;
          output.resume();
      }, 50);

      output.once('data', function (chunk) {
        clearInterval(timer);
        self.callback(null, chunk, noemit);
      });
    },

    'data chunk should not': function (error, chunk, noemit) {
      assert.ifError(error);
      assert.equal(noemit, true);
    },

    'data chunk should emit when steam is resumed': function (error, chunk) {
      assert.ifError(error);
      assert.equal(chunk, 'H');
    }
  }

}).addBatch({

  'when short pipeing to output stream': {
    topic: function () {
      var self = this;

      output.pause();
      var stream = fs.createReadStream(filepath);
      stream.pipe(output, {end: false});

      var noemit = false;
      var timer = setTimeout(function() {
          noemit = true;
          output.resume();
      }, 50);

      output.once('data', function (chunk) {
        clearInterval(timer);
        output.pause();

        self.callback(null, chunk, noemit);
      });
    },

    'data chunk should not': function (error, chunk, noemit) {
      assert.ifError(error);
      assert.equal(noemit, true);
    },

    'one data chunk should emit when steam is resumed': function (error, chunk) {
      assert.ifError(error);

      assert.equal(chunk.toString(), content.slice(position, position + chunk.length));
      position += chunk.length;
    }
  }

}).addBatch({

  'when short pipeing again to output stream': {
    topic: function () {
      var self = this;

      var noemit = false;
      var timer = setTimeout(function() {
          noemit = true;
          output.resume();
      }, 50);

      output.once('data', function (chunk) {
        clearInterval(timer);
        output.pause();

        self.callback(null, chunk, noemit);
      });
    },

    'data chunk should not': function (error, chunk, noemit) {
      assert.ifError(error);
      assert.equal(noemit, true);
    },

    'one data chunk should emit when steam is resumed': function (error, chunk) {
      assert.ifError(error);

      assert.equal(chunk.toString(), content.slice(position, position + chunk.length));
    }
  }

}).addBatch({

  'when short pipeing anoher output stream': {
    topic: function () {
      var self = this;

      output.pause();
      var stream = fs.createReadStream(filepath);
      stream.pipe(output, {end: false});

      var noemit = false;
      var timer = setTimeout(function() {
          noemit = true;
          output.resume();
      }, 50);

      output.once('data', function (chunk) {
        clearInterval(timer);
        output.pause();

        self.callback(null, chunk, noemit);
      });
    },

    'data chunk should not': function (error, chunk, noemit) {
      assert.ifError(error);
      assert.equal(noemit, true);
    },

    'one data chunk should emit when steam is resumed': function (error, chunk) {
      assert.ifError(error);

      position = 0;
      assert.equal(chunk.toString(), content.slice(position, position + chunk.length));
      position += chunk.length;
    }
  }

}).addBatch({

  'when allowing input streams to dry': {
    topic: function () {
      global.begin = true;

      var self = this;

      var stream = fs.createReadStream(filepath);
      stream.pipe(output);

      var result = '';
      function handle(chunk) {
        result += chunk.toString();
      }
      output.on('data', handle);
      output.once('end', function () {
        output.removeListener('data', handle);
        self.callback(null, result);
      });

      output.resume();
    },

    'all data chunks should be emitted on stream': function (error, chunk) {
      assert.ifError(error);
      assert.equal(chunk, content);
    }
  }

}).exportTo(module);
