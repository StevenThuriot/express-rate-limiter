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
};

Limiter.defaults = {
    outerTimeLimit: 2 * 60 * 1000,// 2 Minutes
	outerLimit: 60,	
	innerTimeLimit: 1000,// 1 second
	innerLimit: 3
};

Limiter.prototype.__db = require('memory-cache');

Limiter.prototype.__getip = require('ipware')().get_ip; //function, accepts request

Limiter.prototype.__put = function(ip, limit) {
    this.__db.put(ip, limit, this.__outerTimeLimit);
}

Limiter.prototype.__init = function(ip, now) {    
    this.__put(ip, { date: Date.now(), inner: this.__innerLimit, outer: this.__outerLimit });
}


Limiter.prototype.middleware = function() {    
    var self = this;
    
    var middleware = function (req, res, next) {
        var ip = self.__getip(req).clientIp;        
                
        var limit = self.__db.get(ip);
        
        if (limit) { //Existing user            
			var now = Date.now();
            var timeLimit = limit.date + self.__innerTimeLimit;
            
			if (now > timeLimit) {
				limit.inner = self.__innerLimit;
			} else {
				limit.inner--;
			}
			
			limit.outer--;
			limit.date = now;

            if (limit.inner < 1 || limit.outer < 1) {
                res.set('Retry-After', limit.date - Date.now());
                res.status(429).send('Rate limit exceeded');                    
                return;
            }
        } else {
            //New user
            self.__init(ip);
        }
        
        return next();
    };
    
    return middleware;
}
