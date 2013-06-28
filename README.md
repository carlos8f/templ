templ
=====

yet another lightweight templating thing

[![build status](https://secure.travis-ci.org/carlos8f/templ.png)](http://travis-ci.org/carlos8f/templ)

## Idea

Just a good, simple, [handlebars](http://handlebarsjs.com/)-based templating
middleware.

### Features

- handlebars
- works with [Express](http://expressjs.com/),
  [Connect](http://www.senchalabs.org/connect/),
  [middler](https://github.com/carlos8f/node-middler), etc
- pre-compiles your templates for speed
- layouts
- transparent partials support - no need to register partials
- gzip support
- ETag support
- built-in file watcher with dynamic recompilation
- custom header support, i.e., can serve XML feeds, etc.

## Usage

### Middleware

Using [middler](https://github.com/carlos8f/node-middler)

```js
var middler = require('middler')
  , templ = require('templ')
  , server = require('http').createServer()

middler(server)
  // simply call templ() with the template root folder, and you get a middleware
  // which provides the render() and renderStatus() methods.
  .add(templ('path/to/views'))
  .get('/', function (req, res, next) {
    // use layout.hbs as layout, and render index.hbs inside it
    res.render('index');
  })
  .get('/about', function (req, res, next) {
    // use layouts/about.hbs as layout, and render pages/about.hbs inside it
    // the second argument is available as vars in the templates
    res.render('pages/about', {name: 'carlos'}, {layout: 'layouts/about'});
  })
  .get('/raw', function (req, res, next) {
    // render raw.hbs directly
    res.render('raw', null, {layout: false});
  })
  .get('/feed.xml', function (req, res, next) {
    // render feed.hbs with a custom header
    res.render('feed', null, {headers: {'content-type': 'text/xml'}});
  })
  .add(function (req, res, next) {
    // 404 status code, use layout.hbs as layout, and render
    // status-404.hbs inside it
    res.renderStatus(404, {title: 'error 404'});
  })
```

### Basic

Using without a middleware runner

```js
// template root is implied as ./ or ./views
var templ = require('templ')()
  , server = require('http').createServer()

server.on('request', function (req, res) {
  templ(req, res, function () {
    // now res.render() is available. call with template path and variables
    res.render('index', {title: 'basic templ example', num: Math.random()});
  });
});
```

- - -

### Developed by [Terra Eclipse](http://www.terraeclipse.com)
Terra Eclipse, Inc. is a nationally recognized political technology and
strategy firm located in Aptos, CA and Washington, D.C.

- - -

### License: MIT

- Copyright (C) 2013 Carlos Rodriguez (http://s8f.org/)
- Copyright (C) 2013 Terra Eclipse, Inc. (http://www.terraeclipse.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the &quot;Software&quot;), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
