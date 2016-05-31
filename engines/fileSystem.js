var engineFileSystem = (function () {
	var root = "./persist/";
	var fs;
	var log;

	function k(asName, key) {
		return root + asName + "+" + key + ".json";
	}

	return {
		initialize: function (options, callback) {
			if (options.root) {
				root = options.root + "/";
			}
			fs = require('fs');
			log = options.logger;
			callback(true);
		},
		save: function (asName, key, value, callback) {
			fs.writeFile(k(asName, key), value, function (err) {
				if (err) {
					throw err;
				}
				callback(value);
			});
		},
		restore: function (asName, key, callback) {
			fs.readFile(k(asName, key), "utf8", function (err, data) {
				callback(data || "{}");
			});
		},
		del: function (asName, key, callback) {
			fs.unlink(k(asName, key), function (err) {
				callback(true);
			});
		}
	};
}());

if (typeof module != "undefined") {
	module.exports = engineFileSystem;
}
