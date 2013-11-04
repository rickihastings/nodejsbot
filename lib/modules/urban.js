/*
 * nodejsbot - http://github.com/rickihastings/nodejsbot
 * 
 * IRC Bot framework made in node.js
 */

var config = require('../main').config,
	helper = require('../main').helper,
	irc = require('../main').irc,
	server = require('../main').server,
	http = require('http'),
	module = {
		'name': 'urban.js',
		'author': 'Ricki',
		'version': '0.1',
		'commands': {}
	};

/*
 * urban
 * Command handler for urban
 */
module.commands.urban = function(from, chan, params)
{
	var query = params.splice(1).join(' '),
		stdout = '',
		options = {
			host: 'www.urbandictionary.com',
			port: 80,
			path: '/iphone/search/define?term=' + encodeURIComponent(query),
			method: 'GET'
		};

	if (query == '') return;
	// if the query is empty, bail

	var req = http.request(options, function(res)
	{
		res.setEncoding('utf8');
		res.on('data', function (chunk) { stdout = stdout + chunk.replace(/^\s+|\s+$/g, ''); });
		res.on('end', function()
		{
			var results = JSON.parse(stdout),
				result = results.list[0];

			if (results.result_type == 'no_results' && results.list.size == 0) return;
			// bail if there are no results

			irc.msg(chan, result.definition);
		});

	}).end();
	/* we use a http request here with the http module
	   instead of using a curl request, to prevent from
	   vulnerable code being executed */
};

exports.module = module