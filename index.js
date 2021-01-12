#!/usr/bin/env node
var express = require('express')
var serveStatic = require('serve-static')
var serveIndex = require('serve-index')
var SocketServer = require('ws').Server
var fs = require('fs')
var chokidar = require('chokidar')
var child = require('child_process')

var defaults = {port: 3989, dir: './', ignore: 'hs-ignore-dir'} 
var args = require('minimist')(process.argv.slice(2))
var {port, dir, ignore} = Object.assign(defaults, args)
dir = require('path').resolve(dir) + '/'

// set up express static server with a websocket
var server = express()
  .get('*', injectHTML)
  .use(serveStatic(dir))
  .use('/', serveIndex(dir))
  .listen(port)
  .on('listening', () => {
    child.exec('open http://localhost:' + port)
    console.log('hot-server http://localhost:' + port)
  })
  
process.on('uncaughtException', (err => 
  err.errno == 'EADDRINUSE' ? server.listen(++port) : 0)) //inc port if in use

// append websocket/injecter script to all html pages served
var wsInject = fs.readFileSync(__dirname + '/ws-inject.html', 'utf8')
function injectHTML(req, res, next){
  try{
    var path = req.params[0].slice(1)
    if (path.slice(-1) == '/') path = path + '/index.html'
    if (path == '') path = 'index.html'
    if (path.slice(-5) != '.html') return next()

    res.send(fs.readFileSync(dir + path, 'utf-8') + wsInject)
  } catch(e){ next() }
}

// if a .js or .css files changes, load and send to client via websocket
var wss = new SocketServer({server})
var ignored = new RegExp(`${ignore}|` + /node_modules|\.git|[\/\\]\./.source)
chokidar
  .watch(dir, {ignored})
  .on('change', path => {
    console.log(path)
    var str = fs.readFileSync(path, 'utf8')
    var path = '/' + path.replace(__dirname, '')

    var type = 'reload'
    if (path.includes('.js'))  type = 'jsInject'
    if (path.includes('.css')) type = 'cssInject'

    var msg = {path, type, str}
    wss.clients.forEach(d => d.send(JSON.stringify(msg)))
  })

