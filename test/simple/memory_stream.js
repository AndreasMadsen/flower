/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var vows = require('vows'),
    path = require('path'),
    util = require('util'),
    fs = require('fs'),
    crypto = require('crypto'),
    assert = require('assert'),
    common = require('../common.js'),
    flower = require(common.flower);

// remove temp content
common.reset();

var filepath = path.resolve(common.temp, 'temp.txt');

var content, memory;
vows.describe('testing stream to buffer').addBatch({

  'when creating a memory stream': {
    topic: function () {
      var self = this;

      crypto.randomBytes(Math.round(64 * 1024 * 4.66), function (error, buffer) {
        if (error) return self.callback(error, null);

        // convert to alphabetic chars
        content = buffer.toString('hex', 0, buffer.length);

        fs.writeFile(filepath, content, 'utf8', function (error) {
          if (error) return self.callback(error, null);

          // create mempory stream and pipe a file stream to it
          memory = flower.memoryStream();
          fs.createReadStream(filepath).pipe(memory);

          // TESTCASE: this can be emitted at any time so it can't be contained in a context
          memory.once('close', function () {
            assert.equal(memory.size, content.length);
          });

          // create a paused relay stream
          self.callback(error, memory, content);
        });
      });
    },

    'no error should exist': function (error, memory, content) {
      assert.ifError(error);
    }
  }
}).addBatch({

  'simulation output streams': {
    topic: function () {
      var streams = [];

      var stream1 = memory.relay();
          stream1.pause();
      streams.push(stream1);

      var stream2 = memory.relay();
          stream2.pause();
      streams.push(stream2);

      this.callback(null, streams);
    },

    'can be paused independently': function (error, streams) {
      assert.ifError(error);

      var ondata = function () {
        throw new Error('second stream should not emit data');
      };

      streams[1].once('data', ondata);

      streams[0].once('data', function (chunk) {
        streams[1].removeListener('data', ondata);
        streams[0].pause();

        assert.equal(chunk, content.substr(0, chunk.length));
      });
      streams[0].resume();
    }
  }
}).addBatch({

  'simulation output streams': {
    topic: function () {
      var self = this;

      var stream1 = memory.relay();
          stream1.point = 1;

      flower.stream2buffer(stream1, function (error, buffer1) {
        if (error) return self.callback(error);

        var stream2 = memory.relay();
            stream2.point = 2;

        flower.stream2buffer(stream2, function (error, buffer2) {
          if (error) return self.callback(error);

          self.callback(error, [buffer1, buffer2]);
        });
      });
    },

    'should be emitted equally': function (error, buffers) {
      assert.ifError(error);

      assert.equal(buffers[0].toString(), buffers[1].toString());
    }
  }
}).exportTo(module);
