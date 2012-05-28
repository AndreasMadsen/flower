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
vows.describe('testing relay read stream').addBatch({

  'when pipeing to a paused relay stream': {
    topic: function () {
      var self = this;

      crypto.randomBytes(Math.round(64 * 1024 * 4.66), function (error, buffer) {
        if (error) return self.callback(error, null);

        // convert to alphabetic chars
        var content = buffer.toString('hex', 0, buffer.length);

        fs.writeFile(filepath, content, 'utf8', function (error) {
          if (error) return self.callback(error, null);

          // create a paused relay stream
          var relay = flower.relayReadStream();
              relay.pause();

          // pipe file stream to relay
          fs.createReadStream(filepath).pipe(relay);

          self.callback(null, relay, content);
        });
      });
    },

    'no data should emit': function (error, stream) {
      assert.ifError(error);

      var data = '';
      var onchunk = function (chunk) {
        data += chunk;
      };

      stream.on('data', onchunk);

      setTimeout(function() {
        assert.equal(data, '');
      }, 300);
    },

    'when relay stream is resumed and the paused': {
      topic: function (stream, content) {
        var self = this;

        stream.once('data', function (chunk) {
          stream.pause();

          self.callback(null, stream, chunk, content);
        });

        stream.resume();
      },

      'the first chunks should be emitted': function (error, stream, chunk, content) {
        assert.ifError(error);

        assert.equal(chunk.toString(), content.substr(0, chunk.length));
      },

      'when relay stream is resumed again': {
        topic: function (stream, chunk, content) {
          var self = this;

          common.handleStream(stream, function (error, buffer) {
            self.callback(error, buffer, content, chunk);
          });

          stream.resume();
        },

        'the remaining chunks should be emitted': function (error, buffer, content, chunk) {
          assert.ifError(error);

          assert.equal(buffer.length, content.length - chunk.length);
          assert.equal(buffer.toString(), content.substr(chunk.length, content.length));
        }
      }
    }
  }

}).exportTo(module);
