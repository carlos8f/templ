var handlebars = require('handlebars')
  , dollop = require('dollop')
  , dish = require('dish')
  , path = require('path')
  , inherits = require('util').inherits

function Templ (globs, options) {
  if (globs.constructor === Object) {
    options = globs;
    globs = null;
  }
  if (!globs) globs = 'views/**/*.hbs';
  dollop.Dollop.call(this, globs, options);
  var self = this;
  this.once('ready', function (files) {
    files.forEach(function (file) {
      if (file.stat.isFile()) self.compile(file);
    });
  });
  this.on('all', function (ev, file) {
    switch (ev) {
      case 'add':
      case 'update':
        return self.compile(file);
      case 'remove':
        return self.remove(file);
    }
  });
}
inherits(Templ, dollop.Dollop);

Templ.prototype.compile = function (file) {
  try {
    file.template = handlebars.compile(file.readSync({encoding: 'utf8'}));
    handlebars.registerPartial(file.pluginPath.replace(/^\//, ''), file.template);
  }
  catch (e) {
    throw e;
    this.cache.del(file.key);
  }
};

Templ.prototype.remove = function (file) {
  this.cache.del(file.key);
  handlebars.registerPartial(file.pluginPath, null);
};

Templ.prototype.middleware = function () {
  var self = this;
  return function (req, res, next) {
    function render (p, context, options) {
      var file = self.cache.values().filter(function (file) {
        return file.pluginPath === '/' + p;
      }).pop();
      if (typeof file === 'undefined') throw new Error('template not found: ' + p);
      var layout = 'layout'
        , html
      context || (context = res.vars);
      options || (options = {});
      if (typeof context.layout !== 'undefined') options.layout = context.layout;
      options.status || (options.status = 200);
      options.headers || (options.headers = {});
      options.headers['content-type'] || (options.headers['content-type'] = 'text/html');

      if (options.layout) layout = options.layout;
      if (options.layout === false) html = file.template(context);
      else {
        if (typeof layout !== 'function') {
          // resolve layout basename => cache path => compiled template
          var layoutFile = self.cache.values().filter(function (file) {
            return file.pluginPath === '/' + layout;
          }).pop();
          if (typeof layoutFile === 'undefined') throw new Error('layout not found: ' + layout);
          layout = layoutFile.template;
        }
        context.content = file.template(context);
        html = layout(context);
      }
      var serve = dish(html, options);
      serve(req, res);
    }
    res.render = function (p, context, options) {
      if (self.ready) render(p, context, options);
      else self.once('ready', function () { render(p, context, options) });
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
};

module.exports = function (globs, options) {
  var t = new Templ(globs, options);
  var mw = t.middleware();
  mw._cache = t.cache;
  return mw;
};

module.exports.Templ = Templ;
module.exports.handlebars = handlebars;
