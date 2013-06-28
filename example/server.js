var middler = require('middler')
  , templ = require('../')
  , server = require('http').createServer()

middler(server)
  .add(templ(__dirname))
  .add(function(req, res, next) {
    res.render('index', {title: 'templ example', num: Math.random()});
  });

server.listen(0, function() {
  console.log('listening on http://localhost:' + server.address().port + '/');
});
