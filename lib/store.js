var Store = module.exports = function () {

};

Store.prototype.__getip = require('ipware')().get_ip; //function, accepts request

Store.prototype.hit = function (req, configuration, callback) {
    var self = this;

    var ip = self.__getip(req).clientIp;
    var now = Date.now();

    self.get(ip, function (err, limit) {
        if (err) {
            callback(err, undefined, now);
            return;
        };

        if (limit) {            
            //Existing user
            var limitDate = limit.date;
            var timeLimit = limitDate + configuration.innerTimeLimit;
            
            var resetInner = now > timeLimit;
            limit.date = now;

            self.decreaseLimits(ip, limit, resetInner, configuration, function (error, result) {
                callback(error, result, limitDate);
            });
        } else {
            //New User
            limit = {
                date: now,
                inner: configuration.innerLimit,
                outer: configuration.outerLimit,
                firstDate: now
            };

            self.create(ip, limit, configuration, function (error, result) {
                callback(error, result, now);
            });
        }
    }, configuration);
}