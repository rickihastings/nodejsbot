/*
 * nodejsbot - http://github.com/rickihastings/nodejsbot
 * 
 * IRC Bot framework made in node.js
 */

var config = require('../main').config,
	helper = require('../main').helper,
	irc = require('../main').irc,
	server = require('../main').server,
	fs = require('fs'),
	module = {
		'name': 'seen.js',
		'author': 'Ricki',
		'version': '0.1',
		'commands': {}
	};

/*
 * seen
 * Command handler for seen
 */
module.commands.seen = function(from, chan, params)
{
	var nick = params[1];
	if (nick == undefined)
		return;

	fs.readFile('data/seen.json', function(err, data)
	{
		var seenJson = JSON.parse(data)
			lNick = nick.toLowerCase();
		
		if (seenJson[lNick] != undefined)
		{
			var response = config.responses.lastSeenNick.replace('{nick}', nick);
				response = response.replace('{time}', '1 day');
				response = response.replace('{message}', seenJson[lNick].message);

			irc.msg(chan, response);
			// return the shite
		}
		else
		{
			var response = config.responses.notSeenNick.replace('{nick}', nick);
			irc.msg(chan, response);
			// we aint seen this bish before?
		}
	});
	// search seen records
};

exports.module = module