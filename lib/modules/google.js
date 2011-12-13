/*
 * nodejsbot - http://github.com/n0valyfe/nodejsbot
 * 
 * IRC Bot framework made in node.js
 */

var config = require('../main').config,
	helper = require('../main').helper,
	irc = require('../main').irc,
	server = require('../main').server,
	http = require('http'),
	module = {
		'name': 'google.js',
		'author': 'Ricki',
		'version': '0.1',
		'commands': {}
	};

/*
 * google
 * Command handler for google
 */
module.commands.google = function(from, chan, params)
{
	var query = params.splice(1).join(' '),
		stdout = '',
		options = {
			host: 'ajax.googleapis.com',
			port: 80,
			path: '/ajax/services/search/web?v=1.0&safe=off&q=' + encodeURIComponent(query),
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
			var gJson = JSON.parse(stdout),
			queryString = '';

			for (var result in gJson.responseData.results)
			{
				var title = helper.deEntityNo(gJson.responseData.results[result].titleNoFormatting),
					url = gJson.responseData.results[result].unescapedUrl,
					response = config.responses.gResult.replace('{title}', title);
					response = response.replace('{url}', url);

				irc.msg(chan, response);
			}
		});

	}).end();
	/* we use a http request here with the http module
	   instead of using a curl request, to prevent from
	   vulnerable code being executed */
};

exports.module = module