#!/usr/bin/env node
var express = require('express')
var serveStatic = require('serve-static')
var serveIndex = require('serve-index')
var fs = require('fs')
var chokidar = require('chokidar')
var child = require('child_process')
var querystring = require("querystring")

var PORT = require('minimist')(process.argv.slice(2)).port || 3989



var injectHTML = fs.readFileSync(__dirname + '/inject.html', 'utf8')

// TODO limit to localhost
// TODO how does ssh port forwarding work?

// set up express static server with a websocket
var server = express()
  // TODO server editor.html with node paths allowed
  // TODO save files that are changed
  .get('*', (req, res, next) => {
    // append injecter script to all html pages served
    try{
      var path = req.params[0].slice(1)
      if (path.slice(-1) == '/') path = path + '/index.html'
      if (path == '') path = 'index.html'
      if (path.slice(-5) != '.html') return next()

      res.send(fs.readFileSync(path, 'utf-8') + injectHTML)
    } catch(e){ next() }
  })
  .use(serveStatic('./'))
  .use('/', serveIndex('./'))
  .listen(PORT)
  .on('listening', () => child.exec('open http://localhost:' + PORT))
  
process.on('uncaughtException', (err => 
  err.errno == 'EADDRINUSE' ? server.listen(++PORT) : 0)) //inc PORT if in use



console.log({PORT})



var result = querystring.stringify({hotEditorPath: "_script.js"})
console.log(result)



console.log({PORT})




