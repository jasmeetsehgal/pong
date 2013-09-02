var io = require('socket.io').listen(1025);

io.set('log level', 1); 
  io.set('transports', [                     // enable all transports (optional if you want flashsocket)
    'websocket'
	, 'flashsocket'
   , 'htmlfile'
  , 'xhr-polling'
  ,'xhr-multipart'
  ,'jsonp-polling'
]);


var connections = 0;
// open the socket connection
io.sockets.on('connection', function (socket) {	
    connections = io.sockets.clients().length;
	console.log('msg on connect  ', connections);
    //if (connections > 2) {
        socket.send(connections);
   // }

    socket.on('message', function (data) {
		console.log('message ' + data)
		 var sender = 'unregistered';
        socket.get('nickname', function (err, name) {
              sender = name;
        });
		socket.broadcast.emit('message', {
            msg: data,
            msgr: sender
        });
    });

    socket.on('posData', function (data) {
        var sender = 'unregistered';
		
		socket.get('nickname', function (err, name) {
			//console.log('pos by name' + data)
            //console.log('Chat message by ', name);
            //console.log('error ', err);
            sender = name;
        });
        socket.broadcast.emit('posData', {
            msg: data,
            msgr: sender
        });
    });

    socket.on('disconnect', function () {
        socket.get('nickname', function (err, name) {
            console.log('disconnect ', name);
            console.log('error ', err);
        });
        connections = io.sockets.clients().length;
    });
    socket.on('register', function (name) {
        socket.set('nickname', name, function () {
            io.sockets.emit('register', {
                msg: "welcome " + name + '!',
                msgr: "mr. server"
            });
        });
    });
    return socket;
});