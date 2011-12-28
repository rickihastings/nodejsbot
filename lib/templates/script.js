$(document).ready(function()
{
	var jpRegex = new RegExp("^(.*) [^ ]+ \([^@]+@[^ ]+\) has (joined|left|quit) (#(.*)$|\((.*)\))");

	$('ul#log-lines li').each(function(index)
	{
		if (jpRegex.test($(this).text()))
			$(this).hide();
		// hide joins/parts/quits by default
	});

	$('a#toggle-jp').click(function()
	{
		if ($(this).text() == 'Show joins/parts')
		{
			var hide = false;
			$(this).text('Hide joins/parts');
		}
		else
		{
			var hide = true;
			$(this).text('Show joins/parts');
		}

		$('ul#log-lines li').each(function(index)
		{
			var text = $(this).text();
			if (jpRegex.test($(this).text()))
			{
				if (hide)
					$(this).hide();
				else
					$(this).show();
			}
			// hide joins/parts/quits
		});

		return false;
	});
});