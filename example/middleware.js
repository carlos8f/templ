var middler = require('middler')
  , templ = require('../')
  , server = require('http').createServer()

var root = process.argv[2] || __dirname;
var port = Number(typeof process.argv[3] !== 'undefined' && process.argv[3] || 3000);

middler(server)
  .add(templ(root))
  .get('/hidden', function (req, res, next) {
    res.render('subdir/hidden');
  })
  .get('/hidden/raw', function (req, res, next) {
    res.render('subdir/hidden', {layout: false});
  })
  .get('/', function (req, res, next) {
    res.vars.title = 'templ example';
    res.vars.num = Math.random();
    res.render('index');
  })
  .get('/feed.xml', function (req, res, next) {
    // render with a custom header
    res.render('feed', {layout: 'layouts/xml'}, {headers: {'content-type': 'text/xml'}});
  })
  .add('/admin', function (req, res, next) {
    res.renderStatus(403);
  })
  .add(function (req, res, next) {
    res.renderStatus(404, {title: 'error 404'});
  })

server.listen(port, function() {
  console.log('listening on http://localhost:' + server.address().port + '/');
});
