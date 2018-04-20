#!/usr/bin/env node
var express = require('express')
var serveStatic = require('serve-static')
var serveIndex = require('serve-index')
var SocketServer = require('ws').Server
var fs = require('fs')
var chokidar = require('chokidar')
var child = require('child_process')
var PORT = require('minimist')(process.argv.slice(2)).port || 3989

// set up express static server with a websocket
var server = express()
  .get('*', injectHTML)
  .use(serveStatic('./'))
  .use('/', serveIndex('./'))
  .listen(PORT)
  .on('listening', () => child.exec('open http://localhost:' + PORT))
  
process.on('uncaughtException', (err => 
  err.errno == 'EADDRINUSE' ? server.listen(++PORT) : 0)) //inc PORT if in use

// append websocket/injecter script to all html pages served
var wsInject = fs.readFileSync(__dirname + '/ws-inject.html', 'utf8')
function injectHTML(req, res, next){
  try{
    var path = req.params[0].slice(1)
    if (path.slice(-1) == '/') path = path + '/index.html'
    if (path == '') path = 'index.html'
    if (path.slice(-5) != '.html') return next()

    res.send(fs.readFileSync(path, 'utf-8') + wsInject)
  } catch(e){ next() }
}

// if a .js or .css files changes, load and send to client via websocket
var wss = new SocketServer({server})
chokidar
  .watch('.', {ignored: /node_modules|\.git|[\/\\]\./ })
  .on('change', path => {
    var str = fs.readFileSync(path, 'utf8')
    var path = '/' + path.replace(__dirname, '')

    var type = 'reload'
    if (path.includes('.js'))  type = 'jsInject'
    if (path.includes('.css')) type = 'cssInject'

    var msg = {path, type, str}
    wss.clients.forEach(d => d.send(JSON.stringify(msg)))
  })