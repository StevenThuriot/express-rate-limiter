var Store = require('./store');

var MemoryStore = module.exports = function () {

}

MemoryStore.prototype = Object.create(Store.prototype);

MemoryStore.prototype.__db = require('memory-cache');

MemoryStore.prototype.get = function (ip, callback) {
    var self = this;
    var limit = self.__db.get(ip);

    callback(undefined, limit);
};

MemoryStore.prototype.create = function (ip, limit, timeout, callback) {
    var self = this;
    self.__db.put(ip, limit, timeout);
    callback(undefined, limit);
};

MemoryStore.prototype.update = function (ip, limit, callback) {
    //In memory, already updated.
    callback(undefined, limit);
};