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
		'name': 'calc.js',
		'author': 'Ricki',
		'version': '0.1',
		'commands': {}
	};

/*
 * calc
 * Command handler for calc
 */
module.commands.calc = function(from, chan, params)
{
	var query = params.splice(1).join(' '),
		stdout = '',
		options = {
			host: 'www.google.com',
			port: 80,
			path: '/ig/calculator?q=' + encodeURIComponent(query),
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
			var result = stdout.replace('lhs:', '"lhs":');
				result = result.replace('rhs:', '"rhs":');
				result = result.replace('error:', '"error":');
				result = result.replace('icc:', '"icc":');
			var response = config.responses.cResult.replace('{sum}', query);
				response = response.replace('{answer}', JSON.parse(result).rhs);
			
			irc.msg(chan, response);
		});

	}).end();
	/* we use a http request here with the http module
	   instead of using a curl request, to prevent from
	   vulnerable code being executed */
};

exports.module = module