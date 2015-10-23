[![Express Rate Limiter](http://img.dafont.com/preview.php?text=Express+Rate+Limiter&ttf=squared_display0&ext=1&size=64&psize=m&y=53)](https://github.com/StevenThuriot/express-rate-limiter)
====================

[![npm](https://img.shields.io/npm/v/express-rate-limiter.svg?style=flat-square)](https://www.npmjs.org/package/express-rate-limiter)[![license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](https://www.npmjs.org/package/express-rate-limiter
 )

Rate limiter middleware for express applications.

This limiter has two kinds of limits: an inner and outer limit. It limites based on user ip.

The inner limit is against hammering (e.g. only 3 calls allowed per second). The outer limit is for protecting against over-use. (e.g. max 60 times per two minutes).

The limits are currently held in memory. It's on my roadmap to abstract the use of this module, so other modules can be plugged in instead (e.g. redis).


# Usage

Install

```
npm install express-rate-limiter --save
```

First, create a new Limiter;

```javascript
var Limiter = require('express-rate-limiter');
var MemoryStore = require('express-rate-limiter/lib/memoryStore');
var limiter = new Limiter({ db : new MemoryStore() });
```

The memory store is a lightweight in memory cache. This can be replaced by any other database implementing [store.js](/lib/store.js), for example the [MemoryStore](/lib/memoryStore.js).

Afterwards, use the limiter to create an express middleware for the express methods you want to rate limit.

```javascript
app.post('/', limiter.middleware(), function(req, res) {   

});
```

Anything written in the callback will now be rate limited.



#Default values

Default settings for the created middleware are as follows:

* outerTimeLimit: `2 * 60 * 1000`
	* default: `2 minutes`
	* Time in milliseconds for the outer limit.
	* This will also be used as the cache expiration.
	* Mainly to prevent over-use: The lenient limiter. 
* outerLimit: `60`
	* default: `60 attempts`
	* Number of attemps for the outer limit.
* innerTimeLimit: `1500`
	* default: `1.5 seconds`
	* Time in milliseconds for the inner limit.
	* Mainly to prevent hammering: The hardcore limiter.
* innerLimit: `3`
	* default: `3 attemps`
	* Number of attempts for the inner limit.
* headers: `true`
	* default: `add headers`
	* Send headers along with response.
* limitOnError: `true`
    * default: `true`
    * When an error occurs when looking up the ip in the key store, limit the post if `true`.
* db: `undefined`    
    * default: No default value available.
    * Key Value store being used to rate limit.
* pathLimiter: `boolean`
    * default: false
    * adds a path to the ip for the request limiter identifier. It allows to has differents limiters for each path in the application
* path `''`
    * default: empty value
    * if this value is passed, it will be the value that will be joined to the ip for the limiter identifier. If has not value, the value will be readed from the request. This option only will be applied if "pathLimiter" has true as value

They can be overwritten globally by passing them to the initiator. Properties that were not passed will automatically take default value.

```javascript
var limiter = new Limiter({innerLimit: 5});
```

Settings can also be overwritten per middleware. When a setting is not passed through the initiator, it will revert to the setting specified in the ctor of the Limiter you're using. If you didn't pass that setting there either, it will use the default value instead.

```javascript
app.post('/', limiter.middleware({innerLimit: 10, headers: false}), function(req, res) {   

});
```


When the limit has been reached, the actual method logic will not be executed, but instead a status 429 (Too many Requests) will be sent to the client.

#Headers
Headers are automatically added to the response.

The available headers are:
* X-RateLimit-Limit
* X-RateLimit-Remaining
* X-RateLimit-Reset
* Retry-After (Only in case of a 429 response)

For `X-RateLimit`-headers, the outer limits are used as response values.

#Notes
The framework relies on the fact that express' `req.ip` is correct. This might not always be the case, e.g. when running behind a proxy like NGINX or hosting your app on a platform like `Heroku`.

When this is the case, don't forget to initialize express using the following snippet:

```javascript
app.enable('trust proxy');
```
