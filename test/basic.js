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
      assert(body.match(/<title>templ example<\/title>/));
      assert(body.match(/<h1>templ example<\/h1>/));
      assert(body.match(/your number is: \d\.\d+/));
      assert(body.match(/<div class="hidden">I am a hidden page!<\/div>/));
      done();
    });
  });
  it('hits hidden page', function (done) {
    request('http://localhost:' + port + '/hidden', function (err, resp, body) {
      assert.ifError(err);
      assert(body.match(/<title><\/title>/));
      assert(body.match(/<h1><\/h1>/));
      assert(body.match(/I am a hidden page!/));
      done();
    });
  });
});
