var engineRedis = (function () {
	var root = "PRE+";
	var redisClient;
	var log;

	function k(asName, key) {
		return root + asName + "+" + key;
	}

	return {
		initialize: function (options, callback) {
			if (options.root) {
				root = options.root + "+";
			}
			var redis = require('redis');
			var redisOpts = options.redis || {};
			var log = options.logger;
			redisClient = redis.createClient(redisOpts);
			redisClient.on("ready", function () {
				callback(true);
			});
		},
		save: function (asName, key, value, callback) {
			redisClient.set(k(asName, key), value, function (err) {
				callback(value);
			});
		},
		restore: function (asName, key, callback) {
			redisClient.get(k(asName, key), function (err, data) {
				callback(data || "{}");
			});
		},
		del: function (asName, key, callback) {
			redisClient.del(k(asName, key), function (err) {
				callback(true);
			});
		}
	};
}());

if (typeof module != "undefined") {
	module.exports = engineRedis;
}
