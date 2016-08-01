var fs = require("fs"),
    webSocket = require('faye-websocket'),
    chokidar = require('chokidar'),

    /*
    path = require("path"),
    url = require("url"),
    http = require("http"),
    os = require("os"),
    util = require("util"),
    child = require("child_process",
    d3 = require("d3"),
    connect = require("connect"),
    optimist = require("optimist"),
    hogan = require("hogan.js"),
    yaml = require("js-yaml"),
    queue = require("queue-async"),
    httpRequest = require("request"),
    mkdirp = require("mkdirp");
    */


var server = connect();
server.use(connect.static(__dirname), {maxAge: maxAgeMs})



// initHot


function initHot(server) {
  // websocket to inject script.js
  var WebSocket = require('faye-websocket'),
    chokidar = require('chokidar');

  server.on('upgrade', function(request, socket, body) {
  if (webSocket.isWebSocket(request)) {
    var ws = new webSocket(request, socket, body);
    chokidar.watch(['src'], {ignored: /[\/\\]\./ }).on('all', function(event, path) {

    if (event != 'change' || !ws) return;

    if (path == 'src/script.js') {
      var msg = {type: 'jsInject', str: fs.readFileSync(path, 'utf8')};
      ws.send(JSON.stringify(msg));

    } else if (path.substr(path.length-3,3) == '.js') {
      var mod_name = path.substr(4, path.length-7),
      changed_js = fs.readFileSync(path, 'utf8')
        .replace('define(', 'define(\''+mod_name+'\', '),
      script_js = fs.readFileSync('src/script.js', 'utf8');

      ws.send(JSON.stringify({
      type: 'jsInject',
      str: 'require.undef(\''+mod_name+'\'); \n'+changed_js+';\n'+script_js
      }));
      
    }

    // if src/style.less or src/style.less is updated, rebuild build/style.js and inject
    if (~path.indexOf('style')) {
      child.exec('make build/style.css', {}, function(){
      var msg = {
        type: 'cssInject',
        str: fs.readFileSync('build/style.css', 'utf8')
        .replace(/_assets\//g, 'public/_assets/')
      };
      ws.send(JSON.stringify(msg));
      });
    }

    // todo: run make in background so static files stay in sync
    // child.exec('make', {}, function(){})

    });
    ws.on('message', function(event) { ws.send(event.data); });
    ws.on('close', function(event) { ws = null; });
  }
  });  
}
