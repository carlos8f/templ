var middler = require('middler')
  , templ = require('../')
  , server = require('http').createServer()

middler(server)
  .add(templ(process.argv[2] || __dirname))
  .get('/hidden', function (req, res, next) {
    res.render('subdir/hidden');
  })
  .get('/hidden/raw', function (req, res, next) {
    res.render('subdir/hidden', {layout: false});
  })
  .get('/', function (req, res, next) {
    res.render('index', {title: 'templ example', num: Math.random()});
  })
  .add(function (req, res, next) {
    res.renderStatus(404, {title: 'error 404'});
  })

server.listen(0, function() {
  console.log('listening on http://localhost:' + server.address().port + '/');
});
