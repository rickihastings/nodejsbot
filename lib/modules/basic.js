/*
 * nodejsbot - http://github.com/rickihastings/nodejsbot
 * 
 * IRC Bot framework made in node.js
 */

var config = require('../main').config,
	helper = require('../main').helper,
	irc = require('../main').irc,
	server = require('../main').server,
	module = {
		'name': 'basic.js',
		'author': 'Ricki',
		'version': '0.1',
		'commands': {}
	};

/*
 * join
 * Command handler for join
 */
module.commands.join = function(from, chan, params)
{
	if (helper.checkHost(from, config.adminHosts))
	{
		irc.join(params[1], params[2], null);
		return true;
	}
	// join chan!
	
	var nick = from.split('!');
		nick = nick[0];
	irc.notice(nick, config.responses.invalidAccess);
	// no access, fudge off
};

/*
 * part
 * Command handler for part
 */
module.commands.part = function(from, chan, params)
{
	if (helper.checkHost(from, config.adminHosts))
	{
		irc.part(params[1], null);
		return true;
	}
	// part chan!

	var nick = from.split('!');
		nick = nick[0];
	irc.notice(nick, config.responses.invalidAccess);
	// no access, fudge off
};

/*
 * channels
 * Command handler for channels
 */
module.commands.channels = function(from, chan, params)
{
	var nick = from.split('!'),
		objSize = helper.oc(irc.info.chans);
		nick = nick[0];
	
	irc.notice(nick, config.responses.currentlyIn.replace('{num}', objSize.length));
	for (chan in irc.info.chans)
		irc.notice(nick, config.responses.outputChan.replace('{chan}', chan));
};

/*
 * exit
 * Command handler for exit
 */
module.commands.exit = function(from, chan, params)
{
	if (helper.checkHost(from, config.adminHosts))
	{
		server.debug('main', 'exit(): Shut down signal from ' + from);
		process.exit(0);
		return true;
	}
	// exit
	
	var nick = from.split('!');
		nick = nick[0];
	irc.notice(nick, config.responses.invalidAccess);
	// no access, fudge off
};

exports.module = module;