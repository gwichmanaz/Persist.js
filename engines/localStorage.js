var engineLocalStorage = (function () {
	var root = "PLE+";
	var log;

	function k(asName, key) {
		return root + asName + "+" + key;
	}

	return {
		initialize: function (options, callback) {
			if (options.root) {
				root = options.root + "+";
			}
			log = options.logger;
			callback(typeof localStorage != "undefined");
		},
		save: function (asName, key, value, callback) {
			localStorage.setItem(k(asName, key), value);
			callback(value);
		},
		restore: function (asName, key, callback) {
			callback(localStorage.getItem(k(asName, key)) || "{}");
		},
		del: function (asName, key, callback) {
			localStorage.removeItem(k(asName, key));
			callback(true);
		}
	};
}());

if (typeof module != "undefined") {
	module.exports = engineLocalStorage;
}
