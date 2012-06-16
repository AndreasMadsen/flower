#flowers

**flowers is a collection of stream helpers.**

## Installation

```sheel
npm install flowers
```

##API documentation

### flowers.relayReadStream()

_Also available as javascript constructor at `flowers.RelayReadStream()`_

Will return a `ReadStream` object there does except for relaying pipe output.

The main usercase is that you expose function there don't have a callback
but returns a stream. However you have to do an async operation before
createing the readstream, so you can't return the stream object directly.

```JavaScript
exports.read = function () {
  var relay = flowers.relayReadStream();

  process.nextTick(function () {
    fs.createReadStream('file.txt').pipe(relay);
  });

  return relay;
};
```

### flowers.queryStream()

_Also available as javascript constructor at `flowers.QueryStream()`_

Will return a `ReadStream` and `WritStream` object.

The stream is much like `flower.relayReadStream()` however it is much more
complex. This has both advantages and disadvantages.

The advantages are that you can write to the stream as much as you want
but the data chunks won't emit if it is paused. Instead they gets pulled
to an query list. You can also apply multiply pipes to the stream, the
previouse piped `ReadStream` will simply be destroy to prevent race
conditions.

The disadvantages with this stream is that you easily will end up with
a huge query stack consumeing a lot of memory.

```JavaScript
var output = flowers.queryStream();
output.pause();
output.write('A');
output.write('B');

var input = fs.createWritStream('file.txt');
input.on('open', function () {
  output.pipe(input);
  output.resume();
});
```

### flowers.memoryStream()

_Also available as javascript constructor at `flowers.MemoryStream()`_

returns `WriteStream` that you can pipe to using a `ReadStream`. The data chunks
will be stored seperatly in the `memoryStream`, on the same time or after data are
being piped to the `memoryStream` you can create a new `ReadStream` from it by using
``memoryStream.relay()`, the returned `ReadStream` will then emit the stored an new
chunks in propper order.

Note add chunks are writen to the `memoryStream` its `size` property will increase. This
property contains the total buffer size.

Example of how this can be used to implement a filecache

```JavaScript
var filecache = {};

function request(filename) {
  if (filecache[filename] === undefined) {
    filecache[filename] = flower.memoryStream();
    fs.createReadStream(filename).pipe(filecache[filename]);
  }
  return filecache[filename].relay();
}

// request files
request('file.txt');

//multiply request will share the filestream
request('file.txt');
request('file.txt');
```

### flowers.buffer2stream(buffer, [options])

_Also available as javascript constructor at `flowers.Buffer2stream()`_

Takes a buffer or string and splits it up intro chunks there is emitted in
a `ReadStream` object.

The `options` object takes a `chunkSize` property there tell how big each chunk
should be in bytes. By default this is `64 * 1024`.

```JavaScript
var stream = flowers.buffer2stream(buffer);

stream.pipe(fs.createWriteStream('file.txt'));
};
```

### flowers.stream2buffer(stream, callback)

Takes a `ReadStream` and buffer it up until the stream is closed or an error occurred.
The buffer is then send as a callback argument.

The `callback` have two arguments `error` and `buffer`.

The `options` object takes a `chunkSize` property there tell how big each chunk
should be in bytes. By default this is `64 * 1024`.

```JavaScript
var stream = fs.createReadStream('file.txt');

flowers.stream2buffer(stream, function (error, buffer) {

});
```

##License

**The software is license under "MIT"**

> Copyright (c) 2012 Andreas Madsen
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
