describe('example', function () {
  var server, port;
  before(function (done) {
    server = spawn('node', [path.resolve(__dirname, '..', 'example', 'server.js')]);
    process.once('exit', function () {
      server.kill();
    });
    server.stdout.on('data', function (data) {
      data = String(data);
      var match = data.match(/localhost:(.*)\//);
      assert(match);
      port = Number(match[1]);
      assert(port);
      done();
    });
    server.stderr.pipe(process.stderr);
    server.once('exit', console.error);
  });
  it('hits example', function (done) {
    request('http://localhost:' + port + '/', function (err, resp, body) {
      assert.ifError(err);
      console.log(body);
      done();
    });
  });
});
