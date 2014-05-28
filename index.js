var handlebars = require('handlebars')
  , saw = require('saw')
  , fs = require('graceful-fs')
  , dish = require('dish')
  , path = require('path')

module.exports = function (pattern, options) {
  if (pattern && pattern.constructor === Object) {
    options = pattern;
    pattern = null;
  }
  options || (options = {});
  if (Array.isArray(pattern)) {
    pattern = pattern.length < 2 ? pattern[0] : '{' + (pattern.join(',')) + '}';
  }
  else if (!pattern) pattern = './views';

  try {
    var stat = fs.statSync(pattern);
    if (stat && stat.isDirectory()) {
      options.cwd || (options.cwd = path.resolve(pattern));
      pattern = pattern.replace(path.sep, '/');
      pattern = pattern.replace(new RegExp(path.sep + '$', ''), '') + '/**/*.hbs';
    }
  }
  catch (e) {
    options.cwd || (options.cwd = path.resolve(process.cwd()));
  }

  var cache = {}
    , q = []

  function getPath (file) {
    return file.fullPath.replace(options.cwd, '').replace(/\.[^\.]+$/, '');
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
    if (!s.ready) return;
    var args = q.shift();
    if (args) {
      render.apply(null, args);
      setImmediate(renderQueue);
    }
  }

  function render (p, context, req, res, options) {
    if (typeof cache[p] === 'undefined') throw new Error('template not found: ' + p);

    var layout = 'layout'
      , html

    context || (context = res.vars);
    options || (options = {});
    if (typeof context.layout !== 'undefined') options.layout = context.layout;
    options.status || (options.status = 200);
    options.headers || (options.headers = {});
    options.headers['content-type'] || (options.headers['content-type'] = 'text/html');

    if (options.layout) layout = options.layout;
    if (options.layout === false) html = cache[p](context);
    else {
      if (typeof layout !== 'function') {
        // resolve layout basename => cache path => compiled template
        layout = path.sep + layout;
        if (typeof cache[layout] === 'undefined') throw new Error('layout not found: ' + layout);
        layout = cache[layout];
      }
      context.content = cache[p](context);
      html = layout(context);
    }
    var serve = dish(html, options);
    serve(req, res);
  }

  var s = saw(pattern, {cwd: options.cwd})
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

  var middleware = function (req, res, next) {
    res.render = function (p, context, options) {
      p = path.sep + p;
      if (s.ready) render(p, context, req, res, options);
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
    res.vars = {};
    next && next();
  };

  // expose cache, but it should NOT be altered externally.
  middleware._cache = cache;

  return middleware;
};

module.exports.handlebars = handlebars;
