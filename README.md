jQuery Stash
============
A simple module to help with data caching in a jQuery project.

Stash is a library for dealing with AJAX provided data which is heavily cached on the client side (via window.localStorage).

The idea is that you define the rules on how data should be retrieved, expired or encoded right up front. From then on you can just access it without having to worry about whether it is valid, has expired or cached.


Simple usage example
--------------------
Somewhere deep inside a jQuery Mobile app:

	stashinit();
	$.stash.defineHandler('profile', {
		re: /^@/, // Anything beginning with '@' is a profile
		type: 'json',
		pull: function(code, success, fail) { // Teach Stash how to pull data
			$.ajax({
				url: '/profiles/getJSON',
				dataType: 'json',
				type: 'POST',
				data: { profile: code },
				success: function(json) {
					success(json.profile); // Assumes that your JSON looks like '{profile: {name: 'Joe Random', age: 24}}'
				},
				error: function(a, e) {
					fail(code, e);
				}
			});
		},
	});

From now on you can just pull a profile with:

	$.stash.get('@joe', function(code, profile) {
		alert('Hello ' + profile.name + '!');
	}, function() {
		alert('Something went horribly wrong!');
	});


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
