# hot-server-editor

No config [hot reloading](https://roadtolarissa.com/hot-reload/) for sketching with code over ssh in the browser. 

## Instructions 

### Install: 

`npm install -g hot-server-editor`

### Serve directory statically:

`
ssh -L 3989:localhost:3989 my.remote-machine.com
cd project-repo
hot-server-editor
`

Save changes to `*.js` or `*.css` and they'll be injected via `BroadcastChannel` without a full refresh or round trip to your desktop.

Since your whole script file reruns, you'll probably want to clean up anything it adds to the page with something like `var svg = d3.select('#graph').html('').append('svg')`. Stopping any timers and clearing any listeners that don't reset is also a good idea:

    if (window.timer) timer.stop()
    window.timer = d3.timer(function(t){
      // cool animation code
    })

To persist data between refreshes, declare and initialize your data in a separate file from the rest of your code. Only the changed file will rerun. Or only initialize your data on the first run:

    window.points = window.points || d3.range(50)
        .map(function(d){
          return [Math.random() * width, Math.random() * height]
        })

Default port is 3989; `hot-server --port=4444` sets the port.
