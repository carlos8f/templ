var path = require('path')
  , templ = require('../')(path.join(__dirname, 'views'))
  , server = require('http').createServer()

server.on('request', function (req, res) {
  templ(req, res);
  if (req.url === '/') {
    res.render('index', {title: 'basic templ example', num: Math.random()});
  }
  else res.renderStatus(404);
});

server.listen(3000, function () {
  console.log('listening on http://localhost:' + server.address().port + '/');
});
