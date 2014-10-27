var Limiter = module.exports = function (options) {
    this.__configuration = {
        outerTimeLimit: 2 * 60 * 1000, // 2 Minutes
        outerLimit: 60,
        innerTimeLimit: 1500, // 1.5 seconds
        innerLimit: 3,
        headers: true
    };

    this.__configuration = this.__buildConfiguration(options);
    this.__db = this.__configuration.db;
};

Limiter.prototype.__buildConfiguration = function (options) {
    var configuration = {};
    var settings = [this.__configuration, options];

    for (var i = 0; i < settings.length; i++) {
        var source = settings[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                configuration[key] = source[key]
            }
        }
    }

    if (configuration.outerTimeLimit <= configuration.innerTimeLimit) {
        throw new Error('Outer time limit has to be greater than inner time limit.');
    }

    if (configuration.innerTimeLimit < 1) {
        throw new Error('Inner time limit has to be greater than 0.');
    }

    if (configuration.outerTimeLimit < 1) {
        throw new Error('Outer time limit has to be greater than 0.');
    }

    if (configuration.innerLimit < 1) {
        throw new Error('Inner limit has to be greater than 0.');
    }

    if (configuration.outerLimit < 1) {
        throw new Error('Outer limit has to be greater than 0.');
    }

    if (typeof configuration.headers !== 'boolean') {
        throw new Error('Headers must be a boolean value.');
    }

    if (configuration.db === undefined) {
        throw new Error('No db has been passed.');
    }

    return configuration;
};

Limiter.prototype.middleware = function (options) {
    var self = this;
    var configuration = self.__buildConfiguration(options);

    var middleware = function (req, res, next) {
        if (configuration.headers) res.setHeader('X-RateLimit-Limit', configuration.outerLimit);

        self.__db.hit(req, configuration, function (err, limit, now) {
            if (err) {
                res.status(500).send('Error.');
                return console.log(err);
            }

            if (configuration.headers) {
                res.setHeader('X-RateLimit-Remaining', limit.outer - 1);
                res.setHeader('X-RateLimit-Reset', limit.outerReset);
            }

            var shouldLimit = false;

            if (limit.outer < 1) {
                shouldLimit = true;
                if (configuration.headers) res.setHeader('Retry-After', Math.floor(limit.outerReset - (now / 1000)));
            } else if (limit.inner < 1) {
                shouldLimit = true;
                if (configuration.headers) res.setHeader('Retry-After', Math.floor(((limit.date + configuration.innerTimeLimit - now) / 1000)));
            }

            if (shouldLimit) {
                res.status(429).send('Rate limit exceeded');
                return;
            }

            return next();
        });
    };

    return middleware;
};