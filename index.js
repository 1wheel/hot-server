#!/usr/bin/env node
var express = require('express')
var serveStatic = require('serve-static')
var serveIndex = require('serve-index')
var fs = require('fs')
var chokidar = require('chokidar')
var child = require('child_process')
var querystring = require("querystring")

var PORT = require('minimist')(process.argv.slice(2)).port || 3989

// TODO limit to localhost
// TODO how does ssh port forwarding work?

// set up express static server with a websocket
var server = express()
  .post('/save', (req, res, next) => {
    // save files that are changed
    var bodyStr = ''
    req
      .on('data', d => bodyStr += d )
      .on('end', () => {
        var {path, str} = JSON.parse(bodyStr)

        console.log('saving', path)
        fs.writeFileSync(path, str)
        res.end()
      })
  })
  .get('*', (req, res, next) => {
    var path = req.params[0].slice(1)
    
    // server editor.html with node paths
    if (path.includes('hot-editor.html')){
      return res.send(fs.readFileSync(__dirname + '/hot-editor.html', 'utf8'))
    }
    if (path.includes('node_modules/codemirror/')){
      if (path.includes('.css')) res.contentType('text/css; charset=UTF-8')
      return res.send(fs.readFileSync(__dirname + '/' + path))
    }

    // append injecter script to all html pages served
    try{
      if (path.slice(-1) == '/') path = path + '/index.html'
      if (path == '') path = 'index.html'
      if (path.slice(-5) != '.html') return next()

      return res.send(
        fs.readFileSync(path, 'utf-8') +
        fs.readFileSync(__dirname + '/html-inject.html', 'utf8')
      )

    } catch(e){ next() }
  })
  .use(serveStatic('./'))
  .use('/', serveIndex('./'))
  .listen(PORT)
  .on('listening', () => {
    var url = 'http://localhost:' + PORT
    var editUrl = url + '/hot-editor.html?hotEditorPath=index.js'
    console.log('hot-server: ' + editUrl)
    console.log('hot-server-editor: ' + editUrl)

    // child.exec('open ' + editUrl)
  })
  
//inc PORT if in use
process.on('uncaughtException', err => {
  console.log({err})
  if (err.errno == 'EADDRINUSE') server.listen(++PORT)
})



// 

// var result = querystring.stringify({hotEditorPath: "_script.js"})
// console.log(result)





