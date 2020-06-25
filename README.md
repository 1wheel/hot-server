# hot-server-editor

No config [hot reloading](https://roadtolarissa.com/hot-reload/) for sketching with code over ssh in the browser. 

## Instructions 

### Install: 

`npm install -g hot-server-editor`

### Serve directory statically:

```
ssh -L 3989:localhost:3989 my.remote-machine.com
cd project-repo
hot-server-editor
```

Open `http://localhost:3989/hot-editor.html` and make changes to `*.js` or `*.css` files. They'll be injected to `http://localhost:3989` via `BroadcastChannel` without a full refresh or round trip to your desktop.

Default port is 3989; `hot-server-editor --port=4444` sets the port.
