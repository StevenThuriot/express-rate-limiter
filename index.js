var Limiter = module.exports = function(options) {
	this.__configuration = {}; //Init to keep life simple
    this.__configuration = this.__buildConfiguration(options);
};

Limiter.prototype.__buildConfiguration = function(options) {

	var defaults = {
		outerTimeLimit: 2 * 60 * 1000,// 2 Minutes
		outerLimit: 60,	
		innerTimeLimit: 1500,// 1.5 seconds
		innerLimit: 3,
		headers: true
	};
    
    var configuration = {};    
    var settings = [ defaults, this.__configuration, options ];
	
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
    
    
    return configuration;
};

Limiter.prototype.__db = require('memory-cache');

Limiter.prototype.__getip = require('ipware')().get_ip; //function, accepts request

Limiter.prototype.__put = function(ip, limit) {
    this.__db.put(ip, limit, this.__outerTimeLimit);
};

Limiter.prototype.middleware = function(options) {    
    var self = this;
    var configuration = self.__buildConfiguration(options);
    
    var middleware = function (req, res, next) {
        if (configuration.headers) res.setHeader('X-RateLimit-Limit', configuration.outerLimit);
        
        var ip = self.__getip(req).clientIp;        
        var limit = self.__db.get(ip);
        var now = Date.now();
        
        if (limit) { //Existing user    
            var limitDate = limit.date;
            var timeLimit = limitDate + configuration.innerTimeLimit;      
                   
			if (now > timeLimit) {
				limit.inner = configuration.innerLimit;
			} else {
				limit.inner--;
			}
            			
			limit.outer--;
			limit.date = now;  
            
            if (configuration.headers) {
                res.setHeader('X-RateLimit-Remaining', limit.outer - 1); 
                res.setHeader('X-RateLimit-Reset', limit.outerReset);
            }
            
            var shouldLimit = false;
            
            if (limit.outer < 1) {
                shouldLimit = true;
                if (configuration.headers) res.setHeader('Retry-After', Math.floor(limit.outerReset - (now/1000)));
            } else if (limit.inner < 1) {
                shouldLimit = true;
                if (configuration.headers) res.setHeader('Retry-After', Math.floor(((timeLimit - now)/1000)));
            }
            
            
            if (shouldLimit) {             
                res.status(429).send('Rate limit exceeded');                    
                return;   
            }
        } else {
            //New user
            var outerReset =  Math.floor((now + configuration.outerTimeLimit) / 1000);
            self.__put(ip, { date: now, inner: configuration.innerLimit, outer: configuration.outerLimit, outerReset: outerReset });
            
            if (configuration.headers) {
                res.setHeader('X-RateLimit-Remaining', configuration.outerLimit - 1);
                res.setHeader('X-RateLimit-Reset', outerReset);
            }
        }
        
        return next();
    };
    
    return middleware;
};
