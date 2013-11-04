/*
 * nodejsbot - http://github.com/rickihastings/nodejsbot
 * 
 * IRC Bot framework made in node.js
 */

var net = require('net'),
	util = require('util'),
	server = {};
	server.dataHandler = function(data, from) {};

/*
 * server.setData
 * Function to set server data.
 */
server.setData = function(obj)
{
	server.ip = obj.server.ip;
	server.port = obj.server.port;
	server.dataHandler = obj.server.dataHandler;
	server.serverDebug = obj.server.debug;
	server.ircDebug = obj.irc.debug;
	
	if (obj.server.enabled)
	{
		server.debug('main', 'tcp(): setting up server on ' + server.ip + ':' + server.port);
		server.tcp.listen(server.port, server.ip);
	}
}

/*
 * server.debug
 * Debbuger
 */
server.debug = function(type, message)
{
	if ((type == 'main' && server.debug) || (type == 'raw' && server.ircDebug) || (type == 'client' && server.serverDebug))
		util.log(message);
}

/*
 * server.tcp
 * Create a listening TCP server
 */
server.tcp = net.createServer(function (socket)
{
	socket.addListener('connect', function ()
	{
		server.debug('client', 'connect(): New connection from ' + socket.remoteAddress);
		socket.setTimeout(5000);
		socket.setKeepAlive(false);
	});

	socket.addListener('timeout', function()
	{
		server.debug('client', 'timeout(): No data recieved from ' + socket.remoteAddress + ', closing connection');
		socket.end();
	});

	socket.addListener('data', function	(data)
	{
		var newData = data.toString().replace(/\n|\r/g, '');
		
		socket.end();
		server.debug('client', 'data(): message recieved from ' + socket.remoteAddress + ', closing connection');
		server.dataHandler(newData, socket.remoteAddress);
	});
});

exports.Server = server;