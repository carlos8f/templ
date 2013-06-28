var templ = require('../')()
  , server = require('http').createServer()

server.on('request', function (req, res) {
  templ(req, res, function () {
    res.render('index', {title: 'basic templ example', num: Math.random()});
  });
});

server.listen(3000, function () {
  console.log('listening on http://localhost:' + server.address().port + '/');
});
