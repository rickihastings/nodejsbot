/*
 * nodejsbot - http://github.com/n0valyfe/nodejsbot
 * 
 * IRC Bot framework made in node.js
 */

require.paths.unshift('.');
var net = require('net'),
	server = {},
	irc = {};
	irc.listeners = [];
	irc.textListeners = [];

irc.socket = new net.Socket();
// create the irc socket

/*
 * irc.setData
 * Function to set client data, nick, server, etc.
 */
irc.setData = function(obj)
{
	server = require('lib/main').server;
	irc.nick = obj.irc.nick;
	irc.ident = obj.irc.ident;
	irc.realName = obj.irc.realName;
	irc.nsPass = obj.irc.nsPass;
	irc.server = obj.irc.server;
	irc.port = obj.irc.port;
	irc.chans = obj.irc.chans;
	irc.debug = obj.irc.debug;
	irc.info = {
		'chans': {}
	};
	
	/*
	 * irc.on .. join/part
	 * Track our channel list
	 */
	irc.on(/^:[^!]+![^@]+@[^ ]+ (JOIN|PART) #[^ ]+/, function(info)
	{
		var splitInfo = info[0].split(' '),
			nick = splitInfo[0].split('!');
			nick = nick[0].substr(1);
			
		if (nick == irc.nick && splitInfo[1] == 'JOIN')
			irc.info.chans[splitInfo[2]] = true;
		if (nick == irc.nick && splitInfo[1] == 'PART')
			delete irc.info.chans[splitInfo[2]];
	});
}

/*
 * irc.connect
 * Function to connect with the set data
 */
irc.connect = function()
{
	irc.socket.setEncoding('ascii');
	irc.socket.setNoDelay();
	irc.socket.connect(irc.port, irc.server);
	// set encoding and connect to the server
	server.debug('main', 'connect(): connecting to ' + irc.server + ':' + irc.port);
}

/*
 * irc.raw
 * Function to send data to the irc server
 */
irc.raw = function(data)
{
	irc.socket.write(data + '\n', 'ascii', function()
	{
		server.debug('raw', 'handle(): << ' + data);
	});
}

/*
 * irc.handle
 * Function to handle incoming commands
 */
irc.handle = function(data)
{
	var i, info;
	for (i = 0; i < irc.listeners.length; i++)
	{
		info = irc.listeners[i][0].exec(data);
		if (info)
		{
			irc.listeners[i][1](info, data);
			if (irc.listeners[i][2])
			{
				irc.listeners.splice(i, 1);
				--i;
			}
		}
	}
}

/*
 * irc.on & irc.on_once & irc.watch_for
 * Functions to push event listeners to the queue
 */
irc.on = function(data, callback)
{
	irc.listeners.push([data, callback, false]);
}
irc.on_once = function(data, callback)
{
	irc.listeners.push([data, callback, true]);
}
irc.watch_for = function(data, callback)
{
	irc.textListeners.push([data, callback])
}

/*
 * irc.join
 * Function to join channels and add a callback.
 */
irc.join = function(chan, key, callback)
{
	if (callback !== undefined && callback !== null)
		irc.on_once(new RegExp("^:" + irc.nick + "![^@]+@[^ ]+ JOIN " + chan), callback);
	irc.raw('JOIN ' + chan + ' ' + key);
}

/*
 * irc.part
 * Function to part channels and add a callback.
 */
irc.part = function(chan, callback)
{
	if (callback !== undefined && callback !== null)
		irc.on_once(new RegExp("^:" + irc.nick + "![^@]+@[^ ]+ PART " + chan), callback);
	irc.raw('PART ' + chan);
}

/*
 * irc.msg
 * Function to send messages to users/channels
 */
irc.msg = function(target, message)
{
	var max_length, msgs, interval;
	max_length = 500 - target.length;
	msgs = message.match(new RegExp('.{1,' + max_length + '}', 'g'));

	interval = setInterval(function()
	{
		irc.raw('PRIVMSG ' + target + ' :' + msgs[0]);
		msgs.splice(0, 1);
		if (msgs.length === 0)
			clearInterval(interval);
	}, 100);
}

/*
 * irc.notice
 * Function to send notices to users/channels
 */
irc.notice = function(target, message)
{
	var max_length, msgs, interval;
	max_length = 500 - target.length;
	msgs = message.match(new RegExp('.{1,' + max_length + '}', 'g'));

	interval = setInterval(function()
	{
		irc.raw('NOTICE ' + target + ' :' + msgs[0]);
		msgs.splice(0, 1);
		if (msgs.length === 0)
			clearInterval(interval);
	}, 100);
}

/*
 * irc.socket.on('connect')
 * Event listener for connecting
 */
irc.socket.on('connect', function()
{
	setTimeout(function()
	{
		irc.raw('NICK ' + irc.nick);
		irc.raw('USER ' + irc.ident + ' 8 * :' + irc.realName);
	}, 1000);
	
	irc.on_once(new RegExp("^:[^ ]+ 005 " + irc.nick), function(info)
	{
		if (irc.nsPass != "")
			irc.msg('NickServ', 'identify ' + irc.nsPass);

		setTimeout(function()
		{
			for (var key in irc.chans)
				irc.join(key, irc.chans[key], null);
		}, 500);
	});
});

/*
 * irc.socket.on('data')
 * Event listener for incoming data
 */
irc.socket.on('data', function(data)
{
	data = data.split('\r\n');
	for (var i = 0; i < data.length; i++)
	{
		if (data[i] != '')
		{
			server.debug('raw', 'handle(): >> ' + data[i]);
			irc.handle(data[i]);
		}
	}
});

/*
 * irc.on .. ping
 * PING.. PONG
 */
irc.on(/^PING :(.+)$/i, function(info)
{
	irc.raw('PONG :' + info[1]);
});

exports.Irc = irc;
