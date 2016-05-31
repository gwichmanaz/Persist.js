var Persist = (function () {
	function log() {
		if (options.log) {
			console.log.apply(console, Array.prototype.slice.call(arguments));
		}
	}

	function noCallback() {}

	var defaultEngine;

	if (typeof localStorage != "undefined" && typeof engineLocalStorage != "undefined") {
		defaultEngine = engineLocalStorage;
	} else {
		defaultEngine = "fileSystem";
	}

	var options = {
		engine: defaultEngine,
		redis: null,
		log: true,
		logger: log,
		root: null
	};

	var engine = null;
	var storageReady = false, storageCallbacks = [];

	function onStorageReady(func) {
		if (storageReady) {
			func();
		} else {
			storageCallbacks.push(func);
		}
	}

	function setStorageReady() {
		storageReady = true;
		storageCallbacks.forEach(function (func) {
			func();
		});
	}

	function createStorage() {
		if (storageReady) {
			return;
		}
		if (typeof options.engine == "string") {
			engine = require("./engines/" + options.engine + ".js");
		} else if (options.engine.save && options.engine.restore) {
			engine = options.engine;
		} else {
			throw new Error("Missing Storage engine");
		}
		engine.initialize(options, setStorageReady);
	}

	var _persist = function(obj, arg2, arg3) {
		var _stored = {}, _live = {};
		var _released = false;
		var asName = "default";
		var callback = null;
		createStorage();

		if (typeof arg2 == "function") {
			callback = arg2;
		}
		if (typeof arg2 == "string") {
			asName = arg2;
		}
		if (typeof arg3 == "function") {
			callback = arg3;
		}

		function restore(key, cb) {
			var v = null;
			function gotIt(value) {
				value = value || "{}";
				_stored[key] = value;
				log("restore callback", key, value);
				cb && cb(value);
			}
			engine.restore(asName, key, gotIt);
		}

		function save(key, cb) {
			engine.save(asName, key, _stored[key], cb);
		}

		function del(key) {
			engine.del(asName, key, noCallback);
		}

		function checkProperty(key, cb) {
			var valstring;
			cb = cb || noCallback;
			log("Checking", key);
			if (_live[key] === null) {
				restore(key, function(val) {
					log("restoring key", key, _stored[key]);
					try {
						_live[key] = JSON.parse(_stored[key]);
						cb(key);
					} catch (e) {
						log("bad stuff in property", e);
						throw new Error("Persist: internal error, can't parse JSON");
					}
				});
				return;
			}
			try {
				valstring = JSON.stringify(_live[key]);
			} catch (e) {
				log("bad stuff in property", e);
				throw new Error("Persist: error, can't stringify object");
			}
			if (_stored[key] != valstring) {
				log("key changed", key, _stored[key], valstring);
				_stored[key] = valstring;
				save(key, cb);
				return;
			}
			cb();
		}

		var numProps = Object.keys(obj).length;

		function oneDone() {
			numProps--;
			if (numProps <= 0) {
				callback && callback();
			}
		}

		function makeProperty(key) {
			Object.defineProperty(obj, key, {
				enumerable: true,
				get: function () {
					if (_released) {
						throw new Error("Attempting to access released object");
					}
					// TODO: don't necessarily check on every access, just mark it suspect
					setTimeout(function () {
						checkProperty(key)
					}, 0);
					return _live[key];
				},
				set: function (val) {
					if (_released) {
						throw new Error("Attempting to access released object");
					}
					_live[key] = val;
					checkProperty(key);
				}
			});
			checkProperty(key, oneDone);
		}

		onStorageReady(function () {
			for (var key in obj) {
				if (key == "release") {
					throw new Error("Can't persist object, 'release' is reserved");
				}
				if (obj.hasOwnProperty(key)) {
					_live[key] = obj[key];
					delete obj[key];
					makeProperty(key);
				}
			}
			Object.defineProperty(obj, "release", {
				get: function () {
					return function () {
						Object.keys(_live).forEach(function(key) {
							del(key);
							delete _stored[key];
							delete _live[key];
						});
						_released = true;
					};
				},
				set: function (val) {
					// read-only
				}
			});
		});
	}

	_persist.setOptions = function (opts) {
		for (var key in opts) {
			if (key == "engine" && storageReady) {
				throw new Error("can't change storage engine after initialization");
			}
			if (options.hasOwnProperty(key)) {
				options[key] = opts[key];
			}
		}
	};

	return _persist;
}());

if (typeof module != "undefined") {
	module.exports = Persist;
}
