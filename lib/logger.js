/*
 * nodejsbot - http://github.com/n0valyfe/nodejsbot
 * 
 * IRC Bot framework made in node.js
 */

var helper = {},
	irc = {},
	server = {},
	logger = {},
	parrot = require('parrot'),
	path = require('path'),
	fs = require('fs'),
	express = require('express'),
	http = express.createServer(),
	url = require('url');

/*
 * writeLog
 * function to write to the log!
 */
logger.writeLog = function(chan, message)
{
	var date = new Date(),
		day = date.getDate(),
		day = (day < 10) ? '0' + day : day,
		filename = 'logs/' + chan.substr(1) + '.' + day + '-' + (date.getMonth() + 1) + '-' + date.getFullYear(),
		details = { flags: 'a',
					encoding: null,
					mode: 0666 },
		log = fs.createWriteStream(filename, details),
		hours = date.getHours(),
		minutes = date.getMinutes(),
		seconds = date.getSeconds();

	if (hours < 10) hours = '0' + hours;
	if (minutes < 10) minutes = '0' + minutes;
	if (seconds < 10) seconds = '0' + seconds;
	
	log.write('[' + hours + ':' + minutes + ':' + seconds + '] ' + message + '\n');
	log.end();
}

/*
 * logger.setData
 * Function to set logger data.
 */
logger.setData = function(obj)
{
	helper = require('./main').helper;
	irc = require('./main').irc;
	server = require('./main').server;
	logger.port = obj.webServer.port;
	logger.ip = obj.webServer.ip;
	logger.chans = {};

	http.use(express.logger(function(req, res)
	{
		return server.debug('main', 'logger(): ' + res.method + ' ' + res.url);
	}));

	/*
	 * http.get('/:chan/:month/:day')
	 * route to the homepage.
	 */
	http.get('/:chan/:month/:day', function(req, res)
	{
		logger.logParser(__dirname + '/templates/log.html', req, res);
		// parse the index file up.
	});

	/*
	 * http.get('/:chan/:month')
	 * route to the homepage.
	 */
	http.get('/:chan/:month', function(req, res)
	{
		logger.monthParser(__dirname + '/templates/month.html', req, res);
		// parse the index file up.
	});

	/*
	 * http.get('/')
	 * route to the homepage.
	 */
	http.get('/', function(req, res)
	{
		logger.indexParser(__dirname + '/templates/index.html', req, res);
		// parse the index file up.
	});

	/*
	 * http.get(/\/(.*)?\.(css|js)/i)
	 * route to the css/js files
	 */
	http.get(/\/(.*)?\.(css|js)/i, function(req, res)
	{
		fs.readFile(__dirname + '/templates' + req.url, function(err, data)
		{
			if (err)
			{
				res.header('Content-Type', 'text/plain');
				res.end('Cannot GET ' + req.originalUrl);
				return;
			}
			// not found!

			var split = req.url.split('.');
			if (split[1] == 'css')
				res.header('Content-Type', 'text/css');
			else if (split[1] == 'js')
				res.header('Content-Type', 'text/javascript');
			else
				res.header('Content-Type', 'text/plain');
			// get the valid content type

	    	var output = parrot.render(data, { cache: 86400 * 7 });
			res.send(output);
	    	// send the output, closing the connection
	    });
		// retrieve css/js files
	});

	/*
	 * http.listen()
	 * listen for incoming connections on logger.port
	 */
	http.listen(logger.port, function()
	{
		server.debug('main', 'listen(): server running at http://' + logger.ip + ':' + logger.port + '/');
		// runs when our server is created
	});

	/*
	 * irc.msg
	 * intercept irc.msg
	 */
	irc.oMsg = irc.msg;
	irc.msg = function(target, message)
	{
		irc.oMsg(target, message);
		
		if (target.substr(0, 1) == '#')
			logger.writeLog(target, '<' + irc.nick + '> ' + message);
		// log file
	}

	/*
	 * irc.on .. 353 (NAMES)
	 * Handle names
	 */
	irc.on(/^:[^ ]+ 353 [^ ]+ = #[^ ]+ :(.*)$/, function(info)
	{
		var splitInfo = info[0].split(' '),
			channel = splitInfo[4];
			splitInfo[5] = splitInfo[5].substr(1);
		var users = splitInfo.splice(5),
			user;
		
		if (logger.chans[channel] == undefined)
			logger.chans[channel] = [];

		for (key in users)
		{
			user = users[key];
			if (!(/^[0-9A-Za-z]+$/.test(user.substr(0, 1))))
				logger.chans[channel].push(user.substr(1));
			else
				logger.chans[channel].push(user);
		}
	});

	/*
	 * irc.on .. PRIVMSG/NOTICE
	 * Handle incoming privmsgs and notices
	 */
	irc.on(/^:[^!]+![^@]+@[^ ]+ (PRIVMSG|NOTICE) #[^ ]+ :(.*)$/, function(info)
	{
		var splitInfo = info[0].split(' '),
			nick = info[0].split('!')[0].substr(1),
			channel = splitInfo[2],
			message = splitInfo.splice(3).join(' ').substr(1);

		if (splitInfo[1] == 'NOTICE')
		{
			logger.writeLog(channel, '-' + nick + '/' + channel + '-' + message);
		}
		else
		{
			var parse = /\u0001ACTION (.*?)\u0001/.exec(message);
			if (parse) logger.writeLog(channel, nick + ' ' + parse[1]);
			else logger.writeLog(channel, '<' + nick + '> ' + message);
			// is this an ACTION or

			fs.readFile('data/seen.json', function(err, data)
			{
				var seenJson = JSON.parse(data),
					lNick = nick.toLowerCase();
				if (seenJson[lNick] == undefined)
					seenJson[lNick] = {};
			
				seenJson[lNick].channel = channel;
				seenJson[lNick].timestamp = new Date();
				seenJson[lNick].message = message;
				// update seen json

				fs.writeFile('data/seen.json', JSON.stringify(seenJson));
				// rewrite it to seen.json
			});
			// update seen record
		}
		// parse action
	});

	/*
	 * irc.on .. JOIN/PART
	 * Handle incoming privmsgs
	 */
	irc.on(/^:[^!]+![^@]+@[^ ]+ (JOIN|PART) #[^ ]+/, function(info)
	{
		var splitInfo = info[0].split(' '),
			nick = info[0].split('!')[0].substr(1),
			channel = splitInfo[2];
		
		if (splitInfo[1] == 'JOIN')
		{
			if (logger.chans[channel] == undefined)
				logger.chans[channel] = [];
			
			logger.chans[channel].push(nick);
			logger.writeLog(channel, nick + ' (' + splitInfo[0].split('!')[1] + ') has joined ' + channel);
		}
		else
		{
			delete logger.chans[channel][nick];
			logger.writeLog(channel, nick + ' (' + splitInfo[0].split('!')[1] + ') has left ' + channel);
		}
	});

	/*
	 * irc.on .. QUIT
	 * Handle incoming privmsgs
	 */
	irc.on(/^:[^!]+![^@]+@[^ ]+ QUIT :(.*)$/, function(info)
	{
		var splitInfo = info[0].split(' '),
			nick = info[0].split('!')[0].substr(1),
			message = splitInfo.splice(2).join(' ').substr(1);
		
		for (chan in logger.chans)
		{
			if (nick in helper.oc(logger.chans[chan]))
				logger.writeLog(chan, nick + ' (' + splitInfo[0].split('!')[1] + ') has quit (' + message + ')');
		}
	});

	/*
	 * irc.on .. NICK
	 * Handle incoming privmsgs
	 */
	irc.on(/^:[^!]+![^@]+@[^ ]+ NICK :[^ ]+/, function(info)
	{
		var splitInfo = info[0].split(' '),
			nick = info[0].split('!')[0].substr(1),
			newNick = splitInfo[2];

		logger.writeLog(channel, '* ' + nick + ' is now known as ' + newNick);
	});
};

/*
 * logger.indexParser
 * index page parser
 */
logger.indexParser = function(file, req, res)
{
	fs.readFile(file, function(err, data)
	{
		if (err)
		{
			res.header('Content-Type', 'text/plain');
			res.end('Cannot GET ' + req.originalUrl);
			return;
		}
		// not found!

    	var files = fs.readdirSync('logs'),
    		logChans = {};
    	// generate a logChans array

    	for (var i in files)
    	{
    		var file = files[i],
    			split = file.split('.'),
    			splitDate = split[1].split('-'),
    			monYear = splitDate.splice(1).join('-'),
    			chan = '#' + split[0];
    		
    		if (logChans[chan] == undefined)
    		{
    			logChans[chan] = {
	    			chanUrl: '<a href="irc://' + irc.server + '/' + chan.substr(1) + '">' + chan + '</a>',
	    			logs: []	
	    		};
    		}
    		// check if our logchans array exists

    		logChans[chan].logs[monYear] = '<a href="' + split[0] + '/' + monYear + '">' + monYear + '</a>';
    	};
    	// read our logs

    	var output = parrot.render(data, {
    		cache: -1,
    		sandbox: {
        		title: 'IRCNode Log Viewer (' + irc.server + ')',
        		logChans: logChans,
    		}
		});
    	
    	res.send(output);
    	// send the output, closing the connection
	});
};

/*
 * logger.monthParser
 * month page parser
 */
logger.monthParser = function(file, req, res)
{
	fs.readFile(file, function(err, data)
	{
		var files = fs.readdirSync('logs'),
    		logDays = [];
		// generate a logDays array
		
		for (var i in files)
    	{
    		var split = files[i].split('.'),
    			splitDate = split[1].split('-');
    		
    		if (split[0] == req.params.chan && (splitDate[1] + '-' + splitDate[2]) == req.params.month)
    		{
    			logDays.push({
	    			id: splitDate[0],
	    			link: '<a href="' + req.params.month + '/' + splitDate[0] + '">' + split[1] + '</a>'
		    	});
		    }
    	};
    	// read our logs

    	if (err || logDays.length == 0)
		{
			res.header('Content-Type', 'text/plain');
			res.end('Cannot GET ' + req.originalUrl);
			return;
		}
		// not found!

    	var output = parrot.render(data, {
    		cache: -1,
    		sandbox: {
        		title: 'IRCNode Log Viewer (' + irc.server + ') - #' + req.params.chan + ' ' + req.params.month,
        		logData: {
        			breadCrumb: '<a href="/">irc logs</a> &middot; ' + irc.server + ' &middot; #' + req.params.chan + ' &middot; ' + req.params.month,
        			chanUrl: '<a href="irc://' + irc.server + '/' + req.params.chan + '">' + irc.server + ' / #' + req.params.chan + '</a>'	
        		},
        		logDays: logDays.sort()
    		}
		});

    	res.send(output);
    	// send the output, closing the connection
    });
};

/*
 * logger.logParser
 * month page parser
 */
logger.logParser = function(file, req, res)
{
	fs.readFile(file, function(err, data)
	{
		var fileName = req.params.chan + '.' + req.params.day + '-' + req.params.month;

		if (err || !path.existsSync('logs/' + fileName))
		{
			res.header('Content-Type', 'text/plain');
			res.end('Cannot GET ' + req.originalUrl);
			return;
		}
		// not found!

    	var	log = fs.readFileSync('logs/' + fileName, 'utf8');
    		log = helper.htmlSpecialChars(log, 'ENT_QUOTES').split('\n');
    	log.pop();
		// generate a logDays array

		for (var line in log)
			log[line] = '<li id="l-' + line + '">' + helper.ircParse(log[line]) + '</li>';
		// loop through the log file and parse it up nicely

		var output = parrot.render(data, {
			cache: -1, // no point in caching this, because we're always recieving the log file, not showing it all is pointless
    		sandbox: {
        		title: 'IRCNode Log Viewer (' + irc.server + ') - #' + req.params.chan + ' ' + req.params.day + '-' + req.params.month,
        		logData: {
        			breadCrumb: '<a href="/">irc logs</a> &middot; ' + irc.server + ' &middot; #' + req.params.chan + ' &middot; <a href="/' + req.params.chan + '/' + req.params.month + '">' + req.params.month + '</a> &middot; ' + req.params.day,
        			chanUrl: '<a href="irc://' + irc.server + '/' + req.params.chan + '">' + irc.server + ' / #' + req.params.chan + '</a>'	
        		},
        		log: log,
    		}
		});

		res.send(output);
    	// send the output, closing the connection
    });
};

exports.Logger = logger;
