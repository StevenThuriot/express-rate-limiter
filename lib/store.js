var Store = module.exports = function () {

};

Store.prototype.hit = function (req, configuration, callback) {
    var self = this;

    var createIpIdentifier = function() {
        var ip = req.ip;
        var path;
        if(configuration.pathLimiter) {
            path = (req.baseUrl) ? req.baseUrl.replace(req.path, '') : '';
            ip += configuration.path || path;
        }
        return ip;
    };
    var ip = createIpIdentifier();
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
            var outerReset = Math.floor((now + configuration.outerTimeLimit) / 1000);

            limit = {
                date: now,
                inner: configuration.innerLimit,
                outer: configuration.outerLimit,
                firstDate: now,
                outerReset: outerReset
            };

            self.create(ip, limit, configuration, function (error, result) {
                callback(error, result, now);
            });
        }
    }, configuration);
}
