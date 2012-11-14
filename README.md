jQuery Stash
============
A simple module to help with data caching in a jQuery project.


Usage with jQuery Mobile
------------------------
Stash is intended for use with jQuery mobile projects.

Because of the way that jQuery mobile pages load there is no document.ready() event to bind to.

In order to use stash either execute:

	stashinit()

Somewhere in your own code or just copy paste the following:

	$(document).on('pageinit', 'div[data-role=page]', function(event, ui) {
		if (!$.stash)
			stashinit();

		// Now you can use $.stash
	});
