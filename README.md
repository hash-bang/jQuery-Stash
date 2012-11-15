jQuery Stash
============
A simple module to help with data caching in a jQuery project.

Stash is a library for dealing with AJAX provided data which is heavily cached on the client side (via window.localStorage).

The idea is that you define the rules on how data should be retrieved, expired or encoded right up front. From then on you can just access it without having to worry about whether it is valid, has expired or cached.


Simple usage example
--------------------
Somewhere deep inside your initializer:

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
					fail(e);
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

Somewhere in your code or just copy paste the following:

	$(document).on('pageinit', 'div[data-role=page]', function(event, ui) {
		if (!$.stash)
			stashinit();

		// Now you can use $.stash
	});


API Documentation
=================

Saving / Setting data
---------------------
You can give stash data at any time with a simple call to .set() where you tell Stash the key you want to save the data as.

	$.stash.set('myname', 'joe');

If you are using a JSON handler you can also save more complex structures:

	$.stash.set('some_json', {name: 'foo', type: 'bar'});


Retrieving / Getting data
-------------------------
After you've defined what handlers to use Stash can simply retrieve it. Should the data have expired (and the handler know how to pull new data) it will be retrieved again.
Because Stash may be requesting new data from the server or running some equally complex asynchronous task, get() takes three arguments: the key you want to retrieve, the function thats run when its retrieved (with the code and the value passed as parameters) and the function thats run if it fails.

	// Will popup an alert with 'Your name is joe' (assuming the above examples have already been run)
	$.stash.get('myname', function(code, value) {
		alert('Your name is ' + value);
	});

Or with better error handling:

	$.stash.get('myname', function(code, value) {
		alert('Your name is ' + value);
	}, function() {
		alert('Cant retrieve your name right now');
	});


Defining handlers
-----------------
Stash is made up of different types of data handler. By default Stash will store and retrieve simple text strings, if you want something more complex you have to tell Stash how to deal with it and what the key code looks like in order to allocate the correct handler.

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
					fail(e);
				}
			});
		},
	});

In the above example a handler called 'profile' (internal name only) is created. It takes ownership of any key code that begins with '@' (the re: bit where you specify the regular expression). 'Type' defines that its to be coded and decoded as a JSON string and 'pull' defines how new data should be retrieved if the data has expired or is not already set.

When pulling data a callback is used which must eventually call either success(value) or fail(reason) to continue execution.
