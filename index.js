#!/usr/bin/env node

var express = require('express')
var serveStatic = require('serve-static')
var serveIndex = require('serve-index')
var SocketServer = require('ws').Server
var meow = require('meow');

var fs = require('fs')
var chokidar = require('chokidar')
var child = require("child_process");

var cli = meow(`
  Usage:

    $ hot-server <path> [--port 3000]

  Options:

    --port, -p   Set the port to use (default: 3000)
    --help, -h   This screen

  Examples:

    $ hot-server

      Loads index.html on port 3000

    $ hot-server test.html -p 5554

      Loads test.html on port 5554
`, {
  alias: {
    p: 'port'
  }
})

// set up express static server with a websocket
var PORT = cli.flags.port || process.env.PORT || 3000
var PATH = cli.input;

var server = express()
  .get('*', injectHTML)
  .use(serveStatic('./'))
  .use('/', serveIndex('./', {'icons': true}))
  .listen(PORT);

process.on('uncaughtException', function(err){
  if (err.errno === 'EADDRINUSE') {
    PORT++; // Increment port until it finds one not in use.
    server.listen(PORT);
  }
});

server.on('listening', () => child.exec("open http://localhost:" + PORT + (PATH ? '/' + PATH : '')));


var wss = new SocketServer({ server })
wss.on('connection', (ws) => {
  console.log('Client connected')
  ws.on('close', () => console.log('Client disconnected'))
})


// append websocket/injecter script to all html pages served
var wsInject = fs.readFileSync(__dirname + '/ws-inject.html', 'utf8')
function injectHTML(req, res, next){
  try{
    var path = req.params[0].slice(1)
    if (path.slice(-1) == '/') path = path + '/index.html'
    if (path.slice(-5) != '.html') return next()

    var html = fs.readFileSync(path, 'utf-8') + wsInject
    res.send(html)
  } catch(e){
    next()
  }
}


// if a .js or .css files changes, load and send to client via websocket
chokidar.watch(['./'], {ignored: /[\/\\]\./ }).on('all', function(event, path) {
  if (event != 'change') return
  console.log('updating ' + path)

  if (~path.indexOf('.js')){
    var msg = {type: 'jsInject', str: fs.readFileSync(path, 'utf8')}
    sendToAllClients(msg)
  }

  if (~path.indexOf('.css')){
    var msg = {type: 'cssInject', str: fs.readFileSync(path, 'utf8')}
    sendToAllClients(msg)
  }
})

// todo - only send to active clients that have loaded the linked find before
function sendToAllClients(msg){
  wss.clients.forEach(d => d.send(JSON.stringify(msg)))
}
