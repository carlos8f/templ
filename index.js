var handlebars = require('handlebars')
  , Mayonnaise = require('mayonnaise').Mayonnaise
  , dish = require('dish')
  , path = require('path')
  , fs = require('fs')
  , inherits = require('util').inherits

function Templ (specs, options) {
  if (specs.constructor === Object) {
    options = specs;
    specs = null;
  }
  Mayonnaise.call(this, specs, options);
  this.on('all', function (op, file) {
    switch (op) {
      case 'add': case 'update':
        handlebars.registerPartial(file.pluginPath, file.plugin);
        break;
    }
  });
}
inherits(Templ, Mayonnaise);

Templ.prototype.makePluginPath = function (file) {
  return file.key
    .replace(/\.[^\.]+$/, '')
    .replace(/^\//, '');
};

Templ.prototype.compile = function (file) {
  if (file.name.match(/\.(hbs|handlebars)$/)) {
    return handlebars.compile(file.data({encoding: 'utf8'}));
  }
};

Templ.prototype.middleware = function () {
  var self = this;
  return function (req, res, next) {
    // instrument res with render methods
    res.render = function (p, context, options) {
      function render () {
        var file = self.getPlugin(p);
        if (typeof file === 'undefined') throw new Error('template not found: ' + p);
        var template = file.plugin;
        var layout = 'layout', rendered;
        context || (context = res.vars);
        options || (options = {});
        if (typeof context.layout !== 'undefined') options.layout = context.layout;
        options.status || (options.status = 200);
        options.headers || (options.headers = {});
        options.headers['content-type'] || (options.headers['content-type'] = 'text/html');

        if (options.layout) layout = options.layout;
        if (options.layout === false) dish(template(context), options)(req, res, next);
        else {
          if (typeof layout !== 'function') {
            layoutFile = self.getPlugin(layout);
            if (typeof layoutFile === 'undefined') throw new Error('layout not found: ' + layout);
            layout = layoutFile.plugin;
          }
          context.content = template(context);
          dish(layout(context), options)(req, res, next);
        }
      }
      if (self.ready) render();
      else self.once('ready', render);
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

module.exports = function (root, options) {
  if (!root) {
    try {
      var stat = fs.statSync('views');
      root = path.resolve('views');
    }
    catch (e) {}
  }
  return new Templ([{globs: '**/*.hbs', cwd: root}], options).middleware(options);
};

module.exports.Templ = Templ;
module.exports.handlebars = handlebars;
