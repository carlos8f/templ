var middler = require('middler')
  , path = require('path')
  , templ = require('../')
  , server = require('http').createServer()
  , assert = require('assert')

var root = process.argv[2] || path.join(__dirname, 'views');
var port = Number(typeof process.argv[3] !== 'undefined' && process.argv[3] || 3000);

var middleware = templ(root);
assert(middleware._cache, '_cache should be the exposed cache property');

middler(server)
  .add(middleware)
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
  .get('/layout-override', function (req, res, next) {
    // override layout by passing a template function, and render pages/about.hbs inside it
    var precompiled = require('handlebars').compile('<cool>{{{content}}}</cool>');
    res.render('pages/about', {name: 'carlos'}, {layout: precompiled});
  })
  .add(function (req, res, next) {
    res.renderStatus(404, {title: 'error 404'});
  })

server.listen(port, function() {
  console.log('listening on http://localhost:' + server.address().port + '/');
});
