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
		* The default expiry range
		* If data is older than the current time minus this value its deemed to have expired
		* @var int
		*/
		expiry: 60*60*24*2, // Default: 2 days

		/**
		* Treat all data as expired
		* This in effect forces a pull reguardless of whether the data is actually in the cache or not
		* @var bool
		*/
		forcepull: 0,

		/**
		* An array of data type handlers
		* @var hash
		*/
		handlers: {
			/*
			example: {
				re: /^@/, // Anything beginning with '@'
				type: 'json', // ... is a JSON object (and should be converted to string when storing for example)
				expirykey: 'age', // Look for a subkey called 'age' to determine the expiry point
				encoder: function(code, data) {}, // An encoder to use if 'type' isnt already set to something useful
				decoder: function(code, data) {}, // A decoder to use if 'type' isn't already set to something useful
				pull: function(code, callback_success, callback_fail) {} // How to pull new data from the server - this is the callback thats used if Stash doesnt know of the object OR it has expired. If the pull was successful the pull function should call callback_success(value) otherwise it should call callback_fail()
			},
			*/
			none: { // Generic fallback handler
				name: 'none',
				type: 'text',
				pull: function(code) {
					console.warn('$.stash - WARNING: I dont know how to refresh a stash object that has no registered handler');
				}
			}
		},

		/**
		* Define a new handler object
		* @param string The short name of the handler used for internally refering to the handler
		* @param object The handler object. See handlers for examples of what it could contain
		*/
		defineHandler: function(name, handler) {
			if (handler.type) { // Use a predefined type to specify common settings
				switch (handler.type) {
					case 'json':
						handler['encoder'] = function(code,data) {
							return JSON.stringify(data);
						};
						handler['decoder'] = function(code,data) {
							return JSON.parse(data);
						};
						break;
					default:
						console.warn('$.stash - WARNING: Unrecognised handler type: ' + handler.type);
				}
			}
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
			console.log('$.stash.set(' + code + ',...)');

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
				($.stash.forcepull && handler.pull) || // Force the pulling of all data (but only if we know how to pull) OR
				!value || // No value could be retrieved OR
				( // Has it expired...
					handler.expirykey && // The handler has an expiry key defined
					value.expirykey && // The retrieved data has the expiry key
					value[handler.expirykey] > $.stash.epoc() - $.stash.expiry // The data has expired
				)
			) { // Failed to retrieve the value - maybe do a pull instead?
				if (handler.pull) { // The handler knows how to pull
					console.log('$.stash.get(' + code + ') - pull!');
					handler.pull(code, function(value) { // Define success behaviour
						$.stash.set(code, value); // Store for future use
						success(code, value);
					}, function() { // Define fail behaviour
						fail(code);
					});
				} else { // Handler can't pull - just fail
					fail(code);
				}
			}

			// If we got to here then everything was a success
			success(code, value);
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
