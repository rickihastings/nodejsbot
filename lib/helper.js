/*
 * nodejsbot - http://github.com/n0valyfe/nodejsbot
 * 
 * IRC Bot framework made in node.js
 */

var helper = {};

/*
 * htmlSpecialChars
 * taken from phpjs.org
 */
helper.htmlSpecialChars = function(string, quote_style, charset, double_encode) {
    // Convert special characters to HTML entities  
    // 
    // version: 1109.2015
    // discuss at: http://phpjs.org/functions/htmlspecialchars
    // +   original by: Mirek Slugen
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Nathan
    // +   bugfixed by: Arno
    // +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +    bugfixed by: Brett Zamir (http://brett-zamir.me)
    // +      input by: Ratheous
    // +      input by: Mailfaker (http://www.weedem.fr/)
    // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
    // +      input by: felix
    // +    bugfixed by: Brett Zamir (http://brett-zamir.me)
    // %        note 1: charset argument not supported
    // *     example 1: htmlspecialchars("<a href='test'>Test</a>", 'ENT_QUOTES');
    // *     returns 1: '&lt;a href=&#039;test&#039;&gt;Test&lt;/a&gt;'
    // *     example 2: htmlspecialchars("ab\"c'd", ['ENT_NOQUOTES', 'ENT_QUOTES']);
    // *     returns 2: 'ab"c&#039;d'
    // *     example 3: htmlspecialchars("my "&entity;" is still here", null, null, false);
    // *     returns 3: 'my &quot;&entity;&quot; is still here'
    var optTemp = 0,
        i = 0,
        noquotes = false;
    if (typeof quote_style === 'undefined' || quote_style === null) {
        quote_style = 2;
    }
    string = string.toString();
    if (double_encode !== false) { // Put this first to avoid double-encoding
        string = string.replace(/&/g, '&amp;');
    }
    string = string.replace(/</g, '&lt;').replace(/>/g, '&gt;');
 
    var OPTS = {
        'ENT_NOQUOTES': 0,
        'ENT_HTML_QUOTE_SINGLE': 1,
        'ENT_HTML_QUOTE_DOUBLE': 2,
        'ENT_COMPAT': 2,
        'ENT_QUOTES': 3,
        'ENT_IGNORE': 4
    };
    if (quote_style === 0) {
        noquotes = true;
    }
    if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
        quote_style = [].concat(quote_style);
        for (i = 0; i < quote_style.length; i++) {
            // Resolve string input to bitwise e.g. 'ENT_IGNORE' becomes 4
            if (OPTS[quote_style[i]] === 0) {
                noquotes = true;
            }
            else if (OPTS[quote_style[i]]) {
                optTemp = optTemp | OPTS[quote_style[i]];
            }
        }
        quote_style = optTemp;
    }
    if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
        string = string.replace(/'/g, '&#039;');
    }
    if (!noquotes) {
        string = string.replace(/"/g, '&quot;');
    }
 
    return string;
}

/*
 * ircParse
 * parse links, bold all that etc.
 */
helper.ircParse = function(inputText)
{
    var replacedText = inputText.replace(/\u0002(.*?)\u0002/, '<span style="font-weight: bold">$1</span>');
        replacedText = replacedText.replace(/\u001F(.*?)\u001F/, '<span style="text-decoration: underline">$1</span>');
        replacedText = replacedText.replace(/\u0016(.*?)\u0016/, '<span style="font-style: italic">$1</span>');
        replacedText = replacedText.replace(/\u0003[0-9]{1,2}(,[0-9]{1,2})(.*?)\u0003[0-9]{1,2}(,[0-9]{1,2})/, '$1');
        replacedText = replacedText.replace(/\u0003[0-9]{1,2}(.*?)\u0003[0-9]{1,2}/, '$1');
        // parse bold/underline/italic etc, and strip colours, cause they're EVIL!

        replacedText = replacedText.replace(/(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;\[\]]*[-A-Z0-9+&@#\/%=~_|\[\]])/gim, '<a href="$1" target="_blank">$1</a>');
        replacedText = replacedText.replace(/(^|[^\/])(www\.[\S]+(\b|$))/gim, '$1<a href="http://$2" target="_blank">$2</a>');
        // change email addresses to mailto:: links, parse http links and www. urls

    return replacedText;
}

/*
 * deEntityNo
 * decode entity numbers to their characters
 */
helper.deEntityNo = function(entity)
{
	return entity.replace(/&#(\d+);/g, function(match, number)
	{
		return String.fromCharCode(number);
	});
}

/*
 * oc
 * Convert arrays to objects
 */
helper.oc = function(a)
{
	var o = {};
	for(var i = 0; i < a.length; i++)
		o[a[i]] = '';
	return o;
}

/*
 * checkHost
 * Function to check host against a list of allowed hosts
 */
helper.checkHost = function(host, hosts)
{
	var parts = host.split('@'),
		rHost = parts[1];

	if (rHost in helper.oc(hosts))
		return true;

	return false;
}

exports.Helper = helper;