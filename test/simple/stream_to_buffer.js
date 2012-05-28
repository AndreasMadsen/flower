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
vows.describe('testing stream to buffer').addBatch({

  'when pipeing to a paused relay stream': {
    topic: function () {
      var self = this;

      crypto.randomBytes(Math.round(64 * 1024 * 4.66), function (error, buffer) {
        if (error) return self.callback(error, null);

        // convert to alphabetic chars
        var content = buffer.toString('hex', 0, buffer.length);

        fs.writeFile(filepath, content, 'utf8', function (error) {
          if (error) return self.callback(error, null);

          // create file stream
          var stream = fs.createReadStream(filepath);

          // create a paused relay stream
          flower.stream2buffer(stream, function (error, buffer) {
            self.callback(error, buffer, content);
          });
        });
      });
    },

    'the data stream should match': function (error, buffer, content) {
      assert.ifError(error);

      assert.equal(buffer.length, content.length);
      assert.equal(buffer.toString(), content);
    }
  }

}).exportTo(module);
