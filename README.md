# hot-server
No config hot reloading for sketching [bl.ocks](http://bl.ocks.org/) quickly. 

## Instructions 

### Install: 
`npm install -g hot-server`

### Serve directory statically:
`hot-server`

Save changes to `*.js` or `*.css` and they'll be injected via a websocket without a full refresh.

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

## Is this the right tool for me?

If you're building an actual webapp, probably not! This is a very naive approach to hot reloading that will not work with more complicated code. Webpack might be a better option: 

- [Webpack Hot Module Replacement](https://webpack.github.io/docs/hot-module-replacement.html)
- [Live React: Hot Reloading with Time Travel](https://www.youtube.com/watch?v=xsSnOQynTHs)
- [Live Editing JavaScript with Webpack (Part III)](http://jlongster.com/Backend-Apps-with-Webpack--Part-III)

Or a even a different language:

- [Arcadia for Clojure and Unity](http://arcadia-unity.github.io/)
- [Figwheel for ClojureScript](https://github.com/bhauman/lein-figwheel)

But! If you're mostly working on [short, simple pieces](http://roadtolarissa.com/) and dislike yak shaving config files this might be a good fit. It is as simple to use as `python -m http.server` with the added benefit of seemly magically updating pages without a refresh.  

The code is also relatively simple - just 60 lines of code for the server and 25 for the client - and you might be able to re-purpose it. I incorporated a modified version into a somewhat slow `make/requirejs/grunt` build system at work and reduced the time it took to see the result of changing my code from ~6 seconds to 0. 
