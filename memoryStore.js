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

    callback(null, limit);
};

MemoryStore.prototype.update = function (ip, limit, resetInner, callback) {
    //In memory, already updated.
    callback(null, limit);
};