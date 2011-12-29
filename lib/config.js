/*
 * nodejsbot - http://github.com/n0valyfe/nodejsbot
 * 
 * IRC Bot framework made in node.js
 */

exports.config = {
	"debug": true,
	"modules" : [
		"basic.js",
		"seen.js"
	],
	"server": {
		"enabled": false,
		"ip": "127.0.0.1",
		"port": 1337,
		"debug": false,
		"dataHandler": function(data, from) {}
	},
	"webServer": {
		"ip": "0.0.0.0",
		"port": 3000
	},
	"irc": {
		"nick": "Samantha",
		"ident": "sam",
		"realName": "FUCK YEAH",
		"nsPass": "lulpass",
		"server": "irc.ircnode.org",
		"port": 6667,
		"chans": {
			"#lulz": ""
		},
		"debug": false
	},
	"commandPrefix": ".",
	"adminHosts": [
		"vee.host"
	],
	
	"responses": {
		"invalidAccess": "Oi mush, you don't have access to do this!",
		"currentlyIn": "I am currently in {num} channels.",
		"outputChan": "- {chan}",
		"cResult": "{sum} = {answer}",
		"gResult": "{title} ({url})",
		"lastSeenNick": "I last saw {nick} {time} ago saying: {message}",
		"notSeenNick": "I have not seen {nick} before"
	}
};