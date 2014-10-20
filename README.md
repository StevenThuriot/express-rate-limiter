Express Rate Limiter
====================

Rate limiter middleware for express applications.

This limiter has two kinds of limits: an inner and outer limit. It limites based on user ip.

The inner limit is against hammering (e.g. only 3 calls allowed per second). The outer limit is for protecting against over-use. (e.g. max 60 times per two minutes).

The limits are currently held in memory. It's on my roadmap to abstract the use of this module, so other modules can be plugged in instead (e.g. redis).


# Usage

First, create a new Limiter;

```
var Limiter = require('express-rate-limiter');
var limiter = new Limiter();
```

Afterwards, use the limiter to create an express middleware for the express methods you want to rate limit.

```
app.post('/', limiter.middleware(), function(req, res) {   

});
```

Anything written in the callback will now be rate limited.

Default settings for the created middleware are as follows:

```
Limiter.defaults = {
  outerTimeLimit: 2 * 60 * 1000, // 2 Minutes
	outerLimit: 60,	
	innerTimeLimit: 1000, // 1 second
	innerLimit: 3
};
```

They can be overwritten globally by passing them to the initiator.

```
var limiter = new Limiter({innerLimit: 5});
```


#Roadmap
- Overwritten limits per middleware
- Abstracted db so memory-cache is not required
  - Provide memory-cache plugin
  - Provide redis plugin