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

    callback(undefined, result);
};

MemoryStore.prototype.create = function (ip, limit, timeout, callback) {
    var cache = this.__cache;

    var oldRecord = cache[ip];

    if (oldRecord) {
        clearTimeout(oldRecord.timeout);
    }

    var record = {
        value: limit,
        expire: timeout + Date.now()
    };

    cache[ip] = record;

    record.timeout = setTimeout(function () {
        delete cache[ip];
        console.log('delete ' + ip);
    }, timeout);

    callback(undefined, limit);
};

MemoryStore.prototype.update = function (ip, limit, callback) {
    //In memory, already updated.
    callback(undefined, limit);
};