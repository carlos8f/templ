describe('basic test', function () {
  var server, port, root;
  before(function (done) {
    root = '/tmp/templ-test-' + idgen();
    ncp(path.join(__dirname, '..', 'example', 'views'), root, done);
  });
  after(function (done) {
    rimraf(root, done);
  });
  before(function (done) {
    server = spawn('node', [path.resolve(__dirname, '..', 'example', 'middleware.js'), root, '0']);
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
  });
  it('hits example', function (done) {
    request('http://localhost:' + port + '/', function (err, resp, body) {
      assert.ifError(err);
      assert(body.match(/<title>templ example<\/title>/));
      assert(body.match(/<h1>templ example<\/h1>/));
      assert(body.match(/your number is: \d\.\d+/));
      assert(body.match(/<div class="hidden">this is a partial<\/div>/));
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
  it('serves xml file', function (done) {
    request('http://localhost:' + port + '/feed.xml', function (err, resp, body) {
      assert.ifError(err);
      assert.equal(resp.statusCode, 200);
      assert.equal(resp.headers['content-type'], 'text/xml');
      assert(body.trim().match(/^<xml>this is a fake feed<\/xml>$/));
      done();
    });
  });
  it('update template', function (done) {
    setTimeout(function () {
      fs.writeFile(path.join(root, 'subdir', 'partial.hbs'), 'fo shizzle!', function (err) {
        assert.ifError(err);
        setTimeout(done, 1000);
      });
    }, 1000);
  });
  it('serves updated template', function (done) {
    request('http://localhost:' + port + '/', function (err, resp, body) {
      assert.ifError(err);
      assert(body.match(/<div class="hidden">fo shizzle!<\/div>/));
      done();
    });
  });
  it('serves raw template', function (done) {
    request('http://localhost:' + port + '/hidden/raw', function (err, resp, body) {
      assert.ifError(err);
      assert(body.trim().match(/^I am a hidden page!$/));
      done();
    });
  });
  it('serves 404', function (done) {
    request('http://localhost:' + port + '/pony', function (err, resp, body) {
      assert.ifError(err);
      assert.equal(resp.statusCode, 404);
      assert(body.match(/<title>error 404<\/title>/));
      assert(body.match(/<h1>error 404<\/h1>/));
      assert(body.match(/page not found!/));
      done();
    });
  });
  it('serves 403', function (done) {
    request('http://localhost:' + port + '/admin', function (err, resp, body) {
      assert.ifError(err);
      assert.equal(resp.statusCode, 403);
      assert.equal(body, '');
      done();
    });
  });
});
