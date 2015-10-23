var Store = require('./store');

var MemoryStore = module.exports = function () {
    this.__cache = {}
}

MemoryStore.prototype = Object.create(Store.prototype);

MemoryStore.prototype.get = function (ip, callback) {
    var data = this.__cache[ip];
    var result;

    if (data && data.expire >= Date.now()) {
        result = data.value;
    } else {
        result = undefined;
    }

    callback(null, result);
};

MemoryStore.prototype.create = function (ip, limit, configuration, callback) {
    var cache = this.__cache;

    var oldRecord = cache[ip];

    if (oldRecord) {
        clearTimeout(oldRecord.timeout);
    }

    var record = {
        value: limit,
        expire: configuration.outerTimeLimit + Date.now()
    };

    cache[ip] = record;

    record.timeout = setTimeout(function () {
        delete cache[ip];
    }, configuration.outerTimeLimit);

    callback(null, limit);
};

MemoryStore.prototype.decreaseLimits = function (ip, limit, resetInner, configuration, callback) {
    if (resetInner === true) {
        limit.inner = configuration.innerLimit;
    } else {
        limit.inner--;
    }
    if(limit.inner > 0 ) {
        limit.outer--;
    }

    callback(null, limit);
};