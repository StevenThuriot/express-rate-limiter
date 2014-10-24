var Limiter = module.exports = function(options) {
	var configuration = {};
	
	var settings = [ Limiter.defaults, options ];
	
	for (var i = 0; i < settings.length; i++) {
		var source = settings[i]

		for (var key in source) {
			if (source.hasOwnProperty(key)) {
				configuration[key] = source[key]
			}
		}
	}
		
	this.__outerTimeLimit = configuration.outerTimeLimit;
	this.__outerLimit = configuration.outerLimit;
	
	this.__innerTimeLimit = configuration.innerTimeLimit;
	this.__innerLimit = configuration.innerLimit;
    this.__useHeaders = configuration.headers;
};

Limiter.defaults = {
    outerTimeLimit: 2 * 60 * 1000,// 2 Minutes
	outerLimit: 60,	
	innerTimeLimit: 1500,// 1.5 seconds
	innerLimit: 3,
    headers: true
};

Limiter.prototype.__db = require('memory-cache');

Limiter.prototype.__getip = require('ipware')().get_ip; //function, accepts request

Limiter.prototype.__put = function(ip, limit) {
    this.__db.put(ip, limit, this.__outerTimeLimit);
}

Limiter.prototype.middleware = function() {    
    var self = this;
    
    var middleware = function (req, res, next) {
        if (self.__useHeaders) res.setHeader('X-RateLimit-Limit', self.__outerLimit);
        
        var ip = self.__getip(req).clientIp;        
        var limit = self.__db.get(ip);
        var now = Date.now();
        
        if (limit) { //Existing user    
            var limitDate = limit.date;
            var timeLimit = limitDate + self.__innerTimeLimit;      
                   
			if (now > timeLimit) {
				limit.inner = self.__innerLimit;
			} else {
				limit.inner--;
			}
            			
			limit.outer--;
			limit.date = now;  
            
            if (self.__useHeaders) {
                res.setHeader('X-RateLimit-Remaining', limit.outer - 1); 
                res.setHeader('X-RateLimit-Reset', limit.outerReset);
            }
            
            var shouldLimit = false;
            
            if (limit.outer < 1) {
                shouldLimit = true;
                if (self.__useHeaders) res.setHeader('Retry-After', Math.floor(limit.outerReset - (now/1000)));
            } else if (limit.inner < 1) {
                shouldLimit = true;
                if (self.__useHeaders) res.setHeader('Retry-After', Math.floor(((timeLimit - now)/1000)));
            }
            
            
            if (shouldLimit) {             
                res.status(429).send('Rate limit exceeded');                    
                return;   
            }
        } else {
            //New user
            var outerReset =  Math.floor((now + self.__outerTimeLimit) / 1000);
            self.__put(ip, { date: now, inner: self.__innerLimit, outer: self.__outerLimit, outerReset: outerReset });
            
            if (self.__useHeaders) {
                res.setHeader('X-RateLimit-Remaining', self.__outerLimit - 1);
                res.setHeader('X-RateLimit-Reset', outerReset);
            }
        }
        
        return next();
    };
    
    return middleware;
}
