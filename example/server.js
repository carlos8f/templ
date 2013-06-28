var middler = require('middler')
  , templ = require('../')
  , server = require('http').createServer()

middler(server)
  .add(templ(__dirname))
  .get('/hidden', function (req, res, next) {
    res.render('subdir/hidden');
  })
  .get('/', function (req, res, next) {
    res.render('index', {title: 'templ example', num: Math.random()});
  })
  .add(function (req, res, next) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('cannot ' + req.method + ' ' + req.url);
  })

server.listen(0, function() {
  console.log('listening on http://localhost:' + server.address().port + '/');
});
