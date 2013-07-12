var handlebars = require('handlebars')
  , saw = require('saw')
  , fs = require('graceful-fs')
  , dish = require('dish')
  , path = require('path')

module.exports = function (root) {
  var ready = false, autoRoot = false;

  if (typeof root === 'function') {
    cb = root;
    root = null;
  }
  if (!root) {
    root = './views';
    autoRoot = true;
  }
  root || (root = './views');
  try {
    root = fs.realpathSync(path.resolve(root));
  }
  catch (e) {
    if (e.code === 'ENOENT' && autoRoot) {
      root = fs.realpathSync(process.cwd());
    }
    else throw e;
  }

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
    fs.readFile(file.fullPath, function (err, contents) {
      if (err) {
        if (done) return done(err);
        else throw err;
      }
      contents = String(contents);
      try {
        cache[p] = handlebars.compile(contents);
        handlebars.registerPartial(p.replace(path.sep, ''), cache[p]);
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
    handlebars.registerPartial(p.replace(path.sep, ''), null);
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

  function render (p, context, req, res, options) {
    if (typeof cache[p] === 'undefined') throw new Error('template not found: ' + p);

    var layout = 'layout'
      , html

    context || (context = {});
    options || (options = {});
    if (typeof context.layout !== 'undefined') options.layout = context.layout;
    options.status || (options.status = 200);
    options.headers || (options.headers = {});
    options.headers['content-type'] || (options.headers['content-type'] = 'text/html');

    if (options.layout) layout = options.layout;
    if (options.layout === false) html = cache[p](context);
    else {
      layout = path.sep + layout;
      if (typeof cache[layout] === 'undefined') throw new Error('layout not found: ' + layout);
      context.content = cache[p](context);
      html = cache[layout](context);
    }
    var serve = dish(html, options);
    // @todo: dish() does bind(), bad for performance...?
    serve(req, res, options.status);
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
    res.render = function (p, context, options) {
      p = path.sep + p;
      if (ready) render(p, context, req, res, options);
      else enqueue(p, context, req, res, options);
    };
    res.renderStatus = function (status, p, context) {
      if (typeof p === 'object') {
        context = p;
        p = null;
      }
      if (!p) p = 'status-' + status;
      try {
        res.render(p, context, {status: status});
      }
      catch (e) {
        res.writeHead(status);
        res.end();
      }
    };
    next && next();
  };
};
