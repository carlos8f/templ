var handlebars = require('handlebars')
  , saw = require('saw')
  , fs = require('graceful-fs')
  , dish = require('dish')
  , path = require('path')

module.exports = function (root) {
  var ready = false;

  if (typeof root === 'function') {
    cb = root;
    root = null;
  }
  root || (root = path.resolve('views'));
  root = fs.realpathSync(path.resolve(root));

  var cache = {}
    , q = []
    , ext = /\.(hbs|handlebars|tpl|html|htm)$/

  function getPath (file) {
    if (!file.name.match(ext)) return false;
    return file.fullPath.replace(root, '').replace(/^\/views/, '').replace(ext, '');
  }

  function compile (file, done) {
    var p = getPath(file);
    if (!p) return done && done();
    fs.readFile(file.fullPath, {encoding: 'utf8'}, function (err, contents) {
      if (err) {
        if (done) return done(err);
        else throw err;
      }
      try {
        cache[p] = handlebars.compile(contents);
      }
      catch (e) {
        remove(file);
        if (done) return done(e);
        else throw e;
      }
      done && done();
    });
  }

  function remove (file) {
    var p = getPath(file);
    if (!p) return;
    delete cache[p];
  }

  function enqueue () {
    q.push([].slice.call(arguments));
  }

  function renderQueue () {
    ready = true;
    var args = q.shift();
    if (args) {
      render.apply(null, args);
      if (typeof setImmediate !== 'undefined') setImmediate(renderQueue);
      else process.nextTick(renderQueue);
    }
  }

  function render (p, context, req, res, status) {
    if (typeof cache[p] === 'undefined') throw new Error('template not found: ' + p);

    var layout = 'layout'
      , html

    context || (context = {});
    context.options || (context.options = {});
    context.options.headers || (context.options.headers = {});
    context.options.headers['content-type'] || (context.options.headers['content-type'] = 'text/html');

    if (context.layout) layout = context.layout;
    if (context.layout === false) html = cache[p](context);
    else {
      layout = path.sep + layout;
      if (typeof cache[layout] === 'undefined') throw new Error('layout not found: ' + layout);
      context.content = cache[p](context);
      html = cache[layout](context);
    }
    var serve = dish(html, context.options || null);
    if (context.options.status) status = context.options.status;
    // @todo: dish() does bind(), bad for performance...?
    serve(req, res, status);
  }

  var s = saw(root)
    .on('all', function (ev, file) {
      switch (ev) {
        case 'add':
        case 'update':
          return compile(file);
        case 'remove':
          return remove(file);
      }
    })
    .once('ready', function (files) {
      if (!files.length) return renderQueue();
      var latch = files.length, errored = false;
      files.forEach(function (file) {
        compile(file, function (err) {
          if (errored) return;
          if (err) {
            errored = true;
            throw err;
          }
          if (!--latch) renderQueue();
        });
      });
    })

  return function (req, res, next) {
    res.render = function (p, context, status) {
      p = path.sep + p;
      if (ready) render(p, context, req, res, status);
      else enqueue(p, context, req, res, status);
    };
    res.renderStatus = function (status, p, context) {
      if (!p) p = 'status-' + status;
      res.render(p, context, status);
    };
    next();
  };
};
