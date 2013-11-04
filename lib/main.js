/*
 * nodejsbot - http://github.com/rickihastings/nodejsbot
 * 
 * IRC Bot framework made in node.js
 */

var net = require('net'),
	fs = require('fs'),
	helper = require('./helper').Helper,
	server = require('./server').Server,
	irc = require('./irc').Irc,
	logger = require('./logger').Logger,
	config = require('./config').config,
	modules = {};

exports.config = config;
exports.helper = helper;
exports.server = server;
exports.irc = irc;

/*
 * Load our modules
 */
for (var module in config.modules)
{
	var file = config.modules[module];
	modules[file] = require('./modules/' + file);
	// look for our modules, n that eh.
}

/*
 * fs.watchFile
 * Watch the config file for changes
 */
fs.watchFile('config.js', function(curr, prev)
{
	delete require.cache[__dirname + '/config'];
	var newModule = require('./config');
	config = newModule.config;
	server.debug('main', 'fs.watchFile(): new config file found, reloading: \'config.js\'');
});

/*
 * config.server.dataHandler
 * Handles incoming data on the socket
 */
config.server.dataHandler = function(data, from)
{
	var splitData = data.split(' '),
		target = splitData[0],
		targets = target.split(','),
		messageData = splitData.slice(1).join(' '),
		alreadySent = [];
	
	for (i in targets)
	{
		var key = targets[i];
		if (key in helper.oc(alreadySent))
			continue;
		// already done this, skip it.
		
		if (key == '#*')
		{
			for (chan in irc.chans)
				irc.msg(chan, messageData);
		}
		// all chans!
		
		if (key.substr(0, 1) == '#' && key.substr(1, 2) != '*')
			irc.msg(key, messageData);
		// its a chan, sweet.
		
		if (key.substr(0, 1) == '@')
			irc.msg(key.substr(1), messageData);
		// it's a user
		
		server.debug('main', 'dataHandler(): Sending "' + messageData + '" to ' + key + ' from ' + from);
		alreadySent.push(key);
	}
	// first we check for commas to send stuff to multiple places!
};

logger.setData(config);
server.setData(config);
irc.setData(config);
irc.connect();
// set data and connect

/*
 * irc.on .. PRIVMSG
 * Handle incoming privmsgs
 */
irc.on(/^:[^!]+![^@]+@[^ ]+ PRIVMSG #[^ ]+ :(.+)$/, function(info)
{
	var splitInfo = info[0].split(' '),
		message = splitInfo.splice(3).join(' ');
		message = message.substr(1);
	
	if (message.substr(0, 1) == config.commandPrefix)
	{
		var parts = message.split(' '),
			command = parts[0].substr(1);

		for (var mod in modules)
		{
			if (modules[mod].module.commands[command] !== undefined)
				modules[mod].module.commands[command](splitInfo[0].substr(1), splitInfo[2], parts);
			// we've found a command, let's execute the callback passing a few params to it.
		}
		// search for a command.
		return;
	}
	// handle commands prefixed with our prefix character..
	
	var i, rinfo;
	for (i = 0; i < irc.textListeners.length; i++)
	{
		if (irc.textListeners[i][0] instanceof RegExp)
			rinfo = irc.textListeners[i][0].exec(info);
		else
			rinfo = (irc.textListeners[i][0] == message) ? true : false;
		
		if (rinfo)
		{
			irc.textListeners[i][1](rinfo, info);
			if (irc.textListeners[i][2])
			{
				irc.textListeners.splice(i, 1);
				--i;
			}
		}
	}
	// handle text based events added with irc.watch_for()
});
