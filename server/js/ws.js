var cls = require("./lib/class"),
    url = require('url'),
    http = require('http'),
    Utils = require('./utils'),
    _ = require('underscore'),
    Log = require("log"),
    WebSocket = require('ws'),
    log = new Log(Log.INFO);

var useBison = false;
try {
    var BISON = require('./bison');
    useBison = true;
} catch (e) {
    log.info("Bison not found, using JSON.stringify instead");
}

module.exports = WS = {};

/**
 * Abstract Server and Connection classes
 */
var Server = cls.Class.extend({
    init: function (port) {
        this.port = port;
    },

    onConnect: function (callback) {
        this.connection_callback = callback;
    },

    onError: function (callback) {
        this.error_callback = callback;
    },

    broadcast: function (message) {
        throw "Not implemented";
    },

    forEachConnection: function (callback) {
        _.each(this._connections, callback);
    },

    addConnection: function (connection) {
        this._connections[connection.id] = connection;
    },

    removeConnection: function (id) {
        delete this._connections[id];
    },

    getConnection: function (id) {
        return this._connections[id];
    }
});


var Connection = cls.Class.extend({
    init: function (id, connection, server) {
        this._connection = connection;
        this._server = server;
        this.id = id;
    },

    onClose: function (callback) {
        this.close_callback = callback;
    },

    listen: function (callback) {
        this.listen_callback = callback;
    },

    broadcast: function (message) {
        throw "Not implemented";
    },

    send: function (message) {
        throw "Not implemented";
    },

    sendUTF8: function (data) {
        throw "Not implemented";
    },

    close: function (logError) {
        log.info("Closing connection to " + this._connection.remoteAddress + ". Error: " + logError);
        this._connection.close();
    }
});


/**
 * WebSocketServer
 *
 * Websocket server supporting draft-75, draft-76 and version 08+ of the WebSocket protocol.
 * Fallback for older protocol versions borrowed from https://gist.github.com/1219165
 */
WS.WebSocketServer = Server.extend({
    _connections: {},
    _counter: 0,

    init: function (port) {
        var self = this;

        this._super(port);

        this._httpServer = http.createServer(function (request, response) {
            var path = url.parse(request.url).pathname;
            switch (path) {
                case '/status':
                    if (self.status_callback) {
                        response.writeHead(200);
                        response.write(self.status_callback());
                        break;
                    }
                default:
                    response.writeHead(404);
            }
            response.end();
        });

        this._wsServer = new WebSocket.Server({server: this._httpServer});

        this._wsServer.on('connection', function (ws, req) {
            ws._socket = req.socket;

            var c = new WS.WebSocketConnection(self._createId(), ws, self);

            if (self.connection_callback) {
                self.connection_callback(c);
            }

            self.addConnection(c);
        });

        this._httpServer.listen(port, function () {
            log.info("Server is listening on port " + port);
        });
    },

    _createId: function () {
        return '5' + Utils.random(99) + '' + (this._counter++);
    },

    broadcast: function (message) {
        this.forEachConnection(function (connection) {
            connection.send(message);
        });
    },

    onRequestStatus: function (status_callback) {
        this.status_callback = status_callback;
    }
});


/**
 */
WS.WebSocketConnection = Connection.extend({
    init: function (id, connection, server) {
        var self = this;

        this._super(id, connection, server);

        this._connection.on('message', function (message) {
            if (self.listen_callback) {
                if (message.type === 'utf8') {
                    if (useBison) {
                        self.listen_callback(BISON.decode(message.utf8Data));
                    } else {
                        try {
                            self.listen_callback(JSON.parse(message.utf8Data));
                        } catch (e) {
                            if (e instanceof SyntaxError) {
                                self.close("Received message was not valid JSON.");
                            } else {
                                throw e;
                            }
                        }
                    }
                }
            }
        });

        this._connection.on('close', function (connection) {
            if (self.close_callback) {
                self.close_callback();
            }
            self._server.removeConnection(self.id);
        });
    },

    send: function (message) {
        var data;
        if (useBison) {
            data = BISON.encode(message);
        } else {
            data = JSON.stringify(message);
        }
        this.sendUTF8(data);
    },

    sendUTF8: function (data) {
        if (this._connection.readyState === WebSocket.OPEN) {
            this._connection.send(data);
        }
    }
});
