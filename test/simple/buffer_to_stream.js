/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var vows = require('vows'),
    crypto = require('crypto'),
    assert = require('assert'),
    common = require('../common.js'),
    flower = require(common.flower);

// remove temp content
common.reset();

vows.describe('testing buffer to stream').addBatch({

  'when pipeing to a paused relay stream': {
    topic: function () {
      var self = this;

      crypto.randomBytes(Math.round(64 * 1024 * 4.66), function (error, buffer) {
        if (error) return self.callback(error, null);

        // convert to alphabetic chars
        var source = buffer.toString('hex', 0, buffer.length);

        common.handleStream(flower.buffer2stream(source), function (error, output) {
          self.callback(error, source, output);
        });
      });
    },

    'the data stream should match': function (error, source, output) {
      assert.ifError(error);

      assert.equal(source.length, output.length);
      assert.equal(source, output);
    }
  }

}).exportTo(module);
