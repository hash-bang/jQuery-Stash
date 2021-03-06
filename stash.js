/**
* Matts little data retriever / storage engine
* This object tries to store data using localStorage and/or retrieve it from an AJAX request if its not already there
*/
function stashinit() {
	if ($.stash) // Already loaded?
		return;
	console.log('Stash load');
	$.extend({stash: {
		/**
		* Default properties to be used when creating a handler
		* @var hash
		*/
		defaultHandler: {
			expires: 60*60*24*2, // Default: 2 days
		},

		/**
		* Log debug messages to console
		* @var bool
		*/
		debug: 0,

		/**
		* Treat all data as expired
		* This in effect forces a pull reguardless of whether the data is actually in the cache or not
		* @var bool
		*/
		force: 0,

		/**
		* An array of data type handlers
		* @var hash
		*/
		handlers: {
			/*
			example: {
				re: /^@/, // Anything beginning with '@'
				type: 'json', // ... is a JSON object (and should be converted to string when storing for example)
				expires: 60*60*24, // How many seconds until the data expires - default is inherited from $.stash.defaultHandler.expires. Set to '0' for never expires
				expirykey: 'age', // Look for a subkey called 'age' to determine the expiry point
				encoder: function(code, data) {}, // An encoder to use if 'type' isnt already set to something useful
				decoder: function(code, data) {}, // A decoder to use if 'type' isn't already set to something useful
				allowundefined: 0, // Whether to allow 'undefined' as a valid result. If boolean false an 'undefined' is returned the pull function fails
				pull: function(code, callback_success, callback_fail) {} // How to pull new data from the server - this is the callback thats used if Stash doesnt know of the object OR it has expired. If the pull was successful the pull function should call callback_success(value) otherwise it should call callback_fail()
			},
			*/
			none: { // Generic fallback handler
				name: 'none',
				type: 'text',
				pull: function(code) {
					console.warn('Stash - WARNING: I dont know how to refresh the stash object using the code "' + code + '" that has no registered handler');
				}
			}
		},

		/**
		* Define a new handler object
		* Note that the defaultHandler array is merged with the user properties so see it for defaults unless overridden here
		* @param string The short name of the handler used for internally refering to the handler
		* @param object The handler object. See handlers for examples of what it could contain
		*/
		defineHandler: function(name, handler) {
			handler = $.extend({}, $.stash.defaultHandler, handler);
			if (handler.type) { // Use a predefined type to specify common settings
				switch (handler.type) {
					case 'json':
						handler['encoder'] = function(code,data) {
							return JSON.stringify(data);
						};
						handler['decoder'] = function(code,data) {
							var decoded;
							try {
								decoded = JSON.parse(data);
							} catch(e) {
								console.warn('Stash - WARNING: Invalid JSON "' + data + '"');
							}

						};
						break;
					default:
						console.warn('Stash - WARNING: Unrecognised handler type: ' + handler.type);
				}
			}
			if (this.debug)
				console.log('Stash - Registered handler "' + name + '"');
			handler['name'] = name;
			$.stash.handlers[name] = handler;
			return this;
		},

		/**
		* Works out which handler to use for the given code
		* @param string code The incomming code that should be used to determine the handler to use
		*/
		getHandler: function(code) {
			var usekey = 'none';
			$.each($.stash.handlers, function(key, handler) {
				if (handler.re && code.match(handler.re)) {
					usekey = key;
					return false;
				}
			});
			return $.stash.handlers[usekey];
		},

		/**
		* Set a piece of information in the localStorage cache for later retrieval
		* @param string code The reference code of the stash
		* @param mixed data The data object to store, indexed by 'code'
		*/
		set: function(code, data) {
			if (this.debug)
				console.log('Stash - $.stash.set(' + code + ',...)');

			var handler = $.stash.getHandler(code);
			var value = data;
			if (handler.encoder)
				value = handler.encoder(code, value);

			localStorage.setItem(code, value);
			return this;
		},

		/**
		* Retrieve a piece of information from the stash
		* If the data exists in localStorage it is retrieved and the callback called
		* If the data does not exist in the cache OR the data has expired, it is retreieved fresh from the server and the callback called
		* @param string code The code of the profile to retrieve
		* @param callback success(code, value) The callback to execute when the profile has completed
		* @param callback fail(code, exception) The callback to execute if the profile cannot be retrieved
		*/
		get: function(code, success, fail) {
			var handler = $.stash.getHandler(code);
			var value = localStorage.getItem(code);
			if (value && handler.decoder)
				value = handler.decoder(code, value);

			if (
				($.stash.force && handler.pull) || // Force the pulling of all data (but only if we know how to pull) OR
				!value || // No value could be retrieved OR
				( // Has it expired...
					handler.expires && // An expiry limit is specified
					handler.expirykey && // The handler has an expiry key defined
					value.expirykey && // The retrieved data has the expiry key
					value[handler.expirykey] > $.stash.epoc() - handler.expires // The data has expired
				)
			) { // Failed to retrieve the value - maybe do a pull instead?
				if (handler.pull) { // The handler knows how to pull
					if (this.debug)
						console.log('Stash - $.stash.get(' + code + ') - PULL!');
					handler.pull(code, function(value) { // Define success behaviour
						$.stash.set(code, value); // Store for future use
						success(value, code);
					}, function() { // Define fail behaviour
						if (this.debug)
							console.warn('Stash - $.stash.get(' + code + ') - ERROR DURING PULL!');
						fail('Failed to pull', code);
					});
				} else { // Handler can't pull - just fail
					if (this.debug)
						console.warn('Stash - $.stash.get(' + code + ') - ERROR NO PULL METHOD!');
					fail(code);
				}
			} else { // We dont need to pull the value - use the value we already have
				if (!handler.allowundefined && typeof value == 'undefined') {
					if (this.debug)
						console.warn('Stash - $.stash.get(' + code + ') - RETURNED UNDEFINED!');
					fail(code);
					return;
				}

				// If we got to here then everything was a success
				success(value, code);
			}
		},

		/**
		* Return the current time as a Unix timestamp
		* @return int The time as an epoc
		*/
		epoc: function() {
			return Math.round((new Date()).getTime() / 1000);
		}
	}});
}
$(stashinit); // Run the init function
