#!/usr/bin/env node
var express = require('express')
var serveStatic = require('serve-static')
var serveIndex = require('serve-index')
var http = require('http')
var https = require('https')
var SocketServer = require('ws').Server
var fs = require('fs')
var chokidar = require('chokidar')
var child = require('child_process')

var defaults = {port: 3989, dir: './', ignore: 'hs-ignore-dir'} 
var args = require('minimist')(process.argv.slice(2))
var {port, dir, ignore, cert} = Object.assign(defaults, args)
dir = require('path').resolve(dir) + '/'

// set up express static server with a websocket
var app = express()
  .get('*', injectHTML)
  .use(serveStatic(dir))
  .use('/', serveIndex(dir))

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

// use https server if a cert file is passed in
var server = http.createServer(app)
cert = '../../cert/localhost.pem'
if (cert){
  var credentials = {cert: fs.readFileSync(cert), key: fs.readFileSync(cert.replace('.pem', '-key.pem'))}
  server = https.createServer(credentials, app)
} 

server.listen(port).on('listening', () => {
  var url = `http${cert ? 's' : ''}://localhost:${port}`
  child.exec(`open ${url}`)
  console.log(`hot-server ${url}`)
})

//inc port if in use
process.on('uncaughtException', err => {
  console.log(err)
  ;[err.errno, err.code].includes('EADDRINUSE') ? server.listen(++port) : 0
})

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

