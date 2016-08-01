const express = require('express')
const SocketServer = require('ws').Server
const path = require('path')
const fs = require('fs')
const serveStatic = require('serve-static')
const serveIndex = require('serve-index')


const PORT = process.env.PORT || 3000

const server = express()
  .get('*', injectHTML)
  .use(serveStatic('./'))
  .use('/', serveIndex('./', {'icons': true}))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))


const wss = new SocketServer({ server })

wss.on('connection', (ws) => {
  console.log('Client connected')
  ws.on('close', () => console.log('Client disconnected'))
})

setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString())
  })
}, 100)


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


