const spawn = require('child_process').spawn;
const Log = require('log');
const log = new Log('debug');
const http = require('http');
const wss = require('websocket').server;
const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');
const EventEmitter = require('events');

exports.run = function run(port, script, args) {
    const PORT = port || 1710;
    var serve = serveStatic(__dirname+"/client");

    var server = http.createServer(function(req, res) {
        serve(req, res, finalhandler(req, res));
    });

    server.listen(PORT, () => {
        log.info('http server listening on port ' + PORT);
    });

    var wsServer = new wss({
        httpServer: server,
        autoAcceptConnections: false
    });


    var clients = [];

    wsServer.on('request', function(request) {
        if (!originIsAllowed(request.origin)) {
            // Make sure we only accept requests from an allowed origin
            request.reject();
            log.debug('Connection from origin ' + request.origin + ' rejected.');
            return;
        }

        var connection = request.accept('kai-protocol', request.origin);
        log.debug('Connection from origin ' + request.origin + ' accepted.');
        clients.push(connection);

        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                log.debug('Received Message: ' + message.utf8Data);
                var ios = message.utf8Data.indexOf(" ");
                if (ios == -1) {
                    return;
                }
                var command = message.utf8Data.slice(0, ios);
                var data;
                try {
                    data = JSON.parse(message.utf8Data.slice(ios));
                } catch (e) {
                    return;
                }

                runcmd(command, data);
            } else if (message.type === 'binary') {
                log.debug('Received Binary Message of ' + message.binaryData.length + ' bytes');
            }
        });
        connection.on('close', function(reasonCode, description) {
            log.debug('Peer ' + connection.remoteAddress + ' disconnected.');
        });
    });
    log.debug('spawning script "' + script + '" with arguments "' + args.join(" ") + '"');
    var kainode = new EventEmitter();
    var app;
    process.nextTick(()=>kainode.emit("load", startApp()));

    function runcmd(cmd, data) {
        /*
         * ### command documentation
         * data: #send or recieve data from/to stdio
         * {
         *     content
         * }
         * 
         * pinfo: send info about process changes or all info upon connection
         * {
         *     name,
         *     pid,
         *     children: [pinfo]
         *     cpu,
         *     memory
         * }
         * 
         * notice:
         * {
         *     level,
         *     desc
         * }
         */
        log.debug('running command ' + cmd);
        if (cmd == "data") {
            app.stdin.write(data.content);
        } else if (cmd == "pinfo") {
            var data = {
                connected: app.connected,
                pid: app.pid
            }

            broadcastCmd("pinfo", data);
        }
    }

    function broadcastCmd(cmd, data) {
        clients.forEach(c=>{
            c.sendUTF(cmd + " " + JSON.stringify(data));
        });
    }

    function startApp() {
        app = spawn(script, args);
        app.stdout.on('data', (data) => {
            // console.log(clients);
            var line = data.toString().slice(0, -1);
            for (var i = 0; i < clients.length; i++) {
                if (clients[i].connected) {
                    clients[i].sendUTF("data " + JSON.stringify({ content: line }));
                } else {
                    clients.splice(i, 1);
                    i--;
                }
            }
        });

        app.on("exit", (code, signal) => {
            broadcastCmd("notice ", { level: "warning", desc: "App exited with code " + code + ". Restarting in 3 seconds..." });
            setTimeout(() => {
                kainode.emit("newnode", startApp());
            }, 3000);
        });

        return app;
    }

    return kainode;
};

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}